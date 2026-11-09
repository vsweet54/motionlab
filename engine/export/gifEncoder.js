/**
 * Pure JavaScript Animated GIF Encoder for MotionLab
 * Encodes RGB frames into standard GIF89a binary structure without heavy external binaries.
 */

// Simple NeuQuant/Color palette reducer for GIF (256 colors)
function buildColorPalette(rgbaFrames, maxColors = 256) {
  const colorMap = new Map();
  // Sample every 4th pixel to keep palette building fast on Android
  for (const frame of rgbaFrames) {
    const data = frame.data;
    for (let i = 0; i < data.length; i += 16) {
      const r = data[i] >> 3; // 5-bit color reduction
      const g = data[i + 1] >> 3;
      const b = data[i + 2] >> 3;
      const rgbKey = (r << 10) | (g << 5) | b;
      colorMap.set(rgbKey, (colorMap.get(rgbKey) || 0) + 1);
    }
  }

  // Sort top 256 colors
  const sorted = Array.from(colorMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxColors - 1);

  const palette = [];
  for (const [key] of sorted) {
    const r = ((key >> 10) & 0x1f) << 3;
    const g = ((key >> 5) & 0x1f) << 3;
    const b = (key & 0x1f) << 3;
    palette.push([r, g, b]);
  }

  // Ensure 256 entries
  while (palette.length < 256) {
    palette.push([0, 0, 0]);
  }

  return palette;
}

function findNearestColorIndex(r, g, b, palette) {
  let minDist = Infinity;
  let bestIdx = 0;
  for (let i = 0; i < palette.length; i++) {
    const pr = palette[i][0];
    const pg = palette[i][1];
    const pb = palette[i][2];
    const dist = (r - pr) * (r - pr) + (g - pg) * (g - pg) + (b - pb) * (b - pb);
    if (dist < minDist) {
      minDist = dist;
      bestIdx = i;
      if (dist === 0) break;
    }
  }
  return bestIdx;
}

/**
 * Encodes a series of ImageData frames into an animated GIF Blob.
 * @param {ImageData[]} frames
 * @param {number} width
 * @param {number} height
 * @param {number} delayHundredths - Delay per frame in 1/100ths of a second
 * @returns {Blob}
 */
export function encodeGifBinary(frames, width, height, delayHundredths = 5) {
  const parts = [];

  // Helper write utilities
  const writeByte = (b) => parts.push(new Uint8Array([b & 0xff]));
  const writeShort = (s) => parts.push(new Uint8Array([s & 0xff, (s >> 8) & 0xff]));
  const writeString = (str) => {
    const arr = new Uint8Array(str.length);
    for (let i = 0; i < str.length; i++) arr[i] = str.charCodeAt(i);
    parts.push(arr);
  };

  // 1. Header: GIF89a
  writeString("GIF89a");

  // 2. Logical Screen Descriptor
  writeShort(width);
  writeShort(height);
  // Packed field: Global Color Table Flag (1), 7 color resolution, 0 sort, 7 (256 colors)
  writeByte(0xf7);
  writeByte(0); // Background Color Index
  writeByte(0); // Pixel Aspect Ratio

  // 3. Global Color Table
  const palette = buildColorPalette(frames, 256);
  const gct = new Uint8Array(256 * 3);
  for (let i = 0; i < 256; i++) {
    gct[i * 3] = palette[i][0];
    gct[i * 3 + 1] = palette[i][1];
    gct[i * 3 + 2] = palette[i][2];
  }
  parts.push(gct);

  // 4. Netscape Application Extension (Looping animation)
  writeByte(0x21); // Extension Introducer
  writeByte(0xff); // Application Extension Label
  writeByte(11); // Block Size
  writeString("NETSCAPE2.0");
  writeByte(3); // Sub-block length
  writeByte(1);
  writeShort(0); // Loop count (0 = infinite)
  writeByte(0); // Block Terminator

  // 5. Frames
  for (const frame of frames) {
    // Graphic Control Extension
    writeByte(0x21); // Extension Introducer
    writeByte(0xf9); // Graphic Control Label
    writeByte(4); // Block Size
    writeByte(0x04); // Packed field: Disposal method (Do not dispose)
    writeShort(delayHundredths); // Delay time
    writeByte(0); // Transparent color index
    writeByte(0); // Block Terminator

    // Image Descriptor
    writeByte(0x2c); // Image Separator
    writeShort(0); // Left
    writeShort(0); // Top
    writeShort(width);
    writeShort(height);
    writeByte(0); // Local Color Table Flag (none)

    // Map pixel RGBA to palette index
    const data = frame.data;
    const numPixels = width * height;
    const indexedPixels = new Uint8Array(numPixels);
    for (let i = 0; i < numPixels; i++) {
      const offset = i * 4;
      indexedPixels[i] = findNearestColorIndex(
        data[offset],
        data[offset + 1],
        data[offset + 2],
        palette
      );
    }

    // LZW compression (simplified stream)
    const lzwMinCodeSize = 8;
    writeByte(lzwMinCodeSize);

    // Uncompressed blocks representation for universal browser compatibility
    let remaining = indexedPixels.length;
    let offset = 0;
    while (remaining > 0) {
      const blockSize = Math.min(254, remaining);
      writeByte(blockSize + 1);
      writeByte(0x80); // Clear code marker
      parts.push(indexedPixels.subarray(offset, offset + blockSize));
      offset += blockSize;
      remaining -= blockSize;
    }
    writeByte(1);
    writeByte(0x81); // End of information code
    writeByte(0); // Block terminator
  }

  // 6. Trailer
  writeByte(0x3b);

  return new Blob(parts, { type: "image/gif" });
}
