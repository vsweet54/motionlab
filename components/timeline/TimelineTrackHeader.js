"use client";

import React, { useState } from "react";
import {
  Type,
  Square,
  Circle,
  Star,
  Hexagon,
  Minus,
  Image as ImageIcon,
  Compass,
  Film,
  Volume2,
  VolumeX,
  Sparkles,
  Folder,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  ChevronDown,
  ChevronRight,
  MoreVertical,
  Plus,
} from "lucide-react";
import { useEditorStore } from "@/store/useEditorStore";
import { useAnimationStore } from "@/store/useAnimationStore";

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
  audio: Volume2,
  effect: Sparkles,
  group: Folder,
};

export default function TimelineTrackHeader({
  layer,
  isSelected,
  isExpanded,
  onToggleExpand,
  onSelect,
}) {
  const {
    toggleLayerVisibility,
    toggleLayerLock,
    renameLayer,
  } = useEditorStore();

  const {
    currentTime,
    addKeyframe,
    setActiveInspectorLayerId,
    openContextMenu,
  } = useAnimationStore();

  const [isEditingName, setIsEditingName] = useState(false);
  const [nameVal, setNameVal] = useState(layer.name);

  const Icon = ICONS[layer.type] || Square;

  const handleNameSubmit = (e) => {
    e?.preventDefault();
    if (nameVal.trim()) {
      renameLayer(layer.id, nameVal.trim());
    }
    setIsEditingName(false);
  };

  const handleAddKeyframe = (e) => {
    e.stopPropagation();
    addKeyframe({
      objectId: layer.id,
      property: "opacity",
      time: currentTime,
      value: layer.opacity ?? 1,
      easing: "power2Out",
    });
    setActiveInspectorLayerId(layer.id);
  };

  const handleOpenMenu = (e) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    openContextMenu({
      x: rect.right + 4,
      y: rect.top,
      type: "track",
      targetId: layer.id,
      clickTime: currentTime,
    });
  };

  return (
    <div
      onClick={() => onSelect(layer.id)}
      className={`h-11 px-2.5 sm:px-3 border-r border-surface-border flex items-center justify-between shrink-0 select-none transition-colors cursor-pointer ${
        isSelected
          ? "bg-surface-100 border-l-2 border-l-brand-500"
          : "bg-surface-200 hover:bg-surface-100/60"
      }`}
    >
      {/* Left: Expand chevron + Type Icon + Name */}
      <div className="flex items-center gap-1.5 truncate mr-1">
        {/* Sub-lanes expand chevron */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleExpand();
          }}
          className="p-1 rounded text-zinc-400 hover:text-white transition-colors"
          title={isExpanded ? "Collapse sub-lanes" : "Expand property keyframes"}
        >
          {isExpanded ? (
            <ChevronDown className="w-3.5 h-3.5 text-brand-400" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5" />
          )}
        </button>

        <Icon
          className={`w-3.5 h-3.5 shrink-0 ${
            isSelected ? "text-brand-400" : "text-zinc-400"
          }`}
        />

        {isEditingName ? (
          <form onSubmit={handleNameSubmit} className="truncate">
            <input
              type="text"
              autoFocus
              value={nameVal}
              onChange={(e) => setNameVal(e.target.value)}
              onBlur={handleNameSubmit}
              onClick={(e) => e.stopPropagation()}
              className="bg-surface-200 border border-brand-500 rounded px-1.5 py-0.5 text-xs text-white outline-none w-24 sm:w-28 font-medium"
            />
          </form>
        ) : (
          <span
            onDoubleClick={(e) => {
              e.stopPropagation();
              setIsEditingName(true);
            }}
            className="truncate font-medium text-zinc-200 text-xs"
            title={`${layer.name} (Double-click to rename)`}
          >
            {layer.name}
          </span>
        )}
      </div>

      {/* Right: Quick Track Actions */}
      <div className="flex items-center gap-0.5 shrink-0">
        {/* Add Keyframe */}
        <button
          onClick={handleAddKeyframe}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-brand-400 hover:bg-surface-border/60 transition-colors"
          title="Add Keyframe at playhead"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>

        {/* Visibility */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleLayerVisibility(layer.id);
          }}
          className={`p-1.5 rounded-lg transition-colors ${
            layer.visible !== false
              ? "text-zinc-400 hover:text-white"
              : "text-zinc-600 hover:text-zinc-400"
          }`}
          title={layer.visible !== false ? "Hide track" : "Show track"}
        >
          {layer.visible !== false ? (
            <Eye className="w-3.5 h-3.5" />
          ) : (
            <EyeOff className="w-3.5 h-3.5" />
          )}
        </button>

        {/* Lock */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleLayerLock(layer.id);
          }}
          className={`p-1.5 rounded-lg transition-colors ${
            layer.isLocked
              ? "text-amber-400 hover:text-amber-300"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
          title={layer.isLocked ? "Unlock track" : "Lock track"}
        >
          {layer.isLocked ? (
            <Lock className="w-3.5 h-3.5" />
          ) : (
            <Unlock className="w-3.5 h-3.5" />
          )}
        </button>

        {/* More Menu */}
        <button
          onClick={handleOpenMenu}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-surface-border/60 transition-colors"
          title="Track options"
        >
          <MoreVertical className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
