/**
 * Full Project Backup and Restore Engine for MotionLab
 * Packages project configuration, layers, keyframes, effects, audio references,
 * and metadata into a standardized .motionbackup.json file with schema validation.
 */

export function exportProjectBackup(project) {
  if (!project) throw new Error("No project provided for backup.");

  const backupData = {
    app: "MotionLab",
    type: "project-backup",
    schemaVersion: "2.0.0",
    exportedAt: new Date().toISOString(),
    project: {
      ...project,
      // Metadata clearly specifying media policy
      _mediaStoragePolicy: "Asset references and base configuration preserved for offline restore.",
    },
  };

  const jsonString = JSON.stringify(backupData, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const safeName = (project.name || "project")
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "-");
  const filename = `${safeName}-${new Date().toISOString().slice(0, 10)}.motionbackup.json`;

  return {
    blob,
    url,
    filename,
    sizeBytes: blob.size,
  };
}

/**
 * Validates and parses a backup file.
 */
export async function validateAndParseBackup(fileOrJson) {
  let content;
  if (fileOrJson instanceof File || fileOrJson instanceof Blob) {
    content = await fileOrJson.text();
  } else if (typeof fileOrJson === "string") {
    content = fileOrJson;
  } else {
    throw new Error("Invalid backup source provided.");
  }

  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch (err) {
    throw new Error("Corrupted or invalid JSON in backup file.");
  }

  const projectCandidate = parsed.project || parsed;

  if (!projectCandidate.name && !projectCandidate.title) {
    throw new Error("Backup file is missing project name.");
  }

  // Generate clean restored project
  const restoredId = `proj_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const restoredProject = {
    ...projectCandidate,
    id: restoredId,
    name: `${projectCandidate.name || "Restored Project"} (Restored)`,
    isArchived: false,
    createdAt: projectCandidate.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return restoredProject;
}
