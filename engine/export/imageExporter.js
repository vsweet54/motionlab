/**
 * Image and Frame Sequence Exporter for MotionLab
 * Exports Single Frame PNG, Full PNG Sequences (ZIP), and Animated GIF.
 */

import { renderFrameAtTime, preloadProjectImages } from "./frameRenderer";
import { encodeGifBinary } from "./gifEncoder";
import { createZipArchive } from "./zipArchiver";

/**
 * Exports a single frame as a PNG image.
 */
export async function exportSingleFramePNG({
  project,
  layers,
  keyframes,
  time = 0,
  resolution = "1080p",
  isTransparent = false,
  filename = "motionlab-frame",
}) {
  const resMap = {
    "480p": { w: 854, h: 480 },
    "720p": { w: 1280, h: 720 },
    "1080p": { w: 1920, h: 1080 },
    "1440p": { w: 2560, h: 1440 },
    "4K": { w: 3840, h: 2160 },
  };
  const { w, h } = resMap[resolution] || { w: 1920, h: 1080 };

  await preloadProjectImages(layers);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");

  renderFrameAtTime({
    canvas,
    ctx,
    width: w,
    height: h,
    time,
    layers,
    keyframes,
    backgroundColor: project.backgroundColor || "#09090b",
    isTransparent,
    baseWidth: project.width || 1920,
    baseHeight: project.height || 1080,
  });

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
  const url = URL.createObjectURL(blob);
  const outName = filename.endsWith(".png") ? filename : `${filename}.png`;

  return {
    blob,
    url,
    filename: outName,
    sizeBytes: blob.size,
    format: "png",
  };
}

/**
 * Exports an animation as an animated GIF.
 */
export async function exportAnimatedGIF({
  project,
  layers,
  keyframes,
  settings,
  onProgress,
  signal,
}) {
  const {
    fps = 15,
    resolution = "480p", // Recommended 480p for GIFs to save memory
    startTime = 0,
    duration = Number(project.duration || 5),
    isTransparent = false,
    filename = "motionlab-animation",
  } = settings;

  const resMap = {
    "480p": { w: 854, h: 480 },
    "720p": { w: 1280, h: 720 },
    "1080p": { w: 1920, h: 1080 },
  };
  const { w, h } = resMap[resolution] || { w: 854, h: 480 };

  if (onProgress) onProgress({ percent: 2, status: "Preloading assets..." });
  await preloadProjectImages(layers);

  if (signal?.aborted) throw new Error("Export cancelled by user");

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });

  const totalFrames = Math.ceil(duration * fps);
  const frameIntervalSec = 1 / fps;
  const framesData = [];

  for (let frame = 0; frame < totalFrames; frame++) {
    if (signal?.aborted) throw new Error("Export cancelled by user");

    const frameTime = startTime + frame * frameIntervalSec;

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

    const imgData = ctx.getImageData(0, 0, w, h);
    framesData.push(imgData);

    const percent = Math.min(80, Math.round(5 + ((frame + 1) / totalFrames) * 75));
    if (onProgress) {
      onProgress({
        percent,
        frame: frame + 1,
        totalFrames,
        status: `Capturing GIF frame ${frame + 1} of ${totalFrames}...`,
      });
    }

    // Yield main thread
    await new Promise((r) => setTimeout(r, 0));
  }

  if (onProgress) onProgress({ percent: 85, status: "Encoding GIF binary structure..." });

  const delayHundredths = Math.max(1, Math.round(100 / fps));
  const gifBlob = encodeGifBinary(framesData, w, h, delayHundredths);
  const url = URL.createObjectURL(gifBlob);
  const outName = filename.endsWith(".gif") ? filename : `${filename}.gif`;

  if (onProgress) onProgress({ percent: 100, status: "GIF Export Complete!" });

  return {
    blob: gifBlob,
    url,
    filename: outName,
    sizeBytes: gifBlob.size,
    format: "gif",
  };
}

/**
 * Exports full PNG sequence packed in a ZIP archive.
 */
export async function exportPNGSequence({
  project,
  layers,
  keyframes,
  settings,
  onProgress,
  signal,
}) {
  const {
    fps = 30,
    resolution = "720p",
    startTime = 0,
    duration = Number(project.duration || 5),
    isTransparent = true,
    filename = "motionlab-sequence",
  } = settings;

  const resMap = {
    "480p": { w: 854, h: 480 },
    "720p": { w: 1280, h: 720 },
    "1080p": { w: 1920, h: 1080 },
    "1440p": { w: 2560, h: 1440 },
    "4K": { w: 3840, h: 2160 },
  };
  const { w, h } = resMap[resolution] || { w: 1280, h: 720 };

  await preloadProjectImages(layers);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");

  const totalFrames = Math.ceil(duration * fps);
  const frameIntervalSec = 1 / fps;
  const zipFiles = [];

  for (let frame = 0; frame < totalFrames; frame++) {
    if (signal?.aborted) throw new Error("Export cancelled by user");

    const frameTime = startTime + frame * frameIntervalSec;

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

    const frameBlob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
    const arrayBuffer = await frameBlob.arrayBuffer();
    const frameIndexStr = String(frame + 1).padStart(4, "0");

    zipFiles.push({
      name: `frame_${frameIndexStr}.png`,
      data: new Uint8Array(arrayBuffer),
    });

    const percent = Math.min(85, Math.round(5 + ((frame + 1) / totalFrames) * 80));
    if (onProgress) {
      onProgress({
        percent,
        frame: frame + 1,
        totalFrames,
        status: `Rendering frame ${frame + 1} of ${totalFrames}...`,
      });
    }

    await new Promise((r) => setTimeout(r, 0));
  }

  if (onProgress) onProgress({ percent: 90, status: "Packaging frames into ZIP..." });

  const zipBlob = createZipArchive(zipFiles);
  const url = URL.createObjectURL(zipBlob);
  const outName = filename.endsWith(".zip") ? filename : `${filename}.zip`;

  if (onProgress) onProgress({ percent: 100, status: "Sequence Export Complete!" });

  return {
    blob: zipBlob,
    url,
    filename: outName,
    sizeBytes: zipBlob.size,
    format: "zip",
  };
}
