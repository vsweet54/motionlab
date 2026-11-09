"use client";

import { useState } from "react";
import {
  Layers,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Copy,
  Trash2,
  ChevronUp,
  ChevronDown,
  ChevronsUp,
  ChevronsDown,
  Type,
  Square,
  Circle,
  Star,
  Hexagon,
  Minus,
  Image as ImageIcon,
  Compass,
  Film,
  Edit2,
  Search,
} from "lucide-react";
import { useEditorStore } from "@/store/useEditorStore";

const ICONS = {
  text: Type,
  rect: Square,
  circle: Circle,
  ellipse: Circle,
  star: Star,
  polygon: Hexagon,
  line: Minus,
  image: ImageIcon,
  svg: Compass,
  video: Film,
};

export default function EditorLayersPanel() {
  const {
    layers,
    selectedLayerIds,
    selectLayer,
    toggleLayerVisibility,
    toggleLayerLock,
    renameLayer,
    reorderLayer,
    deleteSelectedLayers,
    duplicateSelectedLayers,
  } = useEditorStore();

  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [search, setSearch] = useState("");

  // In Konva/Canvas, the last layer in array is drawn on top.
  // In the UI Layers panel, designers expect the top layer to be at the top of the list!
  const reversedLayers = [...layers].reverse();

  const filteredLayers = search
    ? reversedLayers.filter((l) =>
        l.name.toLowerCase().includes(search.toLowerCase())
      )
    : reversedLayers;

  const startRename = (layer, e) => {
    e.stopPropagation();
    setEditingId(layer.id);
    setEditingName(layer.name);
  };

  const finishRename = (id) => {
    if (editingName.trim()) {
      renameLayer(id, editingName.trim());
    }
    setEditingId(null);
  };

  return (
    <div className="flex flex-col h-full bg-surface-200 border-r border-surface-border text-xs select-none">
      {/* Panel Header */}
      <div className="p-3 border-b border-surface-border flex items-center justify-between">
        <div className="flex items-center gap-1.5 font-semibold text-zinc-200">
          <Layers className="w-3.5 h-3.5 text-brand-400" />
          <span>Layers</span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-surface-100 text-zinc-400 border border-surface-border">
            {layers.length}
          </span>
        </div>

        {/* Global Layer Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => duplicateSelectedLayers()}
            disabled={selectedLayerIds.length === 0}
            className="p-1 text-zinc-400 hover:text-white disabled:opacity-30 rounded hover:bg-surface-100 transition-colors"
            title="Duplicate Selected (Ctrl+D)"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => deleteSelectedLayers()}
            disabled={selectedLayerIds.length === 0}
            className="p-1 text-zinc-400 hover:text-red-400 disabled:opacity-30 rounded hover:bg-surface-100 transition-colors"
            title="Delete Selected (Delete / Backspace)"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Layer Search Bar */}
      <div className="p-2 border-b border-surface-border/50">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search layers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-2 py-1 bg-surface-100 border border-surface-border rounded-lg text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-brand-500"
          />
        </div>
      </div>

      {/* Layers List */}
      <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5">
        {filteredLayers.length === 0 ? (
          <div className="p-6 text-center text-zinc-500">
            <Layers className="w-6 h-6 mx-auto mb-1.5 opacity-40" />
            <p className="text-[11px]">No layers found</p>
          </div>
        ) : (
          filteredLayers.map((layer) => {
            const isSelected = selectedLayerIds.includes(layer.id);
            const Icon = ICONS[layer.type] || Square;

            return (
              <div
                key={layer.id}
                onClick={(e) => {
                  const isMulti = e.shiftKey || e.ctrlKey || e.metaKey;
                  selectLayer(layer.id, isMulti);
                }}
                className={`group flex items-center justify-between px-2 py-1.5 rounded-lg transition-all duration-150 cursor-pointer ${
                  isSelected
                    ? "bg-brand-600/20 text-white border border-brand-500/40 font-medium"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-surface-100 border border-transparent"
                }`}
              >
                {/* Left: Icon & Name */}
                <div className="flex items-center gap-2 overflow-hidden flex-1 mr-2">
                  <Icon
                    className={`w-3.5 h-3.5 shrink-0 ${
                      isSelected ? "text-brand-400" : "text-zinc-500 group-hover:text-zinc-300"
                    }`}
                  />

                  {editingId === layer.id ? (
                    <input
                      autoFocus
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onBlur={() => finishRename(layer.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") finishRename(layer.id);
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="bg-surface-100 border border-brand-500 rounded px-1.5 py-0.5 text-xs text-white outline-none w-full"
                    />
                  ) : (
                    <span
                      onDoubleClick={(e) => startRename(layer, e)}
                      className="truncate text-xs select-none"
                    >
                      {layer.name}
                    </span>
                  )}
                </div>

                {/* Right: Actions (Visibility, Lock, Reorder) */}
                <div className="flex items-center gap-0.5 shrink-0 opacity-80 group-hover:opacity-100">
                  {/* Reorder Up / Down */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      reorderLayer(layer.id, "up");
                    }}
                    className="p-1 hover:text-white rounded hover:bg-surface-border/50 text-zinc-500"
                    title="Bring Forward"
                  >
                    <ChevronUp className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      reorderLayer(layer.id, "down");
                    }}
                    className="p-1 hover:text-white rounded hover:bg-surface-border/50 text-zinc-500"
                    title="Send Backward"
                  >
                    <ChevronDown className="w-3 h-3" />
                  </button>

                  {/* Lock Toggle */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleLayerLock(layer.id);
                    }}
                    className={`p-1 rounded hover:bg-surface-border/50 transition-colors ${
                      layer.isLocked
                        ? "text-amber-400"
                        : "text-zinc-500 hover:text-zinc-300"
                    }`}
                    title={layer.isLocked ? "Unlock Layer" : "Lock Layer"}
                  >
                    {layer.isLocked ? (
                      <Lock className="w-3 h-3" />
                    ) : (
                      <Unlock className="w-3 h-3 opacity-0 group-hover:opacity-100" />
                    )}
                  </button>

                  {/* Visibility Toggle */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleLayerVisibility(layer.id);
                    }}
                    className={`p-1 rounded hover:bg-surface-border/50 transition-colors ${
                      layer.visible === false
                        ? "text-zinc-600"
                        : "text-zinc-400 hover:text-white"
                    }`}
                    title={layer.visible === false ? "Show Layer" : "Hide Layer"}
                  >
                    {layer.visible === false ? (
                      <EyeOff className="w-3 h-3 text-zinc-600" />
                    ) : (
                      <Eye className="w-3 h-3" />
                    )}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Layer Reorder Shortcuts Footer */}
      {selectedLayerIds.length === 1 && (
        <div className="p-2 border-t border-surface-border/60 bg-surface-100/50 flex items-center justify-between text-[11px] text-zinc-400">
          <span>Arrange Order:</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => reorderLayer(selectedLayerIds[0], "top")}
              className="p-1 hover:text-white hover:bg-surface-border rounded"
              title="Bring to Front"
            >
              <ChevronsUp className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => reorderLayer(selectedLayerIds[0], "up")}
              className="p-1 hover:text-white hover:bg-surface-border rounded"
              title="Bring Forward"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => reorderLayer(selectedLayerIds[0], "down")}
              className="p-1 hover:text-white hover:bg-surface-border rounded"
              title="Send Backward"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => reorderLayer(selectedLayerIds[0], "bottom")}
              className="p-1 hover:text-white hover:bg-surface-border rounded"
              title="Send to Back"
            >
              <ChevronsDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
