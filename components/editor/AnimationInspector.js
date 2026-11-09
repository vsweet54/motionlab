"use client";

import React, { useState } from "react";
import {
  Sparkles,
  Sliders,
  Plus,
  Trash2,
  Copy,
  Clock,
  Activity,
  Layers,
  Repeat,
  Rewind,
  X,
  Play,
  Flame,
  Wand2,
  ChevronRight,
  Check,
} from "lucide-react";
import { useAnimationStore } from "@/store/useAnimationStore";
import { useEditorStore } from "@/store/useEditorStore";
import { ANIMATABLE_PROPERTIES } from "@/engine/keyframes";
import { ANIMATION_PRESETS } from "@/engine/presets";

const EASING_OPTIONS = [
  { id: "linear", label: "Linear" },
  { id: "easeIn", label: "Ease In" },
  { id: "easeOut", label: "Ease Out" },
  { id: "easeInOut", label: "Ease In Out" },
  { id: "power1Out", label: "Power1 Out (Snappy)" },
  { id: "power2Out", label: "Power2 Out (Smooth)" },
  { id: "power3Out", label: "Power3 Out (Strong)" },
  { id: "backOut", label: "Back Out (Overshoot)" },
  { id: "backInOut", label: "Back In Out" },
  { id: "bounceOut", label: "Bounce Out" },
  { id: "elasticOut", label: "Elastic Out" },
];

export default function AnimationInspector({ onClose }) {
  const {
    keyframes,
    selectedKeyframeId,
    selectKeyframe,
    addKeyframe,
    updateKeyframe,
    removeKeyframe,
    duplicateKeyframe,
    applyPreset,
    currentTime,
    duration,
    activeInspectorLayerId,
    setActiveInspectorLayerId,
    isLoop,
    isReverse,
    toggleLoop,
    toggleReverse,
  } = useAnimationStore();

  const { layers, selectedLayerIds, selectLayer } = useEditorStore();

  // Target layer to inspect
  const targetLayerId = activeInspectorLayerId || selectedLayerIds[0] || layers[0]?.id;
  const targetLayer = layers.find((l) => l.id === targetLayerId);

  const [selectedProperty, setSelectedProperty] = useState("opacity");
  const [activeTab, setActiveTab] = useState("inspector"); // 'inspector' | 'presets'

  const layerKeyframes = keyframes.filter((kf) => kf.objectId === targetLayerId);
  const propertyKeyframes = layerKeyframes.filter((kf) => kf.property === selectedProperty);
  const activeKeyframe = keyframes.find((kf) => kf.id === selectedKeyframeId) || propertyKeyframes[0];

  const handleAddKeyframe = () => {
    if (!targetLayer) return;
    const propMeta = ANIMATABLE_PROPERTIES.find((p) => p.id === selectedProperty);
    const currentValue = targetLayer[selectedProperty] ?? propMeta?.defaultValue ?? 1;

    addKeyframe({
      objectId: targetLayer.id,
      property: selectedProperty,
      time: currentTime,
      value: currentValue,
      easing: "power2Out",
    });
  };

  const handleApplyPreset = (presetId) => {
    if (!targetLayer) return;
    applyPreset(presetId, targetLayer, currentTime);
  };

  return (
    <div className="flex flex-col h-full bg-surface-200 text-xs select-none overflow-hidden">
      {/* Top Header */}
      <div className="h-12 border-b border-surface-border px-4 flex items-center justify-between shrink-0 bg-surface-100">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-brand-400" />
          <h3 className="font-semibold text-white text-sm">Animation Inspector</h3>
        </div>

        <div className="flex items-center gap-2">
          {/* Layer Selector Dropdown */}
          <select
            value={targetLayerId || ""}
            onChange={(e) => {
              setActiveInspectorLayerId(e.target.value);
              selectLayer(e.target.value, false);
            }}
            className="px-2.5 py-1 rounded-lg bg-surface-200 border border-surface-border text-xs text-zinc-200 outline-none max-w-[140px] truncate"
          >
            {layers.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-surface-border/50"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Mode Switcher: Keyframes vs Presets */}
      <div className="flex border-b border-surface-border shrink-0 bg-surface-100/50">
        <button
          onClick={() => setActiveTab("inspector")}
          className={`flex-1 py-2 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === "inspector"
              ? "text-brand-400 border-brand-500 bg-surface-200"
              : "text-zinc-400 border-transparent hover:text-white"
          }`}
        >
          Keyframes ({layerKeyframes.length})
        </button>
        <button
          onClick={() => setActiveTab("presets")}
          className={`flex-1 py-2 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === "presets"
              ? "text-brand-400 border-brand-500 bg-surface-200"
              : "text-zinc-400 border-transparent hover:text-white"
          }`}
        >
          Preset Library
        </button>
      </div>

      {/* Tab 1: Keyframe Inspector */}
      {activeTab === "inspector" && (
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* Property Selector Pills */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block">
              Animatable Property
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {ANIMATABLE_PROPERTIES.map((prop) => {
                const count = layerKeyframes.filter((k) => k.property === prop.id).length;
                return (
                  <button
                    key={prop.id}
                    onClick={() => setSelectedProperty(prop.id)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                      selectedProperty === prop.id
                        ? "bg-brand-600 text-white shadow-sm"
                        : "bg-surface-100 text-zinc-400 hover:text-zinc-200 border border-surface-border"
                    }`}
                  >
                    <span>{prop.label}</span>
                    {count > 0 && (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Keyframe Actions Bar */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-surface-100 border border-surface-border">
            <div>
              <p className="font-semibold text-zinc-200">
                Keyframes for {selectedProperty}
              </p>
              <p className="text-[10px] text-zinc-500">
                {propertyKeyframes.length} keypoint(s) configured
              </p>
            </div>

            <button
              onClick={handleAddKeyframe}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs shadow-glow transition-all active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add @ {currentTime}s</span>
            </button>
          </div>

          {/* Active Keyframe Inspector Details */}
          {activeKeyframe ? (
            <div className="p-4 rounded-xl bg-surface-100 border border-surface-border space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-surface-border">
                <span className="font-bold text-zinc-200 text-xs">
                  Keyframe: {activeKeyframe.property}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => duplicateKeyframe(activeKeyframe.id)}
                    className="p-1.5 hover:text-white rounded hover:bg-surface-border text-zinc-400"
                    title="Duplicate Keyframe"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => removeKeyframe(activeKeyframe.id)}
                    className="p-1.5 hover:text-red-400 rounded hover:bg-surface-border text-zinc-400"
                    title="Delete Keyframe"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Time position input */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-zinc-400">
                  <span className="text-[10px]">Timestamp</span>
                  <span className="font-mono text-white font-bold">{activeKeyframe.time}s</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={duration}
                  step="0.05"
                  value={activeKeyframe.time}
                  onChange={(e) =>
                    updateKeyframe(activeKeyframe.id, { time: parseFloat(e.target.value) })
                  }
                  className="w-full accent-brand-500 cursor-pointer"
                />
              </div>

              {/* Keyframe Target Value */}
              <div className="space-y-1">
                <label className="text-[10px] text-zinc-400 block">Target Value</label>
                {selectedProperty === "fill" ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={activeKeyframe.value || "#6366f1"}
                      onChange={(e) => updateKeyframe(activeKeyframe.id, { value: e.target.value })}
                      className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border border-surface-border"
                    />
                    <input
                      type="text"
                      value={activeKeyframe.value || "#6366f1"}
                      onChange={(e) => updateKeyframe(activeKeyframe.id, { value: e.target.value })}
                      className="flex-1 px-3 py-1.5 bg-surface-200 border border-surface-border rounded-lg text-xs font-mono uppercase text-zinc-200"
                    />
                  </div>
                ) : (
                  <input
                    type="number"
                    step={selectedProperty.includes("scale") || selectedProperty === "opacity" ? "0.05" : "1"}
                    value={activeKeyframe.value}
                    onChange={(e) =>
                      updateKeyframe(activeKeyframe.id, { value: Number(e.target.value) })
                    }
                    className="w-full px-3 py-1.5 bg-surface-200 border border-surface-border rounded-lg text-xs font-mono text-zinc-200 focus:outline-none focus:border-brand-500"
                  />
                )}
              </div>

              {/* Easing Curve Picker */}
              <div className="space-y-1">
                <label className="text-[10px] text-zinc-400 block">Easing Curve</label>
                <select
                  value={activeKeyframe.easing || "power2Out"}
                  onChange={(e) => updateKeyframe(activeKeyframe.id, { easing: e.target.value })}
                  className="w-full px-3 py-2 bg-surface-200 border border-surface-border rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-brand-500"
                >
                  {EASING_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center rounded-xl border border-surface-border bg-surface-100/40 text-zinc-500 space-y-1">
              <Clock className="w-5 h-5 mx-auto opacity-40 text-brand-400 mb-1" />
              <p className="font-semibold text-zinc-300">No keyframes for {selectedProperty}</p>
              <p className="text-[10px]">Click "Add @" above or choose a preset.</p>
            </div>
          )}

          {/* Loop & Reverse Global Animation Options */}
          <div className="p-4 rounded-xl bg-surface-100 border border-surface-border space-y-3">
            <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block">
              Playback Modifiers
            </span>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-zinc-200">Continuous Loop</p>
                <p className="text-[10px] text-zinc-500">Restart from 0s on finish</p>
              </div>
              <button
                type="button"
                onClick={toggleLoop}
                className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors ${
                  isLoop ? "bg-brand-600" : "bg-zinc-700"
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    isLoop ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-zinc-200">Reverse Playback</p>
                <p className="text-[10px] text-zinc-500">Play backwards from end to start</p>
              </div>
              <button
                type="button"
                onClick={toggleReverse}
                className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors ${
                  isReverse ? "bg-purple-600" : "bg-zinc-700"
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    isReverse ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Animation Preset Library */}
      {activeTab === "presets" && (
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <p className="text-[11px] text-zinc-400">
            Applying a preset generates customizable keyframes starting at the current playhead ({currentTime}s).
          </p>

          <div className="grid grid-cols-1 gap-2">
            {ANIMATION_PRESETS.map((preset) => (
              <div
                key={preset.id}
                className="p-3 rounded-xl bg-surface-100 hover:bg-surface-50 border border-surface-border flex items-center justify-between transition-colors"
              >
                <div className="pr-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-zinc-200 text-xs">
                      {preset.name}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-brand-500/10 text-brand-400 border border-brand-500/20">
                      {preset.category}
                    </span>
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-0.5">
                    {preset.description}
                  </p>
                </div>

                <button
                  onClick={() => handleApplyPreset(preset.id)}
                  className="px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-semibold text-[11px] shadow-sm transition-all active:scale-95 shrink-0"
                >
                  Apply
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
