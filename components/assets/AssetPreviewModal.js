"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  X,
  Play,
  Pause,
  Volume2,
  VolumeX,
  RotateCcw,
  Plus,
  Edit2,
  Download,
} from "lucide-react";
import { formatBytes } from "@/lib/storage/db";

export default function AssetPreviewModal({
  asset,
  onClose,
  onAddToCanvas,
  onEditImage,
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(asset?.metadata?.duration || 0);
  const [isMuted, setIsMuted] = useState(false);
  const [fontSampleText, setFontSampleText] = useState("The quick brown fox jumps over the lazy dog. 0123456789");
  const [fontSize, setFontSize] = useState(36);

  const videoRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
  }, [asset]);

  if (!asset) return null;

  const src = asset.liveUrl || asset.thumbnail;

  const handleDownload = () => {
    if (!asset.blob && !src) return;
    const a = document.createElement("a");
    a.href = src;
    a.download = asset.originalName || `${asset.name}.${asset.metadata?.format || "bin"}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const toggleMediaPlay = () => {
    const media = videoRef.current || audioRef.current;
    if (!media) return;

    if (media.paused) {
      media.play().catch(() => {});
      setIsPlaying(true);
    } else {
      media.pause();
      setIsPlaying(false);
    }
  };

  const handleTimeUpdate = (e) => {
    const media = e.target;
    setCurrentTime(media.currentTime);
    if (!duration && media.duration) setDuration(media.duration);
  };

  const handleSeek = (newTime) => {
    const media = videoRef.current || audioRef.current;
    if (media) {
      media.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-surface-200 border border-surface-border rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border bg-surface-100">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-brand-500/20 text-brand-400">
              {asset.category}
            </span>
            <h3 className="font-semibold text-sm text-zinc-100 truncate">
              {asset.name}
            </h3>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleDownload}
              className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-surface-200 transition-colors"
              title="Download file"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-surface-200 transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Preview Viewport */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col items-center justify-center min-h-[300px] bg-[#07070a]">
          {/* 1. IMAGE & SVG PREVIEW */}
          {(asset.category === "image" || asset.category === "svg") && (
            <div className="w-full h-full flex flex-col items-center justify-center">
              <div className="max-w-full max-h-[55vh] rounded-xl overflow-hidden shadow-xl border border-surface-border bg-[#0e0e12] flex items-center justify-center p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt={asset.name}
                  className="max-w-full max-h-[50vh] object-contain"
                />
              </div>
              <div className="mt-3 text-xs text-zinc-500 font-mono">
                {asset.metadata?.width && asset.metadata?.height && (
                  <span>
                    Resolution: {asset.metadata.width} × {asset.metadata.height} px
                  </span>
                )}
              </div>
            </div>
          )}

          {/* 2. VIDEO PREVIEW */}
          {asset.category === "video" && (
            <div className="w-full flex flex-col items-center space-y-4">
              <div className="relative max-w-full max-h-[55vh] rounded-xl overflow-hidden bg-black border border-surface-border shadow-2xl">
                <video
                  ref={videoRef}
                  src={src}
                  playsInline
                  muted={isMuted}
                  onTimeUpdate={handleTimeUpdate}
                  onEnded={() => setIsPlaying(false)}
                  className="max-w-full max-h-[50vh] object-contain"
                />
              </div>

              {/* Video Controls Bar */}
              <div className="w-full max-w-xl bg-surface-100 p-3 rounded-xl border border-surface-border space-y-2">
                <div className="flex items-center gap-3">
                  <button
                    onClick={toggleMediaPlay}
                    className="p-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white min-w-[36px] min-h-[36px] flex items-center justify-center transition-colors"
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
                  </button>

                  <button
                    onClick={() => handleSeek(0)}
                    className="p-2 rounded-lg hover:bg-surface-border text-zinc-400 hover:text-white transition-colors"
                    title="Restart"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>

                  <div className="flex-1 flex items-center gap-2">
                    <input
                      type="range"
                      min="0"
                      max={duration || 100}
                      step="0.05"
                      value={currentTime}
                      onChange={(e) => handleSeek(parseFloat(e.target.value))}
                      className="w-full accent-brand-500 cursor-pointer h-1.5 bg-surface-200 rounded-full"
                    />
                    <span className="font-mono text-[11px] text-zinc-400 min-w-[70px] text-right">
                      {currentTime.toFixed(1)}s / {(duration || 0).toFixed(1)}s
                    </span>
                  </div>

                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className="p-2 rounded-lg hover:bg-surface-border text-zinc-400 hover:text-white transition-colors"
                  >
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 3. AUDIO PREVIEW WITH WAVEFORM */}
          {asset.category === "audio" && (
            <div className="w-full max-w-xl flex flex-col items-center space-y-5">
              <audio
                ref={audioRef}
                src={src}
                muted={isMuted}
                onTimeUpdate={handleTimeUpdate}
                onEnded={() => setIsPlaying(false)}
              />

              {/* Interactive Waveform Display */}
              <div className="w-full p-6 rounded-2xl bg-gradient-to-br from-surface-100 to-surface-50 border border-surface-border shadow-xl space-y-4">
                <div className="h-24 w-full flex items-center gap-1 cursor-pointer overflow-hidden px-2">
                  {(asset.metadata?.waveform || Array(50).fill(0.4)).map((p, i, arr) => {
                    const fraction = i / arr.length;
                    const isPassed = currentTime / (duration || 1) >= fraction;
                    return (
                      <div
                        key={i}
                        onClick={() => handleSeek(fraction * (duration || 5))}
                        className={`flex-1 rounded-full transition-all hover:scale-y-125 ${
                          isPassed ? "bg-amber-400 shadow-glow" : "bg-zinc-700 hover:bg-zinc-500"
                        }`}
                        style={{ height: `${Math.max(15, p * 100)}%` }}
                      />
                    );
                  })}
                </div>

                {/* Audio Controls */}
                <div className="flex items-center justify-between pt-2 border-t border-surface-border">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={toggleMediaPlay}
                      className="p-3 rounded-full bg-amber-500 hover:bg-amber-400 text-black shadow-glow min-w-[44px] min-h-[44px] flex items-center justify-center transition-all"
                    >
                      {isPlaying ? <Pause className="w-5 h-5 fill-black" /> : <Play className="w-5 h-5 fill-black ml-0.5" />}
                    </button>
                    <span className="font-mono text-xs text-amber-300 font-semibold">
                      {currentTime.toFixed(1)}s / {(duration || 0).toFixed(1)}s
                    </span>
                  </div>

                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className="p-2.5 rounded-lg hover:bg-surface-border text-zinc-400 hover:text-white transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                  >
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 4. FONT PREVIEW WITH SPECIMEN TESTER */}
          {asset.category === "font" && (
            <div className="w-full max-w-2xl space-y-5">
              <div className="flex items-center justify-between gap-4 p-3 bg-surface-100 rounded-xl border border-surface-border">
                <span className="text-xs text-zinc-400 font-mono">
                  Font Family: <strong className="text-cyan-400">{asset.metadata?.fontFamily}</strong>
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-zinc-400">Size: {fontSize}px</span>
                  <input
                    type="range"
                    min="16"
                    max="72"
                    value={fontSize}
                    onChange={(e) => setFontSize(parseInt(e.target.value))}
                    className="w-28 accent-cyan-400 cursor-pointer"
                  />
                </div>
              </div>

              {/* Interactive Specimen Box */}
              <div className="p-6 rounded-2xl bg-surface-100 border border-surface-border min-h-[220px] flex items-center justify-center">
                <textarea
                  value={fontSampleText}
                  onChange={(e) => setFontSampleText(e.target.value)}
                  style={{
                    fontFamily: asset.metadata?.fontFamily || "sans-serif",
                    fontSize: `${fontSize}px`,
                  }}
                  className="w-full bg-transparent text-white border-none outline-none resize-none text-center font-normal leading-relaxed"
                  rows={4}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-t border-surface-border bg-surface-100 text-xs">
          <div className="flex items-center gap-4 text-zinc-500 font-mono">
            <span>Size: {formatBytes(asset.size)}</span>
            <span>Type: {asset.type}</span>
          </div>

          <div className="flex items-center gap-2">
            {asset.category === "image" && onEditImage && (
              <button
                onClick={() => {
                  onClose();
                  onEditImage(asset);
                }}
                className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-surface-200 hover:bg-surface-border border border-surface-border text-zinc-200 font-semibold transition-colors min-h-[44px]"
              >
                <Edit2 className="w-4 h-4 text-purple-400" />
                <span>Edit Image</span>
              </button>
            )}

            {onAddToCanvas && (
              <button
                onClick={() => {
                  onAddToCanvas(asset);
                  onClose();
                }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold shadow-glow transition-all min-h-[44px]"
              >
                <Plus className="w-4 h-4" />
                <span>Add to Composition</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
