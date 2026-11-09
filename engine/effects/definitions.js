/**
 * Professional MotionLab Effects Engine Definitions
 * Modular visual effects with real pixel/canvas rendering implementations.
 */

export const EFFECT_CATEGORIES = [
  { id: "all", label: "All Effects" },
  { id: "blur", label: "Blur & Focus" },
  { id: "light", label: "Light & Glow" },
  { id: "distortion", label: "Distortion & Warp" },
  { id: "glitch", label: "Glitch & Artifacts" },
  { id: "texture", label: "Texture & Grain" },
  { id: "shadow", label: "Shadow & Depth" },
  { id: "color", label: "Color Grading" },
  { id: "particles", label: "Particle Systems" },
];

export const EFFECT_REGISTRY = {
  // --- BLUR ---
  gaussianBlur: {
    type: "gaussianBlur",
    name: "Gaussian Blur",
    category: "blur",
    description: "Soft multi-pass Gaussian blur on the layer canvas.",
    defaultIntensity: 1.0,
    defaultParams: {
      radius: 12, // 1 to 50 px
    },
    paramSchema: [
      { key: "radius", label: "Blur Radius", type: "number", min: 1, max: 50, step: 1, unit: "px" },
    ],
  },
  motionBlur: {
    type: "motionBlur",
    name: "Motion Blur",
    category: "blur",
    description: "Directional velocity blur simulating rapid camera or layer movement.",
    defaultIntensity: 1.0,
    defaultParams: {
      distance: 16,
      angle: 0, // 0 to 360 deg
    },
    paramSchema: [
      { key: "distance", label: "Blur Distance", type: "number", min: 1, max: 60, step: 1, unit: "px" },
      { key: "angle", label: "Angle", type: "number", min: 0, max: 360, step: 5, unit: "°" },
    ],
  },

  // --- LIGHT ---
  glow: {
    type: "glow",
    name: "Luminous Glow",
    category: "light",
    description: "Vibrant diffused ambient halo radiating outward from the object.",
    defaultIntensity: 1.0,
    defaultParams: {
      color: "#38bdf8",
      radius: 25,
      opacity: 0.9,
    },
    paramSchema: [
      { key: "color", label: "Glow Color", type: "color" },
      { key: "radius", label: "Halo Radius", type: "number", min: 5, max: 80, step: 1, unit: "px" },
      { key: "opacity", label: "Opacity", type: "number", min: 0.1, max: 1.0, step: 0.05, unit: "" },
    ],
  },
  neon: {
    type: "neon",
    name: "Cyber Neon",
    category: "light",
    description: "Intense dual-layer neon sign effect with hot core and colored glow.",
    defaultIntensity: 1.0,
    defaultParams: {
      color: "#ec4899",
      glowRadius: 30,
      coreBrightness: 1.0,
    },
    paramSchema: [
      { key: "color", label: "Neon Tube Color", type: "color" },
      { key: "glowRadius", label: "Glow Spread", type: "number", min: 10, max: 70, step: 1, unit: "px" },
      { key: "coreBrightness", label: "Core Luminance", type: "number", min: 0.5, max: 2.0, step: 0.1, unit: "" },
    ],
  },
  lightLeak: {
    type: "lightLeak",
    name: "Light Leak",
    category: "light",
    description: "Vintage film camera light burn and anamorphic colored flare overlay.",
    defaultIntensity: 0.8,
    defaultParams: {
      color: "#f97316",
      angle: 45,
      opacity: 0.65,
    },
    paramSchema: [
      { key: "color", label: "Leak Tint", type: "color" },
      { key: "angle", label: "Angle", type: "number", min: 0, max: 360, step: 15, unit: "°" },
      { key: "opacity", label: "Intensity", type: "number", min: 0.1, max: 1.0, step: 0.05, unit: "" },
    ],
  },

  // --- DISTORTION ---
  wave: {
    type: "wave",
    name: "Sine Wave Warp",
    category: "distortion",
    description: "Dynamic fluid sinusoidal oscillation across horizontal pixel lines.",
    defaultIntensity: 1.0,
    defaultParams: {
      amplitude: 12,
      frequency: 0.04,
      speed: 3.0,
    },
    paramSchema: [
      { key: "amplitude", label: "Wave Amplitude", type: "number", min: 1, max: 40, step: 1, unit: "px" },
      { key: "frequency", label: "Frequency", type: "number", min: 0.01, max: 0.1, step: 0.005, unit: "" },
      { key: "speed", label: "Wave Speed", type: "number", min: 0.5, max: 8.0, step: 0.5, unit: "x" },
    ],
  },
  ripple: {
    type: "ripple",
    name: "Water Ripple",
    category: "distortion",
    description: "Radial concentric ripple distortion expanding from object center.",
    defaultIntensity: 1.0,
    defaultParams: {
      amplitude: 10,
      wavelength: 24,
      speed: 2.5,
    },
    paramSchema: [
      { key: "amplitude", label: "Ripple Height", type: "number", min: 2, max: 30, step: 1, unit: "px" },
      { key: "wavelength", label: "Wavelength", type: "number", min: 10, max: 60, step: 2, unit: "px" },
      { key: "speed", label: "Ripple Speed", type: "number", min: 0.5, max: 6.0, step: 0.5, unit: "x" },
    ],
  },

  // --- GLITCH ---
  rgbSplit: {
    type: "rgbSplit",
    name: "RGB Split (Chromatic)",
    category: "glitch",
    description: "Prismatic color channel separation offsetting Red and Blue channels.",
    defaultIntensity: 1.0,
    defaultParams: {
      offset: 8,
      angle: 0,
    },
    paramSchema: [
      { key: "offset", label: "Channel Offset", type: "number", min: 1, max: 30, step: 1, unit: "px" },
      { key: "angle", label: "Split Angle", type: "number", min: 0, max: 360, step: 15, unit: "°" },
    ],
  },
  digitalGlitch: {
    type: "digitalGlitch",
    name: "Digital Glitch Slices",
    category: "glitch",
    description: "Cyberpunk horizontal raster slices with randomized displacement.",
    defaultIntensity: 1.0,
    defaultParams: {
      slices: 8,
      displacement: 18,
      speed: 8.0,
    },
    paramSchema: [
      { key: "slices", label: "Glitch Slices", type: "number", min: 2, max: 20, step: 1, unit: "" },
      { key: "displacement", label: "Max Shift", type: "number", min: 4, max: 40, step: 2, unit: "px" },
      { key: "speed", label: "Flicker Rate", type: "number", min: 1, max: 20, step: 1, unit: "Hz" },
    ],
  },
  flicker: {
    type: "flicker",
    name: "Strobe Flicker",
    category: "glitch",
    description: "High-frequency cinematic brightness and opacity pulse flicker.",
    defaultIntensity: 1.0,
    defaultParams: {
      frequency: 14,
      minOpacity: 0.2,
      maxOpacity: 1.0,
    },
    paramSchema: [
      { key: "frequency", label: "Pulse Frequency", type: "number", min: 2, max: 30, step: 1, unit: "Hz" },
      { key: "minOpacity", label: "Min Brightness", type: "number", min: 0.0, max: 0.8, step: 0.05, unit: "" },
    ],
  },

  // --- TEXTURE ---
  noise: {
    type: "noise",
    name: "Film Grain & Noise",
    category: "texture",
    description: "Analog film grain texture simulating 35mm cinematic footage.",
    defaultIntensity: 0.7,
    defaultParams: {
      noise: 0.25,
    },
    paramSchema: [
      { key: "noise", label: "Grain Density", type: "number", min: 0.05, max: 0.8, step: 0.05, unit: "" },
    ],
  },
  pixelate: {
    type: "pixelate",
    name: "Retro Pixelate (8-bit)",
    category: "texture",
    description: "Mosaic downscaling for retro pixel art and arcade video game aesthetics.",
    defaultIntensity: 1.0,
    defaultParams: {
      pixelSize: 8,
    },
    paramSchema: [
      { key: "pixelSize", label: "Block Size", type: "number", min: 2, max: 32, step: 1, unit: "px" },
    ],
  },

  // --- SHADOW ---
  dropShadow: {
    type: "dropShadow",
    name: "Drop Shadow 3D",
    category: "shadow",
    description: "Realistic casting depth shadow with customizable angle and blur.",
    defaultIntensity: 1.0,
    defaultParams: {
      color: "#000000",
      blur: 16,
      offsetX: 10,
      offsetY: 12,
      opacity: 0.75,
    },
    paramSchema: [
      { key: "color", label: "Shadow Color", type: "color" },
      { key: "blur", label: "Softness / Blur", type: "number", min: 0, max: 50, step: 1, unit: "px" },
      { key: "offsetX", label: "Offset X", type: "number", min: -50, max: 50, step: 1, unit: "px" },
      { key: "offsetY", label: "Offset Y", type: "number", min: -50, max: 50, step: 1, unit: "px" },
      { key: "opacity", label: "Opacity", type: "number", min: 0.1, max: 1.0, step: 0.05, unit: "" },
    ],
  },

  // --- COLOR ---
  colorAdjust: {
    type: "colorAdjust",
    name: "Color Grading (HSL)",
    category: "color",
    description: "Professional primary color correction: Brightness, Contrast, Saturation, Hue, Grayscale.",
    defaultIntensity: 1.0,
    defaultParams: {
      brightness: 0, // -100 to 100
      contrast: 0,   // -100 to 100
      saturation: 0, // -100 to 100
      hue: 0,        // 0 to 360
      grayscale: 0,  // 0 to 100
    },
    paramSchema: [
      { key: "brightness", label: "Brightness", type: "number", min: -80, max: 80, step: 2, unit: "%" },
      { key: "contrast", label: "Contrast", type: "number", min: -80, max: 80, step: 2, unit: "%" },
      { key: "saturation", label: "Saturation", type: "number", min: -100, max: 100, step: 5, unit: "%" },
      { key: "hue", label: "Hue Shift", type: "number", min: 0, max: 360, step: 10, unit: "°" },
      { key: "grayscale", label: "Grayscale", type: "number", min: 0, max: 100, step: 5, unit: "%" },
    ],
  },

  // --- PARTICLES ---
  floatingParticles: {
    type: "floatingParticles",
    name: "Floating Particles",
    category: "particles",
    description: "Ethereal ambient orbs drifting smoothly around the object.",
    defaultIntensity: 1.0,
    defaultParams: {
      count: 24,
      color: "#60a5fa",
      size: 4,
      speed: 1.2,
      spread: 120,
    },
    paramSchema: [
      { key: "count", label: "Particle Count", type: "number", min: 5, max: 60, step: 5, unit: "" },
      { key: "color", label: "Particle Tint", type: "color" },
      { key: "size", label: "Particle Size", type: "number", min: 2, max: 10, step: 1, unit: "px" },
      { key: "speed", label: "Drift Speed", type: "number", min: 0.2, max: 3.0, step: 0.2, unit: "x" },
    ],
  },
  spark: {
    type: "spark",
    name: "Spark Ignition",
    category: "particles",
    description: "High-energy electrical or fire sparks radiating dynamically.",
    defaultIntensity: 1.0,
    defaultParams: {
      count: 18,
      color: "#facc15",
      size: 3,
      speed: 2.2,
    },
    paramSchema: [
      { key: "count", label: "Spark Count", type: "number", min: 5, max: 40, step: 5, unit: "" },
      { key: "color", label: "Spark Color", type: "color" },
      { key: "speed", label: "Velocity", type: "number", min: 1.0, max: 5.0, step: 0.5, unit: "x" },
    ],
  },
  dust: {
    type: "dust",
    name: "Ambient Dust Motes",
    category: "particles",
    description: "Cinematic atmospheric dust particles illuminated by overhead light.",
    defaultIntensity: 0.6,
    defaultParams: {
      count: 30,
      color: "#e2e8f0",
      size: 2,
      speed: 0.6,
    },
    paramSchema: [
      { key: "count", label: "Dust Density", type: "number", min: 10, max: 60, step: 5, unit: "" },
      { key: "color", label: "Dust Tint", type: "color" },
      { key: "speed", label: "Float Speed", type: "number", min: 0.2, max: 2.0, step: 0.1, unit: "x" },
    ],
  },
};

/**
 * Creates a unique effect instance for an object.
 */
export function createEffect(type, customParams = {}) {
  const definition = EFFECT_REGISTRY[type];
  if (!definition) {
    throw new Error(`Unknown effect type: ${type}`);
  }

  const id = `fx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  return {
    id,
    type,
    name: definition.name,
    category: definition.category,
    enabled: true,
    intensity: definition.defaultIntensity,
    params: {
      ...definition.defaultParams,
      ...customParams,
    },
  };
}
