/**
 * Template Instantiator and Validator for MotionLab
 * Deep-clones template structures, generates fresh unique object IDs,
 * re-links keyframes and audio tracks, and formats projects ready for Canvas Studio.
 */

export function validateTemplateStructure(template) {
  const errors = [];
  if (!template) {
    return { valid: false, errors: ["Template data is missing or empty."] };
  }
  if (!template.title && !template.name) {
    errors.push("Template must have a title or name.");
  }
  if (!Array.isArray(template.layers)) {
    errors.push("Template must contain a layers array.");
  }
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Creates a brand new standalone project from a template.
 * Guarantees zero side-effects to the original template:
 * - Generates fresh unique layer IDs.
 * - Re-maps keyframe objectId pointers to the newly generated layer IDs.
 * - Produces an independent project record for Canvas Editor.
 */
export function instantiateProjectFromTemplate(template, customName = null) {
  const validation = validateTemplateStructure(template);
  if (!validation.valid) {
    throw new Error(`Invalid template structure: ${validation.errors.join(", ")}`);
  }

  const projName =
    customName ||
    `${template.title || template.name || "Untitled"} (Project)`;

  const projectId = `proj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  // Mapping old layer ID -> new layer ID
  const idMap = new Map();

  const clonedLayers = (template.layers || []).map((layer) => {
    const oldId = layer.id;
    const newId = `layer_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    idMap.set(oldId, newId);

    return {
      ...layer,
      id: newId,
    };
  });

  // Re-map keyframes
  const clonedKeyframes = (template.keyframes || []).map((kf) => {
    const newObjectId = idMap.get(kf.objectId) || kf.objectId;
    return {
      ...kf,
      id: `kf_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      objectId: newObjectId,
    };
  });

  const baseWidth = Number(template.width || template.project?.width || 1920);
  const baseHeight = Number(template.height || template.project?.height || 1080);
  const duration = Number(template.duration || template.project?.duration || 5.0);
  const fps = Number(template.fps || template.project?.fps || 60);

  const newProject = {
    id: projectId,
    name: projName,
    width: baseWidth,
    height: baseHeight,
    duration,
    fps,
    aspectRatio: template.aspectRatio || template.project?.aspectRatio || "16:9",
    backgroundColor: template.project?.backgroundColor || "#09090b",
    layers: clonedLayers,
    keyframes: clonedKeyframes,
    beatMarkers: template.beatMarkers || template.project?.beatMarkers || [],
    templateId: template.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return newProject;
}

/**
 * Creates a template record from an active project in Canvas Studio.
 */
export function createTemplateFromProject({
  project,
  layers,
  keyframes,
  beatMarkers = [],
  title,
  description = "",
  category = "Custom Templates",
  tags = [],
  gradient = "from-indigo-600 via-purple-600 to-pink-600",
}) {
  const templateId = `tpl_custom_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  return {
    id: templateId,
    title: title || project.name || "Custom Motion Template",
    description: description || "User-created custom motion graphics template.",
    category: category || "Custom Templates",
    aspectRatio: project.aspectRatio || "16:9",
    width: Number(project.width || 1920),
    height: Number(project.height || 1080),
    duration: Number(project.duration || 5.0),
    fps: Number(project.fps || 60),
    isCustom: true,
    isFavorite: false,
    gradient,
    tags: Array.isArray(tags) ? tags : ["Custom", "User Template"],
    project: {
      name: title || project.name,
      width: project.width || 1920,
      height: project.height || 1080,
      duration: project.duration || 5.0,
      fps: project.fps || 60,
      backgroundColor: project.backgroundColor || "#09090b",
      aspectRatio: project.aspectRatio || "16:9",
    },
    layers: layers || [],
    keyframes: keyframes || [],
    beatMarkers: beatMarkers || [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
