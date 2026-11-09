"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Download,
  Film,
  Image as ImageIcon,
  FileCode,
  Archive,
  AlertTriangle,
  CheckCircle2,
  Play,
  RotateCcw,
  Sliders,
  Sparkles,
  Info,
  Clock,
  HardDrive,
  Cpu,
  Layers,
} from "lucide-react";
import { useEditorStore } from "@/store/useEditorStore";
import { useAnimationStore } from "@/store/useAnimationStore";
import {
  studioExportManager,
  EXPORT_FORMATS,
  RESOLUTION_PRESETS,
  detectDeviceCapabilities,
  evaluateExportSafety,
} from "@/engine/export";

export default function ExportModal({ isOpen, onClose }) {
  const { project, layers } = useEditorStore();
  const { duration, fps, currentTime, keyframes, beatMarkers } = useAnimationStore();

  const [capabilities, setCapabilities] = useState(null);
  const [format, setFormat] = useState("webm");
  const [resolution, setResolution] = useState("1080p");
  const [exportFps, setExportFps] = useState(30);
  const [exportStartTime, setExportStartTime] = useState(0);
  const [exportDuration, setExportDuration] = useState(duration || 5);
  const [videoBitrate, setVideoBitrate] = useState(8000000); // 8 Mbps
  const [audioBitrate, setAudioBitrate] = useState(192000); // 192 kbps
  const [isTransparent, setIsTransparent] = useState(false);
  const [filename, setFilename] = useState(
    (project?.name || "motionlab-render").toLowerCase().replace(/[^a-z0-9_-]/g, "-")
  );
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Export State
  const [isRendering, setIsRendering] = useState(false);
  const [progress, setProgress] = useState({ percent: 0, status: "", frame: 0, totalFrames: 0 });
  const [startTimeMs, setStartTimeMs] = useState(null);
  const [estimatedRemainingSec, setEstimatedRemainingSec] = useState(null);
  const [exportResult, setExportResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  // Probe device capabilities on modal open
  useEffect(() => {
    if (isOpen) {
      const caps = detectDeviceCapabilities();
      setCapabilities(caps);
      if (caps.recommendedResolution) setResolution(caps.recommendedResolution);
      if (caps.recommendedFps) setExportFps(caps.recommendedFps);
      setExportDuration(duration || 5);
      setFilename((project?.name || "motionlab-render").toLowerCase().replace(/[^a-z0-9_-]/g, "-"));
      setExportResult(null);
      setErrorMessage(null);
      setProgress({ percent: 0, status: "", frame: 0, totalFrames: 0 });
    }
  }, [isOpen, project?.name, duration]);

  if (!isOpen) return null;

  // Evaluate memory safety warnings
  const safety = evaluateExportSafety(resolution, exportFps, exportDuration, format);

  const handleStartExport = async () => {
    setErrorMessage(null);
    setExportResult(null);
    setIsRendering(true);
    setProgress({ percent: 0, status: "Initializing render engine...", frame: 0, totalFrames: 0 });
    setStartTimeMs(Date.now());
    setEstimatedRemainingSec(null);

    try {
      const result = await studioExportManager.startExport({
        project: project || { width: 1920, height: 1080, duration, backgroundColor: "#09090b" },
        layers: layers || [],
        keyframes: keyframes || [],
        beatMarkers: beatMarkers || [],
        currentTime: currentTime || 0,
        settings: {
          format,
          resolution,
          fps: Number(exportFps),
          startTime: Number(exportStartTime),
          duration: Number(exportDuration),
          videoBitrate: Number(videoBitrate),
          audioBitrate: Number(audioBitrate),
          isTransparent: Boolean(isTransparent),
          filename,
        },
        onProgress: (prog) => {
          setProgress((prev) => {
            const next = { ...prev, ...prog };
            // Compute estimated remaining seconds
            if (prog.percent > 5 && startTimeMs) {
              const elapsedSec = (Date.now() - startTimeMs) / 1000;
              const totalEstSec = (elapsedSec / prog.percent) * 100;
              const remaining = Math.max(0, Math.round(totalEstSec - elapsedSec));
              setEstimatedRemainingSec(remaining);
            }
            return next;
          });
        },
      });

      setExportResult(result);
    } catch (err) {
      if (err.message !== "Export cancelled by user") {
        console.error("Export failed:", err);
        setErrorMessage(err.message || "An unexpected error occurred during export.");
      }
    } finally {
      setIsRendering(false);
    }
  };

  const handleCancelExport = () => {
    studioExportManager.cancelExport();
    setIsRendering(false);
    setProgress({ percent: 0, status: "Export cancelled", frame: 0, totalFrames: 0 });
  };

  const handleDownload = () => {
    if (!exportResult) return;
    const a = document.createElement("a");
    a.href = exportResult.url;
    a.download = exportResult.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "0 B";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl bg-surface-200 border border-surface-border rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-xs text-zinc-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border bg-surface-100/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-600/20 border border-brand-500/40 flex items-center justify-center text-brand-400">
              <Film className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm">
                Export & Render Studio
              </h3>
              <p className="text-[11px] text-zinc-400">
                Deterministic browser-based video, GIF, and frame sequence generation
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              if (isRendering) handleCancelExport();
              onClose();
            }}
            className="min-w-[40px] min-h-[40px] p-2 text-zinc-400 hover:text-white rounded-xl flex items-center justify-center hover:bg-surface-border transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {/* Active Rendering Progress View */}
          {isRendering ? (
            <div className="py-8 px-4 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-brand-600/20 border border-brand-500/40 flex items-center justify-center mx-auto text-brand-400 animate-pulse">
                <Film className="w-8 h-8 animate-spin" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">
                  {progress.status || "Rendering Project..."}
                </h4>
                <p className="text-zinc-400 mt-1">
                  Frame {progress.frame} of {progress.totalFrames} ({progress.percent}%)
                </p>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-surface-100 rounded-full h-3 overflow-hidden border border-surface-border max-w-md mx-auto">
                <div
                  className="bg-brand-500 h-full rounded-full transition-all duration-150 shadow-glow"
                  style={{ width: `${progress.percent}%` }}
                />
              </div>

              {/* Time Remaining */}
              {estimatedRemainingSec !== null && (
                <div className="text-[11px] text-zinc-400 font-mono flex items-center justify-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Est. remaining: ~{estimatedRemainingSec}s</span>
                </div>
              )}

              {/* Cancel Button */}
              <button
                onClick={handleCancelExport}
                className="min-h-[44px] px-6 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 font-semibold transition-colors mt-2"
              >
                Cancel Export
              </button>
            </div>
          ) : exportResult ? (
            /* Completed Export Preview View */
            <div className="py-4 space-y-4 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">
                  Export Successfully Finished!
                </h4>
                <p className="text-zinc-400 font-mono mt-0.5">
                  {exportResult.filename} • {formatFileSize(exportResult.sizeBytes)}
                </p>
              </div>

              {/* Preview Window (Video or Image) */}
              {exportResult.format === "webm" || exportResult.format === "mp4" ? (
                <div className="rounded-xl overflow-hidden border border-surface-border max-w-md mx-auto bg-black aspect-video flex items-center justify-center">
                  <video
                    src={exportResult.url}
                    controls
                    autoPlay
                    loop
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : exportResult.format === "gif" || exportResult.format === "png" ? (
                <div className="rounded-xl overflow-hidden border border-surface-border max-w-md mx-auto bg-black p-2 flex items-center justify-center max-h-[240px]">
                  <img
                    src={exportResult.url}
                    alt="Export preview"
                    className="max-h-[220px] object-contain rounded-lg"
                  />
                </div>
              ) : null}

              {/* Action Buttons */}
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => setExportResult(null)}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-surface-100 hover:bg-surface-border border border-surface-border text-zinc-300 font-semibold flex items-center gap-2 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Export Another</span>
                </button>
                <button
                  onClick={handleDownload}
                  className="min-h-[44px] px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-2 shadow-glow transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Download File ({formatFileSize(exportResult.sizeBytes)})</span>
                </button>
              </div>
            </div>
          ) : (
            /* Settings Form View */
            <div className="space-y-4">
              {/* Error Alert */}
              {errorMessage && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Warnings from Safety Check */}
              {safety.warnings.map((w, i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-start gap-2.5"
                >
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>{w}</span>
                </div>
              ))}

              {/* Format Selection Grid */}
              <div className="space-y-1.5">
                <label className="font-semibold text-zinc-300 block">
                  Export Format
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {EXPORT_FORMATS.map((f) => {
                    const isSupported =
                      f.id !== "mp4" || (capabilities && capabilities.mp4Supported);

                    return (
                      <button
                        key={f.id}
                        onClick={() => {
                          if (isSupported) setFormat(f.id);
                        }}
                        disabled={!isSupported}
                        className={`min-h-[48px] p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                          format === f.id
                            ? "bg-brand-600/25 border-brand-500 text-white ring-1 ring-brand-500 shadow-sm"
                            : isSupported
                            ? "bg-surface-100 border-surface-border text-zinc-400 hover:text-zinc-200"
                            : "bg-surface-100/50 border-surface-border text-zinc-600 cursor-not-allowed opacity-60"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs">{f.label}</span>
                          <span className="font-mono text-[10px] text-zinc-500">
                            {f.ext}
                          </span>
                        </div>
                        <span className="text-[10px] text-zinc-400 truncate mt-1">
                          {isSupported ? f.desc : "Not supported by browser"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Resolution & FPS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-semibold text-zinc-300 block">
                    Resolution
                  </label>
                  <select
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                    className="w-full min-h-[44px] bg-surface-100 border border-surface-border rounded-xl px-3 text-xs text-white focus:outline-none focus:border-brand-500 font-medium"
                  >
                    {RESOLUTION_PRESETS.map((res) => (
                      <option key={res.id} value={res.id}>
                        {res.label} {res.mobileSafe ? "• Mobile Safe" : "• High GPU"}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-zinc-300 block">
                    Frame Rate (FPS)
                  </label>
                  <select
                    value={exportFps}
                    onChange={(e) => setExportFps(Number(e.target.value))}
                    className="w-full min-h-[44px] bg-surface-100 border border-surface-border rounded-xl px-3 text-xs text-white focus:outline-none focus:border-brand-500 font-medium"
                  >
                    <option value={15}>15 FPS (Great for GIF / Low RAM)</option>
                    <option value={24}>24 FPS (Cinematic standard)</option>
                    <option value={30}>30 FPS (Recommended Mobile/Web)</option>
                    <option value={60}>60 FPS (Ultra Smooth 60fps)</option>
                  </select>
                </div>
              </div>

              {/* Timeline Export Range & Filename */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-semibold text-zinc-300 block">
                    Export Duration (seconds)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      max={duration || 60}
                      value={exportDuration}
                      onChange={(e) =>
                        setExportDuration(Math.max(0.5, Number(e.target.value)))
                      }
                      className="flex-1 min-h-[44px] bg-surface-100 border border-surface-border rounded-xl px-3 text-xs text-white font-mono font-bold focus:outline-none focus:border-brand-500"
                    />
                    <button
                      onClick={() => {
                        setExportStartTime(0);
                        setExportDuration(duration || 5);
                      }}
                      className="min-h-[44px] px-3 rounded-xl bg-surface-100 hover:bg-surface-border border border-surface-border text-zinc-300 text-[11px]"
                    >
                      Entire Project
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-zinc-300 block">
                    File Name
                  </label>
                  <input
                    type="text"
                    value={filename}
                    onChange={(e) => setFilename(e.target.value)}
                    className="w-full min-h-[44px] bg-surface-100 border border-surface-border rounded-xl px-3 text-xs text-white font-mono focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              {/* Advanced Settings Toggle */}
              <div>
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1.5 font-medium transition-colors"
                >
                  <Sliders className="w-3.5 h-3.5 text-brand-400" />
                  <span>{showAdvanced ? "Hide Advanced Settings" : "Show Advanced Bitrate & Background"}</span>
                </button>

                {showAdvanced && (
                  <div className="mt-3 p-3.5 rounded-xl bg-surface-100 border border-surface-border space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-zinc-400">Video Bitrate</span>
                          <span className="font-mono text-zinc-300">
                            {videoBitrate / 1000000} Mbps
                          </span>
                        </div>
                        <input
                          type="range"
                          min="2000000"
                          max="20000000"
                          step="1000000"
                          value={videoBitrate}
                          onChange={(e) => setVideoBitrate(Number(e.target.value))}
                          className="w-full accent-brand-500 h-2 bg-surface-200 rounded-lg cursor-pointer"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-zinc-400">Audio Bitrate</span>
                          <span className="font-mono text-zinc-300">
                            {audioBitrate / 1000} kbps
                          </span>
                        </div>
                        <input
                          type="range"
                          min="96000"
                          max="320000"
                          step="32000"
                          value={audioBitrate}
                          onChange={(e) => setAudioBitrate(Number(e.target.value))}
                          className="w-full accent-brand-500 h-2 bg-surface-200 rounded-lg cursor-pointer"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-surface-border">
                      <span className="text-zinc-300">Background Transparency (Alpha)</span>
                      <button
                        onClick={() => setIsTransparent(!isTransparent)}
                        className={`min-h-[32px] px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                          isTransparent
                            ? "bg-brand-600 text-white"
                            : "bg-surface-200 text-zinc-400 border border-surface-border"
                        }`}
                      >
                        {isTransparent ? "Transparent Enabled" : "Canvas Background"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        {!isRendering && !exportResult && (
          <div className="px-5 py-3 border-t border-surface-border bg-surface-100/50 flex items-center justify-between">
            <div className="text-[11px] text-zinc-500 hidden sm:flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-emerald-400" />
              <span>Hardware-accelerated deterministic rendering</span>
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <button
                onClick={onClose}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-surface-100 hover:bg-surface-border border border-surface-border font-semibold text-zinc-300 transition-colors"
              >
                Close
              </button>
              <button
                onClick={handleStartExport}
                className="min-h-[44px] px-6 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold flex items-center gap-2 shadow-glow transition-all"
              >
                <Film className="w-4 h-4 text-brand-200" />
                <span>Start Export</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
