/**
 * Audio-Reactive Animation Engine for MotionLab
 * Generates automated keyframes synchronized with detected audio beats and amplitude peaks.
 */

import { createKeyframe } from "@/engine/keyframes";

/**
 * Generates keyframes for a target layer based on audio beat timestamps
 * @param {object} options
 * @param {string} options.targetLayerId - Target layer ID to animate
 * @param {number[]} options.beats - Array of beat timestamps in seconds
 * @param {string} options.property - 'scale' | 'opacity' | 'bounce' | 'rotation'
 * @param {number} options.intensity - Multiplier (0.5 to 2.0)
 * @param {number} options.duration - Project duration
 * @returns {object[]} Array of generated Keyframe objects
 */
export function generateAudioReactiveKeyframes({
  targetLayerId,
  beats,
  property = "scale",
  intensity = 1.0,
  duration = 5.0,
}) {
  if (!targetLayerId || !Array.isArray(beats) || beats.length === 0) {
    return [];
  }

  const generated = [];
  const validBeats = beats.filter((t) => t >= 0 && t <= duration);

  switch (property) {
    case "scale": {
      const peakScale = 1.0 + 0.3 * intensity;
      for (const beatTime of validBeats) {
        // Base state 40ms before beat
        if (beatTime - 0.04 >= 0) {
          generated.push(
            createKeyframe({
              objectId: targetLayerId,
              property: "scaleX",
              time: Number((beatTime - 0.04).toFixed(3)),
              value: 1.0,
              easing: "linear",
            }),
            createKeyframe({
              objectId: targetLayerId,
              property: "scaleY",
              time: Number((beatTime - 0.04).toFixed(3)),
              value: 1.0,
              easing: "linear",
            })
          );
        }

        // Peak pulse on beat
        generated.push(
          createKeyframe({
            objectId: targetLayerId,
            property: "scaleX",
            time: Number(beatTime.toFixed(3)),
            value: Number(peakScale.toFixed(2)),
            easing: "easeOut",
          }),
          createKeyframe({
            objectId: targetLayerId,
            property: "scaleY",
            time: Number(beatTime.toFixed(3)),
            value: Number(peakScale.toFixed(2)),
            easing: "easeOut",
          })
        );

        // Settle back 120ms after beat
        if (beatTime + 0.12 <= duration) {
          generated.push(
            createKeyframe({
              objectId: targetLayerId,
              property: "scaleX",
              time: Number((beatTime + 0.12).toFixed(3)),
              value: 1.0,
              easing: "easeIn",
            }),
            createKeyframe({
              objectId: targetLayerId,
              property: "scaleY",
              time: Number((beatTime + 0.12).toFixed(3)),
              value: 1.0,
              easing: "easeIn",
            })
          );
        }
      }
      break;
    }

    case "opacity": {
      for (const beatTime of validBeats) {
        if (beatTime - 0.05 >= 0) {
          generated.push(
            createKeyframe({
              objectId: targetLayerId,
              property: "opacity",
              time: Number((beatTime - 0.05).toFixed(3)),
              value: 0.35,
              easing: "linear",
            })
          );
        }

        generated.push(
          createKeyframe({
            objectId: targetLayerId,
            property: "opacity",
            time: Number(beatTime.toFixed(3)),
            value: 1.0,
            easing: "easeOut",
          })
        );

        if (beatTime + 0.15 <= duration) {
          generated.push(
            createKeyframe({
              objectId: targetLayerId,
              property: "opacity",
              time: Number((beatTime + 0.15).toFixed(3)),
              value: 0.35,
              easing: "easeIn",
            })
          );
        }
      }
      break;
    }

    case "bounce": {
      const hopDistance = 40 * intensity;
      for (const beatTime of validBeats) {
        generated.push(
          createKeyframe({
            objectId: targetLayerId,
            property: "y",
            time: Number(beatTime.toFixed(3)),
            value: -hopDistance,
            easing: "backOut",
          })
        );

        if (beatTime + 0.18 <= duration) {
          generated.push(
            createKeyframe({
              objectId: targetLayerId,
              property: "y",
              time: Number((beatTime + 0.18).toFixed(3)),
              value: 0,
              easing: "bounceOut",
            })
          );
        }
      }
      break;
    }

    case "rotation": {
      for (let i = 0; i < validBeats.length; i++) {
        const beatTime = validBeats[i];
        const dir = i % 2 === 0 ? 1 : -1;
        const deg = 12 * intensity * dir;

        generated.push(
          createKeyframe({
            objectId: targetLayerId,
            property: "rotation",
            time: Number(beatTime.toFixed(3)),
            value: deg,
            easing: "backOut",
          })
        );

        if (beatTime + 0.14 <= duration) {
          generated.push(
            createKeyframe({
              objectId: targetLayerId,
              property: "rotation",
              time: Number((beatTime + 0.14).toFixed(3)),
              value: 0,
              easing: "easeOut",
            })
          );
        }
      }
      break;
    }
  }

  return generated;
}
