"use client";

import React from "react";
import TimelineTrackHeader from "./TimelineTrackHeader";
import TimelineClip from "./TimelineClip";
import TimelinePropertyLane, { ANIMATABLE_PROPERTIES } from "./TimelinePropertyLane";
import { useAnimationStore } from "@/store/useAnimationStore";

export default function TimelineTrack({
  layer,
  isSelected,
  onSelectLayer,
  timelineWidth = 1000,
}) {
  const {
    duration,
    timelineZoom,
    expandedTrackIds,
    toggleTrackExpanded,
    seek,
  } = useAnimationStore();

  const isExpanded = expandedTrackIds.includes(layer.id);

  const handleTrackLaneClick = (e) => {
    // If clicked on track background (not clip), seek to time
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newTime = Math.max(0, Math.min(duration, clickX / timelineZoom));
    seek(newTime);
  };

  return (
    <div className="flex flex-col border-b border-surface-border/60">
      {/* Primary Track Row */}
      <div className="flex items-center h-11 text-xs select-none">
        {/* Left Track Header */}
        <div className="w-44 sm:w-56 h-full shrink-0">
          <TimelineTrackHeader
            layer={layer}
            isSelected={isSelected}
            isExpanded={isExpanded}
            onToggleExpand={() => toggleTrackExpanded(layer.id)}
            onSelect={onSelectLayer}
          />
        </div>

        {/* Right Track Lane (Clips & Keyframes) */}
        <div
          onClick={handleTrackLaneClick}
          style={{ width: `${timelineWidth}px` }}
          className="timeline-track-content relative h-full bg-[#0a0a0f] overflow-hidden shrink-0"
        >
          {/* Subtle track center guideline */}
          <div className="absolute top-1/2 left-0 right-0 h-px bg-surface-border/40 -translate-y-1/2 pointer-events-none" />

          {/* Draggable & Trimmable Clip */}
          <TimelineClip
            layer={layer}
            timelineZoom={timelineZoom}
            isSelected={isSelected}
            onSelect={onSelectLayer}
          />
        </div>
      </div>

      {/* Expanded Sub-lanes for Individual Properties */}
      {isExpanded && (
        <div className="flex flex-col bg-surface-200/20">
          {ANIMATABLE_PROPERTIES.map((prop) => (
            <TimelinePropertyLane
              key={prop.key}
              layer={layer}
              property={prop}
              timelineZoom={timelineZoom}
            />
          ))}
        </div>
      )}
    </div>
  );
}
