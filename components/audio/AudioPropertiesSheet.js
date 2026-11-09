"use client";

import React, { useState } from "react";
import {
  X,
  Volume2,
  VolumeX,
  Sliders,
  RotateCcw,
  Repeat,
  Gauge,
  Sparkles,
  Activity,
  Music,
} from "lucide-react";
import { useEditorStore } from "@/store/useEditorStore";
import { useAnimationStore } from "@/store/useAnimationStore";
import { studioAudioMixer } from "@/engine/audio/mixer";

const SPEED_OPTIONS = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];

export default function AudioPropertiesSheet({
  clip,
  onClose,
  onOpenEffects,
  onOpenSync,
}) {
  const { updateClipTiming, updateLayer } = useEditorStore();
  const { duration: projectDuration, fps } = useAnimationStore();

  if (!clip) return null;

  const startTime = Number(clip.startTime ?? 0);
  const duration = Number(clip.duration ?? projectDuration);
  const volume = clip.volume !== undefined ? Number(clip.volume) : 1.0;
  const pan = clip.pan !== undefined ? Number(clip.pan) : 0.0;
  const fadeIn = Number(clip.fadeIn ?? 0.0);
  const fadeOut = Number(clip.fadeOut ?? 0.0);
  const speed = Number(clip.playbackSpeed ?? 1.0);
  const isLoop = !!clip.isLoop;
  const isReverse = !!clip.isReverse;
  const isMuted = !!clip.isMuted;

  const handleVolumeChange = (val) => {
    const vol = Math.max(0, Math.min(2.0, Number(val)));
    updateLayer(clip.id, { volume: vol });
    studioAudioMixer.setTrackVolume(clip.id, isMuted ? 0 : vol);
  };

  const handlePanChange = (val) => {
    const p = Math.max(-1, Math.min(1, Number(val)));
    updateLayer(clip.id, { pan: p });
    studioAudioMixer.setTrackPan(clip.id, p);
  };

  const handleToggleMute = () => {
    const nextMute = !isMuted;
    updateLayer(clip.id, { isMuted: nextMute });
    studioAudioMixer.setTrackVolume(clip.id, nextMute ? 0 : volume);
  };

  const handleFadeInChange = (val) => {
    const clamped = Math.max(0, Math.min(duration / 2, Number(val)));
    updateLayer(clip.id, { fadeIn: Number(clamped.toFixed(2)) });
  };

  const handleFadeOutChange = (val) => {
    const clamped = Math.max(0, Math.min(duration / 2, Number(val)));
    updateLayer(clip.id, { fadeOut: Number(clamped.toFixed(2)) });
  };

  const handleSpeedChange = (s) => {
    updateLayer(clip.id, { playbackSpeed: s });
  };

  const handleToggleReverse = () => {
    updateLayer(clip.id, { isReverse: !isReverse });
  };

  const handleToggleLoop = () => {
    updateLayer(clip.id, { isLoop: !isLoop });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full sm:max-w-md bg-surface-200 border border-surface-border rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl space-y-4 text-xs text-zinc-200 max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Grab Handle for Mobile */}
        <div className="w-12 h-1.5 bg-zinc-600 rounded-full mx-auto sm:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-surface-border">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Music className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm">
                Audio Clip Parameters
              </h3>
              <p className="text-[10px] text-zinc-400 truncate max-w-[200px]">
                {clip.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] p-2 text-zinc-400 hover:text-white rounded-xl flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Volume & Gain Control */}
        <div className="p-3 rounded-xl bg-surface-100 border border-surface-border space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-zinc-300 font-medium flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
              Volume & Level
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleToggleMute}
                className={`min-h-[32px] px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors ${
                  isMuted
                    ? "bg-red-500/20 text-red-400 border border-red-500/30"
                    : "bg-surface-200 text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {isMuted ? "MUTED" : "MUTE"}
              </button>
              <span className="font-mono font-bold text-white text-[11px]">
                {Math.round(volume * 100)}%
              </span>
            </div>
          </div>
          <input
            type="range"
            min="0"
            max="1.5"
            step="0.01"
            value={volume}
            onChange={(e) => handleVolumeChange(e.target.value)}
            className="w-full accent-emerald-500 cursor-pointer h-2 bg-surface-200 rounded-lg"
          />
        </div>

        {/* Stereo Pan Slider */}
        <div className="p-3 rounded-xl bg-surface-100 border border-surface-border space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-zinc-300 font-medium">Stereo Panning</span>
            <span className="font-mono font-bold text-white text-[11px]">
              {pan < -0.05
                ? `L ${Math.round(Math.abs(pan) * 100)}%`
                : pan > 0.05
                ? `R ${Math.round(pan * 100)}%`
                : "Center"}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono">
            <span>L</span>
            <input
              type="range"
              min="-1.0"
              max="1.0"
              step="0.05"
              value={pan}
              onChange={(e) => handlePanChange(e.target.value)}
              className="flex-1 accent-emerald-500 cursor-pointer h-2 bg-surface-200 rounded-lg"
            />
            <span>R</span>
          </div>
        </div>

        {/* Fade In & Fade Out Steppers */}
        <div className="grid grid-cols-2 gap-2">
          <div className="p-3 rounded-xl bg-surface-100 border border-surface-border space-y-1.5">
            <span className="text-zinc-400 font-medium block">Fade In (s)</span>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min="0"
                max={duration / 2}
                step="0.1"
                value={fadeIn}
                onChange={(e) => handleFadeInChange(e.target.value)}
                className="w-full bg-surface-200 border border-surface-border rounded-lg px-2 py-1.5 text-center font-mono font-bold text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-surface-100 border border-surface-border space-y-1.5">
            <span className="text-zinc-400 font-medium block">Fade Out (s)</span>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min="0"
                max={duration / 2}
                step="0.1"
                value={fadeOut}
                onChange={(e) => handleFadeOutChange(e.target.value)}
                className="w-full bg-surface-200 border border-surface-border rounded-lg px-2 py-1.5 text-center font-mono font-bold text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Speed & Reverse & Loop */}
        <div className="p-3 rounded-xl bg-surface-100 border border-surface-border space-y-3">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-zinc-300 font-medium flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5 text-brand-400" />
                Playback Speed
              </span>
              <span className="font-mono text-zinc-300">{speed}x</span>
            </div>
            <div className="grid grid-cols-6 gap-1">
              {SPEED_OPTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSpeedChange(s)}
                  className={`min-h-[36px] rounded-lg text-[10px] font-mono font-bold transition-colors ${
                    speed === s
                      ? "bg-emerald-600 text-white"
                      : "bg-surface-200 text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-surface-border">
            <button
              onClick={handleToggleReverse}
              className={`min-h-[40px] px-3 py-2 rounded-xl border flex items-center justify-center gap-1.5 font-semibold transition-colors ${
                isReverse
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                  : "bg-surface-200 text-zinc-400 border-surface-border"
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reverse Audio</span>
            </button>

            <button
              onClick={handleToggleLoop}
              className={`min-h-[40px] px-3 py-2 rounded-xl border flex items-center justify-center gap-1.5 font-semibold transition-colors ${
                isLoop
                  ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                  : "bg-surface-200 text-zinc-400 border-surface-border"
              }`}
            >
              <Repeat className="w-3.5 h-3.5" />
              <span>Loop Playback</span>
            </button>
          </div>
        </div>

        {/* Quick Launchers for DSP Rack & Beat Sync */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={() => {
              onClose();
              if (onOpenEffects) onOpenEffects(clip.id);
            }}
            className="min-h-[44px] px-3 py-2.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-300 font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>DSP Effects Rack</span>
          </button>

          <button
            onClick={() => {
              onClose();
              if (onOpenSync) onOpenSync(clip.id);
            }}
            className="min-h-[44px] px-3 py-2.5 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/40 text-amber-300 font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Beat Sync & Tempo</span>
          </button>
        </div>
      </div>
    </div>
  );
}
