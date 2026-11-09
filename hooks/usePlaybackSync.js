"use client";

import { useMemo } from "react";
import { useAnimationStore } from "@/store/useAnimationStore";
import { useEditorStore } from "@/store/useEditorStore";
import { evaluateLayerAtTime } from "@/engine/keyframes";
import { evaluateLayerTransitions } from "@/engine/transitions";
import { evaluateLayerEffects } from "@/engine/effects";
import { evaluateMotionPathAtProgress } from "@/engine/advanced/motionPath";
import { evaluateExpression } from "@/engine/advanced/expressionEngine";
import { applyParentTransform } from "@/engine/advanced/transformHierarchy";

/**
 * Hook to retrieve live-evaluated animated layers, effects, transitions, procedural expressions,
 * motion paths, and hierarchical parent-child transforms for real-time 60 FPS Konva rendering.
 */
export function useEvaluatedLayers() {
  const layers = useEditorStore((s) => s.layers);
  const currentTime = useAnimationStore((s) => s.currentTime);
  const keyframes = useAnimationStore((s) => s.keyframes);

  return useMemo(() => {
    // First pass: evaluate keyframes, motion paths, and procedural expressions
    const intermediateLayers = layers.map((layer) => {
      const startTime = Number(layer.startTime ?? 0);
      const duration = Number(layer.duration ?? 999999);
      const isWithinClip =
        currentTime >= startTime - 0.001 &&
        currentTime <= startTime + duration + 0.001;

      // If outside clip range, hide from canvas during playback/preview
      if (!isWithinClip) {
        return { ...layer, visible: false };
      }

      // 1. Evaluate keyframed base properties
      const layerKfs = keyframes?.filter((k) => k.objectId === layer.id) || [];
      let evaluated =
        layerKfs.length > 0
          ? evaluateLayerAtTime(layer, layerKfs, currentTime)
          : { ...layer };

      // 2. Evaluate Motion Path (if enabled)
      if (layer.motionPath && Array.isArray(layer.motionPath.waypoints) && layer.motionPath.waypoints.length >= 2) {
        const pathDuration = Number(layer.motionPath.duration) || duration || 5.0;
        const pathProgress = Math.max(0, Math.min(1, (currentTime - startTime) / pathDuration));
        const pathPos = evaluateMotionPathAtProgress(layer.motionPath, pathProgress);
        if (pathPos) {
          evaluated.x = pathPos.x;
          evaluated.y = pathPos.y;
          if (layer.motionPath.autoOrient !== false) {
            evaluated.rotation = pathPos.angle;
          }
        }
      }

      // 3. Evaluate Procedural Expressions (if enabled)
      if (layer.expression && layer.expression.enabled !== false) {
        const targetProp = layer.expression.property || "y";
        const currentBase = evaluated[targetProp] ?? (targetProp === "scaleX" || targetProp === "scaleY" || targetProp === "opacity" ? 1 : 0);
        evaluated[targetProp] = evaluateExpression(
          layer.expression,
          evaluated,
          layers,
          currentTime,
          currentBase
        );
      }

      // 4. Evaluate in/out transitions
      const withTransitions = evaluateLayerTransitions(evaluated, currentTime);

      // 5. Evaluate effects stack (Glow, Neon, Shadow, Flicker, Particles, Filters)
      const {
        evaluatedLayer,
        particles,
        lightLeak,
        customFilterFn,
        hasFilters,
      } = evaluateLayerEffects(withTransitions, currentTime);

      return {
        ...evaluatedLayer,
        _particles: particles,
        _lightLeak: lightLeak,
        _customFilterFn: customFilterFn,
        _hasFilters: hasFilters,
        _clipRect: withTransitions.clipRect,
        _circularClip: withTransitions.circularClip,
        _sweepProgress: withTransitions.sweepProgress,
        _transitionBlur: withTransitions.transitionBlur,
        _transitionGlitch: withTransitions.transitionGlitch,
      };
    });

    // Second pass: apply parent-child transformation inheritance if parentId exists
    return intermediateLayers.map((layer) => {
      if (layer.parentId) {
        const parent = intermediateLayers.find((p) => p.id === layer.parentId);
        if (parent) {
          return applyParentTransform(layer, parent);
        }
      }
      return layer;
    });
  }, [layers, keyframes, currentTime]);
}
