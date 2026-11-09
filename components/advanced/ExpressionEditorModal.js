"use client";

import React, { useState } from "react";
import {
  X,
  Code2,
  Sparkles,
  Check,
  Trash2,
  Sliders,
  Power,
  ShieldCheck,
} from "lucide-react";
import { useEditorStore } from "@/store/useEditorStore";
import { EXPRESSION_TYPES } from "@/engine/advanced/expressionEngine";
import { ANIMATABLE_PROPERTIES } from "@/engine/keyframes";

export default function ExpressionEditorModal({ isOpen, onClose }) {
  const selectedLayerIds = useEditorStore((s) => s.selectedLayerIds);
  const layers = useEditorStore((s) => s.layers);
  const setLayerExpression = useEditorStore((s) => s.setLayerExpression);

  const activeLayer = layers.find((l) => selectedLayerIds.includes(l.id)) || layers[0] || null;

  const [selectedType, setSelectedType] = useState(
    activeLayer?.expression?.type || "sineWave"
  );
  const [selectedProp, setSelectedProp] = useState(
    activeLayer?.expression?.property || "y"
  );
  const [isEnabled, setIsEnabled] = useState(
    activeLayer?.expression?.enabled !== false
  );
  const [params, setParams] = useState(() => {
    const defaultTypeObj = EXPRESSION_TYPES.find((e) => e.type === (activeLayer?.expression?.type || "sineWave"));
    return activeLayer?.expression?.params || defaultTypeObj?.defaultParams || {};
  });

  if (!isOpen || !activeLayer) return null;

  const currentTypeMeta = EXPRESSION_TYPES.find((e) => e.type === selectedType) || EXPRESSION_TYPES[0];

  const handleTypeChange = (newType) => {
    setSelectedType(newType);
    const meta = EXPRESSION_TYPES.find((e) => e.type === newType);
    if (meta) {
      setParams({ ...meta.defaultParams });
      if (!meta.applicableProps.includes(selectedProp)) {
        setSelectedProp(meta.applicableProps[0] || "y");
      }
    }
  };

  const handleParamChange = (key, val) => {
    setParams((prev) => ({ ...prev, [key]: val }));
  };

  const handleApply = () => {
    const exprPayload = {
      type: selectedType,
      property: selectedProp,
      enabled: isEnabled,
      params,
    };
    setLayerExpression(activeLayer.id, exprPayload);
    onClose();
  };

  const handleRemove = () => {
    setLayerExpression(activeLayer.id, null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-surface-200 border border-surface-border rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border bg-surface-100">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                Procedural Expression Engine
                <span className="text-xs font-normal text-zinc-400">({activeLayer.name})</span>
              </h2>
              <p className="text-xs text-zinc-400">
                Safe mathematical animation routines without eval() or runtime injection
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-surface-border transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 p-5 overflow-y-auto flex flex-col gap-5">
          {/* Status & Security Banner */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-surface-100 border border-surface-border">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-xs text-zinc-300 font-medium">
                Pure Mathematical Evaluator (Zero eval() / Sandbox Secure)
              </span>
            </div>
            <button
              onClick={() => setIsEnabled(!isEnabled)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                isEnabled
                  ? "bg-emerald-600/20 text-emerald-300 border border-emerald-500/30"
                  : "bg-surface-200 text-zinc-500 border border-surface-border"
              }`}
            >
              <Power className="w-3.5 h-3.5" />
              <span>{isEnabled ? "Enabled" : "Disabled"}</span>
            </button>
          </div>

          {/* Expression Type Selector */}
          <div>
            <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
              Expression Preset
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {EXPRESSION_TYPES.map((expr) => (
                <button
                  key={expr.type}
                  onClick={() => handleTypeChange(expr.type)}
                  className={`p-2.5 rounded-xl text-left border transition-all ${
                    selectedType === expr.type
                      ? "bg-brand-600/20 border-brand-500 text-white font-semibold shadow-glow"
                      : "bg-surface-100 border-surface-border text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <div className="text-xs">{expr.name}</div>
                  <div className="text-[10px] text-zinc-500 mt-1 line-clamp-1">
                    {expr.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Target Property */}
          <div>
            <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
              Target Property
            </label>
            <div className="flex flex-wrap gap-2">
              {currentTypeMeta.applicableProps.map((propKey) => {
                const propDef = ANIMATABLE_PROPERTIES.find((p) => p.id === propKey);
                return (
                  <button
                    key={propKey}
                    onClick={() => setSelectedProp(propKey)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                      selectedProp === propKey
                        ? "bg-purple-600 text-white border-purple-500"
                        : "bg-surface-100 text-zinc-400 border-surface-border hover:text-zinc-200"
                    }`}
                  >
                    {propDef?.label || propKey}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dynamic Parameter Sliders */}
          <div className="p-4 rounded-xl bg-surface-100 border border-surface-border flex flex-col gap-4">
            <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
              Parameters
            </h4>
            {currentTypeMeta.paramSchema.map((item) => {
              if (item.type === "layerSelect") {
                const otherLayers = layers.filter((l) => l.id !== activeLayer.id);
                return (
                  <div key={item.key}>
                    <label className="block text-xs text-zinc-400 mb-1.5">{item.label}</label>
                    <select
                      value={params[item.key] || ""}
                      onChange={(e) => handleParamChange(item.key, e.target.value)}
                      className="w-full bg-surface-200 border border-surface-border rounded-lg px-3 py-2 text-xs text-zinc-200"
                    >
                      <option value="">Select target layer...</option>
                      {otherLayers.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.name} ({l.type})
                        </option>
                      ))}
                    </select>
                  </div>
                );
              }

              if (item.type === "select") {
                return (
                  <div key={item.key}>
                    <label className="block text-xs text-zinc-400 mb-1.5">{item.label}</label>
                    <select
                      value={params[item.key]}
                      onChange={(e) => handleParamChange(item.key, Number(e.target.value))}
                      className="w-full bg-surface-200 border border-surface-border rounded-lg px-3 py-2 text-xs text-zinc-200"
                    >
                      {item.options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              }

              return (
                <div key={item.key}>
                  <div className="flex justify-between text-xs text-zinc-400 mb-1">
                    <span>{item.label}</span>
                    <span className="font-mono text-zinc-200">
                      {params[item.key] ?? item.min} {item.unit}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={item.min}
                    max={item.max}
                    step={item.step}
                    value={params[item.key] ?? item.min}
                    onChange={(e) => handleParamChange(item.key, parseFloat(e.target.value))}
                    className="w-full accent-brand-500"
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-surface-border bg-surface-100 flex items-center justify-between">
          {activeLayer.expression ? (
            <button
              onClick={handleRemove}
              className="px-3 py-2 rounded-lg text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Remove Expression</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium bg-surface-200 hover:bg-surface-border text-zinc-300"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white flex items-center gap-1.5 shadow-glow"
            >
              <Check className="w-4 h-4" />
              <span>Save Expression</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
