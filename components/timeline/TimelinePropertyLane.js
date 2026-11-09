"use client";

import React from "react";
import { Plus } from "lucide-react";
import { useAnimationStore } from "@/store/useAnimationStore";
import KeyframeDiamond from "./KeyframeDiamond";

const ANIMATABLE_PROPERTIES = [
  { key: "opacity", label: "Opacity", defaultVal: 1 },
  { key: "x", label: "Position X", defaultVal: 960 },
  { key: "y", label: "Position Y", defaultVal: 540 },
  { key: "scaleX", label: "Scale X", defaultVal: 1 },
  { key: "scaleY", label: "Scale Y", defaultVal: 1 },
  { key: "rotation", label: "Rotation", defaultVal: 0 },
];

export default function TimelinePropertyLane({
  layer,
  property,
  timelineZoom = 80,
}) {
  const {
    keyframes,
    selectedKeyframeId,
    selectKeyframe,
    currentTime,
    addKeyframe,
    setActiveInspectorLayerId,
    seek,
  } = useAnimationStore();

  const propertyKeyframes = keyframes.filter(
    (k) => k.objectId === layer.id && k.property === property.key
  );

  const handleAddKeyframe = (e) => {
    e.stopPropagation();
    addKeyframe({
      objectId: layer.id,
      property: property.key,
      time: currentTime,
      value: layer[property.key] ?? property.defaultVal,
      easing: "power2Out",
    });
    setActiveInspectorLayerId(layer.id);
  };

  const handleLaneClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickTime = Math.max(0, clickX / timelineZoom);
    seek(clickTime);
  };

  return (
    <div className="flex items-center h-8 border-b border-surface-border/40 bg-surface-200/40 text-[11px] select-none">
      {/* Left Property Sub-header */}
      <div className="w-44 sm:w-56 h-full px-4 sm:px-6 border-r border-surface-border/50 flex items-center justify-between shrink-0 bg-surface-200/80">
        <span className="text-zinc-400 font-medium truncate">
          {property.label}
        </span>
        <button
          onClick={handleAddKeyframe}
          className="p-1 rounded text-zinc-500 hover:text-brand-400 hover:bg-surface-border transition-colors"
          title={`Add ${property.label} keyframe`}
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>

      {/* Right Lane Keyframes Area */}
      <div
        onClick={handleLaneClick}
        className="timeline-track-content relative flex-1 h-full bg-[#07070b] overflow-hidden"
      >
        <div className="absolute top-1/2 left-0 right-0 h-px bg-surface-border/30 -translate-y-1/2 pointer-events-none" />

        {propertyKeyframes.map((kf) => (
          <KeyframeDiamond
            key={kf.id}
            keyframe={kf}
            timelineZoom={timelineZoom}
            isSelected={selectedKeyframeId === kf.id}
            onSelect={selectKeyframe}
          />
        ))}
      </div>
    </div>
  );
}

export { ANIMATABLE_PROPERTIES };
