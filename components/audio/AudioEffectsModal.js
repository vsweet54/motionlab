"use client";

import React, { useState } from "react";
import {
  X,
  Sliders,
  Sparkles,
  RotateCcw,
  Volume2,
  Activity,
  Layers,
  Check,
} from "lucide-react";
import { studioMixer } from "@/engine/audio/mixer";
import { useEditorStore } from "@/store/useEditorStore";

const EFFECT_TABS = [
  { id: "equalizer", label: "3-Band EQ" },
  { id: "compressor", label: "Compressor" },
  { id: "reverb", label: "Reverb" },
  { id: "delay", label: "Delay / Echo" },
  { id: "distortion", label: "Distortion" },
  { id: "filters", label: "LP / HP Filters" },
];

export default function AudioEffectsModal({ trackId, trackName, onClose }) {
  const [activeTab, setActiveTab] = useState("equalizer");
  const layer = useEditorStore((s) => s.layers.find((l) => l.id === trackId));
  const updateLayer = useEditorStore((s) => s.updateLayer);

  // Active audio effects stored on layer
  const audioEffects = layer?.audioEffects || {
    equalizer: { enabled: true, low: 0, mid: 0, high: 0 },
    compressor: { enabled: false, threshold: -24, ratio: 4, attack: 0.003, release: 0.25 },
    reverb: { enabled: false, decay: 2.0, mix: 0.25 },
    delay: { enabled: false, delayTime: 0.3, feedback: 0.35, mix: 0.3 },
    distortion: { enabled: false, amount: 15 },
    lowpass: { enabled: false, frequency: 4000, Q: 1.0 },
    highpass: { enabled: false, frequency: 120, Q: 1.0 },
  };

  const updateEffectState = (type, params) => {
    const updated = {
      ...audioEffects,
      [type]: {
        ...audioEffects[type],
        ...params,
      },
    };

    updateLayer(trackId, { audioEffects: updated });

    if (updated[type]?.enabled) {
      studioMixer.applyEffect(trackId, type, updated[type]);
    } else {
      studioMixer.removeEffect(trackId, type);
    }
  };

  const toggleEffectEnabled = (type) => {
    const currentEnabled = !!audioEffects[type]?.enabled;
    updateEffectState(type, { enabled: !currentEnabled });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md select-none animate-fade-in">
      <div className="w-full max-w-2xl bg-surface-200 border border-surface-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border bg-surface-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-zinc-100">
                DSP Audio Effects Rack
              </h3>
              <span className="text-[11px] font-mono text-zinc-400">
                Track: {trackName || layer?.name || "Audio Track"}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-surface-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Strip */}
        <div className="flex items-center gap-1 p-2 bg-surface-150 border-b border-surface-border overflow-x-auto no-scrollbar">
          {EFFECT_TABS.map((tab) => {
            const isTabActive = activeTab === tab.id;
            const isEffectOn = !!audioEffects[tab.id]?.enabled;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all min-h-[36px] ${
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
          {/* 1. EQUALIZER */}
          {activeTab === "equalizer" && (
            <div className="space-y-5">
              <div className="flex items-center justify-between p-3 bg-surface-100 rounded-xl border border-surface-border">
                <span className="font-semibold text-zinc-200">3-Band Parametric EQ</span>
                <button
                  onClick={() => toggleEffectEnabled("equalizer")}
                  className={`px-3 py-1 rounded-lg text-[11px] font-semibold border transition-colors ${
                    audioEffects.equalizer?.enabled
                      ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                      : "bg-surface-200 text-zinc-500 border-surface-border"
                  }`}
                >
                  {audioEffects.equalizer?.enabled ? "ENABLED" : "BYPASSED"}
                </button>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {[
                  { key: "low", label: "Low (320Hz)", min: -18, max: 18, val: audioEffects.equalizer?.low ?? 0 },
                  { key: "mid", label: "Mid (1000Hz)", min: -18, max: 18, val: audioEffects.equalizer?.mid ?? 0 },
                  { key: "high", label: "High (3200Hz)", min: -18, max: 18, val: audioEffects.equalizer?.high ?? 0 },
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
                        updateEffectState("equalizer", { [band.key]: parseFloat(e.target.value) })
                      }
                      className="w-full accent-purple-500 cursor-pointer h-2 bg-surface-200 rounded-lg"
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
              <div className="flex items-center justify-between p-3 bg-surface-100 rounded-xl border border-surface-border">
                <span className="font-semibold text-zinc-200">Dynamics Compressor</span>
                <button
                  onClick={() => toggleEffectEnabled("compressor")}
                  className={`px-3 py-1 rounded-lg text-[11px] font-semibold border transition-colors ${
                    audioEffects.compressor?.enabled
                      ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                      : "bg-surface-200 text-zinc-500 border-surface-border"
                  }`}
                >
                  {audioEffects.compressor?.enabled ? "ENABLED" : "BYPASSED"}
                </button>
              </div>

              <div className="space-y-3 p-4 bg-surface-100 rounded-xl border border-surface-border">
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-zinc-400">Threshold</span>
                    <span className="font-mono text-zinc-200">{audioEffects.compressor?.threshold ?? -24} dB</span>
                  </div>
                  <input
                    type="range"
                    min="-60"
                    max="0"
                    value={audioEffects.compressor?.threshold ?? -24}
                    onChange={(e) => updateEffectState("compressor", { threshold: parseFloat(e.target.value) })}
                    className="w-full accent-purple-500 cursor-pointer"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-zinc-400">Ratio</span>
                    <span className="font-mono text-zinc-200">{audioEffects.compressor?.ratio ?? 4}:1</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    step="0.5"
                    value={audioEffects.compressor?.ratio ?? 4}
                    onChange={(e) => updateEffectState("compressor", { ratio: parseFloat(e.target.value) })}
                    className="w-full accent-purple-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 3. REVERB */}
          {activeTab === "reverb" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-surface-100 rounded-xl border border-surface-border">
                <span className="font-semibold text-zinc-200">Algorithmic Convolver Reverb</span>
                <button
                  onClick={() => toggleEffectEnabled("reverb")}
                  className={`px-3 py-1 rounded-lg text-[11px] font-semibold border transition-colors ${
                    audioEffects.reverb?.enabled
                      ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                      : "bg-surface-200 text-zinc-500 border-surface-border"
                  }`}
                >
                  {audioEffects.reverb?.enabled ? "ENABLED" : "BYPASSED"}
                </button>
              </div>

              <div className="space-y-3 p-4 bg-surface-100 rounded-xl border border-surface-border">
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-zinc-400">Decay Time</span>
                    <span className="font-mono text-zinc-200">{audioEffects.reverb?.decay ?? 2.0} s</span>
                  </div>
                  <input
                    type="range"
                    min="0.2"
                    max="6.0"
                    step="0.1"
                    value={audioEffects.reverb?.decay ?? 2.0}
                    onChange={(e) => updateEffectState("reverb", { decay: parseFloat(e.target.value) })}
                    className="w-full accent-purple-500 cursor-pointer"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-zinc-400">Dry / Wet Mix</span>
                    <span className="font-mono text-zinc-200">{Math.round((audioEffects.reverb?.mix ?? 0.25) * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={audioEffects.reverb?.mix ?? 0.25}
                    onChange={(e) => updateEffectState("reverb", { mix: parseFloat(e.target.value) })}
                    className="w-full accent-purple-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 4. DELAY */}
          {activeTab === "delay" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-surface-100 rounded-xl border border-surface-border">
                <span className="font-semibold text-zinc-200">Stereo Echo / Delay</span>
                <button
                  onClick={() => toggleEffectEnabled("delay")}
                  className={`px-3 py-1 rounded-lg text-[11px] font-semibold border transition-colors ${
                    audioEffects.delay?.enabled
                      ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                      : "bg-surface-200 text-zinc-500 border-surface-border"
                  }`}
                >
                  {audioEffects.delay?.enabled ? "ENABLED" : "BYPASSED"}
                </button>
              </div>

              <div className="space-y-3 p-4 bg-surface-100 rounded-xl border border-surface-border">
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-zinc-400">Delay Time</span>
                    <span className="font-mono text-zinc-200">{audioEffects.delay?.delayTime ?? 0.3} s</span>
                  </div>
                  <input
                    type="range"
                    min="0.05"
                    max="1.5"
                    step="0.05"
                    value={audioEffects.delay?.delayTime ?? 0.3}
                    onChange={(e) => updateEffectState("delay", { delayTime: parseFloat(e.target.value) })}
                    className="w-full accent-purple-500 cursor-pointer"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-zinc-400">Feedback Loop</span>
                    <span className="font-mono text-zinc-200">{Math.round((audioEffects.delay?.feedback ?? 0.35) * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="0.85"
                    step="0.05"
                    value={audioEffects.delay?.feedback ?? 0.35}
                    onChange={(e) => updateEffectState("delay", { feedback: parseFloat(e.target.value) })}
                    className="w-full accent-purple-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 5. DISTORTION */}
          {activeTab === "distortion" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-surface-100 rounded-xl border border-surface-border">
                <span className="font-semibold text-zinc-200">WaveShaper Distortion</span>
                <button
                  onClick={() => toggleEffectEnabled("distortion")}
                  className={`px-3 py-1 rounded-lg text-[11px] font-semibold border transition-colors ${
                    audioEffects.distortion?.enabled
                      ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                      : "bg-surface-200 text-zinc-500 border-surface-border"
                  }`}
                >
                  {audioEffects.distortion?.enabled ? "ENABLED" : "BYPASSED"}
                </button>
              </div>

              <div className="space-y-3 p-4 bg-surface-100 rounded-xl border border-surface-border">
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-zinc-400">Drive Amount</span>
                    <span className="font-mono text-zinc-200">{audioEffects.distortion?.amount ?? 15}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={audioEffects.distortion?.amount ?? 15}
                    onChange={(e) => updateEffectState("distortion", { amount: parseInt(e.target.value) })}
                    className="w-full accent-purple-500 cursor-pointer"
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
                  <span className="font-semibold text-zinc-200">Low-Pass Filter (High-cut)</span>
                  <button
                    onClick={() => toggleEffectEnabled("lowpass")}
                    className={`px-2.5 py-0.5 rounded text-[10px] font-semibold border ${
                      audioEffects.lowpass?.enabled
                        ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                        : "bg-surface-200 text-zinc-500 border-surface-border"
                    }`}
                  >
                    {audioEffects.lowpass?.enabled ? "ACTIVE" : "OFF"}
                  </button>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-zinc-400">Cutoff Frequency</span>
                    <span className="font-mono text-zinc-200">{audioEffects.lowpass?.frequency ?? 4000} Hz</span>
                  </div>
                  <input
                    type="range"
                    min="100"
                    max="16000"
                    step="50"
                    value={audioEffects.lowpass?.frequency ?? 4000}
                    onChange={(e) => updateEffectState("lowpass", { frequency: parseInt(e.target.value) })}
                    className="w-full accent-purple-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* High-pass */}
              <div className="p-4 bg-surface-100 rounded-xl border border-surface-border space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-zinc-200">High-Pass Filter (Low-cut)</span>
                  <button
                    onClick={() => toggleEffectEnabled("highpass")}
                    className={`px-2.5 py-0.5 rounded text-[10px] font-semibold border ${
                      audioEffects.highpass?.enabled
                        ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                        : "bg-surface-200 text-zinc-500 border-surface-border"
                    }`}
                  >
                    {audioEffects.highpass?.enabled ? "ACTIVE" : "OFF"}
                  </button>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-zinc-400">Cutoff Frequency</span>
                    <span className="font-mono text-zinc-200">{audioEffects.highpass?.frequency ?? 120} Hz</span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="2000"
                    step="10"
                    value={audioEffects.highpass?.frequency ?? 120}
                    onChange={(e) => updateEffectState("highpass", { frequency: parseInt(e.target.value) })}
                    className="w-full accent-purple-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-surface-border bg-surface-100 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs transition-colors min-h-[44px]"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
}
