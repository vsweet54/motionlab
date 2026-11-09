import { createKeyframe } from "@/engine/keyframes";

export const ANIMATION_PRESETS = [
  {
    id: "fade-in",
    name: "Fade In",
    category: "Opacity",
    description: "Smoothly transitions opacity from 0% to 100%",
    generate: (layer, startTime = 0, duration = 1.0) => [
      createKeyframe({
        objectId: layer.id,
        property: "opacity",
        time: startTime,
        value: 0,
        easing: "power2Out",
      }),
      createKeyframe({
        objectId: layer.id,
        property: "opacity",
        time: startTime + duration,
        value: layer.opacity ?? 1,
        easing: "power2Out",
      }),
    ],
  },
  {
    id: "fade-out",
    name: "Fade Out",
    category: "Opacity",
    description: "Transitions opacity from 100% to 0%",
    generate: (layer, startTime = 0, duration = 1.0) => [
      createKeyframe({
        objectId: layer.id,
        property: "opacity",
        time: startTime,
        value: layer.opacity ?? 1,
        easing: "power2In",
      }),
      createKeyframe({
        objectId: layer.id,
        property: "opacity",
        time: startTime + duration,
        value: 0,
        easing: "power2In",
      }),
    ],
  },
  {
    id: "slide-in-left",
    name: "Slide In (Left)",
    category: "Position",
    description: "Enters smoothly from the left edge of the screen",
    generate: (layer, startTime = 0, duration = 1.0) => {
      const targetX = layer.x ?? 960;
      return [
        createKeyframe({
          objectId: layer.id,
          property: "x",
          time: startTime,
          value: targetX - 600,
          easing: "power3Out",
        }),
        createKeyframe({
          objectId: layer.id,
          property: "x",
          time: startTime + duration,
          value: targetX,
          easing: "power3Out",
        }),
        createKeyframe({
          objectId: layer.id,
          property: "opacity",
          time: startTime,
          value: 0,
          easing: "power2Out",
        }),
        createKeyframe({
          objectId: layer.id,
          property: "opacity",
          time: startTime + duration * 0.5,
          value: layer.opacity ?? 1,
          easing: "power2Out",
        }),
      ];
    },
  },
  {
    id: "slide-in-bottom",
    name: "Slide In (Bottom)",
    category: "Position",
    description: "Slides up into place from below",
    generate: (layer, startTime = 0, duration = 1.0) => {
      const targetY = layer.y ?? 540;
      return [
        createKeyframe({
          objectId: layer.id,
          property: "y",
          time: startTime,
          value: targetY + 400,
          easing: "power3Out",
        }),
        createKeyframe({
          objectId: layer.id,
          property: "y",
          time: startTime + duration,
          value: targetY,
          easing: "power3Out",
        }),
        createKeyframe({
          objectId: layer.id,
          property: "opacity",
          time: startTime,
          value: 0,
          easing: "power2Out",
        }),
        createKeyframe({
          objectId: layer.id,
          property: "opacity",
          time: startTime + duration * 0.4,
          value: layer.opacity ?? 1,
          easing: "power2Out",
        }),
      ];
    },
  },
  {
    id: "zoom-in",
    name: "Zoom In (Pop)",
    category: "Scale",
    description: "Scales from 0x to normal size with spring overshoot",
    generate: (layer, startTime = 0, duration = 1.0) => [
      createKeyframe({
        objectId: layer.id,
        property: "scaleX",
        time: startTime,
        value: 0,
        easing: "backOut",
      }),
      createKeyframe({
        objectId: layer.id,
        property: "scaleX",
        time: startTime + duration,
        value: 1,
        easing: "backOut",
      }),
      createKeyframe({
        objectId: layer.id,
        property: "scaleY",
        time: startTime,
        value: 0,
        easing: "backOut",
      }),
      createKeyframe({
        objectId: layer.id,
        property: "scaleY",
        time: startTime + duration,
        value: 1,
        easing: "backOut",
      }),
      createKeyframe({
        objectId: layer.id,
        property: "opacity",
        time: startTime,
        value: 0,
        easing: "power2Out",
      }),
      createKeyframe({
        objectId: layer.id,
        property: "opacity",
        time: startTime + duration * 0.3,
        value: layer.opacity ?? 1,
        easing: "power2Out",
      }),
    ],
  },
  {
    id: "zoom-out",
    name: "Zoom Out (Disappear)",
    category: "Scale",
    description: "Shrinks away smoothly to zero",
    generate: (layer, startTime = 0, duration = 0.8) => [
      createKeyframe({
        objectId: layer.id,
        property: "scaleX",
        time: startTime,
        value: 1,
        easing: "power2In",
      }),
      createKeyframe({
        objectId: layer.id,
        property: "scaleX",
        time: startTime + duration,
        value: 0,
        easing: "power2In",
      }),
      createKeyframe({
        objectId: layer.id,
        property: "scaleY",
        time: startTime,
        value: 1,
        easing: "power2In",
      }),
      createKeyframe({
        objectId: layer.id,
        property: "scaleY",
        time: startTime + duration,
        value: 0,
        easing: "power2In",
      }),
    ],
  },
  {
    id: "rotate-360",
    name: "Spin 360°",
    category: "Rotation",
    description: "Completes a dynamic full 360-degree rotation",
    generate: (layer, startTime = 0, duration = 1.5) => {
      const baseRotation = layer.rotation || 0;
      return [
        createKeyframe({
          objectId: layer.id,
          property: "rotation",
          time: startTime,
          value: baseRotation,
          easing: "power2InOut",
        }),
        createKeyframe({
          objectId: layer.id,
          property: "rotation",
          time: startTime + duration,
          value: baseRotation + 360,
          easing: "power2InOut",
        }),
      ];
    },
  },
  {
    id: "bounce-drop",
    name: "Bounce Drop",
    category: "Physics",
    description: "Drops from above with realistic gravity bounce physics",
    generate: (layer, startTime = 0, duration = 1.2) => {
      const targetY = layer.y ?? 540;
      return [
        createKeyframe({
          objectId: layer.id,
          property: "y",
          time: startTime,
          value: targetY - 400,
          easing: "bounceOut",
        }),
        createKeyframe({
          objectId: layer.id,
          property: "y",
          time: startTime + duration,
          value: targetY,
          easing: "bounceOut",
        }),
      ];
    },
  },
  {
    id: "elastic-pop",
    name: "Elastic Pop",
    category: "Physics",
    description: "Organic harmonic elastic expansion and settlement",
    generate: (layer, startTime = 0, duration = 1.4) => [
      createKeyframe({
        objectId: layer.id,
        property: "scaleX",
        time: startTime,
        value: 0.2,
        easing: "elasticOut",
      }),
      createKeyframe({
        objectId: layer.id,
        property: "scaleX",
        time: startTime + duration,
        value: 1,
        easing: "elasticOut",
      }),
      createKeyframe({
        objectId: layer.id,
        property: "scaleY",
        time: startTime,
        value: 0.2,
        easing: "elasticOut",
      }),
      createKeyframe({
        objectId: layer.id,
        property: "scaleY",
        time: startTime + duration,
        value: 1,
        easing: "elasticOut",
      }),
    ],
  },
  {
    id: "pulse-heartbeat",
    name: "Pulse / Heartbeat",
    category: "Rhythm",
    description: "Rhythmic scale expansion and contraction",
    generate: (layer, startTime = 0, duration = 1.0) => [
      createKeyframe({
        objectId: layer.id,
        property: "scaleX",
        time: startTime,
        value: 1,
        easing: "easeOut",
      }),
      createKeyframe({
        objectId: layer.id,
        property: "scaleX",
        time: startTime + duration * 0.3,
        value: 1.25,
        easing: "easeInOut",
      }),
      createKeyframe({
        objectId: layer.id,
        property: "scaleX",
        time: startTime + duration * 0.6,
        value: 0.95,
        easing: "easeInOut",
      }),
      createKeyframe({
        objectId: layer.id,
        property: "scaleX",
        time: startTime + duration,
        value: 1,
        easing: "easeOut",
      }),
      createKeyframe({
        objectId: layer.id,
        property: "scaleY",
        time: startTime,
        value: 1,
        easing: "easeOut",
      }),
      createKeyframe({
        objectId: layer.id,
        property: "scaleY",
        time: startTime + duration * 0.3,
        value: 1.25,
        easing: "easeInOut",
      }),
      createKeyframe({
        objectId: layer.id,
        property: "scaleY",
        time: startTime + duration * 0.6,
        value: 0.95,
        easing: "easeInOut",
      }),
      createKeyframe({
        objectId: layer.id,
        property: "scaleY",
        time: startTime + duration,
        value: 1,
        easing: "easeOut",
      }),
    ],
  },
  {
    id: "shake-vibrate",
    name: "Camera Shake",
    category: "Glitch",
    description: "Rapid energetic coordinate oscillation",
    generate: (layer, startTime = 0, duration = 0.6) => {
      const baseX = layer.x ?? 960;
      const step = duration / 6;
      return [
        createKeyframe({ objectId: layer.id, property: "x", time: startTime, value: baseX, easing: "linear" }),
        createKeyframe({ objectId: layer.id, property: "x", time: startTime + step * 1, value: baseX - 25, easing: "linear" }),
        createKeyframe({ objectId: layer.id, property: "x", time: startTime + step * 2, value: baseX + 25, easing: "linear" }),
        createKeyframe({ objectId: layer.id, property: "x", time: startTime + step * 3, value: baseX - 15, easing: "linear" }),
        createKeyframe({ objectId: layer.id, property: "x", time: startTime + step * 4, value: baseX + 15, easing: "linear" }),
        createKeyframe({ objectId: layer.id, property: "x", time: startTime + step * 5, value: baseX - 5, easing: "linear" }),
        createKeyframe({ objectId: layer.id, property: "x", time: startTime + duration, value: baseX, easing: "linear" }),
      ];
    },
  },
  {
    id: "typewriter",
    name: "Typewriter (Text)",
    category: "Typography",
    description: "Reveals characters one-by-one sequentially (Text only)",
    generate: (layer, startTime = 0, duration = 2.0) => {
      if (layer.type !== "text") return [];
      return [
        createKeyframe({
          objectId: layer.id,
          property: "text",
          time: startTime,
          value: "",
          easing: "linear",
        }),
        createKeyframe({
          objectId: layer.id,
          property: "text",
          time: startTime + duration,
          value: layer.text || "MotionLab",
          easing: "linear",
        }),
      ];
    },
  },
];
