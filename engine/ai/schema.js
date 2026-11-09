/**
 * Gemini JSON Output Schema & Validator for MotionLab
 * Strictly enforces valid layers, numbers, supported layer types, and timeline constraints.
 */

export const GEMINI_MOTION_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    project: {
      type: "object",
      properties: {
        title: { type: "string" },
        description: { type: "string" },
        duration: { type: "number" },
        fps: { type: "number" },
        aspectRatio: { type: "string" },
        backgroundColor: { type: "string" },
      },
      required: ["title", "duration", "aspectRatio"],
    },
    scenes: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          duration: { type: "number" },
          description: { type: "string" },
          backgroundColor: { type: "string" },
          layers: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                name: { type: "string" },
                type: { type: "string", enum: ["text", "rect", "circle", "star", "polygon"] },
                x: { type: "number" },
                y: { type: "number" },
                width: { type: "number" },
                height: { type: "number" },
                rotation: { type: "number" },
                opacity: { type: "number" },
                fill: { type: "string" },
                stroke: { type: "string" },
                strokeWidth: { type: "number" },
                // text attributes
                text: { type: "string" },
                fontSize: { type: "number" },
                fontFamily: { type: "string" },
                fontWeight: { type: "string" },
                align: { type: "string", enum: ["center", "left", "right"] },
                // shape attributes
                cornerRadius: { type: "number" },
                radius: { type: "number" },
                sides: { type: "number" },
                numPoints: { type: "number" },
                innerRadius: { type: "number" },
                outerRadius: { type: "number" },
                // timing within scene
                startTime: { type: "number" },
                duration: { type: "number" },
                // transition
                transitionIn: {
                  type: "object",
                  properties: {
                    type: { type: "string", enum: ["fade", "slide", "zoom"] },
                    duration: { type: "number" },
                    direction: { type: "string" },
                    easing: { type: "string" },
                  },
                },
                // animations
                animations: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      property: { type: "string", enum: ["x", "y", "scaleX", "scaleY", "rotation", "opacity"] },
                      easing: { type: "string" },
                      keyframes: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            time: { type: "number" },
                            value: { type: "number" },
                          },
                          required: ["time", "value"],
                        },
                      },
                    },
                    required: ["property", "keyframes"],
                  },
                },
              },
              required: ["id", "type", "x", "y"],
            },
          },
        },
        required: ["id", "name", "duration", "layers"],
      },
    },
    audioRecommendations: {
      type: "object",
      properties: {
        mood: { type: "string" },
        tempoBpm: { type: "number" },
        soundEffects: {
          type: "array",
          items: {
            type: "object",
            properties: {
              time: { type: "number" },
              type: { type: "string" },
              description: { type: "string" },
            },
          },
        },
      },
    },
    warnings: {
      type: "array",
      items: { type: "string" },
    },
  },
  required: ["project", "scenes"],
};

/**
 * Validates raw AI JSON output against security and numerical bounds.
 */
export function validateMotionResponse(data) {
  if (!data || typeof data !== "object") {
    throw new Error("Invalid response format: root must be a JSON object.");
  }

  if (!data.project || typeof data.project !== "object") {
    throw new Error("Missing 'project' metadata in AI response.");
  }

  if (!Array.isArray(data.scenes) || data.scenes.length === 0) {
    throw new Error("AI response must contain at least one valid scene in 'scenes' array.");
  }

  const warnings = [];

  // Validate and sanitize scenes
  data.scenes.forEach((scene, sIdx) => {
    scene.id = scene.id || `scene_${sIdx + 1}`;
    scene.name = scene.name || `Scene ${sIdx + 1}`;
    scene.duration = Math.max(1.0, Number(scene.duration) || 3.0);
    scene.layers = Array.isArray(scene.layers) ? scene.layers : [];

    // Sanitize and validate layers
    scene.layers.forEach((layer, lIdx) => {
      layer.id = layer.id || `layer_s${sIdx + 1}_${lIdx + 1}`;
      layer.type = ["text", "rect", "circle", "star", "polygon"].includes(layer.type) ? layer.type : "rect";
      layer.x = Number(layer.x) || 960;
      layer.y = Number(layer.y) || 540;
      layer.rotation = Number(layer.rotation) || 0;
      layer.opacity = Math.max(0, Math.min(1, Number(layer.opacity ?? 1)));
      layer.scaleX = Number(layer.scaleX ?? 1);
      layer.scaleY = Number(layer.scaleY ?? 1);

      // Validate keyframes bounds
      if (Array.isArray(layer.animations)) {
        layer.animations.forEach((anim) => {
          if (Array.isArray(anim.keyframes)) {
            anim.keyframes.forEach((kf) => {
              kf.time = Math.max(0, Math.min(scene.duration, Number(kf.time) || 0));
              kf.value = Number(kf.value) || 0;
            });
          }
        });
      }
    });
  });

  return { isValid: true, data, warnings };
}
