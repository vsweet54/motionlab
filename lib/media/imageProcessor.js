/**
 * Image Processing Engine for MotionLab
 * Handles crop, resize, rotate, flip, and high-performance thumbnail generation on canvas.
 */

/**
 * Loads an image from a Blob or URL into an HTMLImageElement
 * @param {Blob|string} source
 * @returns {Promise<HTMLImageElement>}
 */
export function loadImage(source) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    let objectUrl = null;

    if (source instanceof Blob) {
      objectUrl = URL.createObjectURL(source);
      img.src = objectUrl;
    } else {
      img.src = source;
    }

    img.onload = () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      resolve(img);
    };

    img.onerror = (err) => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to load image for processing: " + err));
    };
  });
}

/**
 * Converts a Canvas to a Blob
 * @param {HTMLCanvasElement} canvas
 * @param {string} type - mime type
 * @param {number} quality - 0 to 1
 * @returns {Promise<Blob>}
 */
function canvasToBlob(canvas, type = "image/png", quality = 0.92) {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), type, quality);
  });
}

/**
 * Generates an efficient thumbnail data URL (max 256x256)
 * @param {Blob|HTMLImageElement} source
 * @param {number} maxDim - maximum dimension
 * @returns {Promise<string>} dataUrl
 */
export async function generateThumbnail(source, maxDim = 256) {
  const img = source instanceof HTMLImageElement ? source : await loadImage(source);
  let w = img.naturalWidth || img.width;
  let h = img.naturalHeight || img.height;

  if (w <= 0 || h <= 0) {
    w = 100;
    h = 100;
  }

  if (w > maxDim || h > maxDim) {
    if (w > h) {
      h = Math.round((h * maxDim) / w);
      w = maxDim;
    } else {
      w = Math.round((w * maxDim) / h);
      h = maxDim;
    }
  }

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, w, h);

  return canvas.toDataURL("image/webp", 0.85);
}

/**
 * Crops an image to specified rectangle
 * @param {Blob|string} source
 * @param {{ x: number, y: number, width: number, height: number }} cropRect
 * @param {string} mimeType
 * @returns {Promise<{ blob: Blob, width: number, height: number, thumbnail: string }>}
 */
export async function cropImage(source, cropRect, mimeType = "image/png") {
  const img = await loadImage(source);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(cropRect.width));
  canvas.height = Math.max(1, Math.round(cropRect.height));
  const ctx = canvas.getContext("2d");

  ctx.drawImage(
    img,
    cropRect.x,
    cropRect.y,
    cropRect.width,
    cropRect.height,
    0,
    0,
    canvas.width,
    canvas.height
  );

  const blob = await canvasToBlob(canvas, mimeType);
  const thumbnail = await generateThumbnail(canvas, 256);

  return {
    blob,
    width: canvas.width,
    height: canvas.height,
    thumbnail,
  };
}

/**
 * Resizes an image to specified dimensions
 * @param {Blob|string} source
 * @param {number} targetWidth
 * @param {number} targetHeight
 * @param {string} mimeType
 * @returns {Promise<{ blob: Blob, width: number, height: number, thumbnail: string }>}
 */
export async function resizeImage(source, targetWidth, targetHeight, mimeType = "image/png") {
  const img = await loadImage(source);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(targetWidth));
  canvas.height = Math.max(1, Math.round(targetHeight));
  const ctx = canvas.getContext("2d");

  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  const blob = await canvasToBlob(canvas, mimeType);
  const thumbnail = await generateThumbnail(canvas, 256);

  return {
    blob,
    width: canvas.width,
    height: canvas.height,
    thumbnail,
  };
}

/**
 * Rotates an image by degrees (90, 180, 270, or arbitrary)
 * @param {Blob|string} source
 * @param {number} degrees
 * @param {string} mimeType
 * @returns {Promise<{ blob: Blob, width: number, height: number, thumbnail: string }>}
 */
export async function rotateImage(source, degrees, mimeType = "image/png") {
  const img = await loadImage(source);
  const rads = (degrees * Math.PI) / 180;
  const isRightAngle = Math.abs(degrees % 180) === 90;

  const canvas = document.createElement("canvas");
  const origW = img.naturalWidth || img.width;
  const origH = img.naturalHeight || img.height;

  canvas.width = isRightAngle ? origH : origW;
  canvas.height = isRightAngle ? origW : origH;

  const ctx = canvas.getContext("2d");
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate(rads);
  ctx.drawImage(img, -origW / 2, -origH / 2);

  const blob = await canvasToBlob(canvas, mimeType);
  const thumbnail = await generateThumbnail(canvas, 256);

  return {
    blob,
    width: canvas.width,
    height: canvas.height,
    thumbnail,
  };
}

/**
 * Flips an image horizontally and/or vertically
 * @param {Blob|string} source
 * @param {boolean} flipH
 * @param {boolean} flipV
 * @param {string} mimeType
 * @returns {Promise<{ blob: Blob, width: number, height: number, thumbnail: string }>}
 */
export async function flipImage(source, flipH = false, flipV = false, mimeType = "image/png") {
  const img = await loadImage(source);
  const canvas = document.createElement("canvas");
  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;

  canvas.width = w;
  canvas.height = h;

  const ctx = canvas.getContext("2d");
  ctx.save();
  ctx.translate(flipH ? w : 0, flipV ? h : 0);
  ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
  ctx.drawImage(img, 0, 0);
  ctx.restore();

  const blob = await canvasToBlob(canvas, mimeType);
  const thumbnail = await generateThumbnail(canvas, 256);

  return {
    blob,
    width: w,
    height: h,
    thumbnail,
  };
}
