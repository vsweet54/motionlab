"use client";

import React from "react";
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
  FolderPlus,
  FolderMinus,
  CopyPlus,
  Crosshair,
  Link2,
} from "lucide-react";
import { useEditorStore } from "@/store/useEditorStore";
import { ANCHOR_PRESETS } from "@/engine/advanced/transformHierarchy";

export default function TransformToolbar({ className = "" }) {
  const selectedLayerIds = useEditorStore((s) => s.selectedLayerIds);
  const layers = useEditorStore((s) => s.layers);
  const alignSelectedLayers = useEditorStore((s) => s.alignSelectedLayers);
  const distributeSelectedLayers = useEditorStore((s) => s.distributeSelectedLayers);
  const groupSelectedLayers = useEditorStore((s) => s.groupSelectedLayers);
  const ungroupSelectedLayers = useEditorStore((s) => s.ungroupSelectedLayers);
  const duplicateWithOffset = useEditorStore((s) => s.duplicateWithOffset);
  const setLayerAnchor = useEditorStore((s) => s.setLayerAnchor);
  const setLayerParent = useEditorStore((s) => s.setLayerParent);

  const selectedLayers = layers.filter((l) => selectedLayerIds.includes(l.id));
  const activeLayer = selectedLayers[0] || null;
  const isGroupSelected = selectedLayers.some((l) => l.type === "group");

  if (selectedLayerIds.length === 0) return null;

  return (
    <div
      className={`bg-surface-200/95 backdrop-blur-md border border-surface-border rounded-xl p-2 flex items-center gap-2 shadow-2xl flex-wrap select-none ${className}`}
    >
      {/* Anchor Point 9-Grid Pivot Selector */}
      {activeLayer && (
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-surface-100 border border-surface-border/60">
          <Crosshair className="w-3.5 h-3.5 text-zinc-400" />
          <span className="text-[10px] font-semibold text-zinc-400 uppercase hidden sm:inline">
            Pivot
          </span>
          <div className="grid grid-cols-3 gap-0.5 p-0.5 bg-surface-200 rounded">
            {ANCHOR_PRESETS.map((p) => {
              const currentAx = activeLayer.anchorX !== undefined ? activeLayer.anchorX : 0.5;
              const currentAy = activeLayer.anchorY !== undefined ? activeLayer.anchorY : 0.5;
              const isSelected = Math.abs(currentAx - p.x) < 0.1 && Math.abs(currentAy - p.y) < 0.1;
              return (
                <button
                  key={p.id}
                  onClick={() => setLayerAnchor(activeLayer.id, p.x, p.y)}
                  className={`w-2.5 h-2.5 rounded-[2px] transition-colors ${
                    isSelected ? "bg-brand-500" : "bg-zinc-600 hover:bg-zinc-400"
                  }`}
                  title={`Anchor: ${p.label}`}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Alignment Tools */}
      <div className="flex items-center gap-0.5 bg-surface-100 p-0.5 rounded-lg border border-surface-border/60">
        <button
          onClick={() => alignSelectedLayers("left")}
          className="p-1.5 text-zinc-400 hover:text-white rounded hover:bg-surface-border"
          title="Align Left"
        >
          <AlignLeft className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => alignSelectedLayers("centerH")}
          className="p-1.5 text-zinc-400 hover:text-white rounded hover:bg-surface-border"
          title="Align Horizontal Center"
        >
          <AlignCenter className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => alignSelectedLayers("right")}
          className="p-1.5 text-zinc-400 hover:text-white rounded hover:bg-surface-border"
          title="Align Right"
        >
          <AlignRight className="w-3.5 h-3.5" />
        </button>
        <div className="w-[1px] h-4 bg-surface-border/80 my-auto" />
        <button
          onClick={() => alignSelectedLayers("top")}
          className="p-1.5 text-zinc-400 hover:text-white rounded hover:bg-surface-border"
          title="Align Top"
        >
          <AlignStartVertical className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => alignSelectedLayers("centerV")}
          className="p-1.5 text-zinc-400 hover:text-white rounded hover:bg-surface-border"
          title="Align Vertical Middle"
        >
          <AlignCenterVertical className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => alignSelectedLayers("bottom")}
          className="p-1.5 text-zinc-400 hover:text-white rounded hover:bg-surface-border"
          title="Align Bottom"
        >
          <AlignEndVertical className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Distribute Tools (if >= 3 layers selected) */}
      {selectedLayerIds.length >= 3 && (
        <div className="flex items-center gap-1 bg-surface-100 px-1 py-0.5 rounded-lg border border-surface-border/60">
          <button
            onClick={() => distributeSelectedLayers("horizontal")}
            className="px-2 py-1 text-[11px] font-medium text-zinc-400 hover:text-white rounded hover:bg-surface-border"
            title="Distribute Horizontally"
          >
            Dist H
          </button>
          <button
            onClick={() => distributeSelectedLayers("vertical")}
            className="px-2 py-1 text-[11px] font-medium text-zinc-400 hover:text-white rounded hover:bg-surface-border"
            title="Distribute Vertically"
          >
            Dist V
          </button>
        </div>
      )}

      {/* Group / Ungroup */}
      {selectedLayerIds.length >= 2 && (
        <button
          onClick={groupSelectedLayers}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-surface-100 hover:bg-surface-border text-zinc-200 border border-surface-border/60"
          title="Group Selected Objects (Ctrl+G)"
        >
          <FolderPlus className="w-3.5 h-3.5 text-indigo-400" />
          <span>Group</span>
        </button>
      )}

      {isGroupSelected && (
        <button
          onClick={() => ungroupSelectedLayers()}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-surface-100 hover:bg-surface-border text-zinc-200 border border-surface-border/60"
          title="Ungroup Group (Ctrl+Shift+G)"
        >
          <FolderMinus className="w-3.5 h-3.5 text-amber-400" />
          <span>Ungroup</span>
        </button>
      )}

      {/* Duplicate with Offset */}
      <button
        onClick={() => duplicateWithOffset(25, 25)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-surface-100 hover:bg-surface-border text-zinc-200 border border-surface-border/60"
        title="Duplicate with Offset (+25px)"
      >
        <CopyPlus className="w-3.5 h-3.5 text-emerald-400" />
        <span className="hidden sm:inline">Offset Dup</span>
      </button>

      {/* Parent Hierarchy Binding */}
      {activeLayer && (
        <div className="flex items-center gap-1 bg-surface-100 px-2 py-1 rounded-lg border border-surface-border/60">
          <Link2 className="w-3.5 h-3.5 text-zinc-400" />
          <select
            value={activeLayer.parentId || ""}
            onChange={(e) => setLayerParent(activeLayer.id, e.target.value)}
            className="bg-transparent text-[11px] text-zinc-300 outline-none max-w-[100px]"
            title="Parent Hierarchy Link"
          >
            <option value="">No Parent</option>
            {layers
              .filter((l) => l.id !== activeLayer.id)
              .map((l) => (
                <option key={l.id} value={l.id}>
                  Parent: {l.name}
                </option>
              ))}
          </select>
        </div>
      )}
    </div>
  );
}
