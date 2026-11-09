/**
 * Professional Browser Compatibility & Feature Matrix Detector for MotionLab
 * Detects HTML5 Canvas, MediaRecorder, Web Audio, WebCodecs, IndexedDB, Pointer Events,
 * and provides graceful fallbacks for Android Chrome, Firefox, and Safari.
 */

export function detectBrowserCapabilities() {
  if (typeof window === "undefined") {
    return {
      isServer: true,
      score: 100,
      features: {},
      summary: "Server-side rendering environment",
    };
  }

  const features = {
    canvas2d: !!window.CanvasRenderingContext2D,
    webgl: (() => {
      try {
        const c = document.createElement("canvas");
        return !!(window.WebGLRenderingContext && (c.getContext("webgl") || c.getContext("experimental-webgl")));
      } catch {
        return false;
      }
    })(),
    indexedDB: !!window.indexedDB,
    webAudio: !!(window.AudioContext || window.webkitAudioContext),
    mediaRecorder: typeof window.MediaRecorder !== "undefined",
    webCodecs: typeof window.VideoEncoder !== "undefined",
    storageManager: !!(navigator.storage && navigator.storage.estimate),
    pointerEvents: !!window.PointerEvent,
    fullscreen: !!(document.fullscreenEnabled || document.webkitFullscreenEnabled),
    serviceWorker: "serviceWorker" in navigator,
  };

  const fallbacks = [];

  if (!features.mediaRecorder) {
    fallbacks.push({
      feature: "MediaRecorder",
      fallback: "Frame-by-frame PNG sequence and GIF export mode available.",
    });
  }

  if (!features.webCodecs) {
    fallbacks.push({
      feature: "WebCodecs",
      fallback: "Standard MediaRecorder WebM/MP4 pipeline enabled.",
    });
  }

  if (!features.storageManager) {
    fallbacks.push({
      feature: "Storage Quota API",
      fallback: "IndexedDB storage available without quota estimation meter.",
    });
  }

  const supportedCount = Object.values(features).filter(Boolean).length;
  const score = Math.round((supportedCount / Object.keys(features).length) * 100);

  return {
    isServer: false,
    score,
    features,
    fallbacks,
    userAgent: navigator.userAgent,
    isAndroid: /android/i.test(navigator.userAgent),
    isMobile: /android|iphone|ipad|ipod/i.test(navigator.userAgent),
  };
}
