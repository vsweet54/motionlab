"use client";

import React, { useState } from "react";
import {
  X,
  Activity,
  Zap,
  Check,
  Music,
  Sparkles,
  Sliders,
  Eye,
  EyeOff,
  RefreshCw,
} from "lucide-react";
import { useAnimationStore } from "@/store/useAnimationStore";
import { useEditorStore } from "@/store/useEditorStore";
import { getDecodedAudioBuffer } from "@/engine/audio/audioContext";
import { analyzeAudioBeats } from "@/engine/audio/beatDetector";
import { generateAudioReactiveKeyframes } from "@/engine/audio/audioReactive";

const REACTIVE_PROPERTIES = [
  { id: "scale", label: "Scale Pulse", desc: "Layer scales up and bounces back on every beat" },
  { id: "opacity", label: "Opacity Flash", desc: "Flashes bright on beat and smoothly fades" },
  { id: "bounce", label: "Vertical Bounce", desc: "Jumps upward and lands back on beat" },
  { id: "rotation", label: "Bass Wobble", desc: "Rotates slightly left and right with tempo" },
];

export default function AudioSyncModal({ isOpen, onClose }) {
  const {
    duration,
    beatMarkers,
    setBeatMarkers,
    showBeatMarkers,
    toggleShowBeatMarkers,
    addMultipleKeyframes,
  } = useAnimationStore();

  const { layers } = useEditorStore();

  // Find all audio layers
  const audioLayers = layers.filter((l) => l.type === "audio");
  // Find all visual non-audio layers for animation target
  const visualLayers = layers.filter((l) => l.type !== "audio");

  const [selectedAudioId, setSelectedAudioId] = useState(
    audioLayers[0]?.id || ""
  );
  const [selectedVisualLayerId, setSelectedVisualLayerId] = useState(
    visualLayers[0]?.id || ""
  );
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [detectedBpm, setDetectedBpm] = useState(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [reactiveProperty, setReactiveProperty] = useState("scale");
  const [intensity, setIntensity] = useState(1.0);
  const [generatedCount, setGeneratedCount] = useState(0);

  if (!isOpen) return null;

  const handleAnalyzeBeats = async () => {
    const audioLayer = layers.find((l) => l.id === selectedAudioId);
    if (!audioLayer) {
      setStatusMessage("Please select a valid audio track to analyze.");
      return;
    }

    const audioUrl = audioLayer.url || audioLayer.audioUrl;
    if (!audioUrl) {
      setStatusMessage("Audio track has no valid audio URL/file.");
      return;
    }

    try {
      setIsAnalyzing(true);
      setStatusMessage("Decoding audio buffer and analyzing energy flux...");

      const buffer = await getDecodedAudioBuffer(audioUrl);
      if (!buffer) {
        setStatusMessage("Failed to decode audio. Please check file format.");
        setIsAnalyzing(false);
        return;
      }

      // Analyze beats & BPM
      const result = analyzeAudioBeats(buffer);
      const audioStart = Number(audioLayer.startTime || 0);

      // Offset beat timestamps by clip's startTime on timeline
      const timelineBeats = result.beats.map((b) => Number((b + audioStart).toFixed(3)));

      setBeatMarkers(timelineBeats);
      setDetectedBpm(result.bpm);
      setStatusMessage(
        `Analysis complete! Detected ${result.bpm} BPM with ${timelineBeats.length} beats.`
      );
    } catch (err) {
      console.error("Beat analysis failed:", err);
      setStatusMessage("Error analyzing audio: " + (err.message || "Unknown error"));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGenerateKeyframes = () => {
    if (!selectedVisualLayerId) {
      setStatusMessage("Please select a visual target layer to animate.");
      return;
    }

    if (!beatMarkers || beatMarkers.length === 0) {
      setStatusMessage("No beat markers available. Run Beat Analysis first.");
      return;
    }

    const targetLayer = layers.find((l) => l.id === selectedVisualLayerId);
    if (!targetLayer) return;

    const generated = generateAudioReactiveKeyframes({
      targetLayerId: targetLayer.id,
      beats: beatMarkers,
      property: reactiveProperty,
      intensity: Number(intensity),
      duration: duration || 5.0,
    });

    if (generated.length > 0) {
      addMultipleKeyframes(generated);
      setGeneratedCount(generated.length);
      setStatusMessage(
        `Generated ${generated.length} keyframes on "${targetLayer.name}" synced to beats!`
      );
    } else {
      setStatusMessage("No keyframes generated within the project timeline.");
    }
  };

  const handleClearBeats = () => {
    setBeatMarkers([]);
    setDetectedBpm(null);
    setStatusMessage("Beat markers cleared.");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-surface-200 border border-surface-border rounded-2xl p-5 shadow-2xl space-y-5 text-zinc-200 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-surface-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm">
                Beat Synchronization & Audio Reactivity
              </h3>
              <p className="text-[11px] text-zinc-400">
                Detect tempo & automate keyframe pulses from audio rhythms
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="min-w-[40px] min-h-[40px] p-2 text-zinc-400 hover:text-white rounded-xl flex items-center justify-center hover:bg-surface-border transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Section 1: Beat & Tempo Detection */}
        <div className="p-4 rounded-xl bg-surface-100 border border-surface-border space-y-3.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
              <Music className="w-3.5 h-3.5 text-amber-400" />
              1. Tempo & Beat Detection
            </span>
            {beatMarkers.length > 0 && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono font-medium border border-amber-500/30">
                {beatMarkers.length} Beats ({detectedBpm || "~"} BPM)
              </span>
            )}
          </div>

          {audioLayers.length === 0 ? (
            <div className="text-center py-3 text-xs text-zinc-500 bg-surface-200/50 rounded-xl border border-dashed border-zinc-700">
              No audio tracks found in this project. Add an audio file first.
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="text-[11px] text-zinc-400 block mb-1.5">
                  Select Source Audio Track
                </label>
                <select
                  value={selectedAudioId}
                  onChange={(e) => setSelectedAudioId(e.target.value)}
                  className="w-full bg-surface-200 border border-surface-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-medium"
                >
                  {audioLayers.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({Number(a.duration || 0).toFixed(1)}s)
                    </option>
                  ))}
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={handleAnalyzeBeats}
                  disabled={isAnalyzing}
                  className="flex-1 min-h-[44px] px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${isAnalyzing ? "animate-spin" : ""}`}
                  />
                  <span>{isAnalyzing ? "Analyzing Flux..." : "Analyze Beats & BPM"}</span>
                </button>

                {beatMarkers.length > 0 && (
                  <button
                    onClick={handleClearBeats}
                    className="min-h-[44px] px-3 py-2 rounded-xl bg-surface-200 hover:bg-surface-border border border-surface-border text-zinc-400 hover:text-red-400 text-xs transition-colors"
                    title="Clear Detected Beats"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Toggle Beat Markers on Timeline Ruler */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-zinc-400">
                  Show Beat Markers on Ruler
                </span>
                <button
                  onClick={toggleShowBeatMarkers}
                  className={`min-h-[36px] px-3 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                    showBeatMarkers
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                      : "bg-surface-200 text-zinc-500 border border-surface-border"
                  }`}
                >
                  {showBeatMarkers ? (
                    <>
                      <Eye className="w-3.5 h-3.5" />
                      <span>Visible</span>
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-3.5 h-3.5" />
                      <span>Hidden</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Section 2: Audio-Reactive Keyframe Generator */}
        <div className="p-4 rounded-xl bg-surface-100 border border-surface-border space-y-3.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-brand-400" />
              2. Audio-Reactive Keyframe Automation
            </span>
            <span className="text-[10px] text-zinc-500">Auto-Generates GSAP Keyframes</span>
          </div>

          {visualLayers.length === 0 ? (
            <div className="text-center py-3 text-xs text-zinc-500 bg-surface-200/50 rounded-xl border border-dashed border-zinc-700">
              No visual shapes, text, or image layers in project to animate.
            </div>
          ) : (
            <div className="space-y-3">
              {/* Target Layer Selector */}
              <div>
                <label className="text-[11px] text-zinc-400 block mb-1.5">
                  Target Layer to Animate
                </label>
                <select
                  value={selectedVisualLayerId}
                  onChange={(e) => setSelectedVisualLayerId(e.target.value)}
                  className="w-full bg-surface-200 border border-surface-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500 font-medium"
                >
                  {visualLayers.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name} ({l.type})
                    </option>
                  ))}
                </select>
              </div>

              {/* Reactive Motion Type */}
              <div>
                <label className="text-[11px] text-zinc-400 block mb-1.5">
                  Motion Style
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {REACTIVE_PROPERTIES.map((prop) => (
                    <button
                      key={prop.id}
                      onClick={() => setReactiveProperty(prop.id)}
                      className={`min-h-[44px] p-2.5 rounded-xl border text-left transition-all ${
                        reactiveProperty === prop.id
                          ? "bg-brand-600/25 border-brand-500 text-white shadow-sm ring-1 ring-brand-500/50"
                          : "bg-surface-200 border-surface-border text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      <div className="text-xs font-semibold">{prop.label}</div>
                      <div className="text-[10px] text-zinc-500 truncate mt-0.5">
                        {prop.desc}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Intensity Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-zinc-400">Reactive Intensity</span>
                  <span className="font-mono text-brand-300 font-bold">
                    {Number(intensity).toFixed(1)}x
                  </span>
                </div>
                <input
                  type="range"
                  min="0.4"
                  max="2.0"
                  step="0.1"
                  value={intensity}
                  onChange={(e) => setIntensity(Number(e.target.value))}
                  className="w-full accent-brand-500 cursor-pointer h-2 bg-surface-200 rounded-lg"
                />
              </div>

              {/* Generate Button */}
              <button
                onClick={handleGenerateKeyframes}
                disabled={beatMarkers.length === 0}
                className="w-full min-h-[44px] px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-glow transition-all"
              >
                <Zap className="w-4 h-4 text-brand-200" />
                <span>
                  {beatMarkers.length > 0
                    ? `Inject Keyframes Synced to ${beatMarkers.length} Beats`
                    : "Detect Beats First to Generate"}
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Status Feedback */}
        {statusMessage && (
          <div className="p-3 rounded-xl bg-surface-100 border border-surface-border text-xs text-zinc-300 flex items-start gap-2">
            <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Modal Footer */}
        <div className="flex items-center justify-end pt-2 border-t border-surface-border">
          <button
            onClick={onClose}
            className="min-h-[44px] px-5 py-2 rounded-xl bg-surface-100 hover:bg-surface-border border border-surface-border text-xs text-white font-semibold transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
