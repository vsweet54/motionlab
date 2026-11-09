"use client";

import React, { useState } from "react";
import {
  Sliders,
  Maximize,
  RotateCw,
  Eye,
  Type,
  Square,
  Circle,
  Palette,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Copy,
  Trash2,
  Lock,
  Unlock,
  Layers,
  Sparkles,
  ArrowUpToLine,
  ArrowDownToLine,
  AlignCenterVertical,
  AlignCenterHorizontal,
  ChevronRight,
  ArrowRightLeft,
  TrendingUp,
  Navigation,
  Code2,
  Crosshair,
  Link2,
} from "lucide-react";
import { useEditorStore } from "@/store/useEditorStore";
import { useAnimationStore } from "@/store/useAnimationStore";
import EffectsInspector from "@/components/effects/EffectsInspector";
import TransitionInspector from "@/components/effects/TransitionInspector";
import { getRegisteredCustomFonts } from "@/engine/assets/fontManager";
import { ANCHOR_PRESETS } from "@/engine/advanced/transformHierarchy";

const FONT_FAMILIES = [
  "Inter",
  "Roboto",
  "Poppins",
  "Montserrat",
  "Arial",
  "Courier New",
  "Georgia",
  "Impact",
  "Trebuchet MS",
];

const PRESET_COLORS = [
  "#ffffff",
  "#09090b",
  "#6366f1",
  "#a855f7",
  "#ec4899",
  "#ef4444",
  "#f97316",
  "#eab308",
  "#10b981",
  "#06b6d4",
  "#3b82f6",
  "#1e293b",
];

export default function EditorPropertiesPanel({
  onClose,
  onOpenEffectsLibrary,
  onOpenAssetVault,
  onOpenMotionPath,
  onOpenExpressions,
  onOpenGraphEditor,
}) {
  const [inspectorTab, setInspectorTab] = useState("style"); // 'style' | 'effects' | 'transitions' | 'motion'
  const {
    layers,
    selectedLayerIds,
    updateLayer,
    updateSelectedLayers,
    deleteSelectedLayers,
    duplicateSelectedLayers,
    toggleLayerLock,
    toggleLayerVisibility,
    alignSelected,
    setLayerAnchor,
    setLayerParent,
    canvasWidth,
    canvasHeight,
    backgroundColor,
    project,
  } = useEditorStore();

  const selectedLayers = layers.filter((l) => selectedLayerIds.includes(l.id));
  const isSingle = selectedLayers.length === 1;
  const isMultiple = selectedLayers.length > 1;
  const currentLayer = isSingle ? selectedLayers[0] : null;

  // 1. When Nothing is Selected: Show Canvas Overview
  if (selectedLayers.length === 0) {
    return (
      <aside className="w-72 h-full bg-surface-200 border-l border-surface-border p-4 text-xs space-y-6 select-none overflow-y-auto shadow-xl lg:shadow-none">
        <div className="flex items-center justify-between pb-3 border-b border-surface-border">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-brand-400" />
            <h3 className="font-semibold text-zinc-100">Canvas Properties</h3>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 text-zinc-400 hover:text-white lg:hidden"
            >
              ✕
            </button>
          )}
        </div>

        {/* Project Spec Summary */}
        <div className="space-y-3">
          <div className="p-3 bg-surface-100 border border-surface-border rounded-xl space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-zinc-500">Composition</span>
              <span className="font-medium text-zinc-200">{project?.name || "Untitled"}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-500">Dimensions</span>
              <span className="font-mono text-zinc-200">{canvasWidth} × {canvasHeight}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-500">Aspect Ratio</span>
              <span className="font-mono text-brand-400">{project?.aspectRatio || "16:9"}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-500">Frame Rate</span>
              <span className="font-mono text-zinc-200">{project?.fps || 60} FPS</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-500">Duration</span>
              <span className="font-mono text-zinc-200">{project?.duration || 5} Seconds</span>
            </div>
          </div>
        </div>

        {/* Canvas Background Color */}
        <div className="space-y-2">
          <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
            Canvas Background
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={backgroundColor}
              onChange={(e) => {
                useEditorStore.setState({ backgroundColor: e.target.value, isDirty: true });
                useEditorStore.getState().saveProjectToDB();
              }}
              className="w-8 h-8 rounded-lg cursor-pointer border border-surface-border bg-transparent"
            />
            <input
              type="text"
              value={backgroundColor}
              onChange={(e) => {
                useEditorStore.setState({ backgroundColor: e.target.value, isDirty: true });
                useEditorStore.getState().saveProjectToDB();
              }}
              className="flex-1 px-3 py-1.5 bg-surface-100 border border-surface-border rounded-lg text-xs font-mono text-zinc-200 focus:outline-none focus:border-brand-500 uppercase"
            />
          </div>

          <div className="flex flex-wrap gap-1.5 pt-1">
            {PRESET_COLORS.slice(0, 8).map((color) => (
              <button
                key={color}
                onClick={() => {
                  useEditorStore.setState({ backgroundColor: color, isDirty: true });
                  useEditorStore.getState().saveProjectToDB();
                }}
                style={{ backgroundColor: color }}
                className="w-5 h-5 rounded-md border border-white/20 transition-transform hover:scale-110"
              />
            ))}
          </div>
        </div>

        <div className="p-3 rounded-xl bg-surface-100/60 border border-surface-border text-[11px] text-zinc-400 space-y-1">
          <p className="font-semibold text-zinc-300">Quick Tip:</p>
          <p>Click on any object in the canvas or layers list to inspect and edit its properties.</p>
        </div>
      </aside>
    );
  }

  // 2. When Multiple Objects are Selected
  if (isMultiple) {
    return (
      <aside className="w-72 h-full bg-surface-200 border-l border-surface-border p-4 text-xs space-y-6 select-none overflow-y-auto shadow-xl lg:shadow-none">
        <div className="flex items-center justify-between pb-3 border-b border-surface-border">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-brand-400" />
            <h3 className="font-semibold text-zinc-100">Multiple Objects</h3>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-400 text-[10px] font-mono">
              {selectedLayers.length} selected
            </span>
            {onClose && (
              <button
                onClick={onClose}
                className="p-1 text-zinc-400 hover:text-white lg:hidden"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Alignment Tools */}
        <div className="space-y-2">
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
            Align Selection
          </span>
          <div className="grid grid-cols-3 gap-1.5 bg-surface-100 p-1.5 rounded-xl border border-surface-border">
            <button
              onClick={() => alignSelected("left")}
              className="p-2 flex flex-col items-center justify-center gap-1 rounded hover:bg-surface-border text-zinc-300"
              title="Align Left"
            >
              <AlignLeft className="w-4 h-4" />
              <span className="text-[9px]">Left</span>
            </button>
            <button
              onClick={() => alignSelected("center")}
              className="p-2 flex flex-col items-center justify-center gap-1 rounded hover:bg-surface-border text-zinc-300"
              title="Align Center Horizontal"
            >
              <AlignCenterHorizontal className="w-4 h-4" />
              <span className="text-[9px]">Center</span>
            </button>
            <button
              onClick={() => alignSelected("right")}
              className="p-2 flex flex-col items-center justify-center gap-1 rounded hover:bg-surface-border text-zinc-300"
              title="Align Right"
            >
              <AlignRight className="w-4 h-4" />
              <span className="text-[9px]">Right</span>
            </button>
            <button
              onClick={() => alignSelected("top")}
              className="p-2 flex flex-col items-center justify-center gap-1 rounded hover:bg-surface-border text-zinc-300"
              title="Align Top"
            >
              <ArrowUpToLine className="w-4 h-4" />
              <span className="text-[9px]">Top</span>
            </button>
            <button
              onClick={() => alignSelected("middle")}
              className="p-2 flex flex-col items-center justify-center gap-1 rounded hover:bg-surface-border text-zinc-300"
              title="Align Middle Vertical"
            >
              <AlignCenterVertical className="w-4 h-4" />
              <span className="text-[9px]">Middle</span>
            </button>
            <button
              onClick={() => alignSelected("bottom")}
              className="p-2 flex flex-col items-center justify-center gap-1 rounded hover:bg-surface-border text-zinc-300"
              title="Align Bottom"
            >
              <ArrowDownToLine className="w-4 h-4" />
              <span className="text-[9px]">Bottom</span>
            </button>
          </div>
        </div>

        {/* Bulk Opacity */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-zinc-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">
              Bulk Opacity
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            defaultValue="1"
            onChange={(e) => updateSelectedLayers({ opacity: parseFloat(e.target.value) })}
            className="w-full accent-brand-500 cursor-pointer"
          />
        </div>

        {/* Bulk Actions */}
        <div className="space-y-2 pt-2 border-t border-surface-border">
          <button
            onClick={() => duplicateSelectedLayers()}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-surface-100 hover:bg-surface-border border border-surface-border text-zinc-200 transition-colors"
          >
            <Copy className="w-3.5 h-3.5 text-brand-400" />
            <span>Duplicate Selected</span>
          </button>
          <button
            onClick={() => deleteSelectedLayers()}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Selected</span>
          </button>
        </div>
      </aside>
    );
  }

  // 3. Single Object Selected
  const isText = currentLayer.type === "text";
  const isRect = currentLayer.type === "rect";
  const isCircle = currentLayer.type === "circle";
  const isEllipse = currentLayer.type === "ellipse";
  const isStar = currentLayer.type === "star";
  const isPolygon = currentLayer.type === "polygon";
  const isLine = currentLayer.type === "line";
  const isImage = currentLayer.type === "image";
  const isSvg = currentLayer.type === "svg";

  return (
    <aside className="w-72 h-full bg-surface-200 border-l border-surface-border p-4 text-xs space-y-5 select-none overflow-y-auto shadow-xl lg:shadow-none">
      {/* Header: Layer Name & Quick Actions */}
      <div className="flex items-center justify-between pb-3 border-b border-surface-border">
        <div className="flex-1 mr-2">
          <input
            type="text"
            value={currentLayer.name}
            onChange={(e) => updateLayer(currentLayer.id, { name: e.target.value })}
            className="w-full bg-surface-100 border border-surface-border rounded-lg px-2.5 py-1 text-xs font-semibold text-white focus:outline-none focus:border-brand-500"
          />
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => toggleLayerLock(currentLayer.id)}
            className={`p-1.5 rounded hover:bg-surface-100 transition-colors ${
              currentLayer.isLocked ? "text-amber-400" : "text-zinc-400"
            }`}
            title={currentLayer.isLocked ? "Unlock" : "Lock"}
          >
            {currentLayer.isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => toggleLayerVisibility(currentLayer.id)}
            className="p-1.5 rounded hover:bg-surface-100 text-zinc-400 hover:text-white transition-colors"
            title="Toggle Visibility"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 text-zinc-400 hover:text-white lg:hidden"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Inspector Tabs: Style | Effects | Transitions */}
      <div className="flex items-center rounded-xl bg-surface-100 p-1 border border-surface-border text-xs">
        <button
          onClick={() => setInspectorTab("style")}
          className={`flex-1 py-1.5 rounded-lg font-semibold text-center transition-colors min-h-[34px] ${
            inspectorTab === "style"
              ? "bg-brand-600 text-white shadow-sm"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          Style
        </button>
        <button
          onClick={() => setInspectorTab("effects")}
          className={`flex-1 py-1.5 rounded-lg font-semibold text-center transition-colors flex items-center justify-center gap-1 min-h-[34px] ${
            inspectorTab === "effects"
              ? "bg-purple-600 text-white shadow-sm"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <Sparkles className="w-3 h-3 text-purple-300" />
          <span>Effects ({currentLayer.effects?.length || 0})</span>
        </button>
        <button
          onClick={() => setInspectorTab("transitions")}
          className={`flex-1 py-1.5 rounded-lg font-semibold text-center transition-colors min-h-[34px] ${
            inspectorTab === "transitions"
              ? "bg-cyan-600 text-white shadow-sm"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          Transitions
        </button>
        <button
          onClick={() => setInspectorTab("motion")}
          className={`flex-1 py-1.5 rounded-lg font-semibold text-center transition-colors flex items-center justify-center gap-1 min-h-[34px] ${
            inspectorTab === "motion"
              ? "bg-emerald-600 text-white shadow-sm"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <Navigation className="w-3 h-3 text-emerald-300" />
          <span>Motion</span>
        </button>
      </div>

      {inspectorTab === "effects" && (
        <EffectsInspector layer={currentLayer} onOpenLibrary={onOpenEffectsLibrary} />
      )}

      {inspectorTab === "transitions" && (
        <TransitionInspector layer={currentLayer} />
      )}

      {inspectorTab === "motion" && (
        <div className="space-y-4 text-xs select-none">
          {/* Anchor Pivot */}
          <div className="space-y-2 p-3 rounded-xl bg-surface-100 border border-surface-border">
            <div className="flex items-center justify-between text-zinc-300 font-semibold">
              <span className="flex items-center gap-1.5">
                <Crosshair className="w-3.5 h-3.5 text-zinc-400" />
                <span>Pivot Anchor Point</span>
              </span>
              <span className="font-mono text-[11px] text-zinc-400">
                ({currentLayer.anchorX !== undefined ? currentLayer.anchorX : 0.5},{" "}
                {currentLayer.anchorY !== undefined ? currentLayer.anchorY : 0.5})
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1 p-1 bg-surface-200 rounded-lg max-w-[120px] mx-auto">
              {ANCHOR_PRESETS.map((p) => {
                const curX = currentLayer.anchorX !== undefined ? currentLayer.anchorX : 0.5;
                const curY = currentLayer.anchorY !== undefined ? currentLayer.anchorY : 0.5;
                const isSelected = Math.abs(curX - p.x) < 0.1 && Math.abs(curY - p.y) < 0.1;
                return (
                  <button
                    key={p.id}
                    onClick={() => setLayerAnchor(currentLayer.id, p.x, p.y)}
                    className={`h-6 rounded text-[9px] font-bold transition-colors ${
                      isSelected
                        ? "bg-brand-600 text-white shadow-sm"
                        : "bg-surface-100 hover:bg-surface-border text-zinc-400"
                    }`}
                  >
                    {p.x === 0.5 && p.y === 0.5 ? "•" : p.id.replace("Center", "C").slice(0, 2)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Parent Transform Hierarchy */}
          <div className="space-y-2 p-3 rounded-xl bg-surface-100 border border-surface-border">
            <div className="flex items-center gap-1.5 text-zinc-300 font-semibold">
              <Link2 className="w-3.5 h-3.5 text-zinc-400" />
              <span>Parent Hierarchy Link</span>
            </div>
            <select
              value={currentLayer.parentId || ""}
              onChange={(e) => setLayerParent(currentLayer.id, e.target.value)}
              className="w-full bg-surface-200 border border-surface-border rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 outline-none"
            >
              <option value="">No Parent (Root Canvas)</option>
              {layers
                .filter((l) => l.id !== currentLayer.id)
                .map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name} ({l.type})
                  </option>
                ))}
            </select>
          </div>

          {/* Motion Path Status & Trigger */}
          <div className="space-y-2 p-3 rounded-xl bg-surface-100 border border-surface-border">
            <div className="flex items-center justify-between text-zinc-300 font-semibold">
              <span className="flex items-center gap-1.5">
                <Navigation className="w-3.5 h-3.5 text-emerald-400" />
                <span>Motion Path Trajectory</span>
              </span>
              <span className="text-[10px] text-zinc-400">
                {currentLayer.motionPath ? "Active" : "None"}
              </span>
            </div>
            <button
              onClick={onOpenMotionPath}
              className="w-full py-2 px-3 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>{currentLayer.motionPath ? "Edit Motion Path" : "Attach Motion Path"}</span>
            </button>
          </div>

          {/* Procedural Expressions */}
          <div className="space-y-2 p-3 rounded-xl bg-surface-100 border border-surface-border">
            <div className="flex items-center justify-between text-zinc-300 font-semibold">
              <span className="flex items-center gap-1.5">
                <Code2 className="w-3.5 h-3.5 text-purple-400" />
                <span>Procedural Expression</span>
              </span>
              <span className="text-[10px] text-zinc-400">
                {currentLayer.expression?.enabled ? "Running" : "None"}
              </span>
            </div>
            <button
              onClick={onOpenExpressions}
              className="w-full py-2 px-3 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>{currentLayer.expression ? "Configure Expression" : "Add Expression"}</span>
            </button>
          </div>

          {/* Graph Editor Trigger */}
          <div className="p-3 rounded-xl bg-surface-100 border border-surface-border">
            <button
              onClick={onOpenGraphEditor}
              className="w-full py-2 px-3 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Open Graph & Bezier Editor</span>
            </button>
          </div>
        </div>
      )}

      {inspectorTab === "style" && (
        <>
          {/* SECTION 1: Transform & Layout */}
          <div className="space-y-3">
        <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
          Transform
        </span>

        {/* Position X & Y */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-zinc-500 block mb-1">X Position</label>
            <input
              type="number"
              value={Math.round(currentLayer.x)}
              onChange={(e) => updateLayer(currentLayer.id, { x: Number(e.target.value) })}
              className="w-full px-2.5 py-1.5 bg-surface-100 border border-surface-border rounded-lg text-xs font-mono text-zinc-200 focus:outline-none focus:border-brand-500"
            />
          </div>
          <div>
            <label className="text-[10px] text-zinc-500 block mb-1">Y Position</label>
            <input
              type="number"
              value={Math.round(currentLayer.y)}
              onChange={(e) => updateLayer(currentLayer.id, { y: Number(e.target.value) })}
              className="w-full px-2.5 py-1.5 bg-surface-100 border border-surface-border rounded-lg text-xs font-mono text-zinc-200 focus:outline-none focus:border-brand-500"
            />
          </div>
        </div>

        {/* Width & Height */}
        {!isCircle && !isPolygon && (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-zinc-500 block mb-1">Width</label>
              <input
                type="number"
                min="5"
                value={Math.round(currentLayer.width || 100)}
                onChange={(e) => updateLayer(currentLayer.id, { width: Math.max(5, Number(e.target.value)) })}
                className="w-full px-2.5 py-1.5 bg-surface-100 border border-surface-border rounded-lg text-xs font-mono text-zinc-200 focus:outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-zinc-500 block mb-1">Height</label>
              <input
                type="number"
                min="5"
                value={Math.round(currentLayer.height || 100)}
                onChange={(e) => updateLayer(currentLayer.id, { height: Math.max(5, Number(e.target.value)) })}
                className="w-full px-2.5 py-1.5 bg-surface-100 border border-surface-border rounded-lg text-xs font-mono text-zinc-200 focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>
        )}

        {/* Rotation & Opacity */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[10px]">Rotation</span>
            <span className="font-mono text-zinc-200">{Math.round(currentLayer.rotation || 0)}°</span>
          </div>
          <input
            type="range"
            min="0"
            max="360"
            value={currentLayer.rotation || 0}
            onChange={(e) => updateLayer(currentLayer.id, { rotation: Number(e.target.value) })}
            className="w-full accent-brand-500 cursor-pointer"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[10px]">Opacity</span>
            <span className="font-mono text-zinc-200">
              {Math.round((currentLayer.opacity ?? 1) * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={currentLayer.opacity ?? 1}
            onChange={(e) => updateLayer(currentLayer.id, { opacity: parseFloat(e.target.value) })}
            className="w-full accent-brand-500 cursor-pointer"
          />
        </div>
      </div>

      {/* SECTION 2: Text Specific Controls */}
      {isText && (
        <div className="space-y-3 pt-3 border-t border-surface-border">
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
            Typography
          </span>

          {/* Text Content */}
          <div>
            <label className="text-[10px] text-zinc-500 block mb-1">Content</label>
            <textarea
              rows={2}
              value={currentLayer.text || ""}
              onChange={(e) => updateLayer(currentLayer.id, { text: e.target.value })}
              className="w-full px-2.5 py-1.5 bg-surface-100 border border-surface-border rounded-lg text-xs text-zinc-100 focus:outline-none focus:border-brand-500"
            />
          </div>

          {/* Font Family */}
          <div>
            <label className="text-[10px] text-zinc-500 block mb-1">Font Family</label>
            <select
              value={currentLayer.fontFamily || "Inter"}
              onChange={(e) => updateLayer(currentLayer.id, { fontFamily: e.target.value })}
              className="w-full px-2.5 py-1.5 bg-surface-100 border border-surface-border rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-brand-500"
            >
              {Array.from(new Set([...getRegisteredCustomFonts(), ...FONT_FAMILIES])).map((font) => (
                <option key={font} value={font}>
                  {getRegisteredCustomFonts().includes(font) ? `★ ${font} (Custom)` : font}
                </option>
              ))}
            </select>
          </div>

          {/* Font Size & Weight */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-zinc-500 block mb-1">Font Size</label>
              <input
                type="number"
                min="8"
                max="300"
                value={currentLayer.fontSize || 64}
                onChange={(e) => updateLayer(currentLayer.id, { fontSize: Number(e.target.value) })}
                className="w-full px-2.5 py-1.5 bg-surface-100 border border-surface-border rounded-lg text-xs font-mono text-zinc-200 focus:outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-zinc-500 block mb-1">Font Weight</label>
              <select
                value={currentLayer.fontWeight || "bold"}
                onChange={(e) => updateLayer(currentLayer.id, { fontWeight: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-surface-100 border border-surface-border rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-brand-500"
              >
                <option value="normal">Normal (400)</option>
                <option value="500">Medium (500)</option>
                <option value="600">Semibold (600)</option>
                <option value="bold">Bold (700)</option>
                <option value="900">Black (900)</option>
              </select>
            </div>
          </div>

          {/* Alignment & Italic */}
          <div className="flex items-center justify-between gap-2 pt-1">
            <div className="flex items-center rounded-lg bg-surface-100 border border-surface-border p-0.5">
              <button
                onClick={() => updateLayer(currentLayer.id, { align: "left" })}
                className={`p-1.5 rounded ${
                  currentLayer.align === "left"
                    ? "bg-brand-600 text-white"
                    : "text-zinc-400 hover:text-white"
                }`}
                title="Align Left"
              >
                <AlignLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => updateLayer(currentLayer.id, { align: "center" })}
                className={`p-1.5 rounded ${
                  currentLayer.align === "center"
                    ? "bg-brand-600 text-white"
                    : "text-zinc-400 hover:text-white"
                }`}
                title="Align Center"
              >
                <AlignCenter className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => updateLayer(currentLayer.id, { align: "right" })}
                className={`p-1.5 rounded ${
                  currentLayer.align === "right"
                    ? "bg-brand-600 text-white"
                    : "text-zinc-400 hover:text-white"
                }`}
                title="Align Right"
              >
                <AlignRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              onClick={() =>
                updateLayer(currentLayer.id, {
                  fontStyle: currentLayer.fontStyle === "italic" ? "normal" : "italic",
                })
              }
              className={`p-2 rounded-lg border transition-colors ${
                currentLayer.fontStyle === "italic"
                  ? "bg-brand-600 text-white border-brand-500 font-bold"
                  : "bg-surface-100 text-zinc-400 border-surface-border hover:text-white"
              }`}
              title="Italic"
            >
              <Italic className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Letter Spacing & Line Height */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-zinc-500 block mb-1">Letter Spacing</label>
              <input
                type="number"
                step="1"
                value={currentLayer.letterSpacing || 0}
                onChange={(e) => updateLayer(currentLayer.id, { letterSpacing: Number(e.target.value) })}
                className="w-full px-2.5 py-1.5 bg-surface-100 border border-surface-border rounded-lg text-xs font-mono text-zinc-200"
              />
            </div>
            <div>
              <label className="text-[10px] text-zinc-500 block mb-1">Line Height</label>
              <input
                type="number"
                step="0.1"
                min="0.8"
                max="3"
                value={currentLayer.lineHeight || 1.2}
                onChange={(e) => updateLayer(currentLayer.id, { lineHeight: parseFloat(e.target.value) })}
                className="w-full px-2.5 py-1.5 bg-surface-100 border border-surface-border rounded-lg text-xs font-mono text-zinc-200"
              />
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: Shape Specific Controls */}
      {isRect && (
        <div className="space-y-2 pt-3 border-t border-surface-border">
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
            Corner Radius
          </span>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="0"
              max="100"
              value={currentLayer.cornerRadius || 0}
              onChange={(e) => updateLayer(currentLayer.id, { cornerRadius: Number(e.target.value) })}
              className="flex-1 accent-brand-500 cursor-pointer"
            />
            <span className="font-mono text-zinc-300 w-8 text-right">
              {currentLayer.cornerRadius || 0}px
            </span>
          </div>
        </div>
      )}

      {isCircle && (
        <div className="space-y-2 pt-3 border-t border-surface-border">
          <label className="text-[10px] text-zinc-500 block">Radius</label>
          <input
            type="number"
            min="5"
            value={currentLayer.radius || 80}
            onChange={(e) => updateLayer(currentLayer.id, { radius: Math.max(5, Number(e.target.value)) })}
            className="w-full px-2.5 py-1.5 bg-surface-100 border border-surface-border rounded-lg text-xs font-mono text-zinc-200"
          />
        </div>
      )}

      {isEllipse && (
        <div className="grid grid-cols-2 gap-2 pt-3 border-t border-surface-border">
          <div>
            <label className="text-[10px] text-zinc-500 block mb-1">Radius X</label>
            <input
              type="number"
              min="5"
              value={currentLayer.radiusX || 120}
              onChange={(e) => updateLayer(currentLayer.id, { radiusX: Math.max(5, Number(e.target.value)) })}
              className="w-full px-2.5 py-1.5 bg-surface-100 border border-surface-border rounded-lg text-xs font-mono text-zinc-200"
            />
          </div>
          <div>
            <label className="text-[10px] text-zinc-500 block mb-1">Radius Y</label>
            <input
              type="number"
              min="5"
              value={currentLayer.radiusY || 80}
              onChange={(e) => updateLayer(currentLayer.id, { radiusY: Math.max(5, Number(e.target.value)) })}
              className="w-full px-2.5 py-1.5 bg-surface-100 border border-surface-border rounded-lg text-xs font-mono text-zinc-200"
            />
          </div>
        </div>
      )}

      {isStar && (
        <div className="space-y-3 pt-3 border-t border-surface-border">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-zinc-500 block mb-1">Points</label>
              <input
                type="number"
                min="3"
                max="20"
                value={currentLayer.numPoints || 5}
                onChange={(e) => updateLayer(currentLayer.id, { numPoints: Number(e.target.value) })}
                className="w-full px-2.5 py-1.5 bg-surface-100 border border-surface-border rounded-lg text-xs font-mono text-zinc-200"
              />
            </div>
            <div>
              <label className="text-[10px] text-zinc-500 block mb-1">Outer Radius</label>
              <input
                type="number"
                min="10"
                value={currentLayer.outerRadius || 90}
                onChange={(e) => updateLayer(currentLayer.id, { outerRadius: Number(e.target.value) })}
                className="w-full px-2.5 py-1.5 bg-surface-100 border border-surface-border rounded-lg text-xs font-mono text-zinc-200"
              />
            </div>
          </div>
        </div>
      )}

      {isPolygon && (
        <div className="space-y-2 pt-3 border-t border-surface-border">
          <label className="text-[10px] text-zinc-500 block">Sides</label>
          <input
            type="number"
            min="3"
            max="12"
            value={currentLayer.sides || 6}
            onChange={(e) => updateLayer(currentLayer.id, { sides: Number(e.target.value) })}
            className="w-full px-2.5 py-1.5 bg-surface-100 border border-surface-border rounded-lg text-xs font-mono text-zinc-200"
          />
        </div>
      )}

      {/* SECTION: Image / Media Asset Management */}
      {(isImage || currentLayer.type === "video") && (
        <div className="space-y-3 pt-3 border-t border-surface-border">
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
            Media Asset Source
          </span>

          <div className="p-3 bg-surface-100 rounded-xl border border-surface-border space-y-2.5">
            <div className="flex items-center gap-3">
              {currentLayer.src && (
                <div className="w-12 h-12 rounded-lg bg-surface-200 overflow-hidden flex items-center justify-center border border-surface-border flex-shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={currentLayer.src}
                    alt={currentLayer.name}
                    className="w-full h-full object-contain"
                  />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <span className="text-xs font-semibold text-white block truncate">
                  {currentLayer.name}
                </span>
                <span className="text-[10px] text-zinc-400 font-mono block">
                  {currentLayer.width} × {currentLayer.height} px
                </span>
                {currentLayer.assetId && (
                  <span className="text-[10px] text-emerald-400 font-mono block">
                    Linked to Vault Asset
                  </span>
                )}
              </div>
            </div>

            {onOpenAssetVault && (
              <button
                onClick={() => onOpenAssetVault(currentLayer.id)}
                className="w-full py-2 rounded-xl bg-surface-200 hover:bg-surface-border border border-surface-border text-xs font-semibold text-brand-300 hover:text-white transition-colors flex items-center justify-center gap-1.5 min-h-[38px]"
              >
                <span>Replace from Asset Vault</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* SECTION 4: Appearance (Fill & Stroke) */}
      {!isImage && currentLayer.type !== "video" && (
        <div className="space-y-3 pt-3 border-t border-surface-border">
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
            Appearance
          </span>

          {/* Fill Color */}
          {!isLine && (
            <div className="space-y-1.5">
              <label className="text-[10px] text-zinc-500 block">Fill Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={currentLayer.fill || "#6366f1"}
                  onChange={(e) => updateLayer(currentLayer.id, { fill: e.target.value })}
                  className="w-8 h-8 rounded-lg cursor-pointer border border-surface-border bg-transparent"
                />
                <input
                  type="text"
                  value={currentLayer.fill || "#6366f1"}
                  onChange={(e) => updateLayer(currentLayer.id, { fill: e.target.value })}
                  className="flex-1 px-3 py-1.5 bg-surface-100 border border-surface-border rounded-lg text-xs font-mono text-zinc-200 focus:outline-none focus:border-brand-500 uppercase"
                />
              </div>

              {/* Preset swatches */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => updateLayer(currentLayer.id, { fill: c })}
                    style={{ backgroundColor: c }}
                    className="w-5 h-5 rounded-md border border-white/20 transition-transform hover:scale-110"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Stroke Color & Width */}
          <div className="space-y-1.5 pt-1">
            <label className="text-[10px] text-zinc-500 block">Stroke Color & Width</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={currentLayer.stroke === "transparent" ? "#ffffff" : currentLayer.stroke || "#818cf8"}
                onChange={(e) => updateLayer(currentLayer.id, { stroke: e.target.value })}
                className="w-8 h-8 rounded-lg cursor-pointer border border-surface-border bg-transparent"
              />
              <input
                type="number"
                min="0"
                max="40"
                placeholder="0px"
                value={currentLayer.strokeWidth || 0}
                onChange={(e) => updateLayer(currentLayer.id, { strokeWidth: Math.max(0, Number(e.target.value)) })}
                className="w-20 px-2.5 py-1.5 bg-surface-100 border border-surface-border rounded-lg text-xs font-mono text-zinc-200"
              />
              <button
                onClick={() =>
                  updateLayer(currentLayer.id, {
                    stroke: currentLayer.stroke === "transparent" ? "#ffffff" : "transparent",
                    strokeWidth: currentLayer.stroke === "transparent" ? 2 : 0,
                  })
                }
                className="px-2 py-1.5 bg-surface-100 hover:bg-surface-border rounded-lg text-[10px] text-zinc-400"
              >
                {currentLayer.stroke === "transparent" ? "Add" : "None"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 5: Alignment & Actions */}
      <div className="space-y-2 pt-3 border-t border-surface-border">
        <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
          Align to Canvas
        </span>
        <div className="grid grid-cols-3 gap-1 bg-surface-100 p-1 rounded-xl border border-surface-border">
          <button
            onClick={() => alignSelected("left")}
            className="p-1.5 flex justify-center rounded hover:bg-surface-border text-zinc-300"
            title="Align Canvas Left"
          >
            <AlignLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => alignSelected("center")}
            className="p-1.5 flex justify-center rounded hover:bg-surface-border text-zinc-300"
            title="Align Canvas Center"
          >
            <AlignCenterHorizontal className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => alignSelected("right")}
            className="p-1.5 flex justify-center rounded hover:bg-surface-border text-zinc-300"
            title="Align Canvas Right"
          >
            <AlignRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => alignSelected("top")}
            className="p-1.5 flex justify-center rounded hover:bg-surface-border text-zinc-300"
            title="Align Canvas Top"
          >
            <ArrowUpToLine className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => alignSelected("middle")}
            className="p-1.5 flex justify-center rounded hover:bg-surface-border text-zinc-300"
            title="Align Canvas Middle"
          >
            <AlignCenterVertical className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => alignSelected("bottom")}
            className="p-1.5 flex justify-center rounded hover:bg-surface-border text-zinc-300"
            title="Align Canvas Bottom"
          >
            <ArrowDownToLine className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="pt-2 border-t border-surface-border space-y-2">
          <button
            onClick={() => useAnimationStore.getState().setActiveInspectorLayerId(currentLayer.id)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-brand-600/20 hover:bg-brand-600/30 text-brand-300 border border-brand-500/30 text-xs font-semibold transition-colors shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-brand-400" />
            <span>Animate Object (Keyframes & Presets)</span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => duplicateSelectedLayers()}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-surface-100 hover:bg-surface-border border border-surface-border text-zinc-200 transition-colors"
            >
              <Copy className="w-3.5 h-3.5 text-brand-400" />
              <span>Duplicate</span>
            </button>
            <button
              onClick={() => deleteSelectedLayers()}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          </div>
        </div>
      </div>
      </>
      )}
    </aside>
  );
}
