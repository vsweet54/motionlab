"use client";

import React, { useRef } from "react";
import { useAnimationStore } from "@/store/useAnimationStore";

export default function TimelineRuler({ duration = 5, timelineWidth = 1000 }) {
  const {
    currentTime,
    seek,
    timelineZoom = 80,
    fps = 60,
    isSnapToFrame,
    snapTime,
    beatMarkers = [],
    showBeatMarkers = true,
  } = useAnimationStore();

  const rulerRef = useRef(null);
  const isScrubbingRef = useRef(false);

  const playheadPx = currentTime * timelineZoom;

  const handlePointerDown = (e) => {
    isScrubbingRef.current = true;
    const ruler = rulerRef.current;
    if (!ruler) return;

    const updateTimeFromPointer = (clientX) => {
      const rect = ruler.getBoundingClientRect();
      const clickX = clientX - rect.left;
      const rawTime = Math.max(0, Math.min(duration, clickX / timelineZoom));
      const targetTime = isSnapToFrame ? snapTime(rawTime) : Number(rawTime.toFixed(3));
      seek(targetTime);
    };

    updateTimeFromPointer(e.clientX);

    const handlePointerMove = (moveEvent) => {
      if (!isScrubbingRef.current) return;
      const clientX = moveEvent.clientX ?? moveEvent.touches?.[0]?.clientX;
      if (clientX !== undefined) {
        updateTimeFromPointer(clientX);
      }
    };

    const handlePointerUp = () => {
      isScrubbingRef.current = false;
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  };

  // Generate ticks
  const totalSeconds = Math.ceil(duration);
  const majorTicks = [];
  const subTicks = [];

  for (let s = 0; s <= totalSeconds; s++) {
    majorTicks.push(s);
    // Add sub-ticks (half-second or quarter-second depending on zoom)
    if (timelineZoom >= 80 && s < totalSeconds) {
      subTicks.push(s + 0.5);
    }
    if (timelineZoom >= 160 && s < totalSeconds) {
      subTicks.push(s + 0.25);
      subTicks.push(s + 0.75);
    }
  }

  return (
    <div
      ref={rulerRef}
      onPointerDown={handlePointerDown}
      style={{ width: `${timelineWidth}px` }}
      className="relative h-8 bg-surface-200 border-b border-surface-border cursor-pointer select-none overflow-hidden touch-none shrink-0"
    >
      {/* Background Subtle Frame Gridlines */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Sub-ticks */}
        {subTicks.map((t) => {
          const leftPx = t * timelineZoom;
          if (leftPx > timelineWidth) return null;
          return (
            <div
              key={`sub_${t}`}
              style={{ left: `${leftPx}px` }}
              className="absolute bottom-0 w-px h-2 bg-zinc-700/80 -translate-x-1/2"
            />
          );
        })}

        {/* Major second ticks */}
        {majorTicks.map((sec) => {
          const leftPx = sec * timelineZoom;
          if (leftPx > timelineWidth) return null;

          return (
            <div
              key={sec}
              style={{ left: `${leftPx}px` }}
              className="absolute top-0 bottom-0 -translate-x-1/2 flex flex-col items-center"
            >
              <span className="text-[10px] font-mono font-medium text-zinc-400 mt-0.5 select-none pl-1">
                {sec}s
              </span>
              <div className="w-px h-3 bg-zinc-500 mt-auto" />
            </div>
          );
        })}

        {/* Audio Beat Markers */}
        {showBeatMarkers &&
          beatMarkers.map((bTime, idx) => {
            const leftPx = bTime * timelineZoom;
            if (leftPx > timelineWidth) return null;
            return (
              <div
                key={`beat_${idx}_${bTime}`}
                style={{ left: `${leftPx}px` }}
                className="absolute top-0 bottom-0 w-0.5 bg-amber-400/70 -translate-x-1/2 flex flex-col items-center pointer-events-none z-10"
                title={`Beat @ ${bTime}s`}
              >
                <div className="w-1.5 h-1.5 bg-amber-400 rotate-45 mt-0.5 rounded-xs shadow-xs" />
              </div>
            );
          })}
      </div>

      {/* Red Playhead Line and Pointer */}
      <div
        style={{ left: `${playheadPx}px` }}
        className="absolute top-0 bottom-0 -translate-x-1/2 pointer-events-none z-30 flex flex-col items-center"
      >
        <div className="w-3.5 h-3.5 bg-red-500 rotate-45 -translate-y-1.5 rounded-sm shadow-md" />
        <div className="w-0.5 flex-1 bg-red-500 shadow-sm" />
      </div>
    </div>
  );
}
