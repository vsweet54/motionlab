/**
 * High-performance pure JavaScript pixel manipulation filter algorithms.
 * Direct processing of ImageData buffers for Konva cache & canvas rendering.
 */

/**
 * 1. RGB Split (Chromatic Aberration) Filter
 */
export function rgbSplitFilter(imageData, offset = 8, angle = 0) {
  if (offset <= 0) return;
  const { width, height, data } = imageData;
  const len = data.length;
  const copy = new Uint8ClampedArray(data);

  const rad = (angle * Math.PI) / 180;
  const offX = Math.round(Math.cos(rad) * offset);
  const offY = Math.round(Math.sin(rad) * offset);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;

      // Red channel shifted +offset
      const rx = Math.max(0, Math.min(width - 1, x + offX));
      const ry = Math.max(0, Math.min(height - 1, y + offY));
      const rIdx = (ry * width + rx) * 4;

      // Blue channel shifted -offset
      const bx = Math.max(0, Math.min(width - 1, x - offX));
      const by = Math.max(0, Math.min(height - 1, y - offY));
      const bIdx = (by * width + bx) * 4;

      data[idx] = copy[rIdx]; // Red from rIdx
      data[idx + 1] = copy[idx + 1]; // Green stays center
      data[idx + 2] = copy[bIdx + 2]; // Blue from bIdx
    }
  }
}

/**
 * 2. Sine Wave Warp Filter
 */
export function waveFilter(imageData, amplitude = 10, frequency = 0.04, time = 0, speed = 2.0) {
  if (amplitude <= 0) return;
  const { width, height, data } = imageData;
  const copy = new Uint8ClampedArray(data);
  const phase = time * speed;

  for (let y = 0; y < height; y++) {
    const shiftX = Math.round(Math.sin(y * frequency + phase) * amplitude);
    for (let x = 0; x < width; x++) {
      const srcX = Math.max(0, Math.min(width - 1, x + shiftX));
      const targetIdx = (y * width + x) * 4;
      const srcIdx = (y * width + srcX) * 4;

      data[targetIdx] = copy[srcIdx];
      data[targetIdx + 1] = copy[srcIdx + 1];
      data[targetIdx + 2] = copy[srcIdx + 2];
      data[targetIdx + 3] = copy[srcIdx + 3];
    }
  }
}

/**
 * 3. Water Ripple Filter
 */
export function rippleFilter(imageData, amplitude = 10, wavelength = 24, time = 0, speed = 2.5) {
  if (amplitude <= 0) return;
  const { width, height, data } = imageData;
  const copy = new Uint8ClampedArray(data);
  const centerX = width / 2;
  const centerY = height / 2;
  const phase = time * speed * 2;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dx = x - centerX;
      const dy = y - centerY;
      const distance = Math.hypot(dx, dy);

      if (distance > 0) {
        const factor = Math.sin(distance / wavelength - phase) * amplitude;
        const normX = dx / distance;
        const normY = dy / distance;

        const srcX = Math.max(0, Math.min(width - 1, Math.round(x + normX * factor)));
        const srcY = Math.max(0, Math.min(height - 1, Math.round(y + normY * factor)));

        const targetIdx = (y * width + x) * 4;
        const srcIdx = (srcY * width + srcX) * 4;

        data[targetIdx] = copy[srcIdx];
        data[targetIdx + 1] = copy[srcIdx + 1];
        data[targetIdx + 2] = copy[srcIdx + 2];
        data[targetIdx + 3] = copy[srcIdx + 3];
      }
    }
  }
}

/**
 * 4. Digital Glitch Slices Filter
 */
export function digitalGlitchFilter(imageData, slices = 8, displacement = 15, time = 0, speed = 8.0) {
  if (displacement <= 0) return;
  const { width, height, data } = imageData;
  const copy = new Uint8ClampedArray(data);

  // Deterministic seed based on floor(time * speed)
  const step = Math.floor(time * speed);
  const sliceHeight = Math.max(4, Math.floor(height / slices));

  for (let s = 0; s < slices; s++) {
    // Pseudo-random offset per slice
    const pseudoRand = Math.sin(step * 37.1 + s * 91.7);
    if (Math.abs(pseudoRand) < 0.35) continue; // Only glitch some slices

    const shift = Math.round(pseudoRand * displacement);
    const startY = s * sliceHeight;
    const endY = Math.min(height, startY + sliceHeight);

    for (let y = startY; y < endY; y++) {
      for (let x = 0; x < width; x++) {
        const srcX = Math.max(0, Math.min(width - 1, x + shift));
        const targetIdx = (y * width + x) * 4;
        const srcIdx = (y * width + srcX) * 4;

        data[targetIdx] = copy[srcIdx];
        data[targetIdx + 1] = copy[srcIdx + 1];
        data[targetIdx + 2] = copy[srcIdx + 2];
        data[targetIdx + 3] = copy[srcIdx + 3];
      }
    }
  }
}

/**
 * 5. Motion Blur (Linear directional blur)
 */
export function motionBlurFilter(imageData, distance = 16, angle = 0) {
  if (distance <= 1) return;
  const { width, height, data } = imageData;
  const copy = new Uint8ClampedArray(data);

  const rad = (angle * Math.PI) / 180;
  const stepX = Math.cos(rad);
  const stepY = Math.sin(rad);
  const samples = Math.max(3, Math.min(20, Math.round(distance / 2)));

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0, g = 0, b = 0, a = 0, count = 0;

      for (let s = -samples; s <= samples; s++) {
        const factor = (s / samples) * distance;
        const sx = Math.max(0, Math.min(width - 1, Math.round(x + stepX * factor)));
        const sy = Math.max(0, Math.min(height - 1, Math.round(y + stepY * factor)));
        const idx = (sy * width + sx) * 4;

        r += copy[idx];
        g += copy[idx + 1];
        b += copy[idx + 2];
        a += copy[idx + 3];
        count++;
      }

      const targetIdx = (y * width + x) * 4;
      data[targetIdx] = Math.round(r / count);
      data[targetIdx + 1] = Math.round(g / count);
      data[targetIdx + 2] = Math.round(b / count);
      data[targetIdx + 3] = Math.round(a / count);
    }
  }
}

/**
 * 6. Film Grain & Noise Filter
 */
export function noiseFilter(imageData, amount = 0.25) {
  if (amount <= 0) return;
  const { data } = imageData;
  const len = data.length;
  const range = amount * 128;

  for (let i = 0; i < len; i += 4) {
    if (data[i + 3] === 0) continue; // skip transparent pixels
    const noise = (Math.random() - 0.5) * range;
    data[i] = Math.max(0, Math.min(255, data[i] + noise));
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
  }
}

/**
 * 7. Retro Pixelate Filter
 */
export function pixelateFilter(imageData, pixelSize = 8) {
  const size = Math.max(1, Math.round(pixelSize));
  if (size <= 1) return;
  const { width, height, data } = imageData;

  for (let py = 0; py < height; py += size) {
    for (let px = 0; px < width; px += size) {
      const centerIdx = (py * width + px) * 4;
      const r = data[centerIdx];
      const g = data[centerIdx + 1];
      const b = data[centerIdx + 2];
      const a = data[centerIdx + 3];

      for (let y = py; y < Math.min(height, py + size); y++) {
        for (let x = px; x < Math.min(width, px + size); x++) {
          const idx = (y * width + x) * 4;
          data[idx] = r;
          data[idx + 1] = g;
          data[idx + 2] = b;
          data[idx + 3] = a;
        }
      }
    }
  }
}

/**
 * 8. Comprehensive Color Adjust Filter (Brightness, Contrast, Saturation, Hue, Grayscale)
 */
export function colorAdjustFilter(imageData, { brightness = 0, contrast = 0, saturation = 0, hue = 0, grayscale = 0 }) {
  const { data } = imageData;
  const len = data.length;

  const bAdj = (brightness / 100) * 128;
  const cFactor = (259 * (contrast + 255)) / (255 * (259 - contrast));
  const satFactor = 1 + saturation / 100;
  const grayFactor = grayscale / 100;
  const hueRad = (hue * Math.PI) / 180;
  const cosA = Math.cos(hueRad);
  const sinA = Math.sin(hueRad);

  for (let i = 0; i < len; i += 4) {
    if (data[i + 3] === 0) continue;

    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    // 1. Brightness
    if (bAdj !== 0) {
      r += bAdj;
      g += bAdj;
      b += bAdj;
    }

    // 2. Contrast
    if (contrast !== 0) {
      r = cFactor * (r - 128) + 128;
      g = cFactor * (g - 128) + 128;
      b = cFactor * (b - 128) + 128;
    }

    // 3. Hue Rotation
    if (hue !== 0) {
      const hr = (0.213 + cosA * 0.787 - sinA * 0.213) * r +
                 (0.715 - cosA * 0.715 - sinA * 0.715) * g +
                 (0.072 - cosA * 0.072 + sinA * 0.928) * b;
      const hg = (0.213 - cosA * 0.213 + sinA * 0.143) * r +
                 (0.715 + cosA * 0.285 + sinA * 0.140) * g +
                 (0.072 - cosA * 0.072 - sinA * 0.283) * b;
      const hb = (0.213 - cosA * 0.213 - sinA * 0.787) * r +
                 (0.715 - cosA * 0.715 + sinA * 0.715) * g +
                 (0.072 + cosA * 0.928 + sinA * 0.072) * b;
      r = hr;
      g = hg;
      b = hb;
    }

    // 4. Saturation & Grayscale
    const gray = 0.299 * r + 0.587 * g + 0.114 * b;

    if (saturation !== 0) {
      r = gray + satFactor * (r - gray);
      g = gray + satFactor * (g - gray);
      b = gray + satFactor * (b - gray);
    }

    if (grayFactor > 0) {
      r = r * (1 - grayFactor) + gray * grayFactor;
      g = g * (1 - grayFactor) + gray * grayFactor;
      b = b * (1 - grayFactor) + gray * grayFactor;
    }

    data[i] = Math.max(0, Math.min(255, Math.round(r)));
    data[i + 1] = Math.max(0, Math.min(255, Math.round(g)));
    data[i + 2] = Math.max(0, Math.min(255, Math.round(b)));
  }
}
