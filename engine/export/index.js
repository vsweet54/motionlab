/**
 * Master Export Manager for MotionLab
 * Orchestrates device capability checks, settings validation, cancellation,
 * and format dispatching (WebM, MP4, GIF, PNG, PNG Sequence, Project JSON).
 */

import { detectDeviceCapabilities, evaluateExportSafety, getBestMimeType } from "./capabilityDetector";
import { exportVideo } from "./videoExporter";
import { exportSingleFramePNG, exportAnimatedGIF, exportPNGSequence } from "./imageExporter";
import { exportProjectFile } from "./projectExporter";

export * from "./capabilityDetector";
export * from "./frameRenderer";
export * from "./audioMixer";
export * from "./videoExporter";
export * from "./imageExporter";
export * from "./projectExporter";

export const RESOLUTION_PRESETS = [
  { id: "480p", label: "480p SD (854×480)", width: 854, height: 480, aspect: "16:9", mobileSafe: true },
  { id: "720p", label: "720p HD (1280×720)", width: 1280, height: 720, aspect: "16:9", mobileSafe: true },
  { id: "1080p", label: "1080p Full HD (1920×1080)", width: 1920, height: 1080, aspect: "16:9", mobileSafe: true },
  { id: "1440p", label: "1440p 2K (2560×1440)", width: 2560, height: 1440, aspect: "16:9", mobileSafe: false },
  { id: "4K", label: "4K Ultra HD (3840×2160)", width: 3840, height: 2160, aspect: "16:9", mobileSafe: false },
];

export const EXPORT_FORMATS = [
  {
    id: "webm",
    label: "WebM Video",
    desc: "VP9/VP8 high bitrate video with synchronized audio (Universal on Android & Chrome)",
    ext: ".webm",
    type: "video",
  },
  {
    id: "mp4",
    label: "MP4 Video",
    desc: "H.264 video container (Available if supported by device browser)",
    ext: ".mp4",
    type: "video",
  },
  {
    id: "gif",
    label: "Animated GIF",
    desc: "Looping animated GIF image for social media & messaging",
    ext: ".gif",
    type: "image",
  },
  {
    id: "png-single",
    label: "Single Frame PNG",
    desc: "High-resolution snapshot of current playhead frame",
    ext: ".png",
    type: "image",
  },
  {
    id: "png-sequence",
    label: "PNG Frame Sequence",
    desc: "Full lossless sequence of transparent PNG frames packed into a ZIP",
    ext: ".zip",
    type: "archive",
  },
  {
    id: "project-json",
    label: "MotionLab Project JSON",
    desc: "Complete project configuration, layers, keyframes, and timeline",
    ext: ".json",
    type: "project",
  },
];

class ExportManager {
  constructor() {
    this.abortController = null;
    this.isRendering = false;
  }

  /**
   * Dispatches and coordinates the export process.
   */
  async startExport({
    project,
    layers,
    keyframes,
    beatMarkers,
    currentTime,
    settings,
    onProgress,
  }) {
    if (this.isRendering) {
      throw new Error("Another export process is already in progress.");
    }

    this.isRendering = true;
    this.abortController = new AbortController();
    const signal = this.abortController.signal;

    try {
      let result;

      switch (settings.format) {
        case "webm":
        case "mp4": {
          result = await exportVideo({
            project,
            layers,
            keyframes,
            settings,
            onProgress,
            signal,
          });
          break;
        }

        case "gif": {
          result = await exportAnimatedGIF({
            project,
            layers,
            keyframes,
            settings,
            onProgress,
            signal,
          });
          break;
        }

        case "png-single": {
          result = await exportSingleFramePNG({
            project,
            layers,
            keyframes,
            time: currentTime || 0,
            resolution: settings.resolution || "1080p",
            isTransparent: !!settings.isTransparent,
            filename: settings.filename || "motionlab-frame",
          });
          if (onProgress) onProgress({ percent: 100, status: "Frame captured!" });
          break;
        }

        case "png-sequence": {
          result = await exportPNGSequence({
            project,
            layers,
            keyframes,
            settings,
            onProgress,
            signal,
          });
          break;
        }

        case "project-json": {
          result = exportProjectFile({
            project,
            layers,
            keyframes,
            beatMarkers,
          });
          if (onProgress) onProgress({ percent: 100, status: "Project file ready!" });
          break;
        }

        default:
          throw new Error(`Unsupported export format: ${settings.format}`);
      }

      this.isRendering = false;
      return result;
    } catch (err) {
      this.isRendering = false;
      throw err;
    } finally {
      this.abortController = null;
    }
  }

  /**
   * Cancels any active rendering operation immediately.
   */
  cancelExport() {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    this.isRendering = false;
  }
}

export const studioExportManager = new ExportManager();
