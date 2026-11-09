/**
 * Video Exporter (WebM / MP4) for MotionLab
 * Records deterministic frames and mixed audio into high-quality video files via MediaRecorder.
 */

import { renderFrameAtTime, preloadProjectImages } from "./frameRenderer";
import { createExportAudioStream } from "./audioMixer";
import { getBestMimeType } from "./capabilityDetector";

/**
 * Exports project to WebM or MP4 video.
 * @param {object} options
 * @param {object} options.project - Project state
 * @param {Array} options.layers - Layers
 * @param {Array} options.keyframes - Keyframes
 * @param {object} options.settings - Export settings (resolution, fps, duration, format, bitrate)
 * @param {Function} options.onProgress - Progress callback ({ percent, frame, totalFrames, status })
 * @param {AbortSignal} options.signal - Cancellation signal
 * @returns {Promise<{ blob: Blob, url: string, filename: string, sizeBytes: number }>}
 */
export async function exportVideo({
  project,
  layers,
  keyframes,
  settings,
  onProgress,
  signal,
}) {
  const {
    format = "webm",
    resolution = "1080p",
    fps = 30,
    startTime = 0,
    duration = Number(project.duration || 5),
    videoBitrate = 8000000, // 8 Mbps
    audioBitrate = 192000, // 192 kbps
    isTransparent = false,
    filename = "motionlab-render",
  } = settings;

  // 1. Resolve output dimensions
  const resMap = {
    "480p": { w: 854, h: 480 },
    "720p": { w: 1280, h: 720 },
    "1080p": { w: 1920, h: 1080 },
    "1440p": { w: 2560, h: 1440 },
    "4K": { w: 3840, h: 2160 },
  };
  const { w, h } = resMap[resolution] || { w: 1920, h: 1080 };

  // Preload images to prevent blank frames during render
  if (onProgress) onProgress({ percent: 2, status: "Preloading assets..." });
  await preloadProjectImages(layers);

  if (signal?.aborted) throw new Error("Export cancelled by user");

  // 2. Create offscreen canvas for rendering
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: false });

  // 3. Prepare Audio Stream
  if (onProgress) onProgress({ percent: 5, status: "Mixing audio tracks..." });
  const audioLayers = layers.filter((l) => l.type === "audio");
  const { stream: audioStream, cleanup: cleanupAudio, hasAudio } =
    await createExportAudioStream(audioLayers, duration, startTime);

  // 4. Capture canvas stream
  const canvasStream = canvas.captureStream(fps);
  const combinedStream = new MediaStream();

  // Add video track
  canvasStream.getVideoTracks().forEach((track) => combinedStream.addTrack(track));
  // Add audio track if available
  if (hasAudio && audioStream) {
    audioStream.getAudioTracks().forEach((track) => combinedStream.addTrack(track));
  }

  // 5. Select Best MIME type & MediaRecorder
  const mimeType = getBestMimeType(format) || "video/webm";
  const recorderOptions = {
    mimeType,
    videoBitsPerSecond: videoBitrate,
    audioBitsPerSecond: audioBitrate,
  };

  let recorder;
  try {
    recorder = new MediaRecorder(combinedStream, recorderOptions);
  } catch (err) {
    // Fallback without bitrate constraint
    recorder = new MediaRecorder(combinedStream, { mimeType });
  }

  const recordedChunks = [];
  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) {
      recordedChunks.push(e.data);
    }
  };

  recorder.start(100); // chunk every 100ms

  // 6. Deterministic Frame Loop
  const totalFrames = Math.ceil(duration * fps);
  const frameIntervalSec = 1 / fps;
  const frameIntervalMs = 1000 / fps;

  try {
    for (let frame = 0; frame < totalFrames; frame++) {
      if (signal?.aborted) {
        throw new Error("Export cancelled by user");
      }

      const frameTime = startTime + frame * frameIntervalSec;

      // Render deterministic frame
      renderFrameAtTime({
        canvas,
        ctx,
        width: w,
        height: h,
        time: frameTime,
        layers,
        keyframes,
        backgroundColor: project.backgroundColor || "#09090b",
        isTransparent,
        baseWidth: project.width || 1920,
        baseHeight: project.height || 1080,
      });

      // Update progress
      const percent = Math.min(95, Math.round(5 + ((frame + 1) / totalFrames) * 90));
      if (onProgress) {
        onProgress({
          percent,
          frame: frame + 1,
          totalFrames,
          status: `Rendering frame ${frame + 1} of ${totalFrames}...`,
        });
      }

      // Allow MediaRecorder to capture and maintain accurate frame rate pacing
      await new Promise((resolve) => setTimeout(resolve, frameIntervalMs));
    }

    // Wait a brief moment to capture final tail frame
    await new Promise((resolve) => setTimeout(resolve, 200));

    // 7. Stop Recording & Finalize
    if (onProgress) onProgress({ percent: 97, status: "Finalizing video container..." });

    const blobPromise = new Promise((resolve) => {
      recorder.onstop = () => {
        const finalBlob = new Blob(recordedChunks, { type: mimeType });
        resolve(finalBlob);
      };
    });

    recorder.stop();
    const finalBlob = await blobPromise;

    // Cleanup resources
    cleanupAudio();
    combinedStream.getTracks().forEach((t) => t.stop());
    canvasStream.getTracks().forEach((t) => t.stop());

    const ext = format === "mp4" ? ".mp4" : ".webm";
    const outName = filename.endsWith(ext) ? filename : `${filename}${ext}`;
    const url = URL.createObjectURL(finalBlob);

    if (onProgress) onProgress({ percent: 100, status: "Export complete!" });

    return {
      blob: finalBlob,
      url,
      filename: outName,
      sizeBytes: finalBlob.size,
      format,
    };
  } catch (err) {
    cleanupAudio();
    try {
      recorder.stop();
    } catch (e) {}
    combinedStream.getTracks().forEach((t) => t.stop());
    canvasStream.getTracks().forEach((t) => t.stop());
    throw err;
  }
}
