"use client";

import React, { useRef, useState, useEffect } from "react";
import TimelineHeader from "./TimelineHeader";
import TimelineRuler from "./TimelineRuler";
import TimelineTrack from "./TimelineTrack";
import TimelineContextMenu from "./TimelineContextMenu";
import ClipPropertiesSheet from "./ClipPropertiesSheet";
import { useAnimationStore } from "@/store/useAnimationStore";
import { useEditorStore } from "@/store/useEditorStore";
import {
  Film,
  Plus,
  ChevronUp,
  Play,
  Pause,
  GripHorizontal,
  Type,
  Square,
  Volume2,
  Sparkles,
  Folder,
} from "lucide-react";

export default function TimelinePanel() {
  const {
    duration,
    currentTime,
    isPlaying,
    play,
    pause,
    timelineZoom,
    setTimelineZoom,
    timelineHeight,
    setTimelineHeight,
    isTimelineCollapsed,
    setTimelineCollapsed,
  } = useAnimationStore();

  const {
    layers,
    selectedLayerIds,
    selectLayer,
    addLayer,
  } = useEditorStore();

  const [isAddTrackOpen, setIsAddTrackOpen] = useState(false);
  const scrollContainerRef = useRef(null);
  const pinchStartDistRef = useRef(null);
  const initialZoomRef = useRef(timelineZoom);

  // Synchronized Timeline Width
  const [containerWidth, setContainerWidth] = useState(1000);

  useEffect(() => {
    const updateWidth = () => {
      if (scrollContainerRef.current) {
        setContainerWidth(scrollContainerRef.current.clientWidth);
      }
    };
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  const totalContentWidth = Math.max(containerWidth, duration * timelineZoom);

  // Desktop Resizable Panel Drag
  const handleResizePointerDown = (e) => {
    e.preventDefault();
    const startY = e.clientY;
    const initialHeight = timelineHeight;

    const handlePointerMove = (moveEvent) => {
      const deltaY = startY - moveEvent.clientY;
      const newHeight = Math.max(160, Math.min(550, initialHeight + deltaY));
      setTimelineHeight(newHeight);
    };

    const handlePointerUp = () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  };

  // Mobile Pinch-to-Zoom Gesture Handlers
  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const dist = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      pinchStartDistRef.current = dist;
      initialZoomRef.current = timelineZoom;
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 2 && pinchStartDistRef.current) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const dist = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      const scale = dist / pinchStartDistRef.current;
      const newZoom = Math.max(30, Math.min(400, Math.round(initialZoomRef.current * scale)));
      setTimelineZoom(newZoom);
    }
  };

  const handleTouchEnd = () => {
    pinchStartDistRef.current = null;
  };

  // If collapsed (especially on mobile screen), show a sleek mini control bar
  if (isTimelineCollapsed) {
    return (
      <div className="w-full h-12 bg-surface-200 border-t border-surface-border px-3 sm:px-4 flex items-center justify-between text-xs select-none">
        <div className="flex items-center gap-2.5">
          <button
            onClick={isPlaying ? pause : play}
            className="w-8 h-8 rounded-xl bg-brand-600 hover:bg-brand-500 text-white flex items-center justify-center transition-transform active:scale-95 shadow-glow"
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause className="w-3.5 h-3.5 fill-white" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-white ml-0.5" />
            )}
          </button>
          <span className="font-mono text-zinc-300 font-semibold text-xs">
            {currentTime.toFixed(2)}s / {duration.toFixed(2)}s
          </span>
        </div>

        <button
          onClick={() => setTimelineCollapsed(false)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-100 hover:bg-surface-border border border-surface-border text-zinc-300 hover:text-white transition-colors"
        >
          <span>Open Multi-Track Timeline</span>
          <ChevronUp className="w-3.5 h-3.5 text-brand-400" />
        </button>
      </div>
    );
  }

  return (
    <div
      style={{ height: `${timelineHeight}px` }}
      className="relative w-full bg-surface-200 border-t border-surface-border flex flex-col select-none overflow-hidden transition-all duration-100 shrink-0"
    >
      {/* Top Resize Drag Handle for Desktop */}
      <div
        onPointerDown={handleResizePointerDown}
        className="hidden md:flex absolute top-0 left-0 right-0 h-2 -translate-y-1 cursor-ns-resize z-40 items-center justify-center group"
        title="Drag to resize timeline height"
      >
        <div className="w-12 h-1 rounded-full bg-zinc-600 group-hover:bg-brand-400 transition-colors" />
      </div>

      {/* Top Transport & Tool Controls Header */}
      <TimelineHeader />

      {/* Main Multi-Track Body */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Synchronized Header & Ruler Row */}
        <div className="flex h-8 border-b border-surface-border shrink-0 bg-surface-200">
          {/* Left Column Track Title + Add Track button */}
          <div className="w-44 sm:w-56 border-r border-surface-border px-3 flex items-center justify-between text-[11px] font-semibold text-zinc-400 uppercase tracking-wider shrink-0 relative">
            <span>Tracks ({layers.length})</span>

            <div className="relative">
              <button
                onClick={() => setIsAddTrackOpen(!isAddTrackOpen)}
                className="p-1 rounded text-zinc-400 hover:text-white hover:bg-surface-100 flex items-center gap-1 transition-colors"
                title="Add new track"
              >
                <Plus className="w-3.5 h-3.5 text-brand-400" />
              </button>

              {/* Add Track Menu */}
              {isAddTrackOpen && (
                <div
                  onClick={() => setIsAddTrackOpen(false)}
                  className="absolute left-0 sm:right-0 top-full mt-1 w-44 bg-surface-100 border border-surface-border rounded-xl shadow-2xl p-1 z-50 text-xs font-normal normal-case text-zinc-200 space-y-0.5"
                >
                  <button
                    onClick={() => addLayer("text")}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-surface-border text-left"
                  >
                    <Type className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Text Track</span>
                  </button>
                  <button
                    onClick={() => addLayer("rect")}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-surface-border text-left"
                  >
                    <Square className="w-3.5 h-3.5 text-brand-400" />
                    <span>Shape Track</span>
                  </button>
                  <button
                    onClick={() => addLayer("audio")}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-surface-border text-left"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Audio Track</span>
                  </button>
                  <button
                    onClick={() => addLayer("effect")}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-surface-border text-left"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    <span>Effect Track</span>
                  </button>
                  <button
                    onClick={() => addLayer("group")}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-surface-border text-left"
                  >
                    <Folder className="w-3.5 h-3.5 text-blue-400" />
                    <span>Group Track</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Column Timeline Ruler Container */}
          <div
            ref={scrollContainerRef}
            className="flex-1 relative overflow-x-auto overflow-y-hidden bg-surface-100 scrollbar-none"
            onScroll={(e) => {
              const tracksEl = document.querySelector("#timeline-tracks-scroll-container");
              if (tracksEl && tracksEl.scrollLeft !== e.currentTarget.scrollLeft) {
                tracksEl.scrollLeft = e.currentTarget.scrollLeft;
              }
            }}
          >
            <TimelineRuler duration={duration} timelineWidth={totalContentWidth} />
          </div>
        </div>

        {/* Scrollable Tracks List with Touch Pinch Gesture Support */}
        <div
          id="timeline-tracks-scroll-container"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onScroll={(e) => {
            if (
              scrollContainerRef.current &&
              scrollContainerRef.current.scrollLeft !== e.currentTarget.scrollLeft
            ) {
              scrollContainerRef.current.scrollLeft = e.currentTarget.scrollLeft;
            }
          }}
          className="flex-1 overflow-auto bg-[#0a0a0f] relative"
        >
          {layers.length === 0 ? (
            <div className="h-full min-h-[140px] flex flex-col items-center justify-center p-6 text-center text-zinc-500 space-y-2">
              <Film className="w-6 h-6 opacity-40 text-brand-400" />
              <p className="text-xs">No active tracks in project</p>
              <button
                onClick={() => addLayer("text")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-100 hover:bg-surface-border text-zinc-300 text-xs border border-surface-border"
              >
                <Plus className="w-3.5 h-3.5 text-brand-400" />
                <span>Create First Track</span>
              </button>
            </div>
          ) : (
            layers.map((layer) => (
              <TimelineTrack
                key={layer.id}
                layer={layer}
                timelineWidth={totalContentWidth}
                isSelected={selectedLayerIds.includes(layer.id)}
                onSelectLayer={(id) => selectLayer(id, false)}
              />
            ))
          )}

          {/* Red Playhead Vertical Guide Line over all tracks */}
          <div
            style={{
              left: `calc(${currentTime * timelineZoom}px + ${
                typeof window !== "undefined" && window.innerWidth < 640 ? "176px" : "224px"
              })`,
            }}
            className="absolute top-0 bottom-0 w-px bg-red-500/80 pointer-events-none z-30 -translate-x-1/2"
          />
        </div>
      </div>

      {/* Floating Context Menu */}
      <TimelineContextMenu />

      {/* Mobile/Desktop Clip Properties Sheet */}
      <ClipPropertiesSheet />
    </div>
  );
}
