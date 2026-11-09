"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  X,
  TrendingUp,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sparkles,
  Check,
  Maximize2,
} from "lucide-react";
import { useAnimationStore } from "@/store/useAnimationStore";
import { useEditorStore } from "@/store/useEditorStore";
import { BEZIER_PRESETS, evaluateCubicBezier } from "@/engine/advanced/bezierCurve";
import { ANIMATABLE_PROPERTIES } from "@/engine/keyframes";

export default function GraphEditorModal({ isOpen, onClose, initialProperty = "y" }) {
  const selectedLayerIds = useEditorStore((s) => s.selectedLayerIds);
  const layers = useEditorStore((s) => s.layers);
  const keyframes = useAnimationStore((s) => s.keyframes);
  const duration = useAnimationStore((s) => s.duration);
  const currentTime = useAnimationStore((s) => s.currentTime);
  const seek = useAnimationStore((s) => s.seek);
  const setKeyframeEasing = useAnimationStore((s) => s.setKeyframeEasing);

  const activeLayer = layers.find((l) => selectedLayerIds.includes(l.id)) || layers[0] || null;
  const [selectedProperty, setSelectedProperty] = useState(initialProperty);
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [activePreset, setActivePreset] = useState("easeInOut");
  const [customBezier, setCustomBezier] = useState([0.42, 0.0, 0.58, 1.0]);
  const [isDraggingHandle, setIsDraggingHandle] = useState(null); // 'cp1' | 'cp2'

  const canvasRef = useRef(null);

  // Filter keyframes for active layer & selected property
  const propertyKeyframes = useMemo(() => {
    if (!activeLayer) return [];
    return keyframes
      .filter((k) => k.objectId === activeLayer.id && k.property === selectedProperty)
      .sort((a, b) => a.time - b.time);
  }, [keyframes, activeLayer, selectedProperty]);

  // Apply easing preset to all keyframes of current property
  const handleApplyPreset = (presetKey) => {
    setActivePreset(presetKey);
    const preset = BEZIER_PRESETS[presetKey];
    if (preset) {
      setCustomBezier([preset.p1[0], preset.p1[1], preset.p2[0], preset.p2[1]]);
      propertyKeyframes.forEach((kf) => {
        setKeyframeEasing(kf.id, presetKey, [preset.p1[0], preset.p1[1], preset.p2[0], preset.p2[1]]);
      });
    }
  };

  // Render Graph on Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isOpen) return;

    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Padding
    const padX = 50;
    const padY = 40;
    const graphW = width - padX * 2;
    const graphH = height - padY * 2;

    // Background Grid
    ctx.strokeStyle = "#1e1e2d";
    ctx.lineWidth = 1;

    // Time Vertical Gridlines
    const timeSteps = Math.max(4, Math.round(duration));
    for (let i = 0; i <= timeSteps; i++) {
      const gx = padX + (i / timeSteps) * graphW;
      ctx.beginPath();
      ctx.moveTo(gx, padY);
      ctx.lineTo(gx, padY + graphH);
      ctx.stroke();

      ctx.fillStyle = "#71717a";
      ctx.font = "10px monospace";
      ctx.fillText(`${((i / timeSteps) * duration).toFixed(1)}s`, gx - 10, padY + graphH + 16);
    }

    // Horizontal Value Gridlines
    const hSteps = 4;
    for (let j = 0; j <= hSteps; j++) {
      const gy = padY + (j / hSteps) * graphH;
      ctx.beginPath();
      ctx.moveTo(padX, gy);
      ctx.lineTo(padX + graphW, gy);
      ctx.stroke();
    }

    // Determine value range from keyframes or property defaults
    const values = propertyKeyframes.map((k) => Number(k.value));
    const minVal = values.length > 0 ? Math.min(...values) : 0;
    const maxVal = values.length > 0 ? Math.max(...values) : 100;
    const range = Math.max(1, maxVal - minVal);

    const valToY = (v) => padY + graphH - ((v - minVal) / range) * graphH;
    const timeToX = (t) => padX + (Math.max(0, Math.min(duration, t)) / duration) * graphW;

    // Draw Smooth Keyframe Curve
    if (propertyKeyframes.length >= 2) {
      ctx.strokeStyle = "#6366f1";
      ctx.lineWidth = 3;
      ctx.beginPath();

      const samples = 100;
      for (let s = 0; s <= samples; s++) {
        const t = (s / samples) * duration;
        // Simple evaluation between segments
        let evaluatedVal = propertyKeyframes[0].value;
        for (let i = 0; i < propertyKeyframes.length - 1; i++) {
          const kfA = propertyKeyframes[i];
          const kfB = propertyKeyframes[i + 1];
          if (t >= kfA.time && t <= kfB.time) {
            const span = kfB.time - kfA.time;
            const prog = span > 0 ? (t - kfA.time) / span : 0;
            const eased = evaluateCubicBezier(
              customBezier[0],
              customBezier[1],
              customBezier[2],
              customBezier[3],
              prog
            );
            evaluatedVal = Number(kfA.value) + (Number(kfB.value) - Number(kfA.value)) * eased;
            break;
          } else if (t > propertyKeyframes[propertyKeyframes.length - 1].time) {
            evaluatedVal = propertyKeyframes[propertyKeyframes.length - 1].value;
          }
        }

        const px = timeToX(t);
        const py = valToY(evaluatedVal);
        if (s === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      // Draw Keyframe Diamonds & Points
      propertyKeyframes.forEach((kf) => {
        const kx = timeToX(kf.time);
        const ky = valToY(kf.value);

        ctx.fillStyle = "#38bdf8";
        ctx.beginPath();
        ctx.arc(kx, ky, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = "#e4e4e7";
        ctx.font = "bold 11px sans-serif";
        ctx.fillText(String(kf.value), kx - 10, ky - 10);
      });
    }

    // Playhead Vertical Line
    const curX = timeToX(currentTime);
    ctx.strokeStyle = "#f43f5e";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(curX, padY);
    ctx.lineTo(curX, padY + graphH);
    ctx.stroke();
  }, [isOpen, propertyKeyframes, duration, currentTime, customBezier]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-surface-200 border border-surface-border rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border bg-surface-100">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                Graph Editor & Bezier Curve
                <span className="text-xs font-normal text-zinc-400">
                  ({activeLayer ? activeLayer.name : "No Selection"})
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Visualize and adjust real animation curves over time with cubic-bezier handles
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

        {/* Content Area */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Main Visual Curve Canvas */}
          <div className="flex-1 flex flex-col p-4 bg-[#0a0a0f] border-b md:border-b-0 md:border-r border-surface-border">
            {/* Top Toolbar */}
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-1.5 flex-wrap">
                {ANIMATABLE_PROPERTIES.slice(0, 8).map((prop) => (
                  <button
                    key={prop.id}
                    onClick={() => setSelectedProperty(prop.id)}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                      selectedProperty === prop.id
                        ? "bg-brand-600 text-white font-semibold"
                        : "bg-surface-100 text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    {prop.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.25))}
                  className="p-1.5 rounded bg-surface-100 text-zinc-400 hover:text-white"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setZoomLevel((z) => Math.max(0.5, z - 0.25))}
                  className="p-1.5 rounded bg-surface-100 text-zinc-400 hover:text-white"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setZoomLevel(1.0);
                    setPanOffset({ x: 0, y: 0 });
                  }}
                  className="p-1.5 rounded bg-surface-100 text-zinc-400 hover:text-white"
                  title="Reset View"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Canvas Viewport */}
            <div className="flex-1 min-h-[260px] sm:min-h-[340px] relative rounded-xl border border-surface-border overflow-hidden bg-[#07070a]">
              <canvas
                ref={canvasRef}
                width={800}
                height={400}
                className="w-full h-full block cursor-crosshair touch-none"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const clickX = e.clientX - rect.left;
                  const ratio = Math.max(0, Math.min(1, (clickX - 50) / (rect.width - 100)));
                  seek(ratio * duration);
                }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-zinc-500 mt-2">
              <span>Tap on graph to scrub playhead</span>
              <span>Keyframes: {propertyKeyframes.length}</span>
            </div>
          </div>

          {/* Right Curve Presets & Controls */}
          <div className="w-full md:w-72 p-4 bg-surface-100 overflow-y-auto flex flex-col gap-4">
            <div>
              <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
                Cubic Easing Presets
              </h3>
              <div className="grid grid-cols-2 gap-1.5">
                {Object.entries(BEZIER_PRESETS).map(([key, item]) => (
                  <button
                    key={key}
                    onClick={() => handleApplyPreset(key)}
                    className={`px-2.5 py-2 rounded-lg text-left text-xs transition-colors border ${
                      activePreset === key
                        ? "bg-brand-600/20 text-brand-300 border-brand-500/40 font-semibold"
                        : "bg-surface-200 text-zinc-400 border-surface-border hover:text-white"
                    }`}
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Bezier Handles Sliders */}
            <div className="p-3 rounded-xl bg-surface-200 border border-surface-border flex flex-col gap-2.5">
              <h4 className="text-xs font-semibold text-zinc-200">
                Custom Bezier Tangents
              </h4>
              <div>
                <div className="flex justify-between text-[11px] text-zinc-400 mb-1">
                  <span>Handle 1 (X1, Y1)</span>
                  <span className="font-mono text-zinc-300">
                    {customBezier[0].toFixed(2)}, {customBezier[1].toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={customBezier[0]}
                  onChange={(e) => {
                    const next = [...customBezier];
                    next[0] = parseFloat(e.target.value);
                    setCustomBezier(next);
                  }}
                  className="w-full accent-brand-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-zinc-400 mb-1">
                  <span>Handle 2 (X2, Y2)</span>
                  <span className="font-mono text-zinc-300">
                    {customBezier[2].toFixed(2)}, {customBezier[3].toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={customBezier[2]}
                  onChange={(e) => {
                    const next = [...customBezier];
                    next[2] = parseFloat(e.target.value);
                    setCustomBezier(next);
                  }}
                  className="w-full accent-brand-500"
                />
              </div>

              <div className="p-2 rounded bg-surface-100 font-mono text-[10px] text-indigo-300 text-center break-all">
                cubic-bezier({customBezier.map((v) => v.toFixed(2)).join(", ")})
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3 border-t border-surface-border bg-surface-100 flex items-center justify-between">
          <span className="text-xs text-zinc-500">
            Changes automatically propagate to Animation Engine
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white min-h-[40px] flex items-center gap-1.5 transition-colors"
          >
            <Check className="w-4 h-4" />
            <span>Apply & Done</span>
          </button>
        </div>
      </div>
    </div>
  );
}
