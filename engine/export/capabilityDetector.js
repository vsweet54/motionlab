/**
 * Device Capability Detector for MotionLab
 * Detects supported codecs, MediaRecorder MIME types, canvas size limits,
 * WebCodecs availability, memory constraints, and provides adaptive recommendations.
 */

export function detectDeviceCapabilities() {
  if (typeof window === "undefined") {
    return {
      mediaRecorderSupported: false,
      supportedVideoCodecs: [],
      webCodecsSupported: false,
      maxCanvasDimension: 4096,
      recommendedResolution: "720p",
      recommendedFps: 30,
      memoryEstimateGb: 4,
      isMobile: false,
      isAndroid: false,
      warnings: [],
    };
  }

  const isAndroid = /Android/i.test(navigator.userAgent);
  const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
  const mediaRecorderSupported = typeof window.MediaRecorder !== "undefined";

  // Potential video MIME types to probe
  const testMimes = [
    { format: "webm", mime: "video/webm;codecs=vp9,opus" },
    { format: "webm", mime: "video/webm;codecs=vp8,opus" },
    { format: "webm", mime: "video/webm;codecs=vp9" },
    { format: "webm", mime: "video/webm;codecs=vp8" },
    { format: "webm", mime: "video/webm" },
    { format: "mp4", mime: "video/mp4;codecs=avc1.42E01E,mp4a.40.2" },
    { format: "mp4", mime: "video/mp4;codecs=avc1" },
    { format: "mp4", mime: "video/mp4;codecs=h264" },
    { format: "mp4", mime: "video/mp4" },
  ];

  const supportedVideoCodecs = [];
  if (mediaRecorderSupported) {
    for (const item of testMimes) {
      try {
        if (window.MediaRecorder.isTypeSupported(item.mime)) {
          supportedVideoCodecs.push(item);
        }
      } catch (e) {
        // Ignored
      }
    }
  }

  // WebCodecs check
  const webCodecsSupported =
    typeof window.VideoEncoder !== "undefined" &&
    typeof window.VideoFrame !== "undefined";

  // Memory estimation (navigator.deviceMemory is available in Chrome/Android)
  const memoryEstimateGb = navigator.deviceMemory || (isMobile ? 3 : 8);
  const hardwareConcurrency = navigator.hardwareConcurrency || 4;

  // Maximum canvas size test
  let maxCanvasDimension = 4096;
  try {
    const gl = document.createElement("canvas").getContext("webgl");
    if (gl) {
      maxCanvasDimension = gl.getParameter(gl.MAX_RENDERBUFFER_SIZE) || 4096;
    }
  } catch (e) {
    maxCanvasDimension = isMobile ? 4096 : 8192;
  }

  // Warnings & Recommendations
  const warnings = [];
  let recommendedResolution = "1080p";
  let recommendedFps = 60;

  if (isMobile) {
    if (memoryEstimateGb <= 3 || hardwareConcurrency <= 4) {
      recommendedResolution = "720p";
      recommendedFps = 30;
      warnings.push("Device has limited RAM. 720p @ 30fps is recommended for smooth export without tab crashes.");
    } else {
      recommendedResolution = "1080p";
      recommendedFps = 30;
    }
  }

  const mp4Supported = supportedVideoCodecs.some((c) => c.format === "mp4");
  const webmSupported = supportedVideoCodecs.some((c) => c.format === "webm");

  return {
    mediaRecorderSupported,
    supportedVideoCodecs,
    webmSupported,
    mp4Supported,
    webCodecsSupported,
    maxCanvasDimension,
    recommendedResolution,
    recommendedFps,
    memoryEstimateGb,
    hardwareConcurrency,
    isMobile,
    isAndroid,
    warnings,
  };
}

/**
 * Returns optimal MIME type string for chosen video format
 */
export function getBestMimeType(format = "webm") {
  if (typeof window === "undefined" || !window.MediaRecorder) {
    return "";
  }

  if (format === "mp4") {
    const candidates = [
      "video/mp4;codecs=avc1.42E01E,mp4a.40.2",
      "video/mp4;codecs=avc1",
      "video/mp4;codecs=h264",
      "video/mp4",
    ];
    for (const c of candidates) {
      if (window.MediaRecorder.isTypeSupported(c)) return c;
    }
    return "";
  }

  // Default webm
  const candidates = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm;codecs=vp9",
    "video/webm;codecs=vp8",
    "video/webm",
  ];
  for (const c of candidates) {
    if (window.MediaRecorder.isTypeSupported(c)) return c;
  }
  return "";
}

/**
 * Evaluates memory safety of export settings
 */
export function evaluateExportSafety(resolution, fps, duration, format) {
  const warnings = [];
  const resMap = {
    "480p": { w: 854, h: 480 },
    "720p": { w: 1280, h: 720 },
    "1080p": { w: 1920, h: 1080 },
    "1440p": { w: 2560, h: 1440 },
    "4K": { w: 3840, h: 2160 },
  };

  const dim = resMap[resolution] || { w: 1920, h: 1080 };
  const totalPixels = dim.w * dim.h;
  const totalFrames = Math.ceil(duration * fps);

  // Per frame uncompressed RGBA size in MB
  const frameMb = (totalPixels * 4) / (1024 * 1024);
  const totalRawMb = frameMb * totalFrames;

  if (resolution === "4K") {
    warnings.push("4K resolution requires significant GPU & RAM headroom. On mobile devices, this may cause browser tab reloads.");
  }

  if (format === "gif" && totalFrames > 180) {
    warnings.push(`Generating a GIF with ${totalFrames} frames may produce a very large file. Consider reducing duration or FPS to 15-24.`);
  }

  if (format === "png-sequence" && totalFrames > 300) {
    warnings.push(`PNG sequence will generate ${totalFrames} individual images. ZIP compression may take longer on mobile.`);
  }

  return {
    dim,
    totalFrames,
    frameMb: Number(frameMb.toFixed(2)),
    totalRawMb: Number(totalRawMb.toFixed(1)),
    warnings,
  };
}
