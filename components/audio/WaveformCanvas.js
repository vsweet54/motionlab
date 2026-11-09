"use client";

import React, { useRef, useEffect } from "react";

/**
 * High-performance Canvas-based Audio Waveform Visualizer
 * Renders smooth bipolar waveform bars with zoom, responsive scaling, and playhead progress.
 */
export default function WaveformCanvas({
  waveform = [],
  width = 300,
  height = 48,
  progress = 0, // 0 to 1
  color = "#34d399",
  progressColor = "#10b981",
  backgroundColor = "transparent",
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Clear
    ctx.clearRect(0, 0, width, height);

    if (backgroundColor && backgroundColor !== "transparent") {
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, width, height);
    }

    const peaks = Array.isArray(waveform) && waveform.length > 0
      ? waveform
      : Array(40).fill(0.3);

    const centerY = height / 2;
    const barWidth = Math.max(1.5, Math.min(4, width / peaks.length - 1));
    const step = width / peaks.length;
    const progressX = width * Math.max(0, Math.min(1, progress));

    for (let i = 0; i < peaks.length; i++) {
      const x = i * step;
      const amplitude = Math.max(0.08, peaks[i]);
      const barHeight = amplitude * (height * 0.85);

      // Color based on playhead position
      ctx.fillStyle = x <= progressX ? progressColor : color;

      // Draw mirrored bar around center
      const y = centerY - barHeight / 2;
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barHeight, [2]);
      ctx.fill();
    }
  }, [waveform, width, height, progress, color, progressColor, backgroundColor]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: `${width}px`, height: `${height}px` }}
      className="pointer-events-none select-none block"
    />
  );
}
