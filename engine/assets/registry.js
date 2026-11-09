/**
 * Asset Runtime Registry for MotionLab
 * Resolves live URLs for layers, handles missing asset fallbacks, and project asset verification.
 */

import {
  getAssetWithLiveUrl,
  getAllAssetsWithLiveUrls,
  getOrCreateObjectURL,
  getAssetById,
} from "@/engine/storage/assetStorage";

// Fallback SVG data URL for missing or deleted assets
export const MISSING_IMAGE_FALLBACK =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
      <rect width="100%" height="100%" fill="#18181b"/>
      <rect x="10" y="10" width="380" height="280" fill="none" stroke="#ef4444" stroke-width="2" stroke-dasharray="8 8"/>
      <circle cx="200" cy="130" r="36" fill="#27272a"/>
      <path d="M190 120 L210 140 M210 120 L190 140" stroke="#ef4444" stroke-width="4" stroke-linecap="round"/>
      <text x="200" y="195" font-family="sans-serif" font-size="14" font-weight="bold" fill="#ef4444" text-anchor="middle">MISSING ASSET</text>
      <text x="200" y="215" font-family="sans-serif" font-size="11" fill="#71717a" text-anchor="middle">File not found in local vault</text>
    </svg>`
  );

/**
 * Resolves an asset's live render source for a canvas layer.
 * If layer has an assetId, looks up in IndexedDB and generates or retrieves live URL.
 * If asset is missing, returns graceful fallback instead of crashing canvas.
 * @param {object} layer
 * @returns {Promise<string>}
 */
export async function resolveLayerAssetSource(layer) {
  if (!layer) return null;

  // 1. If layer already has an assetId
  if (layer.assetId) {
    const asset = await getAssetById(layer.assetId);
    if (!asset) {
      console.warn(`Asset "${layer.assetId}" referenced by layer "${layer.name}" was not found.`);
      return MISSING_IMAGE_FALLBACK;
    }

    if (asset.blob) {
      return getOrCreateObjectURL(asset.id, asset.blob);
    }
    if (asset.thumbnail) {
      return asset.thumbnail;
    }
  }

  // 2. Direct src if provided
  if (layer.src) {
    return layer.src;
  }

  return null;
}

/**
 * Restores project layers on open: ensures all asset-backed layers have valid live URLs
 * @param {object[]} layers
 * @returns {Promise<object[]>}
 */
export async function restoreProjectLayerAssets(layers) {
  if (!Array.isArray(layers)) return [];

  const restored = await Promise.all(
    layers.map(async (layer) => {
      if (layer.type === "image" || layer.type === "audio" || layer.type === "video") {
        if (layer.assetId) {
          const liveUrl = await resolveLayerAssetSource(layer);
          return {
            ...layer,
            src: liveUrl || layer.src || MISSING_IMAGE_FALLBACK,
            isMissingAsset: liveUrl === MISSING_IMAGE_FALLBACK,
          };
        }
      }
      return layer;
    })
  );

  return restored;
}
