"use client";

import React from "react";
import {
  X,
  Clock,
  Sliders,
  Scissors,
  Copy,
  Trash2,
  Maximize2,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useAnimationStore } from "@/store/useAnimationStore";
import { useEditorStore } from "@/store/useEditorStore";

export default function ClipPropertiesSheet() {
  const {
    editingClipId,
    setEditingClipId,
    currentTime,
    duration: projectDuration,
    fps,
  } = useAnimationStore();

  const {
    layers,
    updateClipTiming,
    splitClip,
    duplicateClip,
    deleteClip,
    renameLayer,
    updateLayer,
  } = useEditorStore();

  if (!editingClipId) return null;

  const clip = layers.find((l) => l.id === editingClipId);
  if (!clip) return null;

  const startTime = Number(clip.startTime ?? 0);
  const duration = Number(clip.duration ?? projectDuration);
  const endTime = Number((startTime + duration).toFixed(3));
  const frameRate = fps || 60;
  const frameStep = Number((1 / frameRate).toFixed(3));

  const handleStartChange = (val) => {
    const num = Math.max(0, Number(val));
    updateClipTiming(clip.id, { startTime: num });
  };

  const handleDurationChange = (val) => {
    const num = Math.max(0.1, Number(val));
    updateClipTiming(clip.id, { duration: num });
  };

  const handleFitToProject = () => {
    updateClipTiming(clip.id, { startTime: 0, duration: projectDuration });
  };

  const canSplit =
    currentTime > startTime + 0.05 && currentTime < endTime - 0.05;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full sm:max-w-md bg-surface-200 border border-surface-border rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl space-y-5 text-xs text-zinc-200 max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Grab Handle for Mobile */}
        <div className="w-12 h-1.5 bg-zinc-600 rounded-full mx-auto sm:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-surface-border">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-brand-400" />
            <h3 className="font-semibold text-white text-sm">
              Clip Timing & Track
            </h3>
          </div>
          <button
            onClick={() => setEditingClipId(null)}
            className="min-w-[44px] min-h-[44px] p-2 text-zinc-400 hover:text-white rounded-xl flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Name input */}
        <div className="space-y-1.5">
          <label className="text-zinc-400 font-medium block">Clip Label</label>
          <input
            type="text"
            value={clip.name}
            onChange={(e) => renameLayer(clip.id, e.target.value)}
            className="w-full bg-surface-100 border border-surface-border rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-brand-500 font-semibold"
          />
        </div>

        {/* Start Time with Stepper Controls (min 44px touch targets) */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-zinc-400 font-medium">
            <span>Start Timestamp (seconds)</span>
            <span className="font-mono text-zinc-300">
              Frame: {Math.round(startTime * frameRate)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleStartChange(Math.max(0, startTime - frameStep))}
              className="min-w-[44px] min-h-[44px] rounded-xl bg-surface-100 border border-surface-border hover:bg-surface-border text-zinc-300 flex items-center justify-center font-bold text-sm active:scale-95 transition-transform"
            >
              -
            </button>
            <input
              type="number"
              step="0.05"
              min="0"
              value={startTime}
              onChange={(e) => handleStartChange(e.target.value)}
              className="flex-1 bg-surface-100 border border-surface-border rounded-xl px-3.5 py-2.5 text-xs text-white text-center font-mono font-bold focus:outline-none focus:border-brand-500 min-h-[44px]"
            />
            <button
              onClick={() => handleStartChange(startTime + frameStep)}
              className="min-w-[44px] min-h-[44px] rounded-xl bg-surface-100 border border-surface-border hover:bg-surface-border text-zinc-300 flex items-center justify-center font-bold text-sm active:scale-95 transition-transform"
            >
              +
            </button>
          </div>
        </div>

        {/* Duration with Stepper Controls */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-zinc-400 font-medium">
            <span>Clip Duration (seconds)</span>
            <span className="font-mono text-zinc-300">
              Ends at: {endTime}s
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleDurationChange(Math.max(0.1, duration - frameStep))}
              className="min-w-[44px] min-h-[44px] rounded-xl bg-surface-100 border border-surface-border hover:bg-surface-border text-zinc-300 flex items-center justify-center font-bold text-sm active:scale-95 transition-transform"
            >
              -
            </button>
            <input
              type="number"
              step="0.05"
              min="0.1"
              value={duration}
              onChange={(e) => handleDurationChange(e.target.value)}
              className="flex-1 bg-surface-100 border border-surface-border rounded-xl px-3.5 py-2.5 text-xs text-white text-center font-mono font-bold focus:outline-none focus:border-brand-500 min-h-[44px]"
            />
            <button
              onClick={() => handleDurationChange(duration + frameStep)}
              className="min-w-[44px] min-h-[44px] rounded-xl bg-surface-100 border border-surface-border hover:bg-surface-border text-zinc-300 flex items-center justify-center font-bold text-sm active:scale-95 transition-transform"
            >
              +
            </button>
          </div>
        </div>

        {/* Audio Specific Controls (if clip is audio) */}
        {clip.type === "audio" && (
          <div className="p-3 rounded-xl bg-surface-100 border border-emerald-500/30 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-emerald-300 font-semibold flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                Audio Level & Fades
              </span>
              <span className="font-mono text-zinc-300">
                {Math.round((clip.volume !== undefined ? clip.volume : 1) * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1.5"
              step="0.05"
              value={clip.volume !== undefined ? clip.volume : 1}
              onChange={(e) => updateLayer(clip.id, { volume: Number(e.target.value) })}
              className="w-full accent-emerald-500 cursor-pointer h-2 bg-surface-200 rounded-lg"
            />
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <label className="text-zinc-400 block mb-1">Fade In (s)</label>
                <input
                  type="number"
                  min="0"
                  max={duration / 2}
                  step="0.1"
                  value={clip.fadeIn || 0}
                  onChange={(e) => updateLayer(clip.id, { fadeIn: Math.max(0, Number(e.target.value)) })}
                  className="w-full bg-surface-200 border border-surface-border rounded-lg px-2 py-1 text-center font-mono text-white"
                />
              </div>
              <div>
                <label className="text-zinc-400 block mb-1">Fade Out (s)</label>
                <input
                  type="number"
                  min="0"
                  max={duration / 2}
                  step="0.1"
                  value={clip.fadeOut || 0}
                  onChange={(e) => updateLayer(clip.id, { fadeOut: Math.max(0, Number(e.target.value)) })}
                  className="w-full bg-surface-200 border border-surface-border rounded-lg px-2 py-1 text-center font-mono text-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-surface-border">
          <button
            onClick={handleFitToProject}
            className="min-h-[44px] flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-surface-100 hover:bg-surface-border border border-surface-border text-zinc-200 transition-colors font-semibold"
          >
            <Maximize2 className="w-4 h-4 text-brand-400" />
            <span>Fit Project ({projectDuration}s)</span>
          </button>

          <button
            onClick={() => {
              splitClip(clip.id, currentTime);
              setEditingClipId(null);
            }}
            disabled={!canSplit}
            className={`min-h-[44px] flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border transition-colors font-semibold ${
              canSplit
                ? "bg-brand-600/20 hover:bg-brand-600/30 text-brand-300 border-brand-500/40"
                : "bg-surface-100 text-zinc-500 border-surface-border cursor-not-allowed"
            }`}
          >
            <Scissors className="w-4 h-4" />
            <span>Split @ Playhead</span>
          </button>

          <button
            onClick={() => {
              duplicateClip(clip.id);
              setEditingClipId(null);
            }}
            className="min-h-[44px] flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-surface-100 hover:bg-surface-border border border-surface-border text-zinc-200 transition-colors font-semibold"
          >
            <Copy className="w-4 h-4 text-cyan-400" />
            <span>Duplicate Clip</span>
          </button>

          <button
            onClick={() => {
              deleteClip(clip.id);
              setEditingClipId(null);
            }}
            className="min-h-[44px] flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 transition-colors font-semibold"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete Clip</span>
          </button>
        </div>
      </div>
    </div>
  );
}
