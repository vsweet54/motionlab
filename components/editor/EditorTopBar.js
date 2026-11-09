"use client";

import { useState } from "react";
import {
  ArrowLeft,
  Undo2,
  Redo2,
  MousePointer,
  Hand,
  Grid,
  Magnet,
  Crosshair,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Save,
  Check,
  Film,
  Sparkles,
  Layers,
  Sliders,
  Wand2,
  FolderOpen,
  Download,
  BookmarkPlus,
  History,
  FileCode,
  Activity,
  HelpCircle,
  TrendingUp,
} from "lucide-react";
import { useEditorStore } from "@/store/useEditorStore";
import { useProjectStore } from "@/store/useProjectStore";

export default function EditorTopBar({
  onBackToDashboard,
  onToggleLeftSidebar,
  onToggleRightSidebar,
  isLeftOpen,
  isRightOpen,
  onOpenEffectsLibrary,
  onOpenPresets,
  onOpenAssetVault,
  onOpenExport,
  onSaveAsTemplate,
  onOpenVersionHistory,
  onOpenCodeExport,
  onOpenDiagnostics,
  onOpenShortcuts,
  onOpenGraphEditor,
  onOpenAiModal,
}) {
  const {
    project,
    canvasWidth,
    canvasHeight,
    zoom,
    setZoom,
    panX,
    panY,
    setPan,
    isGridVisible,
    toggleGrid,
    isSnapToGrid,
    toggleSnap,
    showCenterGuides,
    toggleCenterGuides,
    activeTool,
    setActiveTool,
    undo,
    redo,
    past,
    future,
    isSaving,
    isDirty,
    lastSavedAt,
    saveProjectToDB,
    fitToScreen,
  } = useEditorStore();

  const showToast = useProjectStore((s) => s.showToast);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(project?.name || "Untitled Motion Project");

  const handleTitleSubmit = () => {
    setIsEditingTitle(false);
    if (titleInput.trim()) {
      useEditorStore.setState((s) => ({
        project: { ...s.project, name: titleInput.trim() },
        isDirty: true,
      }));
      saveProjectToDB();
      showToast(`Renamed project to "${titleInput.trim()}"`);
    }
  };

  const handleManualSave = async () => {
    await saveProjectToDB();
    showToast("Project saved to local IndexedDB");
  };

  return (
    <header className="h-13 min-h-[52px] bg-surface-200 border-b border-surface-border px-3 sm:px-4 flex items-center justify-between z-30 select-none">
      {/* Left: Back & Project Info */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Mobile Tools/Layers Drawer Toggle */}
        {onToggleLeftSidebar && (
          <button
            onClick={onToggleLeftSidebar}
            className={`p-2 rounded-lg border text-xs font-medium md:hidden min-w-[38px] min-h-[38px] flex items-center justify-center transition-colors ${
              isLeftOpen
                ? "bg-brand-600 text-white border-brand-500"
                : "bg-surface-100 text-zinc-400 hover:text-white border-surface-border"
            }`}
            title="Toggle Tools & Layers"
          >
            <Layers className="w-4 h-4" />
          </button>
        )}

        <button
          onClick={onBackToDashboard}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-300 hover:text-white bg-surface-100 hover:bg-surface-border border border-surface-border transition-colors min-h-[38px]"
          title="Return to Dashboard"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Dashboard</span>
        </button>

        <div className="h-4 w-px bg-surface-border hidden sm:block" />

        {/* Project Title (Inline Editable) */}
        <div className="flex items-center gap-2">
          {isEditingTitle ? (
            <input
              autoFocus
              type="text"
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              onBlur={handleTitleSubmit}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleTitleSubmit();
                if (e.key === "Escape") {
                  setTitleInput(project?.name || "Untitled");
                  setIsEditingTitle(false);
                }
              }}
              className="text-xs font-semibold text-white bg-surface-100 border border-brand-500 rounded px-2 py-0.5 outline-none"
            />
          ) : (
            <button
              onClick={() => {
                setTitleInput(project?.name || "Untitled");
                setIsEditingTitle(true);
              }}
              className="text-xs font-semibold text-zinc-200 hover:text-white hover:bg-surface-100 px-2 py-1 rounded transition-colors truncate max-w-[140px] sm:max-w-[200px]"
              title="Click to rename"
            >
              {project?.name || "Untitled Project"}
            </button>
          )}

          <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono text-zinc-400 bg-surface-100 border border-surface-border">
            {canvasWidth}×{canvasHeight}
          </span>
        </div>
      </div>

      {/* Center: Tools, Undo/Redo & Toggles */}
      <div className="flex items-center gap-1 sm:gap-2">
        {/* Undo / Redo */}
        <div className="flex items-center rounded-lg bg-surface-100 border border-surface-border p-0.5">
          <button
            onClick={undo}
            disabled={past.length === 0}
            className="p-1.5 rounded text-zinc-400 hover:text-white disabled:opacity-30 disabled:hover:text-zinc-400 transition-colors"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={redo}
            disabled={future.length === 0}
            className="p-1.5 rounded text-zinc-400 hover:text-white disabled:opacity-30 disabled:hover:text-zinc-400 transition-colors"
            title="Redo (Ctrl+Shift+Z)"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Pointer / Hand Tool Toggle */}
        <div className="flex items-center rounded-lg bg-surface-100 border border-surface-border p-0.5">
          <button
            onClick={() => setActiveTool("select")}
            className={`p-1.5 rounded text-xs transition-colors ${
              activeTool === "select"
                ? "bg-brand-600 text-white shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
            title="Select Tool (V)"
          >
            <MousePointer className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setActiveTool("pan")}
            className={`p-1.5 rounded text-xs transition-colors ${
              activeTool === "pan"
                ? "bg-brand-600 text-white shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
            title="Pan Hand Tool (H / Space+Drag)"
          >
            <Hand className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Grid, Snap & Center Guides */}
        <div className="hidden lg:flex items-center rounded-lg bg-surface-100 border border-surface-border p-0.5">
          <button
            onClick={toggleGrid}
            className={`p-1.5 rounded text-xs transition-colors ${
              isGridVisible
                ? "bg-surface-border text-brand-400 font-bold"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
            title="Toggle Grid Overlay"
          >
            <Grid className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={toggleSnap}
            className={`p-1.5 rounded text-xs transition-colors ${
              isSnapToGrid
                ? "bg-brand-600 text-white"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
            title="Toggle Snap to Grid (40px)"
          >
            <Magnet className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={toggleCenterGuides}
            className={`p-1.5 rounded text-xs transition-colors ${
              showCenterGuides
                ? "bg-surface-border text-cyan-400 font-bold"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
            title="Toggle Center Alignment Guides"
          >
            <Crosshair className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Right: Presets, Effects, Zoom Controls & Save Button */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Presets & Effects Modals Trigger */}
        <div className="flex items-center gap-1">
          {onOpenAiModal && (
            <button
              onClick={onOpenAiModal}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-purple-600/20 via-indigo-600/20 to-cyan-500/20 hover:from-purple-600/30 hover:to-cyan-500/30 border border-purple-500/40 text-purple-200 transition-all min-h-[38px] shadow-glow"
              title="Generate new scenes with Gemini AI"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
              <span className="hidden xl:inline">AI Studio</span>
            </button>
          )}
          {onOpenPresets && (
            <button
              onClick={onOpenPresets}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-amber-500/10 to-orange-500/10 hover:from-amber-500/20 hover:to-orange-500/20 border border-amber-500/30 text-amber-300 transition-all min-h-[38px]"
              title="Open Preset Library"
            >
              <Wand2 className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden xl:inline">Presets</span>
            </button>
          )}
          {onOpenEffectsLibrary && (
            <button
              onClick={onOpenEffectsLibrary}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-purple-500/10 to-indigo-500/10 hover:from-purple-500/20 hover:to-indigo-500/20 border border-purple-500/30 text-purple-300 transition-all min-h-[38px]"
              title="Open Visual Effects Library"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span className="hidden xl:inline">Effects</span>
            </button>
          )}
          {onOpenAssetVault && (
            <button
              onClick={onOpenAssetVault}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-emerald-500/10 to-teal-500/10 hover:from-emerald-500/20 hover:to-teal-500/20 border border-emerald-500/30 text-emerald-300 transition-all min-h-[38px]"
              title="Open Local Asset Vault"
            >
              <FolderOpen className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden xl:inline">Vault</span>
            </button>
          )}
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center rounded-lg bg-surface-100 border border-surface-border p-0.5 text-xs">
          <button
            onClick={() => setZoom(zoom - 0.1)}
            className="p-1.5 text-zinc-400 hover:text-white"
            title="Zoom Out"
          >
            <ZoomOut className="w-3 h-3" />
          </button>
          <button
            onClick={() => {
              setZoom(1);
              setPan(0, 0);
            }}
            className="px-2 py-0.5 font-mono text-[11px] text-zinc-300 hover:text-white"
            title="Reset to 100%"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            onClick={() => setZoom(zoom + 0.1)}
            className="p-1.5 text-zinc-400 hover:text-white"
            title="Zoom In"
          >
            <ZoomIn className="w-3 h-3" />
          </button>
          <button
            onClick={() => {
              const el = document.querySelector("#canvas-viewport-container");
              if (el) fitToScreen(el.clientWidth, el.clientHeight);
            }}
            className="p-1.5 text-zinc-400 hover:text-white border-l border-surface-border/50"
            title="Fit to Screen"
          >
            <Maximize2 className="w-3 h-3" />
          </button>
        </div>

        {/* Save to IndexedDB Button */}
        <button
          onClick={handleManualSave}
          disabled={isSaving}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-all min-h-[38px] ${
            isDirty
              ? "bg-brand-600 hover:bg-brand-500 text-white shadow-glow"
              : "bg-surface-100 hover:bg-surface-border text-zinc-300 border border-surface-border"
          }`}
          title="Save project to IndexedDB"
        >
          {isSaving ? (
            <>
              <Save className="w-3.5 h-3.5 animate-spin" />
              <span className="hidden sm:inline">Saving</span>
            </>
          ) : (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">
                {lastSavedAt ? `Saved` : "Save"}
              </span>
            </>
          )}
        </button>

        {/* Save as Template Button */}
        <button
          onClick={onSaveAsTemplate}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-surface-100 hover:bg-surface-border text-zinc-300 border border-surface-border min-h-[38px] transition-colors"
          title="Save project as reusable template"
        >
          <BookmarkPlus className="w-3.5 h-3.5 text-purple-400" />
          <span className="hidden md:inline">Template</span>
        </button>

        {/* Version History Button */}
        <button
          onClick={onOpenVersionHistory}
          className="hidden 2xl:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-surface-100 hover:bg-surface-border text-zinc-300 border border-surface-border min-h-[38px] transition-colors"
          title="Inspect version history and snapshots"
        >
          <History className="w-3.5 h-3.5 text-cyan-400" />
          <span>History</span>
        </button>

        {/* Project Diagnostics Button */}
        <button
          onClick={onOpenDiagnostics}
          className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-surface-100 hover:bg-surface-border text-zinc-300 border border-surface-border min-h-[38px] transition-colors"
          title="Inspect project health, missing assets & performance"
        >
          <Activity className="w-3.5 h-3.5 text-emerald-400" />
          <span>Health</span>
        </button>

        {/* Code Export Button */}
        <button
          onClick={onOpenCodeExport}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-surface-100 hover:bg-surface-border text-zinc-300 border border-surface-border min-h-[38px] transition-colors"
          title="Export project as JSON, SVG, HTML+CSS, GSAP or React"
        >
          <FileCode className="w-3.5 h-3.5 text-indigo-400" />
          <span>Code</span>
        </button>

        {/* Shortcuts Help Button */}
        <button
          onClick={onOpenShortcuts}
          className="hidden lg:flex items-center p-2 rounded-lg text-zinc-400 hover:text-white bg-surface-100 hover:bg-surface-border border border-surface-border min-w-[38px] min-h-[38px] justify-center transition-colors"
          title="Keyboard and touch shortcuts"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        {/* Export Video & Frames Button */}
        <button
          onClick={onOpenExport}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-glow bg-brand-600 hover:bg-brand-500 text-white min-h-[38px] transition-all"
          title="Open Export & Rendering Studio"
        >
          <Download className="w-3.5 h-3.5 text-brand-200" />
          <span className="font-bold">Export</span>
        </button>

        {/* Mobile Properties Inspector Drawer Toggle */}
        {onToggleRightSidebar && (
          <button
            onClick={onToggleRightSidebar}
            className={`p-2 rounded-lg border text-xs font-medium lg:hidden min-w-[38px] min-h-[38px] flex items-center justify-center transition-colors ${
              isRightOpen
                ? "bg-brand-600 text-white border-brand-500"
                : "bg-surface-100 text-zinc-400 hover:text-white border-surface-border"
            }`}
            title="Toggle Properties Inspector"
          >
            <Sliders className="w-4 h-4" />
          </button>
        )}
      </div>
    </header>
  );
}
