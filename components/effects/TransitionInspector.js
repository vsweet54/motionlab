"use client";

import React from "react";
import { ArrowRightLeft, Clock, Compass } from "lucide-react";
import { useEditorStore } from "@/store/useEditorStore";
import { TRANSITION_TYPES, TRANSITION_DIRECTIONS } from "@/engine/transitions/definitions";

const EASING_OPTIONS = [
  { id: "power2Out", label: "Power2 Out" },
  { id: "power3Out", label: "Power3 Out" },
  { id: "backOut", label: "Back Overshoot" },
  { id: "elasticOut", label: "Elastic Spring" },
  { id: "bounceOut", label: "Bounce" },
  { id: "power2InOut", label: "Smooth InOut" },
];

export default function TransitionInspector({ layer }) {
  const { setLayerTransitionIn, setLayerTransitionOut } = useEditorStore();

  if (!layer) return null;

  const tIn = layer.transitionIn || { type: "none", duration: 0.6, easing: "power2Out", direction: "left" };
  const tOut = layer.transitionOut || { type: "none", duration: 0.6, easing: "power2In", direction: "right" };

  const handleInTypeChange = (type) => {
    if (type === "none") {
      setLayerTransitionIn(layer.id, null);
    } else {
      const match = TRANSITION_TYPES.find((t) => t.id === type);
      setLayerTransitionIn(layer.id, {
        ...tIn,
        type,
        duration: tIn.duration || match?.defaultDuration || 0.6,
        easing: match?.defaultEasing || "power2Out",
      });
    }
  };

  const handleOutTypeChange = (type) => {
    if (type === "none") {
      setLayerTransitionOut(layer.id, null);
    } else {
      const match = TRANSITION_TYPES.find((t) => t.id === type);
      setLayerTransitionOut(layer.id, {
        ...tOut,
        type,
        duration: tOut.duration || match?.defaultDuration || 0.6,
        easing: "power2In",
      });
    }
  };

  return (
    <div className="space-y-4 text-xs select-none">
      <div className="flex items-center gap-2 pb-2 border-b border-surface-border">
        <ArrowRightLeft className="w-4 h-4 text-cyan-400" />
        <h4 className="font-semibold text-zinc-100 uppercase tracking-wider text-[11px]">
          Clip Transitions
        </h4>
      </div>

      {/* 1. In-Transition Card */}
      <div className="p-3.5 rounded-2xl bg-surface-100 border border-surface-border space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-zinc-200">Transition In (Entrance)</span>
          <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 text-[10px] font-mono font-bold uppercase">
            {tIn.type || "None"}
          </span>
        </div>

        {/* Transition Type Dropdown */}
        <div className="space-y-1">
          <label className="text-[11px] text-zinc-400">Type</label>
          <select
            value={tIn.type || "none"}
            onChange={(e) => handleInTypeChange(e.target.value)}
            className="w-full bg-surface-200 border border-surface-border rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-cyan-500 min-h-[40px]"
          >
            <option value="none">None (Cut)</option>
            {TRANSITION_TYPES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        {tIn.type && tIn.type !== "none" && (
          <>
            {/* Duration Slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-zinc-400">Duration</span>
                <span className="font-mono text-cyan-400 font-semibold">{tIn.duration}s</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="2.0"
                step="0.05"
                value={tIn.duration || 0.6}
                onChange={(e) =>
                  setLayerTransitionIn(layer.id, {
                    ...tIn,
                    duration: parseFloat(e.target.value),
                  })
                }
                className="w-full accent-cyan-500 cursor-pointer h-2 bg-surface-200 rounded-lg"
              />
            </div>

            {/* Direction Picker (if supported) */}
            {(tIn.type === "slide" || tIn.type === "wipe") && (
              <div className="space-y-1">
                <label className="text-[11px] text-zinc-400">Direction</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {TRANSITION_DIRECTIONS.map((dir) => (
                    <button
                      key={dir.id}
                      onClick={() =>
                        setLayerTransitionIn(layer.id, { ...tIn, direction: dir.id })
                      }
                      className={`py-1.5 px-2 rounded-xl text-[10px] font-semibold transition-colors min-h-[36px] ${
                        tIn.direction === dir.id
                          ? "bg-cyan-600 text-white font-bold"
                          : "bg-surface-200 text-zinc-400 hover:text-white"
                      }`}
                    >
                      {dir.id.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* 2. Out-Transition Card */}
      <div className="p-3.5 rounded-2xl bg-surface-100 border border-surface-border space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-zinc-200">Transition Out (Exit)</span>
          <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 text-[10px] font-mono font-bold uppercase">
            {tOut.type || "None"}
          </span>
        </div>

        {/* Transition Out Type Dropdown */}
        <div className="space-y-1">
          <label className="text-[11px] text-zinc-400">Type</label>
          <select
            value={tOut.type || "none"}
            onChange={(e) => handleOutTypeChange(e.target.value)}
            className="w-full bg-surface-200 border border-surface-border rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-purple-500 min-h-[40px]"
          >
            <option value="none">None (Cut)</option>
            {TRANSITION_TYPES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        {tOut.type && tOut.type !== "none" && (
          <div className="space-y-1">
            <div className="flex justify-between text-[11px]">
              <span className="text-zinc-400">Duration</span>
              <span className="font-mono text-purple-400 font-semibold">{tOut.duration}s</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="2.0"
              step="0.05"
              value={tOut.duration || 0.6}
              onChange={(e) =>
                setLayerTransitionOut(layer.id, {
                  ...tOut,
                  duration: parseFloat(e.target.value),
                })
              }
              className="w-full accent-purple-500 cursor-pointer h-2 bg-surface-200 rounded-lg"
            />
          </div>
        )}
      </div>
    </div>
  );
}
