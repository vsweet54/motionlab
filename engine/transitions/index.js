import { getEasingProgress } from "@/engine/interpolation";
import { TRANSITION_TYPES } from "./definitions";

export * from "./definitions";

/**
 * Evaluates transitions (In & Out) on a layer at the current playhead timestamp.
 * Returns the modified layer properties and any active clip/mask parameters.
 */
export function evaluateLayerTransitions(layer, currentTime = 0) {
  if (!layer) return layer;

  const startTime = Number(layer.startTime ?? 0);
  const duration = Number(layer.duration ?? 5.0);
  const endTime = startTime + duration;

  // Base properties to modify
  let opacity = layer.opacity ?? 1;
  let x = layer.x ?? 0;
  let y = layer.y ?? 0;
  let scaleX = layer.scaleX ?? 1;
  let scaleY = layer.scaleY ?? 1;
  let rotation = layer.rotation ?? 0;
  let clipRect = null;
  let circularClip = null;
  let sweepProgress = null;
  let transitionBlur = 0;
  let transitionGlitch = 0;

  const w = layer.width || 300;
  const h = layer.height || 200;

  // 1. Transition IN
  const tIn = layer.transitionIn;
  if (tIn && tIn.type && tIn.duration > 0) {
    const inDur = Math.min(duration / 2, Number(tIn.duration));
    if (currentTime >= startTime && currentTime < startTime + inDur) {
      const rawProg = Math.max(0, Math.min(1, (currentTime - startTime) / inDur));
      const p = getEasingProgress(tIn.easing || "power2Out", rawProg);

      switch (tIn.type) {
        case "fade":
          opacity *= p;
          break;

        case "slide": {
          const dir = tIn.direction || "left";
          const dist = 500;
          if (dir === "left") x -= (1 - p) * dist;
          else if (dir === "right") x += (1 - p) * dist;
          else if (dir === "up") y -= (1 - p) * dist;
          else if (dir === "down") y += (1 - p) * dist;
          opacity *= Math.min(1, p * 1.5);
          break;
        }

        case "zoom":
          scaleX *= p;
          scaleY *= p;
          opacity *= Math.min(1, p * 1.5);
          break;

        case "spin":
          rotation += (1 - p) * 360;
          scaleX *= p;
          scaleY *= p;
          opacity *= p;
          break;

        case "morph":
          scaleX *= 0.2 + 0.8 * p;
          scaleY *= 1.8 - 0.8 * p;
          opacity *= Math.min(1, p * 2);
          break;

        case "blur":
          transitionBlur = (1 - p) * 24;
          opacity *= Math.min(1, p * 1.3);
          break;

        case "glitch":
          transitionGlitch = (1 - p) * 16;
          opacity *= 0.4 + 0.6 * p;
          break;

        case "wipe": {
          const dir = tIn.direction || "left";
          if (dir === "left") {
            clipRect = { x: 0, y: 0, width: w * p, height: h };
          } else {
            clipRect = { x: w * (1 - p), y: 0, width: w * p, height: h };
          }
          break;
        }

        case "circular_reveal": {
          const maxR = Math.hypot(w, h) / 1.5;
          circularClip = { x: w / 2, y: h / 2, radius: maxR * p };
          break;
        }

        case "light_sweep":
          sweepProgress = p;
          break;

        default:
          break;
      }
    }
  }

  // 2. Transition OUT
  const tOut = layer.transitionOut;
  if (tOut && tOut.type && tOut.duration > 0) {
    const outDur = Math.min(duration / 2, Number(tOut.duration));
    if (currentTime >= endTime - outDur && currentTime <= endTime) {
      const rawProg = Math.max(0, Math.min(1, (endTime - currentTime) / outDur));
      const p = getEasingProgress(tOut.easing || "power2In", rawProg);

      switch (tOut.type) {
        case "fade":
          opacity *= p;
          break;

        case "slide": {
          const dir = tOut.direction || "right";
          const dist = 500;
          if (dir === "left") x -= (1 - p) * dist;
          else if (dir === "right") x += (1 - p) * dist;
          else if (dir === "up") y -= (1 - p) * dist;
          else if (dir === "down") y += (1 - p) * dist;
          opacity *= Math.min(1, p * 1.5);
          break;
        }

        case "zoom":
          scaleX *= p;
          scaleY *= p;
          opacity *= p;
          break;

        case "spin":
          rotation -= (1 - p) * 360;
          scaleX *= p;
          scaleY *= p;
          opacity *= p;
          break;

        case "blur":
          transitionBlur = Math.max(transitionBlur, (1 - p) * 24);
          opacity *= p;
          break;

        case "glitch":
          transitionGlitch = Math.max(transitionGlitch, (1 - p) * 16);
          break;

        case "wipe": {
          clipRect = { x: 0, y: 0, width: w * p, height: h };
          break;
        }

        case "circular_reveal": {
          const maxR = Math.hypot(w, h) / 1.5;
          circularClip = { x: w / 2, y: h / 2, radius: maxR * p };
          break;
        }

        default:
          break;
      }
    }
  }

  return {
    ...layer,
    opacity: Math.max(0, Math.min(1, opacity)),
    x,
    y,
    scaleX,
    scaleY,
    rotation,
    clipRect,
    circularClip,
    sweepProgress,
    transitionBlur,
    transitionGlitch,
  };
}
