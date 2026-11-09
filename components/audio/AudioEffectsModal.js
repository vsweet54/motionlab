"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  X,
  Play,
  Pause,
  Square,
  Sparkles,
  RotateCcw,
  Volume2,
  VolumeX,
  Activity,
  Check,
  AlertCircle,
  Sliders,
} from "lucide-react";
import { studioMixer } from "@/engine/audio/mixer";
import { audioContextManager } from "@/engine/audio/audioContext";
import { useEditorStore } from "@/store/useEditorStore";
import { getAssetById } from "@/lib/storage/db";

const EFFECT_TABS = [
  { id: "equalizer", label: "3-Band EQ" },
  { id: "compressor", label: "Compressor" },
  { id: "reverb", label: "Reverb" },
  { id: "delay", label: "Delay / Echo" },
  { id: "distortion", label: "Distortion" },
  { id: "filters", label: "LP / HP Filters" },
];

const DEFAULT_EFFECTS = {
  equalizer: { enabled: true, low: 0, mid: 0, high: 0 },
  compressor: { enabled: false, threshold: -24, ratio: 4, attack: 0.003, release: 0.25 },
  reverb: { enabled: false, decay: 2.0, mix: 0.25 },
  delay: { enabled: false, delayTime: 0.3, feedback: 0.35, mix: 0.3 },
  distortion: { enabled: false, amount: 15 },
  lowpass: { enabled: false, frequency: 4000, Q: 1.0 },
  highpass: { enabled: false, frequency: 120, Q: 1.0 },
};

export default function AudioEffectsModal({
  isOpen = true,
  trackId,
  trackName,
  onClose,
}) {
  const layer = useEditorStore((s) => s.layers.find((l) => l.id === trackId));
  const updateLayer = useEditorStore((s) => s.updateLayer);

  const [activeTab, setActiveTab] = useState("equalizer");
  const [errorMessage, setErrorMessage] = useState("");
  const [hasAudioSource, setHasAudioSource] = useState(false);
  const [audioBuffer, setAudioBuffer] = useState(null);

  // Draft effects state for Apply/Cancel pattern
  const [draftEffects, setDraftEffects] = useState(() => {
    return JSON.parse(JSON.stringify(layer?.audioEffects || DEFAULT_EFFECTS));
  });

  // Keep a snapshot of original applied effects to restore if cancelled (X pressed)
  const initialEffectsRef = useRef(
    JSON.parse(JSON.stringify(layer?.audioEffects || DEFAULT_EFFECTS))
  );

  // Playback Preview State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(Number(layer?.duration || 0));

  const sourceNodeRef = useRef(null);
  const startTimeRef = useRef(0);
  const pausedAtRef = useRef(0);
  const animFrameRef = useRef(null);
  const isPlayingRef = useRef(false);

  // Sync initial state when layer changes
  useEffect(() => {
    if (layer) {
      const initial = JSON.parse(
        JSON.stringify(layer.audioEffects || DEFAULT_EFFECTS)
      );
      setDraftEffects(initial);
      initialEffectsRef.current = initial;
      if (layer.duration) {
        setTotalDuration(Number(layer.duration));
      }
    }
  }, [layer?.id]);

  // Load and decode audio buffer for preview
  useEffect(() => {
    let isCancelled = false;

    async function loadBuffer() {
      if (!layer) return;

      const hasSource = Boolean(layer.assetId || layer.src);
      setHasAudioSource(hasSource);

      if (!hasSource) {
        setAudioBuffer(null);
        return;
      }

      try {
        let buffer = null;
        const cacheKey = layer.assetId || layer.src || layer.id;

        if (layer.assetId) {
          const asset = await getAssetById(layer.assetId);
          if (asset?.blob) {
            buffer = layer.isReverse
              ? await audioContextManager.getReversedAudio(cacheKey, asset.blob)
              : await audioContextManager.decodeAudio(cacheKey, asset.blob);
          }
        }

        if (!buffer && layer.src) {
          buffer = layer.isReverse
            ? await audioContextManager.getReversedAudio(cacheKey, layer.src)
            : await audioContextManager.decodeAudio(cacheKey, layer.src);
        }

        if (!isCancelled && buffer) {
          setAudioBuffer(buffer);
          setTotalDuration(buffer.duration);
        }
      } catch (err) {
        if (!isCancelled) {
          console.warn("Could not load preview audio buffer:", err);
          setErrorMessage("Failed to decode audio source.");
        }
      }
    }

    loadBuffer();

    return () => {
      isCancelled = true;
    };
  }, [layer?.id, layer?.assetId, layer?.src, layer?.isReverse]);

  // Stop preview source helper
  const stopAudioSource = useCallback(() => {
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.onended = null;
        sourceNodeRef.current.stop();
        sourceNodeRef.current.disconnect();
      } catch {}
      sourceNodeRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    isPlayingRef.current = false;
    setIsPlaying(false);
  }, []);

  // Clean up playback on unmount or close
  useEffect(() => {
    return () => {
      stopAudioSource();
    };
  }, [stopAudioSource]);

  // Immediately apply draft effects to the active DSP channel for live auditioning
  const applyLiveEffectToMixer = useCallback(
    (type, config) => {
      if (!trackId) return;
      if (config?.enabled) {
        studioMixer.applyEffect(trackId, type, config);
      } else {
        studioMixer.removeEffect(trackId, type);
      }
    },
    [trackId]
  );

  // Update a specific effect parameter
  const handleUpdateEffect = (type, params) => {
    setDraftEffects((prev) => {
      const updated = {
        ...prev,
        [type]: {
          ...prev[type],
          ...params,
        },
      };
      // Audition live immediately if active or previewing
      applyLiveEffectToMixer(type, updated[type]);
      return updated;
    });
  };

  // Toggle effect enable/bypass
  const handleToggleEffect = (type) => {
    setDraftEffects((prev) => {
      const currentEnabled = !!prev[type]?.enabled;
      const updated = {
        ...prev,
        [type]: {
          ...prev[type],
          enabled: !currentEnabled,
        },
      };
      applyLiveEffectToMixer(type, updated[type]);
      return updated;
    });
  };

  // Play audio preview
  const handlePlay = async () => {
    if (!audioBuffer) return;

    const ctx = audioContextManager.getContext();
    if (!ctx) return;

    if (ctx.state === "suspended") {
      await ctx.resume().catch(() => {});
    }

    // Stop any existing source to avoid overlapping sound
    stopAudioSource();

    // Ensure all current draft effects are mounted on the track's DSP mixer channel
    Object.keys(draftEffects).forEach((effType) => {
      applyLiveEffectToMixer(effType, draftEffects[effType]);
    });

    const channel = studioMixer.getOrCreateChannel(trackId);
    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;

    const offset = Math.min(pausedAtRef.current, audioBuffer.duration);
    const speed = Number(layer?.playbackSpeed) || 1.0;
    source.playbackRate.value = Math.max(0.25, Math.min(4.0, speed));

    source.connect(channel.inputNode);

    startTimeRef.current = ctx.currentTime - offset / speed;
    isPlayingRef.current = true;
    setIsPlaying(true);
    sourceNodeRef.current = source;

    source.onended = () => {
      if (sourceNodeRef.current === source) {
        setIsPlaying(false);
        isPlayingRef.current = false;
        sourceNodeRef.current = null;
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        pausedAtRef.current = 0;
        setCurrentTime(0);
      }
    };

    source.start(0, offset);

    // Update playhead timer
    const updateProgress = () => {
      if (isPlayingRef.current && ctx) {
        const elapsed = (ctx.currentTime - startTimeRef.current) * speed;
        if (elapsed <= audioBuffer.duration) {
          setCurrentTime(elapsed);
          pausedAtRef.current = elapsed;
          animFrameRef.current = requestAnimationFrame(updateProgress);
        } else {
          setCurrentTime(audioBuffer.duration);
          pausedAtRef.current = 0;
          setIsPlaying(false);
          isPlayingRef.current = false;
        }
      }
    };
    animFrameRef.current = requestAnimationFrame(updateProgress);
  };

  // Pause audio preview
  const handlePause = () => {
    if (!isPlayingRef.current) return;
    const ctx = audioContextManager.getContext();
    if (ctx) {
      const speed = Number(layer?.playbackSpeed) || 1.0;
      pausedAtRef.current = (ctx.currentTime - startTimeRef.current) * speed;
    }
    stopAudioSource();
  };

  // Stop audio and rewind
  const handleStop = () => {
    stopAudioSource();
    pausedAtRef.current = 0;
    setCurrentTime(0);
  };

  // Scrubber / Seek
  const handleSeek = (timeVal) => {
    const target = Math.max(0, Math.min(Number(timeVal), totalDuration));
    pausedAtRef.current = target;
    setCurrentTime(target);
    if (isPlayingRef.current) {
      handlePlay();
    }
  };

  // Cancel / Close (X button)
  const handleCancelAndClose = (e) => {
    e?.stopPropagation();
    stopAudioSource();

    // Revert mixer DSP graph to initial saved layer state
    const original = initialEffectsRef.current;
    if (trackId && original) {
      Object.keys(original).forEach((type) => {
        if (original[type]?.enabled) {
          studioMixer.applyEffect(trackId, type, original[type]);
        } else {
          studioMixer.removeEffect(trackId, type);
        }
      });
    }

    if (onClose) onClose();
  };

  // Apply & Close
  const handleApplyAndClose = (e) => {
    e?.stopPropagation();
    stopAudioSource();

    try {
      // 1. Validate parameters
      if (!trackId) {
        setErrorMessage("Audio track ID is missing.");
        return;
      }

      // 2. Persist to project store and trigger Autosave & History
      updateLayer(trackId, { audioEffects: draftEffects });

      // 3. Confirm audio processing chain
      Object.keys(draftEffects).forEach((type) => {
        if (draftEffects[type]?.enabled) {
          studioMixer.applyEffect(trackId, type, draftEffects[type]);
        } else {
          studioMixer.removeEffect(trackId, type);
        }
      });

      // 4. Close modal
      if (onClose) onClose();
    } catch (err) {
      console.error("Failed to apply audio effects:", err);
      setErrorMessage("Failed to save audio effects. Please try again.");
    }
  };

  if (isOpen === false || !trackId) return null;

  const formatTime = (secs) => {
    const s = Math.max(0, Number(secs) || 0);
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    const ms = Math.floor((s % 1) * 10);
    return `${m}:${sec.toString().padStart(2, "0")}.${ms}`;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md select-none animate-fade-in"
      onClick={handleCancelAndClose}
    >
      <div
        className="w-full max-w-2xl bg-surface-200 border border-surface-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] z-50 relative pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-surface-border bg-surface-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-zinc-100 flex items-center gap-2">
                DSP Audio Effects Rack
              </h3>
              <span className="text-[11px] font-mono text-zinc-400">
                Track: {trackName || layer?.name || "Audio Track"}
              </span>
            </div>
          </div>

          <button
            onClick={handleCancelAndClose}
            type="button"
            className="p-2.5 rounded-xl bg-surface-200 hover:bg-surface-border text-zinc-400 hover:text-white transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer touch-manipulation"
            aria-label="Close Effects Rack"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Real-time Preview & Transport Bar */}
        <div className="px-5 py-3 bg-surface-100/70 border-b border-surface-border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            {/* Play / Pause Button */}
            <button
              onClick={isPlaying ? handlePause : handlePlay}
              disabled={!hasAudioSource || !audioBuffer}
              type="button"
              className={`flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl font-bold transition-all min-h-[44px] min-w-[90px] cursor-pointer touch-manipulation ${
                !hasAudioSource || !audioBuffer
                  ? "bg-surface-150 text-zinc-600 border border-surface-border cursor-not-allowed"
                  : isPlaying
                  ? "bg-amber-500 hover:bg-amber-400 text-black shadow-glow"
                  : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-glow"
              }`}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              <span>{isPlaying ? "Pause" : "Preview"}</span>
            </button>

            {/* Stop Button */}
            <button
              onClick={handleStop}
              disabled={!hasAudioSource || !audioBuffer || (!isPlaying && currentTime === 0)}
              type="button"
              className="p-2.5 rounded-xl bg-surface-150 hover:bg-surface-border border border-surface-border text-zinc-400 hover:text-white disabled:opacity-30 disabled:hover:text-zinc-400 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer touch-manipulation"
              title="Stop & Rewind"
            >
              <Square className="w-3.5 h-3.5" />
            </button>

            {/* Time Indicator */}
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-150 border border-surface-border font-mono text-[11px] text-zinc-300">
              <span className="text-emerald-400">{formatTime(currentTime)}</span>
              <span className="text-zinc-600">/</span>
              <span>{formatTime(totalDuration)}</span>
            </div>
          </div>

          {/* Scrubbable Seek Bar */}
          <div className="flex-1 flex items-center gap-2 min-w-[140px]">
            <input
              type="range"
              min="0"
              max={totalDuration || 5}
              step="0.05"
              value={currentTime}
              disabled={!hasAudioSource || !audioBuffer}
              onChange={(e) => handleSeek(parseFloat(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer h-2 bg-surface-200 rounded-lg touch-manipulation"
              aria-label="Audio preview position"
            />
          </div>

          {!hasAudioSource && (
            <div className="flex items-center gap-1.5 text-amber-400 text-[11px] bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>No audio source attached</span>
            </div>
          )}
        </div>

        {/* Tab Strip */}
        <div className="flex items-center gap-1 p-2 bg-surface-150 border-b border-surface-border overflow-x-auto no-scrollbar">
          {EFFECT_TABS.map((tab) => {
            const isTabActive = activeTab === tab.id;
            const isEffectOn = !!draftEffects[tab.id]?.enabled;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                type="button"
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all min-h-[44px] cursor-pointer touch-manipulation ${
                  isTabActive
                    ? "bg-purple-600 text-white shadow-sm"
                    : "bg-surface-100 text-zinc-400 hover:text-white hover:bg-surface-border"
                }`}
              >
                {isEffectOn && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Controls Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 text-xs">
          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-xs flex items-center justify-between">
              <span>{errorMessage}</span>
              <button onClick={() => setErrorMessage("")} className="text-red-400 font-bold p-1">
                &times;
              </button>
            </div>
          )}

          {/* 1. EQUALIZER */}
          {activeTab === "equalizer" && (
            <div className="space-y-5">
              <div className="flex items-center justify-between p-3.5 bg-surface-100 rounded-xl border border-surface-border">
                <div>
                  <span className="font-semibold text-zinc-200 block text-xs">3-Band Parametric EQ</span>
                  <span className="text-[11px] text-zinc-500">Low shelf, mid peak, and high shelf tone sculpting</span>
                </div>
                <button
                  onClick={() => handleToggleEffect("equalizer")}
                  type="button"
                  className={`px-3.5 py-1.5 rounded-xl text-[11px] font-bold border transition-colors min-h-[36px] cursor-pointer touch-manipulation ${
                    draftEffects.equalizer?.enabled
                      ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                      : "bg-surface-200 text-zinc-500 border-surface-border"
                  }`}
                >
                  {draftEffects.equalizer?.enabled ? "ENABLED" : "BYPASSED"}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { key: "low", label: "Low (320Hz)", min: -18, max: 18, val: draftEffects.equalizer?.low ?? 0 },
                  { key: "mid", label: "Mid (1000Hz)", min: -18, max: 18, val: draftEffects.equalizer?.mid ?? 0 },
                  { key: "high", label: "High (3200Hz)", min: -18, max: 18, val: draftEffects.equalizer?.high ?? 0 },
                ].map((band) => (
                  <div key={band.key} className="p-4 bg-surface-100 rounded-xl border border-surface-border space-y-3 text-center">
                    <span className="text-[11px] font-semibold text-zinc-300 block">{band.label}</span>
                    <input
                      type="range"
                      min={band.min}
                      max={band.max}
                      step="0.5"
                      value={band.val}
                      onChange={(e) =>
                        handleUpdateEffect("equalizer", { [band.key]: parseFloat(e.target.value) })
                      }
                      className="w-full accent-purple-500 cursor-pointer h-2 bg-surface-200 rounded-lg touch-manipulation"
                    />
                    <span className="font-mono text-xs text-purple-300 font-bold block">
                      {band.val > 0 ? `+${band.val}` : band.val} dB
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. COMPRESSOR */}
          {activeTab === "compressor" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3.5 bg-surface-100 rounded-xl border border-surface-border">
                <div>
                  <span className="font-semibold text-zinc-200 block text-xs">Dynamics Compressor</span>
                  <span className="text-[11px] text-zinc-500">Controls dynamic range and peaks</span>
                </div>
                <button
                  onClick={() => handleToggleEffect("compressor")}
                  type="button"
                  className={`px-3.5 py-1.5 rounded-xl text-[11px] font-bold border transition-colors min-h-[36px] cursor-pointer touch-manipulation ${
                    draftEffects.compressor?.enabled
                      ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                      : "bg-surface-200 text-zinc-500 border-surface-border"
                  }`}
                >
                  {draftEffects.compressor?.enabled ? "ENABLED" : "BYPASSED"}
                </button>
              </div>

              <div className="space-y-3 p-4 bg-surface-100 rounded-xl border border-surface-border">
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-zinc-400">Threshold</span>
                    <span className="font-mono text-zinc-200">{draftEffects.compressor?.threshold ?? -24} dB</span>
                  </div>
                  <input
                    type="range"
                    min="-60"
                    max="0"
                    value={draftEffects.compressor?.threshold ?? -24}
                    onChange={(e) => handleUpdateEffect("compressor", { threshold: parseFloat(e.target.value) })}
                    className="w-full accent-purple-500 cursor-pointer h-2 bg-surface-200 rounded-lg touch-manipulation"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-zinc-400">Ratio</span>
                    <span className="font-mono text-zinc-200">{draftEffects.compressor?.ratio ?? 4}:1</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    step="0.5"
                    value={draftEffects.compressor?.ratio ?? 4}
                    onChange={(e) => handleUpdateEffect("compressor", { ratio: parseFloat(e.target.value) })}
                    className="w-full accent-purple-500 cursor-pointer h-2 bg-surface-200 rounded-lg touch-manipulation"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 3. REVERB */}
          {activeTab === "reverb" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3.5 bg-surface-100 rounded-xl border border-surface-border">
                <div>
                  <span className="font-semibold text-zinc-200 block text-xs">Algorithmic Convolver Reverb</span>
                  <span className="text-[11px] text-zinc-500">Spatial depth and acoustic reflection</span>
                </div>
                <button
                  onClick={() => handleToggleEffect("reverb")}
                  type="button"
                  className={`px-3.5 py-1.5 rounded-xl text-[11px] font-bold border transition-colors min-h-[36px] cursor-pointer touch-manipulation ${
                    draftEffects.reverb?.enabled
                      ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                      : "bg-surface-200 text-zinc-500 border-surface-border"
                  }`}
                >
                  {draftEffects.reverb?.enabled ? "ENABLED" : "BYPASSED"}
                </button>
              </div>

              <div className="space-y-3 p-4 bg-surface-100 rounded-xl border border-surface-border">
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-zinc-400">Decay Time</span>
                    <span className="font-mono text-zinc-200">{draftEffects.reverb?.decay ?? 2.0} s</span>
                  </div>
                  <input
                    type="range"
                    min="0.2"
                    max="6.0"
                    step="0.1"
                    value={draftEffects.reverb?.decay ?? 2.0}
                    onChange={(e) => handleUpdateEffect("reverb", { decay: parseFloat(e.target.value) })}
                    className="w-full accent-purple-500 cursor-pointer h-2 bg-surface-200 rounded-lg touch-manipulation"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-zinc-400">Dry / Wet Mix</span>
                    <span className="font-mono text-zinc-200">{Math.round((draftEffects.reverb?.mix ?? 0.25) * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={draftEffects.reverb?.mix ?? 0.25}
                    onChange={(e) => handleUpdateEffect("reverb", { mix: parseFloat(e.target.value) })}
                    className="w-full accent-purple-500 cursor-pointer h-2 bg-surface-200 rounded-lg touch-manipulation"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 4. DELAY */}
          {activeTab === "delay" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3.5 bg-surface-100 rounded-xl border border-surface-border">
                <div>
                  <span className="font-semibold text-zinc-200 block text-xs">Stereo Echo / Delay</span>
                  <span className="text-[11px] text-zinc-500">Feedback repeat and temporal echoes</span>
                </div>
                <button
                  onClick={() => handleToggleEffect("delay")}
                  type="button"
                  className={`px-3.5 py-1.5 rounded-xl text-[11px] font-bold border transition-colors min-h-[36px] cursor-pointer touch-manipulation ${
                    draftEffects.delay?.enabled
                      ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                      : "bg-surface-200 text-zinc-500 border-surface-border"
                  }`}
                >
                  {draftEffects.delay?.enabled ? "ENABLED" : "BYPASSED"}
                </button>
              </div>

              <div className="space-y-3 p-4 bg-surface-100 rounded-xl border border-surface-border">
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-zinc-400">Delay Time</span>
                    <span className="font-mono text-zinc-200">{draftEffects.delay?.delayTime ?? 0.3} s</span>
                  </div>
                  <input
                    type="range"
                    min="0.05"
                    max="1.5"
                    step="0.05"
                    value={draftEffects.delay?.delayTime ?? 0.3}
                    onChange={(e) => handleUpdateEffect("delay", { delayTime: parseFloat(e.target.value) })}
                    className="w-full accent-purple-500 cursor-pointer h-2 bg-surface-200 rounded-lg touch-manipulation"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-zinc-400">Feedback Loop</span>
                    <span className="font-mono text-zinc-200">{Math.round((draftEffects.delay?.feedback ?? 0.35) * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="0.85"
                    step="0.05"
                    value={draftEffects.delay?.feedback ?? 0.35}
                    onChange={(e) => handleUpdateEffect("delay", { feedback: parseFloat(e.target.value) })}
                    className="w-full accent-purple-500 cursor-pointer h-2 bg-surface-200 rounded-lg touch-manipulation"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 5. DISTORTION */}
          {activeTab === "distortion" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3.5 bg-surface-100 rounded-xl border border-surface-border">
                <div>
                  <span className="font-semibold text-zinc-200 block text-xs">WaveShaper Distortion</span>
                  <span className="text-[11px] text-zinc-500">Harmonic saturation and tube overdrive</span>
                </div>
                <button
                  onClick={() => handleToggleEffect("distortion")}
                  type="button"
                  className={`px-3.5 py-1.5 rounded-xl text-[11px] font-bold border transition-colors min-h-[36px] cursor-pointer touch-manipulation ${
                    draftEffects.distortion?.enabled
                      ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                      : "bg-surface-200 text-zinc-500 border-surface-border"
                  }`}
                >
                  {draftEffects.distortion?.enabled ? "ENABLED" : "BYPASSED"}
                </button>
              </div>

              <div className="space-y-3 p-4 bg-surface-100 rounded-xl border border-surface-border">
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-zinc-400">Drive Amount</span>
                    <span className="font-mono text-zinc-200">{draftEffects.distortion?.amount ?? 15}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={draftEffects.distortion?.amount ?? 15}
                    onChange={(e) => handleUpdateEffect("distortion", { amount: parseInt(e.target.value) })}
                    className="w-full accent-purple-500 cursor-pointer h-2 bg-surface-200 rounded-lg touch-manipulation"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 6. FILTERS */}
          {activeTab === "filters" && (
            <div className="space-y-4">
              {/* Low-pass */}
              <div className="p-4 bg-surface-100 rounded-xl border border-surface-border space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-zinc-200 block">Low-Pass Filter (High-cut)</span>
                    <span className="text-[11px] text-zinc-500">Attenuates high frequencies above cutoff</span>
                  </div>
                  <button
                    onClick={() => handleToggleEffect("lowpass")}
                    type="button"
                    className={`px-3 py-1 rounded-xl text-[10px] font-bold border min-h-[36px] cursor-pointer touch-manipulation ${
                      draftEffects.lowpass?.enabled
                        ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                        : "bg-surface-200 text-zinc-500 border-surface-border"
                    }`}
                  >
                    {draftEffects.lowpass?.enabled ? "ACTIVE" : "OFF"}
                  </button>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-zinc-400">Cutoff Frequency</span>
                    <span className="font-mono text-zinc-200">{draftEffects.lowpass?.frequency ?? 4000} Hz</span>
                  </div>
                  <input
                    type="range"
                    min="100"
                    max="16000"
                    step="50"
                    value={draftEffects.lowpass?.frequency ?? 4000}
                    onChange={(e) => handleUpdateEffect("lowpass", { frequency: parseInt(e.target.value) })}
                    className="w-full accent-purple-500 cursor-pointer h-2 bg-surface-200 rounded-lg touch-manipulation"
                  />
                </div>
              </div>

              {/* High-pass */}
              <div className="p-4 bg-surface-100 rounded-xl border border-surface-border space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-zinc-200 block">High-Pass Filter (Low-cut)</span>
                    <span className="text-[11px] text-zinc-500">Cuts sub-bass rumble below cutoff</span>
                  </div>
                  <button
                    onClick={() => handleToggleEffect("highpass")}
                    type="button"
                    className={`px-3 py-1 rounded-xl text-[10px] font-bold border min-h-[36px] cursor-pointer touch-manipulation ${
                      draftEffects.highpass?.enabled
                        ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                        : "bg-surface-200 text-zinc-500 border-surface-border"
                    }`}
                  >
                    {draftEffects.highpass?.enabled ? "ACTIVE" : "OFF"}
                  </button>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-zinc-400">Cutoff Frequency</span>
                    <span className="font-mono text-zinc-200">{draftEffects.highpass?.frequency ?? 120} Hz</span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="2000"
                    step="10"
                    value={draftEffects.highpass?.frequency ?? 120}
                    onChange={(e) => handleUpdateEffect("highpass", { frequency: parseInt(e.target.value) })}
                    className="w-full accent-purple-500 cursor-pointer h-2 bg-surface-200 rounded-lg touch-manipulation"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-surface-border bg-surface-100 flex items-center justify-between gap-3">
          <button
            onClick={handleCancelAndClose}
            type="button"
            className="px-4 py-2.5 rounded-xl bg-surface-200 hover:bg-surface-border text-zinc-400 hover:text-white font-semibold text-xs transition-colors min-h-[44px] cursor-pointer touch-manipulation"
          >
            Cancel
          </button>

          <button
            onClick={handleApplyAndClose}
            type="button"
            className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs shadow-glow transition-all min-h-[44px] cursor-pointer touch-manipulation flex items-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Apply & Close</span>
          </button>
        </div>
      </div>
    </div>
  );
}
