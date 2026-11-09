import { openDB } from "idb";

const DB_NAME = "motionlab-db";
const DB_VERSION = 4; // Incremented for snapshots & crash recovery stores
const STORE_PROJECTS = "projects";
const STORE_ASSETS = "assets";
const STORE_TEMPLATES = "templates";
const STORE_SNAPSHOTS = "snapshots";
const STORE_RECOVERY = "recovery";

/**
 * Initializes and opens the IndexedDB instance.
 */
export async function getDB() {
  if (typeof window === "undefined") return null;

  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      // 1. Projects Store
      if (!db.objectStoreNames.contains(STORE_PROJECTS)) {
        const projectStore = db.createObjectStore(STORE_PROJECTS, {
          keyPath: "id",
        });
        projectStore.createIndex("updatedAt", "updatedAt");
        projectStore.createIndex("createdAt", "createdAt");
      }

      // 2. Assets Store
      if (!db.objectStoreNames.contains(STORE_ASSETS)) {
        const assetStore = db.createObjectStore(STORE_ASSETS, {
          keyPath: "id",
        });
        assetStore.createIndex("type", "type");
        assetStore.createIndex("category", "category");
        assetStore.createIndex("createdAt", "createdAt");
        assetStore.createIndex("isFavorite", "isFavorite");
      } else if (oldVersion < 2) {
        const assetStore = db.transaction.objectStore(STORE_ASSETS);
        if (!assetStore.indexNames.contains("category")) {
          assetStore.createIndex("category", "category");
        }
        if (!assetStore.indexNames.contains("createdAt")) {
          assetStore.createIndex("createdAt", "createdAt");
        }
        if (!assetStore.indexNames.contains("isFavorite")) {
          assetStore.createIndex("isFavorite", "isFavorite");
        }
      }

      // 3. Templates Store (v3)
      if (!db.objectStoreNames.contains(STORE_TEMPLATES)) {
        const templateStore = db.createObjectStore(STORE_TEMPLATES, {
          keyPath: "id",
        });
        templateStore.createIndex("category", "category");
        templateStore.createIndex("isCustom", "isCustom");
        templateStore.createIndex("isFavorite", "isFavorite");
        templateStore.createIndex("lastUsedAt", "lastUsedAt");
        templateStore.createIndex("createdAt", "createdAt");
      }

      // 4. Snapshots & Version History Store (v4)
      if (!db.objectStoreNames.contains(STORE_SNAPSHOTS)) {
        const snapshotStore = db.createObjectStore(STORE_SNAPSHOTS, {
          keyPath: "id",
        });
        snapshotStore.createIndex("projectId", "projectId");
        snapshotStore.createIndex("createdAt", "createdAt");
      }

      // 5. Crash Recovery Store (v4)
      if (!db.objectStoreNames.contains(STORE_RECOVERY)) {
        db.createObjectStore(STORE_RECOVERY, {
          keyPath: "projectId",
        });
      }
    },
  });
}

/* ========================================================
   PROJECTS CRUD
   ======================================================== */

export async function getAllProjects() {
  const db = await getDB();
  if (!db) return [];
  const projects = await db.getAll(STORE_PROJECTS);
  return projects.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
}

export async function getProjectById(id) {
  const db = await getDB();
  if (!db) return null;
  return db.get(STORE_PROJECTS, id);
}

export async function saveProject(project) {
  const db = await getDB();
  if (!db) return project;
  const projectWithTimestamp = {
    ...project,
    updatedAt: new Date().toISOString(),
  };
  await db.put(STORE_PROJECTS, projectWithTimestamp);
  return projectWithTimestamp;
}

export async function deleteProject(id) {
  const db = await getDB();
  if (!db) return;
  await db.delete(STORE_PROJECTS, id);
}

export async function clearAllProjects() {
  const db = await getDB();
  if (!db) return;
  await db.clear(STORE_PROJECTS);
}

/* ========================================================
   ASSETS CRUD (Stored as native Blobs in IndexedDB)
   ======================================================== */

/**
 * Saves or updates an asset in IndexedDB
 * @param {object} asset
 */
export async function saveAsset(asset) {
  const db = await getDB();
  if (!db) return asset;

  const assetRecord = {
    id: asset.id || `asset_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    name: asset.name || "Untitled Asset",
    originalName: asset.originalName || asset.name || "Untitled",
    type: asset.type || "application/octet-stream",
    category: asset.category || "image",
    size: Number(asset.size || 0),
    blob: asset.blob, // Native Blob stored without Base64 overhead
    thumbnail: asset.thumbnail || null, // Small WebP dataUrl <= 256px
    metadata: asset.metadata || {},
    isFavorite: !!asset.isFavorite,
    createdAt: asset.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await db.put(STORE_ASSETS, assetRecord);
  return assetRecord;
}

/**
 * Gets a single asset by id
 */
export async function getAssetById(id) {
  const db = await getDB();
  if (!db) return null;
  return db.get(STORE_ASSETS, id);
}

/**
 * Gets all assets from IndexedDB, sorted by createdAt descending
 */
export async function getAllAssets() {
  const db = await getDB();
  if (!db) return [];
  const assets = await db.getAll(STORE_ASSETS);
  return assets.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

/**
 * Updates partial asset fields (e.g. name, isFavorite, thumbnail, blob)
 */
export async function updateAsset(id, updates) {
  const db = await getDB();
  if (!db) return null;
  const existing = await db.get(STORE_ASSETS, id);
  if (!existing) return null;

  const updated = {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  await db.put(STORE_ASSETS, updated);
  return updated;
}

/**
 * Deletes an asset by id
 */
export async function deleteAsset(id) {
  const db = await getDB();
  if (!db) return;
  await db.delete(STORE_ASSETS, id);
}

/**
 * Clears all assets from IndexedDB
 */
export async function clearAllAssets() {
  const db = await getDB();
  if (!db) return;
  await db.clear(STORE_ASSETS);
}

/* ========================================================
   STORAGE QUOTA & PERSISTENCE
   ======================================================== */

/**
 * Requests persistent storage from browser
 * @returns {Promise<boolean>}
 */
export async function requestPersistentStorage() {
  if (typeof window === "undefined" || !navigator.storage || !navigator.storage.persist) {
    return false;
  }
  try {
    return await navigator.storage.persist();
  } catch (err) {
    console.warn("Storage persistence request failed:", err);
    return false;
  }
}

/**
 * Checks storage quota and current usage
 * @returns {Promise<{ quota: number, usage: number, usagePercent: number, usageFormatted: string, quotaFormatted: string, isPersisted: boolean }>}
 */
export async function getStorageInfo() {
  const result = {
    quota: 0,
    usage: 0,
    usagePercent: 0,
    usageFormatted: "0 MB",
    quotaFormatted: "Unknown",
    isPersisted: false,
  };

  if (typeof window === "undefined" || !navigator.storage) {
    return result;
  }

  try {
    if (navigator.storage.persisted) {
      result.isPersisted = await navigator.storage.persisted();
    }

    if (navigator.storage.estimate) {
      const estimate = await navigator.storage.estimate();
      const usage = estimate.usage || 0;
      const quota = estimate.quota || 0;

      result.usage = usage;
      result.quota = quota;
      result.usagePercent = quota > 0 ? Number(((usage / quota) * 100).toFixed(1)) : 0;
      result.usageFormatted = formatBytes(usage);
      result.quotaFormatted = formatBytes(quota);
    }
  } catch (err) {
    console.warn("Failed to query storage estimate:", err);
  }

  return result;
}

/**
 * Formats bytes to human-readable string (KB, MB, GB)
 */
export function formatBytes(bytes) {
  if (!bytes || bytes <= 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Scans all projects and finds assets that are not referenced in any project
 * @returns {Promise<{ unusedAssets: object[], totalReclaimableBytes: number }>}
 */
export async function findUnusedAssets() {
  const [allAssets, allProjects] = await Promise.all([
    getAllAssets(),
    getAllProjects(),
  ]);

  const referencedAssetIds = new Set();

  for (const project of allProjects) {
    if (Array.isArray(project.layers)) {
      for (const layer of project.layers) {
        if (layer.assetId) referencedAssetIds.add(layer.assetId);
      }
    }
  }

  const unused = allAssets.filter((a) => !referencedAssetIds.has(a.id));
  const totalReclaimableBytes = unused.reduce((acc, a) => acc + (a.size || 0), 0);

  return {
    unusedAssets: unused,
    totalReclaimableBytes,
    totalReclaimableFormatted: formatBytes(totalReclaimableBytes),
  };
}

/**
 * Cleans up unused assets from IndexedDB
 */
export async function cleanupUnusedAssets() {
  const { unusedAssets, totalReclaimableBytes } = await findUnusedAssets();
  const db = await getDB();
  if (!db || unusedAssets.length === 0) {
    return { count: 0, reclaimedFormatted: "0 B" };
  }

  const tx = db.transaction(STORE_ASSETS, "readwrite");
  for (const asset of unusedAssets) {
    await tx.store.delete(asset.id);
  }
  await tx.done;

  return {
    count: unusedAssets.length,
    reclaimedFormatted: formatBytes(totalReclaimableBytes),
  };
}

/* ========================================================
   TEMPLATES CRUD (Built-in overrides + Custom User Templates)
   ======================================================== */

/**
 * Saves or updates a template in IndexedDB
 */
export async function saveTemplateRecord(template) {
  const db = await getDB();
  if (!db) return template;

  const record = {
    ...template,
    updatedAt: new Date().toISOString(),
  };

  await db.put(STORE_TEMPLATES, record);
  return record;
}

/**
 * Gets a single template by id
 */
export async function getTemplateRecordById(id) {
  const db = await getDB();
  if (!db) return null;
  return db.get(STORE_TEMPLATES, id);
}

/**
 * Gets all user-saved or overridden templates from IndexedDB
 */
export async function getAllTemplateRecords() {
  const db = await getDB();
  if (!db) return [];
  const templates = await db.getAll(STORE_TEMPLATES);
  return templates.sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));
}

/**
 * Deletes a template by id
 */
export async function deleteTemplateRecord(id) {
  const db = await getDB();
  if (!db) return;
  await db.delete(STORE_TEMPLATES, id);
}

/* ========================================================
   VERSION SNAPSHOTS CRUD (History and Revert)
   ======================================================== */

export async function saveSnapshot(snapshot) {
  const db = await getDB();
  if (!db) return snapshot;

  const record = {
    ...snapshot,
    id: snapshot.id || `snap_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    createdAt: snapshot.createdAt || new Date().toISOString(),
  };

  await db.put(STORE_SNAPSHOTS, record);
  return record;
}

export async function getSnapshotsByProjectId(projectId) {
  const db = await getDB();
  if (!db) return [];
  const all = await db.getAllFromIndex(STORE_SNAPSHOTS, "projectId", projectId);
  return all.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export async function deleteSnapshot(id) {
  const db = await getDB();
  if (!db) return;
  await db.delete(STORE_SNAPSHOTS, id);
}

export async function clearSnapshotsByProjectId(projectId) {
  const db = await getDB();
  if (!db) return;
  const list = await getSnapshotsByProjectId(projectId);
  const tx = db.transaction(STORE_SNAPSHOTS, "readwrite");
  for (const s of list) {
    await tx.store.delete(s.id);
  }
  await tx.done;
}

/* ========================================================
   CRASH RECOVERY CRUD
   ======================================================== */

export async function saveRecoveryData(projectId, data) {
  const db = await getDB();
  if (!db || !projectId) return;

  await db.put(STORE_RECOVERY, {
    projectId,
    data,
    savedAt: new Date().toISOString(),
  });
}

export async function getRecoveryData(projectId) {
  const db = await getDB();
  if (!db || !projectId) return null;
  return db.get(STORE_RECOVERY, projectId);
}

export async function clearRecoveryData(projectId) {
  const db = await getDB();
  if (!db || !projectId) return;
  await db.delete(STORE_RECOVERY, projectId);
}

export async function getAllRecoveryRecords() {
  const db = await getDB();
  if (!db) return [];
  return db.getAll(STORE_RECOVERY);
}
