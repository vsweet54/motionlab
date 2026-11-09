import { EFFECT_REGISTRY, createEffect } from "./definitions";
import {
  rgbSplitFilter,
  waveFilter,
  rippleFilter,
  digitalGlitchFilter,
  motionBlurFilter,
  noiseFilter,
  pixelateFilter,
  colorAdjustFilter,
} from "./filters";
import { generateParticles } from "./particles";

export * from "./definitions";
export * from "./filters";
export * from "./particles";

/**
 * Evaluates all effects attached to a layer at a given playhead timestamp.
 * Interpolates any effect-specific keyframes and calculates live properties.
 */
export function evaluateLayerEffects(layer, time = 0) {
  if (!layer || !layer.effects || !Array.isArray(layer.effects) || layer.effects.length === 0) {
    return {
      evaluatedLayer: layer,
      activeFilters: [],
      particles: [],
      lightLeak: null,
      customFilterFn: null,
    };
  }

  let finalOpacity = layer.opacity ?? 1;
  let shadowColor = layer.shadowColor || undefined;
  let shadowBlur = layer.shadowBlur || undefined;
  let shadowOffset = layer.shadowOffset || undefined;
  let shadowOpacity = layer.shadowOpacity || undefined;
  let stroke = layer.stroke;
  let strokeWidth = layer.strokeWidth;

  const activeEffects = layer.effects.filter((fx) => fx.enabled);
  const filterFns = [];
  let allParticles = [];
  let activeLightLeak = null;

  for (const fx of activeEffects) {
    const intensity = fx.intensity ?? 1.0;
    if (intensity <= 0) continue;

    const p = fx.params || {};

    switch (fx.type) {
      // 1. Glow
      case "glow": {
        shadowColor = p.color || "#38bdf8";
        shadowBlur = Math.round((p.radius || 25) * intensity);
        shadowOffset = { x: 0, y: 0 };
        shadowOpacity = Math.min(1, (p.opacity || 0.9) * intensity);
        break;
      }

      // 2. Neon
      case "neon": {
        shadowColor = p.color || "#ec4899";
        shadowBlur = Math.round((p.glowRadius || 30) * intensity);
        shadowOffset = { x: 0, y: 0 };
        shadowOpacity = 1.0;
        stroke = p.color || "#ec4899";
        strokeWidth = Math.max(2, strokeWidth || 2);
        break;
      }

      // 3. Drop Shadow
      case "dropShadow": {
        shadowColor = p.color || "#000000";
        shadowBlur = Math.round((p.blur || 16) * intensity);
        shadowOffset = {
          x: Math.round((p.offsetX || 10) * intensity),
          y: Math.round((p.offsetY || 12) * intensity),
        };
        shadowOpacity = Math.min(1, (p.opacity || 0.75) * intensity);
        break;
      }

      // 4. Strobe Flicker
      case "flicker": {
        const freq = p.frequency || 14;
        const minOp = p.minOpacity || 0.2;
        const maxOp = p.maxOpacity || 1.0;
        // Deterministic high speed flicker waveform
        const wave = 0.5 + 0.5 * Math.sin(time * freq * Math.PI * 2);
        const noise = (Math.sin(time * freq * 13.7) + 1) * 0.5;
        const factor = (wave * 0.7 + noise * 0.3);
        const flickeredOp = minOp + factor * (maxOp - minOp);
        finalOpacity = finalOpacity * (1 - intensity + flickeredOp * intensity);
        break;
      }

      // 5. Light Leak
      case "lightLeak": {
        activeLightLeak = {
          color: p.color || "#f97316",
          angle: p.angle || 45,
          opacity: Math.min(1, (p.opacity || 0.65) * intensity),
        };
        break;
      }

      // 6. Particles
      case "floatingParticles":
      case "spark":
      case "dust": {
        const count = Math.round((p.count || 20) * intensity);
        const bounds = { width: layer.width || 300, height: layer.height || 200 };
        const pts = generateParticles(
          fx.type === "spark" ? "spark" : fx.type === "dust" ? "dust" : "floating",
          count,
          bounds,
          time,
          p.color,
          p.speed,
          p.size
        );
        allParticles = [...allParticles, ...pts];
        break;
      }

      // 7. Pixel Filters (RGB Split, Wave, Ripple, Glitch, Blur, Motion Blur, Noise, Pixelate, Color)
      case "rgbSplit": {
        const off = Math.round((p.offset || 8) * intensity);
        const ang = p.angle || 0;
        filterFns.push((imgData) => rgbSplitFilter(imgData, off, ang));
        break;
      }

      case "wave": {
        const amp = (p.amplitude || 12) * intensity;
        const freq = p.frequency || 0.04;
        const spd = p.speed || 3.0;
        filterFns.push((imgData) => waveFilter(imgData, amp, freq, time, spd));
        break;
      }

      case "ripple": {
        const amp = (p.amplitude || 10) * intensity;
        const wl = p.wavelength || 24;
        const spd = p.speed || 2.5;
        filterFns.push((imgData) => rippleFilter(imgData, amp, wl, time, spd));
        break;
      }

      case "digitalGlitch": {
        const slices = p.slices || 8;
        const disp = Math.round((p.displacement || 18) * intensity);
        const spd = p.speed || 8.0;
        filterFns.push((imgData) => digitalGlitchFilter(imgData, slices, disp, time, spd));
        break;
      }

      case "motionBlur": {
        const dist = Math.round((p.distance || 16) * intensity);
        const ang = p.angle || 0;
        filterFns.push((imgData) => motionBlurFilter(imgData, dist, ang));
        break;
      }

      case "noise": {
        const amt = (p.noise || 0.25) * intensity;
        filterFns.push((imgData) => noiseFilter(imgData, amt));
        break;
      }

      case "pixelate": {
        const size = Math.max(2, Math.round((p.pixelSize || 8) * intensity));
        filterFns.push((imgData) => pixelateFilter(imgData, size));
        break;
      }

      case "colorAdjust": {
        const colorParams = {
          brightness: (p.brightness || 0) * intensity,
          contrast: (p.contrast || 0) * intensity,
          saturation: (p.saturation || 0) * intensity,
          hue: (p.hue || 0) * intensity,
          grayscale: (p.grayscale || 0) * intensity,
        };
        filterFns.push((imgData) => colorAdjustFilter(imgData, colorParams));
        break;
      }

      default:
        break;
    }
  }

  // Composite custom filter function
  let customFilterFn = null;
  if (filterFns.length > 0) {
    customFilterFn = function (imageData) {
      for (const fn of filterFns) {
        fn(imageData);
      }
    };
  }

  const evaluatedLayer = {
    ...layer,
    opacity: Math.max(0, Math.min(1, finalOpacity)),
    shadowColor,
    shadowBlur,
    shadowOffset,
    shadowOpacity,
    stroke,
    strokeWidth,
  };

  return {
    evaluatedLayer,
    particles: allParticles,
    lightLeak: activeLightLeak,
    customFilterFn,
    hasFilters: filterFns.length > 0,
  };
}
