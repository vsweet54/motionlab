/**
 * Project File Exporter for MotionLab
 * Exports full standalone project state including layers, keyframes, effects,
 * timeline configuration, and audio asset references into JSON file.
 */

export function exportProjectFile({ project, layers, keyframes, beatMarkers = [] }) {
  const exportPayload = {
    version: "2.0.0",
    app: "MotionLab",
    exportedAt: new Date().toISOString(),
    project: {
      id: project.id || `proj_${Date.now()}`,
      name: project.name || "Untitled Motion Project",
      width: project.width || 1920,
      height: project.height || 1080,
      fps: project.fps || 60,
      duration: project.duration || 5.0,
      backgroundColor: project.backgroundColor || "#09090b",
      aspectRatio: project.aspectRatio || "16:9",
    },
    timeline: {
      duration: project.duration || 5.0,
      fps: project.fps || 60,
      beatMarkers: Array.isArray(beatMarkers) ? beatMarkers : [],
    },
    layers: layers.map((layer) => ({
      ...layer,
      // Ensure media reference is clearly labeled
      _assetStorageType: layer.src?.startsWith("blob:") ? "local-session-blob" : "url-reference",
    })),
    keyframes: Array.isArray(keyframes) ? keyframes : [],
  };

  const jsonStr = JSON.stringify(exportPayload, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const cleanName = (project.name || "motionlab-project").toLowerCase().replace(/[^a-z0-9_-]/g, "-");
  const filename = `${cleanName}.motionlab.json`;

  return {
    blob,
    url,
    filename,
    sizeBytes: blob.size,
    format: "json",
  };
}
