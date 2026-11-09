/**
 * Media Importer for MotionLab
 * Validates, sanitizes, and extracts metadata/thumbnails for Images, SVGs, Videos, Audio, and Fonts.
 */

import { sanitizeSvg } from "@/lib/media/svgSanitizer";
import { extractWaveform } from "@/lib/media/waveform";
import { generateThumbnail, loadImage } from "@/lib/media/imageProcessor";
import { loadCustomFont, sanitizeFontFamily } from "./fontManager";
import { saveAsset, getAllAssets } from "@/engine/storage/assetStorage";

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

// Supported mime type and extension mapping
const SUPPORTED_EXTENSIONS = {
  // Images
  png: { category: "image", mime: "image/png" },
  jpg: { category: "image", mime: "image/jpeg" },
  jpeg: { category: "image", mime: "image/jpeg" },
  webp: { category: "image", mime: "image/webp" },
  svg: { category: "svg", mime: "image/svg+xml" },
  // Videos
  mp4: { category: "video", mime: "video/mp4" },
  webm: { category: "video", mime: "video/webm" },
  // Audio
  mp3: { category: "audio", mime: "audio/mpeg" },
  wav: { category: "audio", mime: "audio/wav" },
  aac: { category: "audio", mime: "audio/aac" },
  ogg: { category: "audio", mime: "audio/ogg" },
  // Fonts
  ttf: { category: "font", mime: "font/ttf" },
  otf: { category: "font", mime: "font/otf" },
  woff: { category: "font", mime: "font/woff" },
  woff2: { category: "font", mime: "font/woff2" },
};

/**
 * Validates file type and returns category and normalized mime
 */
export function inspectFile(file) {
  const ext = file.name.split(".").pop().toLowerCase();
  const match = SUPPORTED_EXTENSIONS[ext];

  if (!match) {
    throw new Error(
      `Unsupported file format ".${ext}". Supported: PNG, JPG, WebP, SVG, MP4, WebM, MP3, WAV, AAC, OGG, TTF, OTF, WOFF, WOFF2.`
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error(
      `File "${file.name}" exceeds maximum allowed size (100 MB).`
    );
  }

  return {
    extension: ext,
    category: match.category,
    mimeType: file.type || match.mime,
  };
}

/**
 * Captures a video frame thumbnail and extracts video duration/dimensions
 */
function processVideo(file) {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;

    const objectUrl = URL.createObjectURL(file);
    video.src = objectUrl;

    const cleanup = () => {
      URL.revokeObjectURL(objectUrl);
      video.remove();
    };

    video.onloadedmetadata = () => {
      video.currentTime = Math.min(0.5, video.duration / 2);
    };

    video.onseeked = () => {
      const w = video.videoWidth || 640;
      const h = video.videoHeight || 360;
      const canvas = document.createElement("canvas");
      canvas.width = Math.min(320, w);
      canvas.height = Math.round((canvas.width * h) / w);

      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const thumbnail = canvas.toDataURL("image/webp", 0.8);
      const duration = Number(video.duration.toFixed(2));

      cleanup();
      resolve({
        width: w,
        height: h,
        duration,
        thumbnail,
      });
    };

    video.onerror = () => {
      cleanup();
      resolve({
        width: 1920,
        height: 1080,
        duration: 5,
        thumbnail: null,
      });
    };
  });
}

/**
 * Imports a single file, processes metadata, generates thumbnail, and saves to IndexedDB
 * @param {File} file
 * @param {object} options - { checkDuplicates: boolean }
 * @returns {Promise<object>} saved asset record
 */
export async function importSingleFile(file, options = { checkDuplicates: true }) {
  const { extension, category, mimeType } = inspectFile(file);

  // Duplicate detection
  if (options.checkDuplicates) {
    const existingAssets = await getAllAssets();
    const duplicate = existingAssets.find(
      (a) => a.originalName === file.name && Math.abs(a.size - file.size) < 10
    );
    if (duplicate) {
      throw new Error(
        `Duplicate file detected: "${file.name}" already exists in the Asset Vault.`
      );
    }
  }

  let metadata = { format: extension };
  let thumbnail = null;
  let finalBlob = file;

  switch (category) {
    case "image": {
      const img = await loadImage(file);
      metadata.width = img.naturalWidth || img.width;
      metadata.height = img.naturalHeight || img.height;
      thumbnail = await generateThumbnail(img, 256);
      break;
    }

    case "svg": {
      const rawText = await file.text();
      const sanitized = sanitizeSvg(rawText);
      metadata.width = sanitized.width;
      metadata.height = sanitized.height;
      metadata.paths = sanitized.paths;
      // Store sanitized SVG blob
      finalBlob = new Blob([sanitized.sanitizedSvg], { type: "image/svg+xml" });
      thumbnail = `data:image/svg+xml;utf8,${encodeURIComponent(sanitized.sanitizedSvg)}`;
      break;
    }

    case "audio": {
      const { peaks, duration } = await extractWaveform(file, 80);
      metadata.duration = duration;
      metadata.waveform = peaks;
      break;
    }

    case "video": {
      const vidInfo = await processVideo(file);
      metadata.width = vidInfo.width;
      metadata.height = vidInfo.height;
      metadata.duration = vidInfo.duration;
      thumbnail = vidInfo.thumbnail;
      break;
    }

    case "font": {
      const fontFamily = sanitizeFontFamily(file.name);
      metadata.fontFamily = fontFamily;
      await loadCustomFont(fontFamily, file);
      break;
    }
  }

  const assetRecord = {
    id: `asset_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    name: file.name.replace(/\.[^/.]+$/, ""), // Display name without extension
    originalName: file.name,
    type: mimeType,
    category,
    size: file.size,
    blob: finalBlob,
    thumbnail,
    metadata,
    isFavorite: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await saveAsset(assetRecord);
  return assetRecord;
}

/**
 * Imports multiple files with progress reporting
 * @param {FileList|File[]} files
 * @param {(progress: { current: number, total: number, currentFileName: string }) => void} onProgress
 * @returns {Promise<{ imported: object[], errors: { fileName: string, error: string }[] }>}
 */
export async function importMultipleFiles(files, onProgress) {
  const fileArray = Array.from(files);
  const total = fileArray.length;
  const imported = [];
  const errors = [];

  for (let i = 0; i < total; i++) {
    const file = fileArray[i];
    if (onProgress) {
      onProgress({
        current: i + 1,
        total,
        currentFileName: file.name,
      });
    }

    try {
      const record = await importSingleFile(file);
      imported.push(record);
    } catch (err) {
      errors.push({
        fileName: file.name,
        error: err.message || "Unknown error during import",
      });
    }
  }

  return { imported, errors };
}
