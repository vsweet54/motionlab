/**
 * Professional Interpolation & Easing Curves for MotionLab Engine
 */

export const EASING_FUNCTIONS = {
  // Linear
  linear: (t) => t,

  // Quad / Power1
  easeIn: (t) => t * t,
  easeOut: (t) => t * (2 - t),
  easeInOut: (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
  power1In: (t) => t * t,
  power1Out: (t) => t * (2 - t),
  power1InOut: (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),

  // Cubic / Power2
  power2In: (t) => t * t * t,
  power2Out: (t) => --t * t * t + 1,
  power2InOut: (t) =>
    t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,

  // Quart / Power3
  power3In: (t) => t * t * t * t,
  power3Out: (t) => 1 - --t * t * t * t,
  power3InOut: (t) => (t < 0.5 ? 8 * t * t * t * t : 1 - 8 * --t * t * t * t),

  // Back (Overshoot / Anticipate)
  backIn: (t) => {
    const s = 1.70158;
    return t * t * ((s + 1) * t - s);
  },
  backOut: (t) => {
    const s = 1.70158;
    return --t * t * ((s + 1) * t + s) + 1;
  },
  backInOut: (t) => {
    let s = 1.70158 * 1.525;
    if ((t *= 2) < 1) return 0.5 * (t * t * ((s + 1) * t - s));
    return 0.5 * ((t -= 2) * t * ((s + 1) * t + s) + 2);
  },

  // Bounce
  bounceOut: (t) => {
    if (t < 1 / 2.75) {
      return 7.5625 * t * t;
    } else if (t < 2 / 2.75) {
      return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
    } else if (t < 2.5 / 2.75) {
      return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
    } else {
      return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
    }
  },
  bounceIn: (t) => 1 - EASING_FUNCTIONS.bounceOut(1 - t),
  bounceInOut: (t) =>
    t < 0.5
      ? EASING_FUNCTIONS.bounceIn(t * 2) * 0.5
      : EASING_FUNCTIONS.bounceOut(t * 2 - 1) * 0.5 + 0.5,

  // Elastic
  elasticOut: (t) => {
    if (t === 0 || t === 1) return t;
    const p = 0.3;
    const s = p / 4;
    return Math.pow(2, -10 * t) * Math.sin(((t - s) * (2 * Math.PI)) / p) + 1;
  },
  elasticIn: (t) => {
    if (t === 0 || t === 1) return t;
    const p = 0.3;
    const s = p / 4;
    return -(
      Math.pow(2, 10 * (t -= 1)) * Math.sin(((t - s) * (2 * Math.PI)) / p)
    );
  },
  elasticInOut: (t) => {
    if (t === 0 || t === 1) return t;
    const p = 0.45;
    const s = p / 4;
    t *= 2;
    if (t < 1) {
      return (
        -0.5 *
        (Math.pow(2, 10 * (t -= 1)) * Math.sin(((t - s) * (2 * Math.PI)) / p))
      );
    }
    return (
      Math.pow(2, -10 * (t -= 1)) *
        Math.sin(((t - s) * (2 * Math.PI)) / p) *
        0.5 +
      1
    );
  },
};

import { evaluateCubicBezier } from "@/engine/advanced/bezierCurve";

/**
 * Returns easing progress for given normalized progress t (0 to 1) and easing name or bezier definition.
 */
export function getEasingProgress(t, easing = "linear") {
  const clampedT = Math.max(0, Math.min(1, t));

  // If easing is an array of 4 bezier control points [x1, y1, x2, y2]
  if (Array.isArray(easing) && easing.length >= 4) {
    return evaluateCubicBezier(easing[0], easing[1], easing[2], easing[3], clampedT);
  }

  // If easing is a CSS string like "cubic-bezier(0.25, 0.1, 0.25, 1.0)"
  if (typeof easing === "string" && easing.startsWith("cubic-bezier")) {
    const match = easing.match(/cubic-bezier\s*\(\s*([\d.-]+)\s*,\s*([\d.-]+)\s*,\s*([\d.-]+)\s*,\s*([\d.-]+)\s*\)/);
    if (match) {
      return evaluateCubicBezier(Number(match[1]), Number(match[2]), Number(match[3]), Number(match[4]), clampedT);
    }
  }

  const fn = EASING_FUNCTIONS[easing] || EASING_FUNCTIONS.linear;
  return fn(clampedT);
}

/**
 * Linear number interpolation
 */
export function lerpNumber(start, end, progress) {
  return start + (end - start) * progress;
}

/**
 * Parses hex color into RGB object
 */
export function hexToRgb(hex) {
  if (!hex || typeof hex !== "string" || hex === "transparent") {
    return { r: 0, g: 0, b: 0, a: 0 };
  }
  let cleaned = hex.replace("#", "");
  if (cleaned.length === 3) {
    cleaned = cleaned
      .split("")
      .map((c) => c + c)
      .join("");
  }
  const num = parseInt(cleaned, 16);
  if (isNaN(num)) return { r: 0, g: 0, b: 0, a: 1 };
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
    a: 1,
  };
}

/**
 * Smoothly interpolates between two hex colors.
 */
export function lerpColor(startHex, endHex, progress) {
  if (startHex === endHex) return startHex;
  const c1 = hexToRgb(startHex);
  const c2 = hexToRgb(endHex);

  const r = Math.round(lerpNumber(c1.r, c2.r, progress));
  const g = Math.round(lerpNumber(c1.g, c2.g, progress));
  const b = Math.round(lerpNumber(c1.b, c2.b, progress));

  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

/**
 * Generic property value interpolator (supports numbers, colors, text typewriter).
 */
export function interpolateValue(prop, startVal, endVal, progress, easing = "linear") {
  const eased = getEasingProgress(progress, easing);

  if (prop === "fill" || prop === "stroke") {
    return lerpColor(String(startVal), String(endVal), eased);
  }

  if (prop === "text") {
    // Typewriter effect
    const fullText = String(endVal || "");
    const charCount = Math.round(lerpNumber(0, fullText.length, eased));
    return fullText.slice(0, charCount);
  }

  const nStart = Number(startVal ?? 0);
  const nEnd = Number(endVal ?? 0);
  return Number((nStart + (nEnd - nStart) * eased).toFixed(2));
}
