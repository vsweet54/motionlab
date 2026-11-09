/**
 * JSON Project Exporter for MotionLab
 * Exports the complete, sanitized project schema with full fidelity.
 */

export function exportProjectToJson(project, layers = [], keyframes = [], options = {}) {
  const exportPayload = {
    schemaVersion: "motionlab/v2.0",
    exportedAt: new Date().toISOString(),
    project: {
      id: project?.id || `proj_${Date.now()}`,
      name: project?.name || "MotionLab Project",
      width: Number(project?.width || 1920),
      height: Number(project?.height || 1080),
      duration: Number(project?.duration || 5.0),
      fps: Number(project?.fps || 60),
      backgroundColor: project?.backgroundColor || "#0a0a0f",
      createdAt: project?.createdAt || Date.now(),
      updatedAt: Date.now(),
    },
    layers: layers.map((l) => ({
      id: l.id,
      name: l.name,
      type: l.type,
      visible: l.visible !== false,
      isLocked: !!l.isLocked,
      x: Number(l.x ?? 960),
      y: Number(l.y ?? 540),
      width: Number(l.width ?? 300),
      height: Number(l.height ?? 200),
      rotation: Number(l.rotation ?? 0),
      opacity: Number(l.opacity ?? 1),
      scaleX: Number(l.scaleX ?? 1),
      scaleY: Number(l.scaleY ?? 1),
      fill: l.fill || "#6366f1",
      stroke: l.stroke || "transparent",
      strokeWidth: Number(l.strokeWidth ?? 0),
      anchorX: l.anchorX !== undefined ? Number(l.anchorX) : 0.5,
      anchorY: l.anchorY !== undefined ? Number(l.anchorY) : 0.5,
      parentId: l.parentId || null,
      startTime: Number(l.startTime ?? 0),
      duration: Number(l.duration ?? (project?.duration || 5.0)),
      // Text
      text: l.text || "",
      fontSize: l.fontSize ? Number(l.fontSize) : 64,
      fontFamily: l.fontFamily || "Inter",
      fontWeight: l.fontWeight || "bold",
      fontStyle: l.fontStyle || "normal",
      align: l.align || "center",
      letterSpacing: Number(l.letterSpacing ?? 0),
      lineHeight: Number(l.lineHeight ?? 1.2),
      // Shapes
      cornerRadius: Number(l.cornerRadius ?? 0),
      radius: Number(l.radius ?? 100),
      radiusX: Number(l.radiusX ?? 150),
      radiusY: Number(l.radiusY ?? 100),
      sides: Number(l.sides ?? 6),
      numPoints: Number(l.numPoints ?? 5),
      innerRadius: Number(l.innerRadius ?? 40),
      outerRadius: Number(l.outerRadius ?? 100),
      points: l.points || null,
      // Media
      src: l.src || null,
      assetId: l.assetId || null,
      isMuted: !!l.isMuted,
      // Effects, Transitions, Expressions, Motion Path
      effects: Array.isArray(l.effects) ? l.effects : [],
      transitionIn: l.transitionIn || null,
      transitionOut: l.transitionOut || null,
      expression: l.expression || null,
      motionPath: l.motionPath || null,
    })),
    keyframes: keyframes.map((k) => ({
      id: k.id,
      objectId: k.objectId,
      property: k.property,
      time: Number(Number(k.time).toFixed(3)),
      value: k.value,
      easing: k.easing || "easeInOut",
      bezierPoints: k.bezierPoints || null,
    })),
    audioMetadata: {
      tracks: layers.filter((l) => l.type === "audio").map((l) => ({
        id: l.id,
        name: l.name,
        src: l.src,
        duration: l.duration,
        startTime: l.startTime,
        isMuted: l.isMuted,
      })),
      beatMarkers: project?.beatMarkers || [],
    },
  };

  const formatted = JSON.stringify(exportPayload, null, options.minify ? 0 : 2);
  return {
    code: formatted,
    filename: `${(project?.name || "motionlab-project").toLowerCase().replace(/\s+/g, "-")}.json`,
    mimeType: "application/json",
  };
}
