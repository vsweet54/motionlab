/**
 * Storage Manager for MotionLab
 * Queries storage quota, clears temporary caches, cleans up unused thumbnails,
 * and removes stale recovery buffers without touching user projects or media assets.
 */

import { getDB, getStorageInfo, getAllRecoveryRecords, clearRecoveryData } from "@/lib/storage/db";

export async function getDetailedStorageStats() {
  const info = await getStorageInfo();
  const db = await getDB();

  let projectCount = 0;
  let assetCount = 0;
  let templateCount = 0;
  let snapshotCount = 0;
  let recoveryCount = 0;

  if (db) {
    try {
      projectCount = await db.count("projects");
      assetCount = await db.count("assets");
      templateCount = await db.count("templates");
      snapshotCount = await db.count("snapshots");
      recoveryCount = await db.count("recovery");
    } catch (e) {}
  }

  return {
    ...info,
    projectCount,
    assetCount,
    templateCount,
    snapshotCount,
    recoveryCount,
  };
}

/**
 * Clears old recovery data buffers
 */
export async function cleanStaleRecoveryData() {
  const records = await getAllRecoveryRecords();
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
  let cleaned = 0;

  for (const r of records) {
    if (new Date(r.savedAt).getTime() < oneDayAgo) {
      await clearRecoveryData(r.projectId);
      cleaned++;
    }
  }

  return { cleaned };
}
