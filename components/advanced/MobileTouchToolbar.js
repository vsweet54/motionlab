"use client";

import React from "react";
import {
  Undo2,
  Redo2,
  Sliders,
  TrendingUp,
  Navigation,
  Code2,
  Activity,
  FolderPlus,
  CopyPlus,
  HelpCircle,
} from "lucide-react";
import { useEditorStore } from "@/store/useEditorStore";

export default function MobileTouchToolbar({
  onOpenGraphEditor,
  onOpenMotionPath,
  onOpenExpressions,
  onOpenDiagnostics,
  onOpenShortcuts,
}) {
  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);
  const past = useEditorStore((s) => s.past);
  const future = useEditorStore((s) => s.future);
  const selectedLayerIds = useEditorStore((s) => s.selectedLayerIds);
  const groupSelectedLayers = useEditorStore((s) => s.groupSelectedLayers);
  const duplicateWithOffset = useEditorStore((s) => s.duplicateWithOffset);

  const hasSelection = selectedLayerIds.length > 0;

  return (
    <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 p-1.5 bg-surface-200/90 backdrop-blur-md border border-surface-border/80 rounded-2xl shadow-2xl max-w-[95vw] overflow-x-auto no-scrollbar">
      {/* Undo */}
      <button
        onClick={undo}
        disabled={past.length === 0}
        className="p-2 rounded-xl text-zinc-300 hover:text-white disabled:opacity-30 disabled:pointer-events-none hover:bg-surface-100 min-w-[38px] min-h-[38px] flex items-center justify-center transition-colors"
        title="Undo (Ctrl+Z)"
      >
        <Undo2 className="w-4 h-4" />
      </button>

      {/* Redo */}
      <button
        onClick={redo}
        disabled={future.length === 0}
        className="p-2 rounded-xl text-zinc-300 hover:text-white disabled:opacity-30 disabled:pointer-events-none hover:bg-surface-100 min-w-[38px] min-h-[38px] flex items-center justify-center transition-colors"
        title="Redo (Ctrl+Shift+Z)"
      >
        <Redo2 className="w-4 h-4" />
      </button>

      <div className="w-[1px] h-5 bg-surface-border my-auto mx-0.5" />

      {/* Graph Editor */}
      <button
        onClick={onOpenGraphEditor}
        className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 min-h-[38px] transition-colors whitespace-nowrap"
        title="Open Graph Editor & Bezier Curve"
      >
        <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
        <span className="hidden sm:inline">Graph</span>
      </button>

      {/* Motion Path */}
      <button
        onClick={onOpenMotionPath}
        disabled={!hasSelection}
        className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 disabled:opacity-30 disabled:pointer-events-none min-h-[38px] transition-colors whitespace-nowrap"
        title="Attach / Edit Motion Path"
      >
        <Navigation className="w-3.5 h-3.5 text-emerald-400" />
        <span className="hidden sm:inline">Path</span>
      </button>

      {/* Procedural Expressions */}
      <button
        onClick={onOpenExpressions}
        disabled={!hasSelection}
        className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 disabled:opacity-30 disabled:pointer-events-none min-h-[38px] transition-colors whitespace-nowrap"
        title="Procedural Animation Expressions"
      >
        <Code2 className="w-3.5 h-3.5 text-purple-400" />
        <span className="hidden sm:inline">Expression</span>
      </button>

      {/* Group (if >= 2 selected) */}
      {selectedLayerIds.length >= 2 && (
        <button
          onClick={groupSelectedLayers}
          className="p-2 rounded-xl text-zinc-300 hover:text-white hover:bg-surface-100 min-w-[38px] min-h-[38px] flex items-center justify-center transition-colors"
          title="Group Layers (Ctrl+G)"
        >
          <FolderPlus className="w-4 h-4 text-brand-400" />
        </button>
      )}

      {/* Duplicate Offset */}
      {hasSelection && (
        <button
          onClick={() => duplicateWithOffset(20, 20)}
          className="p-2 rounded-xl text-zinc-300 hover:text-white hover:bg-surface-100 min-w-[38px] min-h-[38px] flex items-center justify-center transition-colors"
          title="Duplicate with Offset"
        >
          <CopyPlus className="w-4 h-4 text-emerald-400" />
        </button>
      )}

      <div className="w-[1px] h-5 bg-surface-border my-auto mx-0.5" />

      {/* Diagnostics */}
      <button
        onClick={onOpenDiagnostics}
        className="p-2 rounded-xl text-zinc-300 hover:text-white hover:bg-surface-100 min-w-[38px] min-h-[38px] flex items-center justify-center transition-colors"
        title="Project Diagnostics & Health"
      >
        <Activity className="w-4 h-4 text-cyan-400" />
      </button>

      {/* Shortcuts Help */}
      <button
        onClick={onOpenShortcuts}
        className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-surface-100 min-w-[38px] min-h-[38px] flex items-center justify-center transition-colors"
        title="Keyboard & Touch Shortcuts"
      >
        <HelpCircle className="w-4 h-4" />
      </button>
    </div>
  );
}
