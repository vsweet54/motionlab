"use client";

import React, { useState } from "react";
import {
  Play,
  Pause,
  Square,
  RotateCcw,
  Repeat,
  Rewind,
  StepBack,
  StepForward,
  Scissors,
  Magnet,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Sliders,
  Activity,
  ArrowRightLeft,
} from "lucide-react";
import { useAnimationStore } from "@/store/useAnimationStore";
import { useEditorStore } from "@/store/useEditorStore";

const SPEEDS = [0.25, 0.5, 1.0, 1.5, 2.0];
const FPS_OPTIONS = [24, 30, 60];

export default function TimelineHeader() {
  const {
    isPlaying,
    currentTime,
    duration,
    fps,
    playbackSpeed,
    isLoop,
    isReverse,
    isPingPong,
    isSnapToFrame,
    play,
    pause,
    stop,
    restart,
    stepFrame,
    setPlaybackSpeed,
    toggleLoop,
    toggleReverse,
    togglePingPong,
    toggleSnapToFrame,
    setFps,
    setProjectDuration,
    zoomIn,
    zoomOut,
    fitTimelineToScreen,
    isTimelineCollapsed,
    setTimelineCollapsed,
    setIsInspectorOpen,
    isInspectorOpen,
    isMixerOpen,
    setIsMixerOpen,
    isAudioSyncOpen,
    setIsAudioSyncOpen,
  } = useAnimationStore();

  const {
    layers,
    selectedLayerIds,
    splitClip,
  } = useEditorStore();

  const [isEditingDuration, setIsEditingDuration] = useState(false);
  const [durationInput, setDurationInput] = useState(duration);

  const selectedLayerId = selectedLayerIds[0] || null;
  const selectedLayer = layers.find((l) => l.id === selectedLayerId);

  const canSplitSelected =
    selectedLayer &&
    currentTime > Number(selectedLayer.startTime ?? 0) + 0.05 &&
    currentTime <
      Number(selectedLayer.startTime ?? 0) +
        Number(selectedLayer.duration ?? duration) -
        0.05;

  // Format timecode: MM:SS:FF
  const formatTimecode = (time, currentFps) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    const frames = Math.floor((time % 1) * currentFps);
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}:${frames.toString().padStart(2, "0")}`;
  };

  const handleDurationSubmit = (e) => {
    e?.preventDefault();
    const parsed = Math.max(1, Math.min(60, Number(durationInput)));
    setProjectDuration(parsed);
    setIsEditingDuration(false);
  };

  return (
    <div className="h-12 bg-surface-200 border-b border-surface-border px-2 sm:px-4 flex items-center justify-between z-10 select-none overflow-x-auto">
      {/* Left: Transport Playback Controls (Min 44px touch targets!) */}
      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
        {/* Frame Step Backward */}
        <button
          onClick={() => stepFrame(-1)}
          className="min-w-[44px] min-h-[44px] p-2.5 rounded-xl bg-surface-100 hover:bg-surface-border text-zinc-300 hover:text-white border border-surface-border flex items-center justify-center transition-colors active:scale-95"
          title="Step Frame Backward (Left Arrow / J)"
        >
          <StepBack className="w-4 h-4" />
        </button>

        {/* Play / Pause Toggle Button */}
        <button
          onClick={isPlaying ? pause : play}
          className="min-w-[44px] min-h-[44px] px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white flex items-center justify-center gap-2 shadow-glow font-semibold text-xs transition-transform active:scale-95"
          title={isPlaying ? "Pause (Space / K)" : "Play (Space / K)"}
        >
          {isPlaying ? (
            <>
              <Pause className="w-4 h-4 fill-white" />
              <span className="hidden md:inline">Pause</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-white ml-0.5" />
              <span className="hidden md:inline">Play</span>
            </>
          )}
        </button>

        {/* Frame Step Forward */}
        <button
          onClick={() => stepFrame(1)}
          className="min-w-[44px] min-h-[44px] p-2.5 rounded-xl bg-surface-100 hover:bg-surface-border text-zinc-300 hover:text-white border border-surface-border flex items-center justify-center transition-colors active:scale-95"
          title="Step Frame Forward (Right Arrow / L)"
        >
          <StepForward className="w-4 h-4" />
        </button>

        {/* Stop Button */}
        <button
          onClick={stop}
          className="min-w-[44px] min-h-[44px] p-2.5 rounded-xl bg-surface-100 hover:bg-surface-border text-zinc-300 hover:text-white border border-surface-border flex items-center justify-center transition-colors active:scale-95"
          title="Stop & Reset to 0s"
        >
          <Square className="w-4 h-4 fill-current" />
        </button>

        {/* Restart Button */}
        <button
          onClick={restart}
          className="min-w-[44px] min-h-[44px] p-2.5 rounded-xl bg-surface-100 hover:bg-surface-border text-zinc-300 hover:text-white border border-surface-border flex items-center justify-center transition-colors active:scale-95"
          title="Restart from Beginning"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <div className="h-5 w-px bg-surface-border mx-0.5 hidden sm:block" />

        {/* Split Clip Button */}
        <button
          onClick={() => {
            if (canSplitSelected && selectedLayer) {
              splitClip(selectedLayer.id, currentTime);
            }
          }}
          disabled={!canSplitSelected}
          className={`min-w-[44px] min-h-[44px] p-2.5 rounded-xl border flex items-center justify-center transition-colors ${
            canSplitSelected
              ? "bg-brand-600/20 text-brand-300 border-brand-500/50 hover:bg-brand-600 hover:text-white"
              : "bg-surface-100 text-zinc-600 border-surface-border cursor-not-allowed"
          }`}
          title="Split Selected Clip at Playhead (S)"
        >
          <Scissors className="w-4 h-4" />
        </button>

        {/* Snap to Frame Toggle */}
        <button
          onClick={toggleSnapToFrame}
          className={`min-w-[44px] min-h-[44px] p-2.5 rounded-xl border flex items-center justify-center transition-colors ${
            isSnapToFrame
              ? "bg-brand-600/20 text-brand-400 border-brand-500/50 font-bold"
              : "bg-surface-100 text-zinc-500 hover:text-zinc-300 border-surface-border"
          }`}
          title={isSnapToFrame ? "Snap to Frame: ON" : "Snap to Frame: OFF"}
        >
          <Magnet className="w-4 h-4" />
        </button>

        {/* Loop Toggle */}
        <button
          onClick={toggleLoop}
          className={`min-w-[44px] min-h-[44px] p-2.5 rounded-xl border flex items-center justify-center transition-colors hidden sm:flex ${
            isLoop
              ? "bg-brand-600/20 text-brand-400 border-brand-500/50 font-bold"
              : "bg-surface-100 text-zinc-500 hover:text-zinc-300 border-surface-border"
          }`}
          title="Toggle Seamless Loop"
        >
          <Repeat className="w-4 h-4" />
        </button>

        {/* Reverse Play Toggle */}
        <button
          onClick={toggleReverse}
          className={`min-w-[44px] min-h-[44px] p-2.5 rounded-xl border flex items-center justify-center transition-colors hidden sm:flex ${
            isReverse
              ? "bg-purple-600/20 text-purple-400 border-purple-500/50 font-bold"
              : "bg-surface-100 text-zinc-500 hover:text-zinc-300 border-surface-border"
          }`}
          title="Toggle Reverse Playback"
        >
          <Rewind className="w-4 h-4" />
        </button>

        {/* Ping-Pong (Yoyo) Toggle */}
        <button
          onClick={togglePingPong}
          className={`min-w-[44px] min-h-[44px] p-2.5 rounded-xl border flex items-center justify-center transition-colors hidden sm:flex ${
            isPingPong
              ? "bg-amber-600/20 text-amber-400 border-amber-500/50 font-bold"
              : "bg-surface-100 text-zinc-500 hover:text-zinc-300 border-surface-border"
          }`}
          title="Toggle Ping-Pong (Yoyo) Playback"
        >
          <ArrowRightLeft className="w-4 h-4" />
        </button>

        {/* Speed Selector */}
        <div className="hidden lg:flex items-center rounded-xl bg-surface-100 border border-surface-border p-0.5">
          {SPEEDS.map((spd) => (
            <button
              key={spd}
              onClick={() => setPlaybackSpeed(spd)}
              className={`px-2 py-1 rounded-lg text-[10px] font-mono transition-colors ${
                playbackSpeed === spd
                  ? "bg-brand-600 text-white font-bold"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {spd}x
            </button>
          ))}
        </div>
      </div>

      {/* Right: Timecode readout, Zoom Controls & Panel Actions */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Timeline Zoom Controls */}
        <div className="flex items-center rounded-xl bg-surface-100 border border-surface-border p-0.5">
          <button
            onClick={zoomOut}
            className="min-w-[36px] min-h-[36px] p-2 text-zinc-400 hover:text-white rounded-lg flex items-center justify-center"
            title="Zoom Out Timeline"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              const el = document.querySelector("#timeline-tracks-scroll-container");
              if (el) fitTimelineToScreen(el.clientWidth);
            }}
            className="min-w-[36px] min-h-[36px] p-2 text-zinc-400 hover:text-white rounded-lg flex items-center justify-center"
            title="Fit Timeline to Screen"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={zoomIn}
            className="min-w-[36px] min-h-[36px] p-2 text-zinc-400 hover:text-white rounded-lg flex items-center justify-center"
            title="Zoom In Timeline"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* FPS Selector */}
        <div className="hidden md:flex items-center rounded-xl bg-surface-100 border border-surface-border p-0.5 text-[10px] font-mono">
          {FPS_OPTIONS.map((f) => (
            <button
              key={f}
              onClick={() => setFps(f)}
              className={`px-1.5 py-1 rounded-lg transition-colors ${
                fps === f
                  ? "bg-brand-600 text-white font-bold"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {f}fps
            </button>
          ))}
        </div>

        {/* Timecode & Duration readout */}
        <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-surface-100 border border-surface-border font-mono text-xs">
          <Clock className="w-3.5 h-3.5 text-brand-400 shrink-0" />
          <span className="text-white font-bold">
            {formatTimecode(currentTime, fps)}
          </span>
          <span className="text-zinc-500">/</span>

          {isEditingDuration ? (
            <form onSubmit={handleDurationSubmit}>
              <input
                type="number"
                autoFocus
                step="0.5"
                min="1"
                max="60"
                value={durationInput}
                onChange={(e) => setDurationInput(e.target.value)}
                onBlur={handleDurationSubmit}
                className="w-12 bg-surface-200 text-white text-xs px-1 py-0.5 rounded outline-none border border-brand-500 font-mono"
              />
            </form>
          ) : (
            <span
              onDoubleClick={() => setIsEditingDuration(true)}
              className="text-zinc-400 cursor-pointer hover:text-zinc-200"
              title="Double click to edit project duration"
            >
              {formatTimecode(duration, fps)}
            </span>
          )}
        </div>

        {/* Audio Mixer Toggle */}
        <button
          onClick={() => setIsMixerOpen(!isMixerOpen)}
          className={`min-w-[44px] min-h-[44px] px-2.5 py-2 rounded-xl border flex items-center gap-1.5 text-xs font-semibold transition-colors ${
            isMixerOpen
              ? "bg-emerald-600 text-white border-emerald-500 shadow-glow"
              : "bg-surface-100 hover:bg-surface-border text-zinc-300 border-surface-border"
          }`}
          title="Open Audio Mixer & Channel Strips"
        >
          <Sliders className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden xl:inline">Mixer</span>
        </button>

        {/* Audio Beat Sync Toggle */}
        <button
          onClick={() => setIsAudioSyncOpen(!isAudioSyncOpen)}
          className={`min-w-[44px] min-h-[44px] px-2.5 py-2 rounded-xl border flex items-center gap-1.5 text-xs font-semibold transition-colors ${
            isAudioSyncOpen
              ? "bg-amber-600 text-white border-amber-500 shadow-glow"
              : "bg-surface-100 hover:bg-surface-border text-zinc-300 border-surface-border"
          }`}
          title="Open Beat Sync & Audio-Reactive Generator"
        >
          <Activity className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden xl:inline">Beats</span>
        </button>

        {/* Open Animation Inspector */}
        <button
          onClick={() => {
            if (selectedLayerId) {
              useAnimationStore.getState().setActiveInspectorLayerId(selectedLayerId);
            } else {
              setIsInspectorOpen(!isInspectorOpen);
            }
          }}
          className={`min-w-[44px] min-h-[44px] px-3 py-2 rounded-xl border flex items-center gap-1.5 text-xs font-semibold transition-colors ${
            isInspectorOpen
              ? "bg-brand-600 text-white border-brand-500 shadow-glow"
              : "bg-surface-100 hover:bg-surface-border text-zinc-300 border-surface-border"
          }`}
          title="Open Animation & Keyframe Inspector"
        >
          <Sparkles className="w-3.5 h-3.5 text-brand-400" />
          <span className="hidden md:inline">Inspector</span>
        </button>

        {/* Collapse / Expand Timeline Toggle */}
        <button
          onClick={() => setTimelineCollapsed(!isTimelineCollapsed)}
          className="min-w-[44px] min-h-[44px] p-2.5 rounded-xl bg-surface-100 hover:bg-surface-border text-zinc-400 hover:text-white border border-surface-border flex items-center justify-center transition-colors"
          title={isTimelineCollapsed ? "Expand Timeline" : "Collapse Timeline"}
        >
          {isTimelineCollapsed ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
}
