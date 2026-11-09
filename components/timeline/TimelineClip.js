"use client";

import React, { useRef, useState } from "react";
import { useAnimationStore } from "@/store/useAnimationStore";
import { useEditorStore } from "@/store/useEditorStore";
import KeyframeDiamond from "./KeyframeDiamond";
import WaveformCanvas from "@/components/audio/WaveformCanvas";

const TYPE_COLORS = {
  text: "bg-indigo-600/30 border-indigo-500/60 text-indigo-300",
  rect: "bg-brand-600/30 border-brand-500/60 text-brand-300",
  circle: "bg-purple-600/30 border-purple-500/60 text-purple-300",
  ellipse: "bg-cyan-600/30 border-cyan-500/60 text-cyan-300",
  star: "bg-amber-600/30 border-amber-500/60 text-amber-300",
  polygon: "bg-emerald-600/30 border-emerald-500/60 text-emerald-300",
  line: "bg-sky-600/30 border-sky-500/60 text-sky-300",
  image: "bg-pink-600/30 border-pink-500/60 text-pink-300",
  svg: "bg-rose-600/30 border-rose-500/60 text-rose-300",
  audio: "bg-emerald-700/40 border-emerald-500/70 text-emerald-300",
  video: "bg-purple-700/40 border-purple-500/70 text-purple-300",
  effect: "bg-purple-700/40 border-purple-500/70 text-purple-300",
  group: "bg-blue-600/30 border-blue-500/60 text-blue-300",
};

export default function TimelineClip({
  layer,
  timelineZoom = 80,
  isSelected,
  onSelect,
}) {
  const {
    moveClip,
    trimClipStart,
    trimClipEnd,
  } = useEditorStore();

  const {
    duration: projectDuration,
    keyframes,
    selectedKeyframeId,
    selectKeyframe,
    currentTime,
    isSnapToFrame,
    snapTime,
    openContextMenu,
    setEditingClipId,
  } = useAnimationStore();

  const [isInteracting, setIsInteracting] = useState(false);
  const longPressTimerRef = useRef(null);

  const startTime = Number(layer.startTime ?? 0);
  const clipDuration = Number(layer.duration ?? projectDuration);

  const leftPx = startTime * timelineZoom;
  const widthPx = Math.max(28, clipDuration * timelineZoom);

  const colorClass = TYPE_COLORS[layer.type] || TYPE_COLORS.rect;
  const layerKeyframes = keyframes.filter((k) => k.objectId === layer.id);

  // Handle Dragging Clip Body
  const handleBodyPointerDown = (e) => {
    // Only drag with primary mouse button or touch
    if (e.button !== 0 && e.button !== undefined) return;
    e.stopPropagation();

    onSelect(layer.id);

    // Setup long press for mobile touch
    longPressTimerRef.current = setTimeout(() => {
      openContextMenu({
        x: e.clientX ?? 100,
        y: e.clientY ?? 200,
        type: "clip",
        targetId: layer.id,
        clickTime: currentTime,
      });
    }, 550);

    const startClientX = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
    const initialStartTime = startTime;
    let hasMoved = false;

    const handlePointerMove = (moveEvent) => {
      const clientX = moveEvent.clientX ?? moveEvent.touches?.[0]?.clientX;
      if (clientX === undefined) return;

      const deltaX = clientX - startClientX;
      if (Math.abs(deltaX) > 4) {
        if (longPressTimerRef.current) {
          clearTimeout(longPressTimerRef.current);
          longPressTimerRef.current = null;
        }
        hasMoved = true;
        setIsInteracting(true);
      }

      if (!hasMoved) return;

      const deltaSec = deltaX / timelineZoom;
      const rawNewStart = Math.max(0, initialStartTime + deltaSec);

      // Magnetic snap to playhead or frame
      let targetStart = rawNewStart;
      if (Math.abs(rawNewStart - currentTime) < 0.15) {
        targetStart = currentTime;
      } else if (isSnapToFrame) {
        targetStart = snapTime(rawNewStart);
      }

      moveClip(layer.id, targetStart);
    };

    const handlePointerUp = () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
      setIsInteracting(false);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  };

  // Handle Trim Start (Left Handle)
  const handleTrimStartPointerDown = (e) => {
    e.stopPropagation();
    setIsInteracting(true);

    const startClientX = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
    const initialStartTime = startTime;

    const handlePointerMove = (moveEvent) => {
      const clientX = moveEvent.clientX ?? moveEvent.touches?.[0]?.clientX;
      if (clientX === undefined) return;

      const deltaX = clientX - startClientX;
      const deltaSec = deltaX / timelineZoom;
      const rawNewStart = initialStartTime + deltaSec;
      const targetStart = isSnapToFrame ? snapTime(rawNewStart) : rawNewStart;

      trimClipStart(layer.id, targetStart);
    };

    const handlePointerUp = () => {
      setIsInteracting(false);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  };

  // Handle Trim End (Right Handle)
  const handleTrimEndPointerDown = (e) => {
    e.stopPropagation();
    setIsInteracting(true);

    const startClientX = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
    const initialDuration = clipDuration;

    const handlePointerMove = (moveEvent) => {
      const clientX = moveEvent.clientX ?? moveEvent.touches?.[0]?.clientX;
      if (clientX === undefined) return;

      const deltaX = clientX - startClientX;
      const deltaSec = deltaX / timelineZoom;
      const rawNewDuration = Math.max(0.1, initialDuration + deltaSec);
      const targetDuration = isSnapToFrame ? snapTime(rawNewDuration) : rawNewDuration;

      trimClipEnd(layer.id, targetDuration);
    };

    const handlePointerUp = () => {
      setIsInteracting(false);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  };

  // Right Click Context Menu (Desktop)
  const handleContextMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    openContextMenu({
      x: e.clientX,
      y: e.clientY,
      type: "clip",
      targetId: layer.id,
      clickTime: currentTime,
    });
  };

  return (
    <div
      style={{
        left: `${leftPx}px`,
        width: `${widthPx}px`,
      }}
      onPointerDown={handleBodyPointerDown}
      onContextMenu={handleContextMenu}
      onDoubleClick={(e) => {
        e.stopPropagation();
        setEditingClipId(layer.id);
      }}
      className={`absolute top-1 bottom-1 rounded-xl border flex items-center justify-between z-10 cursor-grab active:cursor-grabbing select-none transition-shadow ${colorClass} ${
        isSelected
          ? "ring-2 ring-brand-400 border-white shadow-glow"
          : "hover:border-zinc-400/80"
      } ${isInteracting ? "opacity-90 shadow-2xl" : ""}`}
    >
      {/* Left Trim Handle - min 44px touch hitbox */}
      <div
        onPointerDown={handleTrimStartPointerDown}
        className="absolute -left-2 top-0 bottom-0 w-6 flex items-center justify-center cursor-ew-resize z-20 group/left touch-none"
        title="Drag to trim start"
      >
        <div className="w-1.5 h-6 rounded-full bg-white/40 group-hover/left:bg-white transition-colors" />
      </div>

      {/* Audio Waveform Canvas */}
      {layer.type === "audio" && (
        <div className="absolute inset-0 px-2 py-1 pointer-events-none overflow-hidden opacity-75">
          <WaveformCanvas
            audioUrl={layer.url || layer.audioUrl}
            duration={clipDuration}
            waveformPeaks={layer.waveform}
            currentTime={currentTime - startTime}
            width={widthPx - 16}
            height={32}
            color="#34d399"
            progressColor="#10b981"
          />
        </div>
      )}

      {/* Clip Content & Label */}
      <div className="flex-1 px-3.5 flex items-center gap-2 overflow-hidden pointer-events-none z-10">
        <span className="text-[11px] font-semibold truncate text-zinc-100">
          {layer.name}
        </span>
        <span className="text-[9px] font-mono text-zinc-300/80 shrink-0">
          {clipDuration.toFixed(2)}s
        </span>
      </div>

      {/* Embedded Keyframes */}
      {layerKeyframes.map((kf) => (
        <KeyframeDiamond
          key={kf.id}
          keyframe={kf}
          timelineZoom={timelineZoom}
          isSelected={selectedKeyframeId === kf.id}
          onSelect={selectKeyframe}
        />
      ))}

      {/* Right Trim Handle - min 44px touch hitbox */}
      <div
        onPointerDown={handleTrimEndPointerDown}
        className="absolute -right-2 top-0 bottom-0 w-6 flex items-center justify-center cursor-ew-resize z-20 group/right touch-none"
        title="Drag to trim end"
      >
        <div className="w-1.5 h-6 rounded-full bg-white/40 group-hover/right:bg-white transition-colors" />
      </div>
    </div>
  );
}
