/**
 * Asset Storage Manager for MotionLab
 * Manages object URL generation, lifecycle, memory revocation, and missing asset fallback.
 */

import {
  saveAsset as dbSaveAsset,
  getAssetById as dbGetAssetById,
  getAllAssets as dbGetAllAssets,
  updateAsset as dbUpdateAsset,
  deleteAsset as dbDeleteAsset,
  clearAllAssets as dbClearAllAssets,
  getStorageInfo,
  requestPersistentStorage,
  findUnusedAssets,
  cleanupUnusedAssets,
  formatBytes,
} from "@/lib/storage/db";

// In-memory cache for live Object URLs: assetId -> objectUrl
const objectUrlRegistry = new Map();

/**
 * Creates or retrieves an existing Object URL for an asset blob.
 * Reusing Object URLs prevents browser memory thrashing and DOM reload flicker.
 * @param {string} assetId
 * @param {Blob} blob
 * @returns {string} Object URL
 */
export function getOrCreateObjectURL(assetId, blob) {
  if (!assetId || !blob) return null;

  if (objectUrlRegistry.has(assetId)) {
    return objectUrlRegistry.get(assetId);
  }

  const url = URL.createObjectURL(blob);
  objectUrlRegistry.set(assetId, url);
  return url;
}

/**
 * Revokes a single asset's Object URL
 * @param {string} assetId
 */
export function revokeAssetURL(assetId) {
  if (objectUrlRegistry.has(assetId)) {
    const url = objectUrlRegistry.get(assetId);
    URL.revokeObjectURL(url);
    objectUrlRegistry.delete(assetId);
  }
}

/**
 * Revokes all managed Object URLs on unload
 */
export function revokeAllAssetURLs() {
  for (const [, url] of objectUrlRegistry.entries()) {
    try {
      URL.revokeObjectURL(url);
    } catch {
      // ignore
    }
  }
  objectUrlRegistry.clear();
}

/**
 * Retrieves an asset with an active live URL ready for canvas or audio/video playback
 * @param {string} id
 * @returns {Promise<object|null>}
 */
export async function getAssetWithLiveUrl(id) {
  const asset = await dbGetAssetById(id);
  if (!asset) return null;

  let liveUrl = null;
  if (asset.blob) {
    liveUrl = getOrCreateObjectURL(asset.id, asset.blob);
  } else if (asset.thumbnail) {
    liveUrl = asset.thumbnail;
  }

  return {
    ...asset,
    liveUrl,
  };
}

/**
 * Retrieves all assets with active live URLs
 * @returns {Promise<object[]>}
 */
export async function getAllAssetsWithLiveUrls() {
  const assets = await dbGetAllAssets();
  return assets.map((a) => {
    let liveUrl = null;
    if (a.blob) {
      liveUrl = getOrCreateObjectURL(a.id, a.blob);
    } else if (a.thumbnail) {
      liveUrl = a.thumbnail;
    }
    return {
      ...a,
      liveUrl,
    };
  });
}

/**
 * Deletes asset and cleans up live memory URL
 * @param {string} id
 */
export async function deleteAssetAndRevoke(id) {
  revokeAssetURL(id);
  await dbDeleteAsset(id);
}

/**
 * Duplicates an existing asset in IndexedDB
 * @param {string} id
 */
export async function duplicateAsset(id) {
  const existing = await dbGetAssetById(id);
  if (!existing) throw new Error("Asset not found");

  const copy = {
    ...existing,
    id: `asset_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    name: `${existing.name} (Copy)`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await dbSaveAsset(copy);
  return copy;
}

export {
  dbSaveAsset as saveAsset,
  dbGetAssetById as getAssetById,
  dbGetAllAssets as getAllAssets,
  dbUpdateAsset as updateAsset,
  dbDeleteAsset as deleteAsset,
  dbClearAllAssets as clearAllAssets,
  getStorageInfo,
  requestPersistentStorage,
  findUnusedAssets,
  cleanupUnusedAssets,
  formatBytes,
};
