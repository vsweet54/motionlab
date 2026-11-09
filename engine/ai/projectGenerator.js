/**
 * MotionLab Project Generator from AI Structured Output
 * Transforms AI scene-based storyboard JSON into a complete, native MotionLab project
 * with coordinated layers, global timeline offsets, and GSAP keyframes.
 */

import { ASPECT_RATIOS } from "./promptEngine.js";

export function convertAiResponseToProject(aiData, requestedOptions = {}) {
  const { project: projMeta, scenes = [], audioRecommendations } = aiData;

  const aspectRatio = requestedOptions.aspectRatio || projMeta.aspectRatio || "16:9";
  const dimensions = ASPECT_RATIOS[aspectRatio] || ASPECT_RATIOS["16:9"];
  const fps = Number(requestedOptions.fps || projMeta.fps || 60);

  // Compute cumulative start times for scenes
  let accumulatedTime = 0;
  const processedScenes = scenes.map((scene, idx) => {
    const sDuration = Math.max(1.0, Number(scene.duration) || 3.0);
    const sStart = Number(accumulatedTime.toFixed(2));
    accumulatedTime += sDuration;

    return {
      ...scene,
      index: idx,
      startTime: sStart,
      duration: sDuration,
      endTime: Number((sStart + sDuration).toFixed(2)),
    };
  });

  const totalDuration = Number(accumulatedTime.toFixed(2));

  // Flatten scene layers into MotionLab global layers with timeline offsets
  const globalLayers = [];
  const globalKeyframes = [];

  processedScenes.forEach((scene) => {
    // Scene background layer if custom color provided
    if (scene.backgroundColor && scene.backgroundColor !== "#09090b") {
      const bgId = `bg_${scene.id}`;
      globalLayers.push({
        id: bgId,
        name: `${scene.name} (Backdrop)`,
        type: "rect",
        x: dimensions.width / 2,
        y: dimensions.height / 2,
        width: dimensions.width,
        height: dimensions.height,
        fill: scene.backgroundColor,
        opacity: 1,
        startTime: scene.startTime,
        duration: scene.duration,
        visible: true,
        isLocked: true,
        scaleX: 1,
        scaleY: 1,
        rotation: 0,
      });
    }

    // Process individual scene layers
    scene.layers.forEach((layer) => {
      const layerId = layer.id || `layer_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const layerStartTime = scene.startTime + Math.max(0, Number(layer.startTime) || 0);
      const layerDuration = Math.min(scene.duration, Number(layer.duration) || scene.duration);

      const motionLayer = {
        id: layerId,
        name: layer.name || (layer.type === "text" ? layer.text?.substring(0, 20) || "Text" : `${layer.type} layer`),
        type: layer.type || "rect",
        x: Number(layer.x ?? dimensions.width / 2),
        y: Number(layer.y ?? dimensions.height / 2),
        width: Number(layer.width ?? (layer.type === "text" ? 600 : 200)),
        height: Number(layer.height ?? (layer.type === "text" ? 100 : 200)),
        rotation: Number(layer.rotation ?? 0),
        opacity: Number(layer.opacity ?? 1),
        scaleX: Number(layer.scaleX ?? 1),
        scaleY: Number(layer.scaleY ?? 1),
        fill: layer.fill || "#6366f1",
        stroke: layer.stroke || "transparent",
        strokeWidth: Number(layer.strokeWidth ?? 0),
        // Text layer specifics
        text: layer.text || "MotionLab Headline",
        fontSize: Number(layer.fontSize ?? 48),
        fontFamily: layer.fontFamily || "Inter, sans-serif",
        fontWeight: layer.fontWeight || "bold",
        align: layer.align || "center",
        // Shape layer specifics
        cornerRadius: Number(layer.cornerRadius ?? 0),
        radius: Number(layer.radius ?? 80),
        sides: Number(layer.sides ?? 6),
        numPoints: Number(layer.numPoints ?? 5),
        innerRadius: Number(layer.innerRadius ?? 35),
        outerRadius: Number(layer.outerRadius ?? 75),
        // Timing
        startTime: Number(layerStartTime.toFixed(2)),
        duration: Number(layerDuration.toFixed(2)),
        visible: true,
        isLocked: false,
        // Transition
        transitionIn: layer.transitionIn || { type: "fade", duration: 0.5, easing: "power2Out" },
        effects: Array.isArray(layer.effects) ? layer.effects : [],
      };

      globalLayers.push(motionLayer);

      // Process Keyframe animations with global timeline offsets
      if (Array.isArray(layer.animations)) {
        layer.animations.forEach((anim) => {
          const property = anim.property;
          const easing = anim.easing || "power2Out";

          if (Array.isArray(anim.keyframes)) {
            anim.keyframes.forEach((kf, kfIdx) => {
              const globalKfTime = Number((scene.startTime + Number(kf.time)).toFixed(2));
              globalKeyframes.push({
                id: `kf_${layerId}_${property}_${kfIdx}`,
                objectId: layerId,
                property,
                time: Math.min(totalDuration, Math.max(0, globalKfTime)),
                value: Number(kf.value),
                easing,
              });
            });
          }
        });
      }
    });
  });

  const projectId = "proj_ai_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);

  const fullProject = {
    id: projectId,
    name: projMeta.title || "AI Motion Graphics Composition",
    description: projMeta.description || "Generated via Google Gemini Prompt-to-Motion",
    aspectRatio,
    width: dimensions.width,
    height: dimensions.height,
    fps,
    duration: totalDuration,
    backgroundColor: projMeta.backgroundColor || "#09090b",
    layers: globalLayers,
    keyframes: globalKeyframes,
    scenes: processedScenes,
    audioRecommendations: audioRecommendations || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isAiGenerated: true,
    thumbnailGradient: "from-purple-600 via-indigo-600 to-cyan-500",
  };

  return fullProject;
}
