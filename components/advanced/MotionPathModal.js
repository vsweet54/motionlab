"use client";

import React, { useState } from "react";
import {
  X,
  Compass,
  Repeat,
  RotateCcw,
  Plus,
  Trash2,
  Check,
  Play,
  Navigation,
} from "lucide-react";
import { useEditorStore } from "@/store/useEditorStore";
import {
  createMotionPath,
  createPresetPath,
  reverseWaypoints,
  waypointsToSvgPath,
  getDefaultWaypoints,
} from "@/engine/advanced/motionPath";

export default function MotionPathModal({ isOpen, onClose }) {
  const selectedLayerIds = useEditorStore((s) => s.selectedLayerIds);
  const layers = useEditorStore((s) => s.layers);
  const canvasWidth = useEditorStore((s) => s.canvasWidth);
  const canvasHeight = useEditorStore((s) => s.canvasHeight);
  const setLayerMotionPath = useEditorStore((s) => s.setLayerMotionPath);

  const activeLayer = layers.find((l) => selectedLayerIds.includes(l.id)) || layers[0] || null;

  const [pathConfig, setPathConfig] = useState(() => {
    return activeLayer?.motionPath || createMotionPath({
      waypoints: getDefaultWaypoints(),
      closed: false,
      autoOrient: true,
      easing: "easeInOut",
    });
  });

  if (!isOpen || !activeLayer) return null;

  const handleApplyPreset = (type) => {
    const preset = createPresetPath(type, canvasWidth / 2, canvasHeight / 2);
    setPathConfig(preset);
  };

  const handleToggleClosed = () => {
    setPathConfig((prev) => ({ ...prev, closed: !prev.closed }));
  };

  const handleToggleAutoOrient = () => {
    setPathConfig((prev) => ({ ...prev, autoOrient: !prev.autoOrient }));
  };

  const handleReverse = () => {
    setPathConfig((prev) => ({
      ...prev,
      waypoints: reverseWaypoints(prev.waypoints),
    }));
  };

  const handleAddWaypoint = () => {
    const pts = pathConfig.waypoints;
    const last = pts[pts.length - 1] || { x: 500, y: 500 };
    const newPt = {
      id: `wp_${Date.now()}`,
      x: Math.min(canvasWidth - 100, last.x + 120),
      y: Math.min(canvasHeight - 100, last.y + 60),
      handleIn: { x: -40, y: 0 },
      handleOut: { x: 40, y: 0 },
    };
    setPathConfig((prev) => ({
      ...prev,
      waypoints: [...prev.waypoints, newPt],
    }));
  };

  const handleRemoveWaypoint = (id) => {
    if (pathConfig.waypoints.length <= 2) return;
    setPathConfig((prev) => ({
      ...prev,
      waypoints: prev.waypoints.filter((w) => w.id !== id),
    }));
  };

  const handleSaveToLayer = () => {
    setLayerMotionPath(activeLayer.id, pathConfig);
    onClose();
  };

  const handleRemovePathFromLayer = () => {
    setLayerMotionPath(activeLayer.id, null);
    onClose();
  };

  const svgD = waypointsToSvgPath(pathConfig.waypoints, pathConfig.closed);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-surface-200 border border-surface-border rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border bg-surface-100">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Navigation className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                Motion Path Editor
                <span className="text-xs font-normal text-zinc-400">({activeLayer.name})</span>
              </h2>
              <p className="text-xs text-zinc-400">
                Direct object to traverse smooth Bezier trajectories with auto-orientation
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

        {/* Content */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Path Preview Canvas */}
          <div className="flex-1 p-4 bg-[#0a0a0f] border-b md:border-b-0 md:border-r border-surface-border flex flex-col items-center justify-center">
            <div className="w-full aspect-video bg-[#07070a] border border-surface-border rounded-xl relative overflow-hidden flex items-center justify-center">
              <svg
                viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
                className="w-full h-full block"
              >
                {/* Motion Trajectory Path */}
                <path
                  d={svgD}
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="4"
                  strokeDasharray="6 6"
                />
                {/* Control Points & Handles */}
                {pathConfig.waypoints.map((wp, idx) => (
                  <g key={wp.id}>
                    <circle cx={wp.x} cy={wp.y} r="10" fill="#6366f1" stroke="#ffffff" strokeWidth="2" />
                    <text x={wp.x + 14} y={wp.y + 4} fill="#a1a1aa" fontSize="18" fontWeight="bold">
                      {idx + 1}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
            <p className="text-[11px] text-zinc-500 mt-2">
              Trajectory preview scaled from {canvasWidth}x{canvasHeight}
            </p>
          </div>

          {/* Controls Panel */}
          <div className="w-full md:w-80 p-4 bg-surface-100 overflow-y-auto flex flex-col gap-4">
            {/* Presets */}
            <div>
              <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
                Path Presets
              </h3>
              <div className="grid grid-cols-2 gap-1.5">
                {["arc", "circle", "infinity", "wave", "spiral"].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => handleApplyPreset(preset)}
                    className="px-2.5 py-1.5 rounded-lg text-xs bg-surface-200 hover:bg-surface-border border border-surface-border text-zinc-300 capitalize text-center"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Path Options */}
            <div className="flex flex-col gap-2 p-3 rounded-xl bg-surface-200 border border-surface-border">
              <h4 className="text-xs font-semibold text-zinc-200">Trajectory Rules</h4>

              <label className="flex items-center justify-between text-xs text-zinc-300 cursor-pointer">
                <span>Auto-Orient (Follow Tangent)</span>
                <input
                  type="checkbox"
                  checked={pathConfig.autoOrient}
                  onChange={handleToggleAutoOrient}
                  className="rounded border-zinc-700 accent-brand-500 w-4 h-4"
                />
              </label>

              <label className="flex items-center justify-between text-xs text-zinc-300 cursor-pointer">
                <span>Close Path Loop</span>
                <input
                  type="checkbox"
                  checked={pathConfig.closed}
                  onChange={handleToggleClosed}
                  className="rounded border-zinc-700 accent-brand-500 w-4 h-4"
                />
              </label>

              <button
                onClick={handleReverse}
                className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded text-xs bg-surface-100 hover:bg-surface-border text-zinc-300 border border-surface-border mt-1"
              >
                <Repeat className="w-3.5 h-3.5" />
                <span>Reverse Direction</span>
              </button>
            </div>

            {/* Waypoints List */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-zinc-300">
                  Waypoints ({pathConfig.waypoints.length})
                </h4>
                <button
                  onClick={handleAddWaypoint}
                  className="p-1 rounded bg-brand-600/30 text-brand-300 hover:bg-brand-600/50 text-xs flex items-center gap-1 px-2"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Point</span>
                </button>
              </div>

              <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto">
                {pathConfig.waypoints.map((wp, i) => (
                  <div
                    key={wp.id}
                    className="flex items-center justify-between px-3 py-1.5 rounded bg-surface-200 text-xs border border-surface-border"
                  >
                    <span className="font-medium text-zinc-300">Point #{i + 1}</span>
                    <span className="font-mono text-[11px] text-zinc-400">
                      ({wp.x}, {wp.y})
                    </span>
                    {pathConfig.waypoints.length > 2 && (
                      <button
                        onClick={() => handleRemoveWaypoint(wp.id)}
                        className="text-red-400 hover:text-red-300 p-1"
                        title="Remove point"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-surface-border bg-surface-100 flex items-center justify-between">
          <button
            onClick={handleRemovePathFromLayer}
            className="px-3 py-2 rounded-lg text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
          >
            Clear Path from Layer
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium bg-surface-200 hover:bg-surface-border text-zinc-300"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveToLayer}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white flex items-center gap-1.5 shadow-glow"
            >
              <Check className="w-4 h-4" />
              <span>Attach Path to Object</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
