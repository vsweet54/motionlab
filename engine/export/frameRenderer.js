/**
 * Deterministic Frame Renderer for MotionLab
 * Accurately renders every frame of a project at exact timestamps (t) onto an offscreen canvas.
 * Evaluates layers, keyframes, transitions, and visual effects (filters, glow, particles, shadows).
 */

import { evaluateLayerAtTime } from "@/engine/keyframes";
import { evaluateLayerTransitions } from "@/engine/transitions";
import { evaluateLayerEffects } from "@/engine/effects";

// In-memory cache for loaded HTMLImageElement instances to avoid reloading per frame
const imageBitmapCache = new Map();

/**
 * Preloads all image/svg assets used in layers so frame-by-frame rendering never waits on I/O.
 */
export async function preloadProjectImages(layers) {
  const promises = [];
  for (const layer of layers) {
    if ((layer.type === "image" || layer.type === "svg") && (layer.src || layer.url)) {
      const src = layer.src || layer.url;
      if (!imageBitmapCache.has(src)) {
        promises.push(
          new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => {
              imageBitmapCache.set(src, img);
              resolve();
            };
            img.onerror = () => {
              console.warn("Failed to preload image for export:", src);
              resolve();
            };
            img.src = src;
          })
        );
      }
    }
  }
  await Promise.all(promises);
}

/**
 * Renders a single frame deterministically at timestamp `time` onto the provided canvas.
 * @param {object} options
 * @param {HTMLCanvasElement} options.canvas - Target canvas element
 * @param {CanvasRenderingContext2D} options.ctx - 2D rendering context
 * @param {number} options.width - Target render width
 * @param {number} options.height - Target render height
 * @param {number} options.time - Timestamp in seconds
 * @param {Array} options.layers - Project layers
 * @param {Array} options.keyframes - Project keyframes
 * @param {string} options.backgroundColor - Canvas background color (or transparent)
 * @param {boolean} options.isTransparent - Whether background should remain transparent
 */
export function renderFrameAtTime({
  canvas,
  ctx,
  width,
  height,
  time,
  layers,
  keyframes,
  backgroundColor = "#09090b",
  isTransparent = false,
  baseWidth = 1920,
  baseHeight = 1080,
}) {
  if (!ctx) return;

  // Scale factor between base project canvas and export resolution
  const scaleX = width / baseWidth;
  const scaleY = height / baseHeight;

  // 1. Clear Canvas
  ctx.clearRect(0, 0, width, height);

  // 2. Draw Background
  if (!isTransparent && backgroundColor && backgroundColor !== "transparent") {
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);
  }

  // 3. Filter layers that are within current playback time
  const visibleLayers = layers
    .filter((l) => l.visible !== false && l.type !== "audio")
    .filter((layer) => {
      const start = Number(layer.startTime ?? 0);
      const dur = Number(layer.duration ?? 999999);
      return time >= start - 0.001 && time <= start + dur + 0.001;
    });

  // 4. Render each layer in z-order
  for (const rawLayer of visibleLayers) {
    // A. Evaluate Keyframes
    const layerKfs = keyframes?.filter((k) => k.objectId === rawLayer.id) || [];
    const withKeyframes =
      layerKfs.length > 0
        ? evaluateLayerAtTime(rawLayer, layerKfs, time)
        : rawLayer;

    // B. Evaluate Transitions
    const withTransitions = evaluateLayerTransitions(withKeyframes, time);

    // C. Evaluate Visual Effects Stack
    const {
      evaluatedLayer,
      particles,
      lightLeak,
      customFilterFn,
    } = evaluateLayerEffects(withTransitions, time);

    drawLayerToContext({
      ctx,
      layer: evaluatedLayer,
      scaleX,
      scaleY,
      time,
      particles,
      lightLeak,
      customFilterFn,
    });
  }
}

/**
 * Draws an individual evaluated layer onto the 2D canvas context.
 */
function drawLayerToContext({
  ctx,
  layer,
  scaleX,
  scaleY,
  time,
  particles,
  lightLeak,
}) {
  ctx.save();

  // Position and Dimensions
  const posX = (layer.x ?? 0) * scaleX;
  const posY = (layer.y ?? 0) * scaleY;
  const width = (layer.width ?? 100) * scaleX * (layer.scaleX ?? 1);
  const height = (layer.height ?? 100) * scaleY * (layer.scaleY ?? 1);
  const rotationDeg = Number(layer.rotation ?? 0);
  const opacity = Math.max(0, Math.min(1, Number(layer.opacity ?? 1)));

  ctx.globalAlpha = opacity;

  // Transform coordinates: translate to center of layer for rotation
  ctx.translate(posX + width / 2, posY + height / 2);
  if (rotationDeg !== 0) {
    ctx.rotate((rotationDeg * Math.PI) / 180);
  }
  ctx.translate(-width / 2, -height / 2);

  // Apply Shadow / Glow effects
  if (layer.shadowColor) {
    ctx.shadowColor = layer.shadowColor;
    ctx.shadowBlur = (layer.shadowBlur || 0) * ((scaleX + scaleY) / 2);
    ctx.shadowOffsetX = (layer.shadowOffset?.x || 0) * scaleX;
    ctx.shadowOffsetY = (layer.shadowOffset?.y || 0) * scaleY;
  }

  // Draw Specific Shape Types
  switch (layer.type) {
    case "rect": {
      const radius = (layer.cornerRadius || 0) * Math.min(scaleX, scaleY);
      ctx.beginPath();
      if (ctx.roundRect && radius > 0) {
        ctx.roundRect(0, 0, width, height, radius);
      } else {
        ctx.rect(0, 0, width, height);
      }

      if (layer.fill && layer.fill !== "transparent") {
        ctx.fillStyle = layer.fill;
        ctx.fill();
      }
      if (layer.stroke && layer.strokeWidth) {
        ctx.strokeStyle = layer.stroke;
        ctx.lineWidth = layer.strokeWidth * scaleX;
        ctx.stroke();
      }
      break;
    }

    case "circle": {
      const radius = Math.min(width, height) / 2;
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, radius, 0, Math.PI * 2);

      if (layer.fill && layer.fill !== "transparent") {
        ctx.fillStyle = layer.fill;
        ctx.fill();
      }
      if (layer.stroke && layer.strokeWidth) {
        ctx.strokeStyle = layer.stroke;
        ctx.lineWidth = layer.strokeWidth * scaleX;
        ctx.stroke();
      }
      break;
    }

    case "ellipse": {
      ctx.beginPath();
      ctx.ellipse(width / 2, height / 2, width / 2, height / 2, 0, 0, Math.PI * 2);

      if (layer.fill && layer.fill !== "transparent") {
        ctx.fillStyle = layer.fill;
        ctx.fill();
      }
      if (layer.stroke && layer.strokeWidth) {
        ctx.strokeStyle = layer.stroke;
        ctx.lineWidth = layer.strokeWidth * scaleX;
        ctx.stroke();
      }
      break;
    }

    case "text": {
      const fontSize = (layer.fontSize || 36) * Math.min(scaleX, scaleY);
      const fontFamily = layer.fontFamily || "Inter, sans-serif";
      const fontStyle = layer.fontStyle || "normal";
      ctx.font = `${fontStyle} ${fontSize}px ${fontFamily}`;
      ctx.fillStyle = layer.fill || "#ffffff";
      ctx.textAlign = layer.align || "left";
      ctx.textBaseline = "top";

      const textX = layer.align === "center" ? width / 2 : layer.align === "right" ? width : 0;
      ctx.fillText(layer.text || "", textX, 0);

      if (layer.stroke && layer.strokeWidth) {
        ctx.strokeStyle = layer.stroke;
        ctx.lineWidth = layer.strokeWidth * scaleX;
        ctx.strokeText(layer.text || "", textX, 0);
      }
      break;
    }

    case "image":
    case "svg": {
      const src = layer.src || layer.url;
      const cached = imageBitmapCache.get(src);
      if (cached && cached.complete && cached.naturalWidth > 0) {
        ctx.drawImage(cached, 0, 0, width, height);
      } else {
        // Fallback placeholder box
        ctx.fillStyle = "rgba(236, 72, 153, 0.2)";
        ctx.fillRect(0, 0, width, height);
      }
      break;
    }

    default: {
      // Default bounding rect
      if (layer.fill) {
        ctx.fillStyle = layer.fill;
        ctx.fillRect(0, 0, width, height);
      }
      break;
    }
  }

  // Draw floating particles if active
  if (Array.isArray(particles) && particles.length > 0) {
    for (const p of particles) {
      const px = (p.x * scaleX) % width;
      const py = (p.y * scaleY) % height;
      const pr = (p.radius || 2) * scaleX;
      ctx.beginPath();
      ctx.arc(px, py, pr, 0, Math.PI * 2);
      ctx.fillStyle = p.color || "#ffffff";
      ctx.globalAlpha = opacity * (p.alpha || 0.6);
      ctx.fill();
    }
  }

  // Draw light leak gradient if active
  if (lightLeak) {
    const grad = ctx.createRadialGradient(
      width * 0.2,
      0,
      10,
      width * 0.2,
      0,
      width * 0.8
    );
    grad.addColorStop(0, lightLeak.color || "rgba(251, 146, 60, 0.6)");
    grad.addColorStop(1, "rgba(251, 146, 60, 0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
  }

  ctx.restore();
}
