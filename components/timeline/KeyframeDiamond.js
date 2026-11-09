"use client";

import React, { useRef } from "react";
import { useAnimationStore } from "@/store/useAnimationStore";

export default function KeyframeDiamond({
  keyframe,
  timelineZoom = 80,
  isSelected,
  onSelect,
}) {
  const {
    updateKeyframe,
    seek,
    selectedKeyframeIds,
    moveKeyframes,
    isSnapToFrame,
    snapTime,
    duration,
  } = useAnimationStore();

  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const startTimeRef = useRef(keyframe.time);

  // Position in pixels
  const leftPx = keyframe.time * timelineZoom;

  const handlePointerDown = (e) => {
    e.stopPropagation();
    const isMulti = e.shiftKey || e.ctrlKey || e.metaKey;
    onSelect(keyframe.id, isMulti);
    seek(keyframe.time);

    isDraggingRef.current = true;
    startXRef.current = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
    startTimeRef.current = keyframe.time;

    const handlePointerMove = (moveEvent) => {
      if (!isDraggingRef.current) return;
      const clientX = moveEvent.clientX ?? moveEvent.touches?.[0]?.clientX;
      if (clientX === undefined) return;

      const deltaPx = clientX - startXRef.current;
      const rawDeltaSec = deltaPx / timelineZoom;

      const isMultiDrag =
        selectedKeyframeIds &&
        selectedKeyframeIds.length > 1 &&
        selectedKeyframeIds.includes(keyframe.id);

      if (isMultiDrag) {
        moveKeyframes(selectedKeyframeIds, rawDeltaSec);
        startXRef.current = clientX;
      } else {
        const rawNewTime = Math.max(0, Math.min(duration, startTimeRef.current + rawDeltaSec));
        const finalTime = isSnapToFrame ? snapTime(rawNewTime) : Number(rawNewTime.toFixed(3));
        updateKeyframe(keyframe.id, { time: finalTime });
        seek(finalTime);
      }
    };

    const handlePointerUp = () => {
      isDraggingRef.current = false;
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  };

  return (
    <div
      style={{ left: `${leftPx}px` }}
      onPointerDown={handlePointerDown}
      className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-20 flex items-center justify-center cursor-grab active:cursor-grabbing group min-w-[44px] min-h-[44px] touch-none"
      title={`${keyframe.property}: ${keyframe.value} @ ${keyframe.time}s (${keyframe.easing})`}
    >
      {/* Visual Diamond */}
      <div
        className={`w-3.5 h-3.5 rotate-45 transition-transform duration-100 border shadow-sm ${
          isSelected
            ? "bg-amber-400 border-white scale-125 shadow-glow z-30"
            : "bg-brand-500 hover:bg-brand-400 border-brand-300 group-hover:scale-110"
        }`}
      />
    </div>
  );
}
