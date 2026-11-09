"use client";

import React, { useState } from "react";
import {
  Sparkles,
  Plus,
  Trash2,
  Copy,
  RotateCcw,
  ChevronUp,
  ChevronDown,
  Eye,
  EyeOff,
  Sliders,
  Diamond,
} from "lucide-react";
import { useEditorStore } from "@/store/useEditorStore";
import { useAnimationStore } from "@/store/useAnimationStore";
import { EFFECT_REGISTRY } from "@/engine/effects/definitions";

export default function EffectsInspector({ layer, onOpenLibrary }) {
  const {
    addEffectToLayer,
    removeEffectFromLayer,
    toggleEffect,
    updateEffectParams,
    reorderEffect,
    duplicateEffect,
    resetEffectParams,
  } = useEditorStore();

  const { currentTime, addKeyframe } = useAnimationStore();
  const [expandedEffectId, setExpandedEffectId] = useState(null);

  if (!layer) return null;

  const effects = layer.effects || [];

  const handleParamChange = (effectId, key, value) => {
    updateEffectParams(layer.id, effectId, {
      [key]: value,
    });
  };

  const handleAddKeyframeToParam = (effectId, paramKey, currentValue) => {
    addKeyframe({
      objectId: layer.id,
      property: `effect_${paramKey}`,
      time: currentTime,
      value: currentValue,
      easing: "power2Out",
    });
  };

  return (
    <div className="space-y-4 text-xs select-none">
      {/* Header with Add Effect Button */}
      <div className="flex items-center justify-between pb-2 border-b border-surface-border">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <h4 className="font-semibold text-zinc-100 uppercase tracking-wider text-[11px]">
            Visual Effects ({effects.length})
          </h4>
        </div>

        <button
          onClick={onOpenLibrary}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 text-xs font-semibold transition-colors min-h-[36px]"
          title="Browse & Add Effects"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Effect</span>
        </button>
      </div>

      {/* Empty State */}
      {effects.length === 0 ? (
        <div className="p-5 rounded-2xl bg-surface-100 border border-dashed border-surface-border text-center space-y-2">
          <Sparkles className="w-6 h-6 text-purple-400/50 mx-auto" />
          <p className="text-zinc-400 text-xs font-medium">No visual effects added</p>
          <p className="text-zinc-500 text-[10px]">
            Enhance this layer with Glow, Neon, RGB Split, Wave, Blur, or Particles.
          </p>
          <button
            onClick={onOpenLibrary}
            className="w-full mt-2 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-colors shadow-glow"
          >
            Open Effects Library
          </button>
        </div>
      ) : (
        /* Effect Stack List */
        <div className="space-y-2.5">
          {effects.map((fx, index) => {
            const schema = EFFECT_REGISTRY[fx.type];
            const isExpanded = expandedEffectId === fx.id || expandedEffectId === null;

            return (
              <div
                key={fx.id}
                className={`rounded-2xl border transition-all ${
                  fx.enabled
                    ? "bg-surface-100 border-surface-border"
                    : "bg-surface-100/40 border-surface-border/50 opacity-60"
                }`}
              >
                {/* Effect Card Top Bar */}
                <div className="flex items-center justify-between p-3 border-b border-surface-border/50">
                  <div className="flex items-center gap-2 truncate mr-2">
                    {/* Enable / Disable Toggle */}
                    <button
                      onClick={() => toggleEffect(layer.id, fx.id)}
                      className={`p-1.5 rounded-lg transition-colors min-w-[32px] min-h-[32px] flex items-center justify-center ${
                        fx.enabled
                          ? "text-purple-400 hover:text-purple-300 bg-purple-500/10"
                          : "text-zinc-500 hover:text-zinc-400"
                      }`}
                      title={fx.enabled ? "Disable Effect" : "Enable Effect"}
                    >
                      {fx.enabled ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </button>

                    <span className="font-semibold text-zinc-100 text-xs truncate">
                      {fx.name}
                    </span>
                  </div>

                  {/* Actions: Reorder, Duplicate, Reset, Delete, Expand */}
                  <div className="flex items-center gap-0.5 shrink-0">
                    <button
                      onClick={() => reorderEffect(layer.id, fx.id, "up")}
                      disabled={index === 0}
                      className="p-1 rounded text-zinc-400 hover:text-white disabled:opacity-30 disabled:hover:text-zinc-400"
                      title="Move Up"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => reorderEffect(layer.id, fx.id, "down")}
                      disabled={index === effects.length - 1}
                      className="p-1 rounded text-zinc-400 hover:text-white disabled:opacity-30 disabled:hover:text-zinc-400"
                      title="Move Down"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => duplicateEffect(layer.id, fx.id)}
                      className="p-1 rounded text-zinc-400 hover:text-cyan-400"
                      title="Duplicate Effect"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => resetEffectParams(layer.id, fx.id)}
                      className="p-1 rounded text-zinc-400 hover:text-amber-400"
                      title="Reset Parameters"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => removeEffectFromLayer(layer.id, fx.id)}
                      className="p-1 rounded text-zinc-400 hover:text-red-400"
                      title="Delete Effect"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Effect Parameters Controls */}
                <div className="p-3 space-y-3">
                  {/* Master Intensity Slider */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-zinc-400">
                      <span>Effect Intensity</span>
                      <span className="font-mono text-purple-300 font-semibold">
                        {Math.round((fx.intensity ?? 1.0) * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={fx.intensity ?? 1.0}
                      onChange={(e) =>
                        updateEffectParams(layer.id, fx.id, {
                          intensity: parseFloat(e.target.value),
                        })
                      }
                      className="w-full accent-purple-500 cursor-pointer h-2 bg-surface-200 rounded-lg"
                    />
                  </div>

                  {/* Schema-based Custom Parameters */}
                  {schema?.paramSchema?.map((param) => {
                    const val = fx.params?.[param.key] ?? schema.defaultParams[param.key];

                    if (param.type === "color") {
                      return (
                        <div key={param.key} className="flex items-center justify-between">
                          <span className="text-[11px] text-zinc-400">{param.label}</span>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={val}
                              onChange={(e) => handleParamChange(fx.id, param.key, e.target.value)}
                              className="w-7 h-7 rounded-lg border border-surface-border cursor-pointer bg-transparent"
                            />
                            <span className="font-mono text-[10px] text-zinc-400 uppercase">
                              {val}
                            </span>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div key={param.key} className="space-y-1">
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-zinc-400">{param.label}</span>
                          <div className="flex items-center gap-1.5 font-mono text-zinc-300">
                            <span>
                              {val}
                              {param.unit}
                            </span>
                            <button
                              onClick={() => handleAddKeyframeToParam(fx.id, param.key, val)}
                              className="p-1 rounded hover:bg-surface-border text-zinc-500 hover:text-brand-400"
                              title="Add keyframe to this parameter at playhead"
                            >
                              <Diamond className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        <input
                          type="range"
                          min={param.min}
                          max={param.max}
                          step={param.step}
                          value={val}
                          onChange={(e) =>
                            handleParamChange(fx.id, param.key, parseFloat(e.target.value))
                          }
                          className="w-full accent-brand-500 cursor-pointer h-2 bg-surface-200 rounded-lg"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
