"use client";

import React, { useEffect, useRef } from "react";
import {
  Scissors,
  Copy,
  Trash2,
  Plus,
  SlidersHorizontal,
  Clipboard,
  Sparkles,
  X,
} from "lucide-react";
import { useAnimationStore } from "@/store/useAnimationStore";
import { useEditorStore } from "@/store/useEditorStore";

export default function TimelineContextMenu() {
  const {
    contextMenu,
    closeContextMenu,
    currentTime,
    addKeyframe,
    setActiveInspectorLayerId,
    setEditingClipId,
    copySelectedKeyframes,
    pasteKeyframesAtCurrentTime,
    copiedKeyframes,
  } = useAnimationStore();

  const {
    layers,
    splitClip,
    duplicateClip,
    deleteClip,
  } = useEditorStore();

  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        closeContextMenu();
      }
    };

    if (contextMenu.isOpen) {
      window.addEventListener("pointerdown", handleClickOutside);
    }
    return () => {
      window.removeEventListener("pointerdown", handleClickOutside);
    };
  }, [contextMenu.isOpen, closeContextMenu]);

  if (!contextMenu.isOpen) return null;

  const targetLayer = layers.find((l) => l.id === contextMenu.targetId);

  const canSplit =
    targetLayer &&
    currentTime > Number(targetLayer.startTime ?? 0) + 0.05 &&
    currentTime < Number(targetLayer.startTime ?? 0) + Number(targetLayer.duration ?? 5.0) - 0.05;

  const handleSplit = () => {
    if (canSplit && targetLayer) {
      splitClip(targetLayer.id, currentTime);
    }
    closeContextMenu();
  };

  const handleDuplicate = () => {
    if (targetLayer) {
      duplicateClip(targetLayer.id);
    }
    closeContextMenu();
  };

  const handleDelete = () => {
    if (targetLayer) {
      deleteClip(targetLayer.id);
    }
    closeContextMenu();
  };

  const handleAddKeyframe = () => {
    if (targetLayer) {
      addKeyframe({
        objectId: targetLayer.id,
        property: "opacity",
        time: currentTime,
        value: targetLayer.opacity ?? 1,
        easing: "power2Out",
      });
      setActiveInspectorLayerId(targetLayer.id);
    }
    closeContextMenu();
  };

  const handleOpenProperties = () => {
    if (targetLayer) {
      setEditingClipId(targetLayer.id);
    }
    closeContextMenu();
  };

  const handleOpenInspector = () => {
    if (targetLayer) {
      setActiveInspectorLayerId(targetLayer.id);
    }
    closeContextMenu();
  };

  const handleCopyKeyframes = () => {
    copySelectedKeyframes();
    closeContextMenu();
  };

  const handlePasteKeyframes = () => {
    pasteKeyframesAtCurrentTime(targetLayer?.id);
    closeContextMenu();
  };

  // Clamp popup position inside viewport
  const style = {
    top: Math.min(window.innerHeight - 320, Math.max(10, contextMenu.y)),
    left: Math.min(window.innerWidth - 220, Math.max(10, contextMenu.x)),
  };

  return (
    <div
      ref={menuRef}
      style={style}
      className="fixed z-50 w-56 bg-surface-100 border border-surface-border rounded-2xl shadow-2xl p-1.5 text-xs text-zinc-200 select-none backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-surface-border/60 text-[11px] font-semibold text-zinc-400">
        <span className="truncate">{targetLayer?.name || "Timeline Track"}</span>
        <button
          onClick={closeContextMenu}
          className="p-1 text-zinc-400 hover:text-white rounded"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="py-1 space-y-0.5">
        {/* Split at Playhead */}
        <button
          onClick={handleSplit}
          disabled={!canSplit}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-colors min-h-[40px] ${
            canSplit
              ? "hover:bg-brand-600 hover:text-white text-zinc-200"
              : "text-zinc-500 cursor-not-allowed"
          }`}
        >
          <Scissors className="w-4 h-4 text-brand-400" />
          <span>Split at Playhead (S)</span>
        </button>

        {/* Duplicate Clip */}
        <button
          onClick={handleDuplicate}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left hover:bg-surface-border text-zinc-200 transition-colors min-h-[40px]"
        >
          <Copy className="w-4 h-4 text-cyan-400" />
          <span>Duplicate Clip</span>
        </button>

        {/* Add Keyframe */}
        <button
          onClick={handleAddKeyframe}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left hover:bg-surface-border text-zinc-200 transition-colors min-h-[40px]"
        >
          <Plus className="w-4 h-4 text-emerald-400" />
          <span>Add Keyframe</span>
        </button>

        {/* Animation & Presets */}
        <button
          onClick={handleOpenInspector}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left hover:bg-surface-border text-zinc-200 transition-colors min-h-[40px]"
        >
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span>Animation & Presets</span>
        </button>

        {/* Copy & Paste Keyframes */}
        <button
          onClick={handleCopyKeyframes}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left hover:bg-surface-border text-zinc-200 transition-colors min-h-[40px]"
        >
          <Clipboard className="w-4 h-4 text-amber-400" />
          <span>Copy Keyframes</span>
        </button>

        <button
          onClick={handlePasteKeyframes}
          disabled={!copiedKeyframes || copiedKeyframes.length === 0}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-colors min-h-[40px] ${
            copiedKeyframes && copiedKeyframes.length > 0
              ? "hover:bg-surface-border text-zinc-200"
              : "text-zinc-600 cursor-not-allowed"
          }`}
        >
          <Clipboard className="w-4 h-4 text-zinc-500" />
          <span>Paste Keyframes</span>
        </button>

        {/* Clip Properties */}
        <button
          onClick={handleOpenProperties}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left hover:bg-surface-border text-zinc-200 transition-colors min-h-[40px]"
        >
          <SlidersHorizontal className="w-4 h-4 text-brand-400" />
          <span>Clip Timing Settings</span>
        </button>

        <div className="h-px bg-surface-border/60 my-1" />

        {/* Delete */}
        <button
          onClick={handleDelete}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left hover:bg-red-500/20 text-red-400 transition-colors min-h-[40px]"
        >
          <Trash2 className="w-4 h-4" />
          <span>Delete Clip</span>
        </button>
      </div>
    </div>
  );
}
