/**
 * Professional Procedural Expression Engine for MotionLab
 * Pure parameter-based mathematics.
 * Strictly adheres to security rules: ZERO eval(), ZERO Function constructors.
 */

export const EXPRESSION_TYPES = [
  {
    type: "sineWave",
    name: "Sine Wave (Harmonic)",
    description: "Smooth sinusoidal oscillation around base value.",
    applicableProps: ["y", "x", "rotation", "scaleX", "scaleY", "opacity"],
    defaultParams: { amplitude: 60, frequency: 1.0, phase: 0 },
    paramSchema: [
      { key: "amplitude", label: "Amplitude", type: "number", min: 1, max: 500, step: 5, unit: "px" },
      { key: "frequency", label: "Frequency", type: "number", min: 0.1, max: 10, step: 0.1, unit: "Hz" },
      { key: "phase", label: "Phase Offset", type: "number", min: 0, max: 360, step: 15, unit: "°" },
    ],
  },
  {
    type: "cosineWave",
    name: "Cosine Wave (Phase Shifted)",
    description: "Cosine oscillation (90° shifted from sine, ideal for circular orbits).",
    applicableProps: ["x", "y", "scaleX", "scaleY", "rotation"],
    defaultParams: { amplitude: 60, frequency: 1.0, phase: 0 },
    paramSchema: [
      { key: "amplitude", label: "Amplitude", type: "number", min: 1, max: 500, step: 5, unit: "px" },
      { key: "frequency", label: "Frequency", type: "number", min: 0.1, max: 10, step: 0.1, unit: "Hz" },
      { key: "phase", label: "Phase Offset", type: "number", min: 0, max: 360, step: 15, unit: "°" },
    ],
  },
  {
    type: "oscillation",
    name: "Damped Oscillation",
    description: "Decaying spring-like oscillation that smoothly settles over time.",
    applicableProps: ["y", "x", "rotation", "scaleX", "scaleY"],
    defaultParams: { amplitude: 100, frequency: 2.0, decay: 0.8 },
    paramSchema: [
      { key: "amplitude", label: "Peak Amplitude", type: "number", min: 10, max: 500, step: 10, unit: "px" },
      { key: "frequency", label: "Frequency", type: "number", min: 0.2, max: 8, step: 0.2, unit: "Hz" },
      { key: "decay", label: "Decay Rate", type: "number", min: 0.1, max: 3.0, step: 0.1, unit: "s⁻¹" },
    ],
  },
  {
    type: "rotationLoop",
    name: "Continuous Rotation Loop",
    description: "Constant angular rotation speed across timeline.",
    applicableProps: ["rotation"],
    defaultParams: { speed: 120, clockwise: 1 },
    paramSchema: [
      { key: "speed", label: "Speed", type: "number", min: 10, max: 720, step: 10, unit: "°/s" },
      { key: "clockwise", label: "Direction", type: "select", options: [{ label: "Clockwise", value: 1 }, { label: "Counter-Clockwise", value: -1 }] },
    ],
  },
  {
    type: "randomMotion",
    name: "Perlin-style Jitter (Wiggle)",
    description: "Organic smooth pseudo-random camera shake / floating motion.",
    applicableProps: ["x", "y", "rotation", "scaleX", "scaleY"],
    defaultParams: { intensity: 25, speed: 2.5, seed: 42 },
    paramSchema: [
      { key: "intensity", label: "Jitter Amount", type: "number", min: 1, max: 150, step: 1, unit: "px" },
      { key: "speed", label: "Wiggle Speed", type: "number", min: 0.2, max: 10, step: 0.2, unit: "Hz" },
      { key: "seed", label: "Random Seed", type: "number", min: 1, max: 999, step: 1, unit: "" },
    ],
  },
  {
    type: "bounce",
    name: "Gravity Bounce",
    description: "Physical gravity drop with restitution bounces on the floor.",
    applicableProps: ["y"],
    defaultParams: { height: 250, bounceCount: 3, period: 1.5, floorY: 0 },
    paramSchema: [
      { key: "height", label: "Drop Height", type: "number", min: 50, max: 800, step: 25, unit: "px" },
      { key: "period", label: "Bounce Duration", type: "number", min: 0.5, max: 4.0, step: 0.2, unit: "s" },
      { key: "bounceCount", label: "Bounces", type: "number", min: 1, max: 6, step: 1, unit: "" },
    ],
  },
  {
    type: "spring",
    name: "Hooke's Spring Physics",
    description: "Harmonic spring mass simulation with damping ratio.",
    applicableProps: ["scaleX", "scaleY", "y", "x"],
    defaultParams: { stiffness: 150, damping: 12, mass: 1 },
    paramSchema: [
      { key: "stiffness", label: "Stiffness (k)", type: "number", min: 20, max: 400, step: 10, unit: "" },
      { key: "damping", label: "Damping (c)", type: "number", min: 2, max: 50, step: 1, unit: "" },
      { key: "mass", label: "Mass (m)", type: "number", min: 0.5, max: 5, step: 0.5, unit: "kg" },
    ],
  },
  {
    type: "followObject",
    name: "Follow Layer Target",
    description: "Smoothly lags and follows another layer's canvas coordinates.",
    applicableProps: ["x", "y"],
    defaultParams: { targetLayerId: null, lagSeconds: 0.2, offsetX: 0, offsetY: 0 },
    paramSchema: [
      { key: "targetLayerId", label: "Target Layer", type: "layerSelect" },
      { key: "lagSeconds", label: "Follow Delay", type: "number", min: 0.05, max: 1.5, step: 0.05, unit: "s" },
      { key: "offsetX", label: "Offset X", type: "number", min: -500, max: 500, step: 10, unit: "px" },
      { key: "offsetY", label: "Offset Y", type: "number", min: -500, max: 500, step: 10, unit: "px" },
    ],
  },
  {
    type: "lookAt",
    name: "Look At Target",
    description: "Continuously points/aims rotation toward a target layer.",
    applicableProps: ["rotation"],
    defaultParams: { targetLayerId: null, angleOffset: 0 },
    paramSchema: [
      { key: "targetLayerId", label: "Target Layer", type: "layerSelect" },
      { key: "angleOffset", label: "Angle Offset", type: "number", min: -180, max: 180, step: 15, unit: "°" },
    ],
  },
  {
    type: "repeatingPulse",
    name: "Repeating Pulse / Beat",
    description: "Rhythmic scale expansion and contraction matching tempo.",
    applicableProps: ["scaleX", "scaleY", "opacity"],
    defaultParams: { bpm: 120, pulseScale: 0.25, sharpness: 3 },
    paramSchema: [
      { key: "bpm", label: "Tempo (BPM)", type: "number", min: 40, max: 240, step: 1, unit: "BPM" },
      { key: "pulseScale", label: "Pulse Depth", type: "number", min: 0.05, max: 1.0, step: 0.05, unit: "" },
      { key: "sharpness", label: "Snappiness", type: "number", min: 1, max: 8, step: 1, unit: "" },
    ],
  },
];

/**
 * Deterministic pseudo-random 1D noise based on sine permutation
 */
function pseudoNoise(t, seed = 42) {
  const n = Math.sin(t * 12.9898 + seed * 78.233) * 43758.5453;
  return (n - Math.floor(n)) * 2 - 1; // -1 to 1
}

/**
 * Smooth interpolated noise
 */
function smoothNoise(t, seed = 42) {
  const i = Math.floor(t);
  const f = t - i;
  // Cubic hermite curve
  const u = f * f * (3 - 2 * f);
  const n0 = pseudoNoise(i, seed);
  const n1 = pseudoNoise(i + 1, seed);
  return n0 + (n1 - n0) * u;
}

/**
 * Evaluates an expression for a specific property of a layer at given time.
 * Returns evaluated value or fallback if expression is inactive.
 */
export function evaluateExpression(expr, layer, allLayers = [], currentTime = 0, baseValue = 0) {
  if (!expr || expr.enabled === false) {
    return baseValue;
  }

  const t = Math.max(0, currentTime - Number(layer.startTime ?? 0));
  const params = expr.params || {};

  switch (expr.type) {
    case "sineWave": {
      const amp = Number(params.amplitude ?? 60);
      const freq = Number(params.frequency ?? 1.0);
      const phaseRad = ((Number(params.phase ?? 0)) * Math.PI) / 180;
      const offset = amp * Math.sin(2 * Math.PI * freq * t + phaseRad);
      return Number((Number(baseValue) + offset).toFixed(2));
    }

    case "cosineWave": {
      const amp = Number(params.amplitude ?? 60);
      const freq = Number(params.frequency ?? 1.0);
      const phaseRad = ((Number(params.phase ?? 0)) * Math.PI) / 180;
      const offset = amp * Math.cos(2 * Math.PI * freq * t + phaseRad);
      return Number((Number(baseValue) + offset).toFixed(2));
    }

    case "oscillation": {
      const amp = Number(params.amplitude ?? 100);
      const freq = Number(params.frequency ?? 2.0);
      const decay = Number(params.decay ?? 0.8);
      const envelope = Math.exp(-decay * t);
      const offset = amp * envelope * Math.cos(2 * Math.PI * freq * t);
      return Number((Number(baseValue) + offset).toFixed(2));
    }

    case "rotationLoop": {
      const speed = Number(params.speed ?? 120);
      const dir = Number(params.clockwise ?? 1);
      const rot = (Number(baseValue) + dir * speed * t) % 360;
      return Number(rot.toFixed(1));
    }

    case "randomMotion": {
      const intensity = Number(params.intensity ?? 25);
      const speed = Number(params.speed ?? 2.5);
      const seed = Number(params.seed ?? 42);
      // Dual-octave smooth noise
      const n1 = smoothNoise(t * speed, seed);
      const n2 = smoothNoise(t * speed * 2.3, seed + 101) * 0.5;
      const jitter = (n1 + n2) * intensity;
      return Number((Number(baseValue) + jitter).toFixed(2));
    }

    case "bounce": {
      const h = Number(params.height ?? 250);
      const period = Math.max(0.2, Number(params.period ?? 1.5));
      const normalizedT = (t % period) / period; // 0 to 1
      // Absolute sine bounce curve
      const bounce = h * Math.abs(Math.sin(Math.PI * normalizedT)) * Math.pow(1 - normalizedT, 0.5);
      return Number((Number(baseValue) - bounce).toFixed(2));
    }

    case "spring": {
      const k = Number(params.stiffness ?? 150);
      const c = Number(params.damping ?? 12);
      const m = Math.max(0.1, Number(params.mass ?? 1));
      const omega0 = Math.sqrt(k / m);
      const zeta = c / (2 * Math.sqrt(k * m));

      let displacement = 0;
      if (zeta < 1) {
        // Underdamped
        const omegaD = omega0 * Math.sqrt(1 - zeta * zeta);
        displacement = Math.exp(-zeta * omega0 * t) * Math.cos(omegaD * t);
      } else {
        // Critically damped / Overdamped
        displacement = Math.exp(-omega0 * t);
      }
      return Number((Number(baseValue) * (1 - displacement * 0.5)).toFixed(3));
    }

    case "followObject": {
      const targetId = params.targetLayerId;
      if (!targetId) return baseValue;
      const target = allLayers.find((l) => l.id === targetId);
      if (!target) return baseValue;

      const prop = expr.property || "x";
      const targetVal = Number(target[prop] ?? 0);
      const offset = prop === "x" ? Number(params.offsetX ?? 0) : Number(params.offsetY ?? 0);
      const lag = Math.max(0.01, Number(params.lagSeconds ?? 0.2));
      // Exponential smoothing factor
      const alpha = Math.min(1, 1 / (lag * 60 + 1));
      return Number((Number(baseValue) + (targetVal + offset - Number(baseValue)) * alpha).toFixed(2));
    }

    case "lookAt": {
      const targetId = params.targetLayerId;
      if (!targetId) return baseValue;
      const target = allLayers.find((l) => l.id === targetId);
      if (!target) return baseValue;

      const dx = (target.x ?? 0) - (layer.x ?? 0);
      const dy = (target.y ?? 0) - (layer.y ?? 0);
      const rad = Math.atan2(dy, dx);
      const deg = (rad * 180) / Math.PI + Number(params.angleOffset ?? 0);
      return Number(deg.toFixed(1));
    }

    case "repeatingPulse": {
      const bpm = Number(params.bpm ?? 120);
      const pulseScale = Number(params.pulseScale ?? 0.25);
      const sharpness = Number(params.sharpness ?? 3);
      const beatPeriod = 60 / bpm;
      const beatProgress = (t % beatPeriod) / beatPeriod; // 0 to 1
      const attackDecay = Math.pow(1 - beatProgress, sharpness);
      const pulse = pulseScale * attackDecay;
      return Number((Number(baseValue) + pulse).toFixed(3));
    }

    default:
      return baseValue;
  }
}
