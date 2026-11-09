/**
 * Version History and Snapshot Manager for MotionLab
 * Manages periodic project snapshots, version diffing, and restoration.
 */

import { saveSnapshot, getSnapshotsByProjectId, deleteSnapshot as dbDeleteSnapshot } from "@/lib/storage/db";

export { dbDeleteSnapshot as deleteSnapshot };

const MAX_SNAPSHOTS_PER_PROJECT = 20;

/**
 * Creates a version snapshot of a project.
 */
export async function createProjectSnapshot(project, note = "") {
  if (!project || !project.id) return null;

  const existing = await getSnapshotsByProjectId(project.id);
  // Enforce max snapshot cap to save storage space
  if (existing.length >= MAX_SNAPSHOTS_PER_PROJECT) {
    const oldest = existing[existing.length - 1];
    await deleteSnapshot(oldest.id);
  }

  const snapshot = {
    projectId: project.id,
    name: project.name,
    note: note || "User version snapshot",
    data: project,
    createdAt: new Date().toISOString(),
  };

  return saveSnapshot(snapshot);
}

/**
 * Loads all version snapshots for a project.
 */
export async function loadProjectSnapshots(projectId) {
  if (!projectId) return [];
  return getSnapshotsByProjectId(projectId);
}

/**
 * Restores a project from a historical version snapshot.
 */
export function restoreProjectFromSnapshot(snapshot) {
  if (!snapshot || !snapshot.data) {
    throw new Error("Invalid snapshot payload");
  }
  return {
    ...snapshot.data,
    updatedAt: new Date().toISOString(),
  };
}
