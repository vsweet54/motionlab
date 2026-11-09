/**
 * Professional Project Diagnostics & Health Inspector for MotionLab
 * Detects missing assets, duplicate layers, invalid keyframes, performance bottlenecks,
 * and structural anomalies.
 */

import { detectBrowserCapabilities } from "../../lib/compatibility/browserCapabilities.js";

export function runProjectDiagnostics({
  project = {},
  layers = [],
  keyframes = [],
  audioTracks = [],
  deviceCapabilities = null,
}) {
  const issues = [];
  const warnings = [];
  const passed = [];

  const caps = deviceCapabilities || (typeof window !== "undefined" ? detectBrowserCapabilities() : null);

  const duration = Number(project?.duration || 5.0);
  const fps = Number(project?.fps || 60);
  const width = Number(project?.width || 1920);
  const height = Number(project?.height || 1080);

  // 1. Missing Asset Detector
  const assetLayers = layers.filter((l) => l.type === "image" || l.type === "audio");
  let missingAssetCount = 0;
  for (const layer of assetLayers) {
    if (!layer.src && !layer.assetId) {
      missingAssetCount++;
      issues.push({
        type: "missing_asset",
        severity: "error",
        layerId: layer.id,
        layerName: layer.name,
        message: `Layer "${layer.name}" is missing its source media reference.`,
        recommendation: "Re-link asset from Asset Vault or replace image.",
      });
    }
  }
  if (missingAssetCount === 0) {
    passed.push("All media assets are properly linked and referenced.");
  }

  // 2. Duplicate Layer Detector (identical bounds & geometry)
  const positionMap = new Map();
  let duplicateCount = 0;
  for (const l of layers) {
    const key = `${l.type}_${l.x}_${l.y}_${l.width}_${l.height}_${l.rotation}`;
    if (positionMap.has(key)) {
      duplicateCount++;
      const orig = positionMap.get(key);
      warnings.push({
        type: "duplicate_layer",
        severity: "warning",
        layerId: l.id,
        layerName: l.name,
        message: `Layer "${l.name}" has identical geometry and overlaps exactly with "${orig.name}".`,
        recommendation: "Delete or offset layer to prevent redundant rendering overhead.",
      });
    } else {
      positionMap.set(key, l);
    }
  }
  if (duplicateCount === 0) {
    passed.push("Zero duplicate/coinciding layers detected.");
  }

  // 3. Invalid Keyframe Detector
  let invalidKfCount = 0;
  let oobKfCount = 0;
  const kfTimelineMap = new Map();

  for (const kf of keyframes) {
    // Check NaN or undefined value
    if (kf.value === undefined || kf.value === null || (typeof kf.value === "number" && isNaN(kf.value))) {
      invalidKfCount++;
      issues.push({
        type: "invalid_keyframe",
        severity: "error",
        keyframeId: kf.id,
        property: kf.property,
        message: `Keyframe on "${kf.property}" has an invalid (NaN/null) value.`,
        recommendation: "Reset keyframe value in Animation Inspector.",
      });
    }

    // Check bounds against project duration
    if (kf.time < 0 || kf.time > duration + 0.05) {
      oobKfCount++;
      warnings.push({
        type: "out_of_bounds_keyframe",
        severity: "warning",
        keyframeId: kf.id,
        time: kf.time,
        message: `Keyframe at ${kf.time}s exceeds current project duration (${duration}s).`,
        recommendation: "Extend project duration or clamp keyframe within timeline bounds.",
      });
    }

    // Duplicate keyframes on the same property at the same timestamp
    const kfKey = `${kf.objectId}_${kf.property}_${Number(kf.time).toFixed(2)}`;
    if (kfTimelineMap.has(kfKey)) {
      warnings.push({
        type: "duplicate_timestamp_keyframe",
        severity: "warning",
        keyframeId: kf.id,
        property: kf.property,
        message: `Multiple conflicting keyframes on "${kf.property}" at time ${kf.time}s.`,
        recommendation: "Delete the redundant keyframe to ensure deterministic tweening.",
      });
    } else {
      kfTimelineMap.set(kfKey, kf);
    }
  }
  if (invalidKfCount === 0 && oobKfCount === 0) {
    passed.push("All keyframes are strictly valid and within project timeline boundaries.");
  }

  // 4. Performance & Memory Warnings
  let heavyEffectsCount = 0;
  for (const l of layers) {
    if (Array.isArray(l.effects)) {
      for (const eff of l.effects) {
        if (eff.type === "particles" || (eff.type === "gaussianBlur" && Number(eff.params?.radius || 0) > 30)) {
          heavyEffectsCount++;
        }
      }
    }
  }
  if (heavyEffectsCount > 2) {
    warnings.push({
      type: "performance_heavy_effects",
      severity: "warning",
      message: `Project contains ${heavyEffectsCount} compute-intensive effects (Particles / High Radius Blur).`,
      recommendation: "On mobile Android, high particle counts may reduce real-time playback FPS.",
    });
  }

  if (layers.length > 50) {
    warnings.push({
      type: "performance_layer_count",
      severity: "warning",
      message: `Layer count (${layers.length}) is unusually high.`,
      recommendation: "Group stationary objects or merge layers where possible.",
    });
  }

  if (width * height > 1920 * 1080) {
    warnings.push({
      type: "performance_resolution",
      severity: "info",
      message: `Project canvas is ${width}x${height} (> Full HD).`,
      recommendation: "Ensure devices have sufficient GPU RAM before 60 FPS rendering.",
    });
  }

  // 5. Device & Browser Capabilities Check
  if (caps && !caps.isServer) {
    if (caps.features.canvas2d) {
      passed.push("HTML5 2D Canvas Hardware Acceleration is supported.");
    }
    if (caps.features.indexedDB) {
      passed.push("IndexedDB local persistent storage is online.");
    } else {
      issues.push({
        type: "missing_storage",
        severity: "error",
        message: "IndexedDB is not supported or is blocked in this browser context.",
        recommendation: "Enable cookies/storage in browser settings or exit private browsing mode.",
      });
    }

    if (caps.features.mediaRecorder) {
      passed.push("Native MediaRecorder video encoding is available.");
    } else {
      warnings.push({
        type: "missing_media_recorder",
        severity: "warning",
        message: "MediaRecorder API is not available on this browser.",
        recommendation: "WebM direct video capture disabled; fallback to PNG sequence and GIF export.",
      });
    }

    if (caps.features.webAudio) {
      passed.push("Web Audio API audio processing pipeline is active.");
    }

    if (caps.features.serviceWorker) {
      passed.push("PWA Service Worker offline shell is supported.");
    }
  }

  // 6. Structure & Metrics Summary
  const estimatedSizeBytes = JSON.stringify({ project, layers, keyframes }).length * 2;
  const stats = {
    totalLayers: layers.length,
    activeKeyframes: keyframes.length,
    audioTracks: audioTracks.length,
    durationSeconds: duration,
    fps,
    resolution: `${width}x${height}`,
    aspectRatio: `${(width / (height || 1)).toFixed(2)}:1`,
    estimatedSizeKb: (estimatedSizeBytes / 1024).toFixed(1),
    deviceScore: caps ? caps.score : 100,
    healthScore: Math.max(0, 100 - issues.length * 20 - warnings.length * 5),
  };

  return {
    healthScore: stats.healthScore,
    status: issues.length > 0 ? "error" : warnings.length > 0 ? "warning" : "healthy",
    issues,
    warnings,
    passed,
    stats,
  };
}

/**
 * Formats diagnostic inspection results into exportable text / markdown
 */
export function formatDiagnosticReport(diagnostics, projectName = "Untitled") {
  const d = diagnostics;
  const dateStr = new Date().toLocaleString();

  let report = `# MotionLab Project Diagnostic Report\n`;
  report += `**Project:** ${projectName}\n`;
  report += `**Generated:** ${dateStr}\n`;
  report += `**Health Score:** ${d.healthScore}/100 (${d.status.toUpperCase()})\n\n`;

  report += `## Summary Metrics\n`;
  report += `- **Resolution:** ${d.stats.resolution} (${d.stats.aspectRatio})\n`;
  report += `- **Duration & FPS:** ${d.stats.durationSeconds}s @ ${d.stats.fps} FPS\n`;
  report += `- **Layers:** ${d.stats.totalLayers}\n`;
  report += `- **Keyframes:** ${d.stats.activeKeyframes}\n`;
  report += `- **Estimated JSON Payload:** ${d.stats.estimatedSizeKb} KB\n\n`;

  report += `## Issues (${d.issues.length})\n`;
  if (d.issues.length === 0) {
    report += `*No critical issues found.*\n\n`;
  } else {
    d.issues.forEach((iss, i) => {
      report += `${i + 1}. **[${iss.severity.toUpperCase()}]** ${iss.message}\n   - Fix: ${iss.recommendation}\n`;
    });
    report += `\n`;
  }

  report += `## Warnings & Optimization Suggestions (${d.warnings.length})\n`;
  if (d.warnings.length === 0) {
    report += `*No performance warnings.*\n\n`;
  } else {
    d.warnings.forEach((w, i) => {
      report += `${i + 1}. **[${w.severity.toUpperCase()}]** ${w.message}\n   - Recommendation: ${w.recommendation}\n`;
    });
    report += `\n`;
  }

  report += `## Health Checks Passed (${d.passed.length})\n`;
  d.passed.forEach((p) => {
    report += `- ✓ ${p}\n`;
  });

  return report;
}
