/**
 * Professional MotionLab Transition System Definitions
 */

export const TRANSITION_TYPES = [
  {
    id: "fade",
    name: "Dissolve Fade",
    description: "Smooth alpha opacity fade in or fade out.",
    defaultDuration: 0.6,
    defaultEasing: "power2Out",
  },
  {
    id: "slide",
    name: "Slide Push",
    description: "Directional entrance/exit sliding across horizontal or vertical axis.",
    defaultDuration: 0.6,
    defaultEasing: "power3Out",
    supportsDirection: true,
  },
  {
    id: "zoom",
    name: "Scale Zoom",
    description: "Elastic or smooth scale pop from 0% to 100%.",
    defaultDuration: 0.6,
    defaultEasing: "backOut",
  },
  {
    id: "wipe",
    name: "Linear Wipe",
    description: "Sharp or soft horizontal screen wipe reveal.",
    defaultDuration: 0.7,
    defaultEasing: "power2InOut",
    supportsDirection: true,
  },
  {
    id: "circular_reveal",
    name: "Circular Iris Reveal",
    description: "Expanding circular iris mask revealing the layer from center.",
    defaultDuration: 0.8,
    defaultEasing: "power3Out",
  },
  {
    id: "glitch",
    name: "Glitch Cyber Burst",
    description: "RGB split displacement and raster glitch burst entrance.",
    defaultDuration: 0.5,
    defaultEasing: "power1InOut",
  },
  {
    id: "blur",
    name: "Defocus Blur",
    description: "Cinematic camera focus pull from heavy blur into sharpness.",
    defaultDuration: 0.7,
    defaultEasing: "power2Out",
  },
  {
    id: "spin",
    name: "Rotational Spin",
    description: "Dynamic 360-degree rotation pop into place.",
    defaultDuration: 0.7,
    defaultEasing: "backOut",
  },
  {
    id: "morph",
    name: "Morph Squash & Stretch",
    description: "Elastic dimensional deformation snapping into natural aspect ratio.",
    defaultDuration: 0.7,
    defaultEasing: "elasticOut",
  },
  {
    id: "light_sweep",
    name: "Specular Light Sweep",
    description: "High-luminance diagonal beam sweeping across the object.",
    defaultDuration: 0.8,
    defaultEasing: "power2InOut",
  },
];

export const TRANSITION_DIRECTIONS = [
  { id: "left", label: "From Left" },
  { id: "right", label: "From Right" },
  { id: "up", label: "From Top" },
  { id: "down", label: "From Bottom" },
];
