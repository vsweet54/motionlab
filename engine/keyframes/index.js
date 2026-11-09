import { interpolateValue } from "@/engine/interpolation";

export const ANIMATABLE_PROPERTIES = [
  { id: "x", label: "Position X", unit: "px", defaultValue: 960, min: -2000, max: 4000, step: 1 },
  { id: "y", label: "Position Y", unit: "px", defaultValue: 540, min: -2000, max: 4000, step: 1 },
  { id: "scaleX", label: "Scale X", unit: "", defaultValue: 1, min: 0, max: 10, step: 0.05 },
  { id: "scaleY", label: "Scale Y", unit: "", defaultValue: 1, min: 0, max: 10, step: 0.05 },
  { id: "rotation", label: "Rotation", unit: "°", defaultValue: 0, min: -720, max: 720, step: 1 },
  { id: "opacity", label: "Opacity", unit: "", defaultValue: 1, min: 0, max: 1, step: 0.05 },
  { id: "width", label: "Width", unit: "px", defaultValue: 300, min: 10, max: 3840, step: 1 },
  { id: "height", label: "Height", unit: "px", defaultValue: 200, min: 10, max: 2160, step: 1 },
  { id: "fill", label: "Fill Color", unit: "", defaultValue: "#6366f1", type: "color" },
  { id: "blur", label: "Blur Radius", unit: "px", defaultValue: 0, min: 0, max: 50, step: 1 },
];

/**
 * Creates a unique keyframe object.
 */
export function createKeyframe({
  objectId,
  property,
  time,
  value,
  easing = "easeInOut",
  id = null,
}) {
  return {
    id: id || `kf_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    objectId,
    property,
    time: Number(Number(time).toFixed(2)),
    value,
    easing,
  };
}

/**
 * Evaluates the value of a property at time t given a list of keyframes.
 * Falls back to layerDefaultValue if no keyframes exist.
 */
export function evaluatePropertyAtTime(keyframes, time, layerDefaultValue) {
  if (!keyframes || keyframes.length === 0) {
    return layerDefaultValue;
  }

  // Sort keyframes by time
  const sorted = [...keyframes].sort((a, b) => a.time - b.time);

  // Before first keyframe
  if (time <= sorted[0].time) {
    return sorted[0].value;
  }

  // After last keyframe
  if (time >= sorted[sorted.length - 1].time) {
    return sorted[sorted.length - 1].value;
  }

  // Find surrounding segment
  for (let i = 0; i < sorted.length - 1; i++) {
    const kfStart = sorted[i];
    const kfEnd = sorted[i + 1];

    if (time >= kfStart.time && time <= kfEnd.time) {
      const span = kfEnd.time - kfStart.time;
      if (span <= 0) return kfStart.value;

      const progress = (time - kfStart.time) / span;
      return interpolateValue(
        kfStart.property,
        kfStart.value,
        kfEnd.value,
        progress,
        kfEnd.easing || "linear"
      );
    }
  }

  return layerDefaultValue;
}

/**
 * Evaluates an entire layer's animated properties at time t.
 */
export function evaluateLayerAtTime(layer, layerKeyframes = [], time = 0) {
  if (!layer) return layer;
  if (!layerKeyframes || layerKeyframes.length === 0) return layer;

  // Group keyframes by property
  const keyframesByProp = {};
  for (const kf of layerKeyframes) {
    if (!keyframesByProp[kf.property]) {
      keyframesByProp[kf.property] = [];
    }
    keyframesByProp[kf.property].push(kf);
  }

  const result = { ...layer };

  // Evaluate each animated property
  for (const [prop, kfs] of Object.entries(keyframesByProp)) {
    const fallback = layer[prop] ?? (prop === "scaleX" || prop === "scaleY" || prop === "opacity" ? 1 : 0);
    result[prop] = evaluatePropertyAtTime(kfs, time, fallback);
  }

  return result;
}
