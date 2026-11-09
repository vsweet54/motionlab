"use client";

import React, { useRef, useEffect, useState } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  Maximize2,
  Minimize2,
  Clock,
  Monitor,
  Sparkles,
} from "lucide-react";
import { renderFrameAtTime, preloadProjectImages } from "@/engine/export/frameRenderer";

/**
 * Interactive Live Animation Canvas for Template Preview
 * Uses the deterministic frame renderer to execute 60 FPS GSAP animations smoothly.
 */
export default function TemplateAnimatedPreview({ template, isFullscreen = false }) {
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const startTimeRef = useRef(null);
  const isPausedRef = useRef(false);

  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);

  const duration = Number(template.duration || 5.0);
  const width = Number(template.width || 1920);
  const height = Number(template.height || 1080);

  useEffect(() => {
    isPausedRef.current = !isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    let isMounted = true;

    // Preload template assets
    preloadProjectImages(template.layers || []).then(() => {
      if (!isMounted) return;

      const animate = (timestamp) => {
        if (!startTimeRef.current) {
          startTimeRef.current = timestamp;
        }

        if (!isPausedRef.current) {
          const elapsedSec = (timestamp - startTimeRef.current) / 1000;
          const currentLoopTime = elapsedSec % duration;
          setCurrentTime(currentLoopTime);

          renderFrameAtTime({
            canvas,
            ctx,
            width: canvas.width,
            height: canvas.height,
            time: currentLoopTime,
            layers: template.layers || [],
            keyframes: template.keyframes || [],
            backgroundColor: template.project?.backgroundColor || "#09090b",
            isTransparent: false,
            baseWidth: width,
            baseHeight: height,
          });
        }

        animFrameRef.current = requestAnimationFrame(animate);
      };

      animFrameRef.current = requestAnimationFrame(animate);
    });

    return () => {
      isMounted = false;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [template, duration, width, height]);

  const handleTogglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const handleRestart = () => {
    startTimeRef.current = performance.now();
    setCurrentTime(0);
    setIsPlaying(true);
  };

  return (
    <div className="relative w-full rounded-2xl overflow-hidden bg-black border border-surface-border group shadow-2xl flex flex-col items-center justify-center">
      {/* 16:9 or custom aspect ratio viewport */}
      <div
        className="w-full relative flex items-center justify-center bg-[#070709]"
        style={{
          aspectRatio: template.aspectRatio === "9:16" ? "9/16" : template.aspectRatio === "1:1" ? "1/1" : "16/9",
          maxHeight: isFullscreen ? "70vh" : "360px",
        }}
      >
        <canvas
          ref={canvasRef}
          width={854}
          height={480}
          className="w-full h-full object-contain"
        />

        {/* Ambient Overlay Controls (Appear on hover/touch) */}
        <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-center justify-between text-white z-10">
          <div className="flex items-center gap-2">
            <button
              onClick={handleTogglePlay}
              className="min-w-[36px] min-h-[36px] p-2 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md flex items-center justify-center transition-transform active:scale-95"
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            </button>
            <button
              onClick={handleRestart}
              className="min-w-[36px] min-h-[36px] p-2 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center transition-transform active:scale-95"
              title="Restart"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono text-zinc-300 ml-1">
              {currentTime.toFixed(1)}s / {duration}s
            </span>
          </div>

          <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-400">
            <span>{width}×{height}</span>
            <span>•</span>
            <span>{template.fps || 60} FPS</span>
          </div>
        </div>

        {/* Timeline Progress Line */}
        <div className="absolute bottom-0 inset-x-0 h-1 bg-white/20 z-20">
          <div
            className="h-full bg-brand-500 transition-all duration-75"
            style={{ width: `${(currentTime / duration) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
