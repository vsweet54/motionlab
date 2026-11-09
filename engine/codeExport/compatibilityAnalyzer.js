/**
 * Professional Code Compatibility Analyzer for MotionLab
 * Analyzes project capabilities against target export formats (JSON, SVG, HTML+CSS, GSAP JS, React).
 * Never silently discards incompatible features; produces clear transparency ratings and notices.
 */

export const EXPORT_FORMATS = [
  {
    id: "json",
    label: "JSON Project Bundle",
    extension: ".json",
    description: "Complete lossless project data including layers, keyframes, audio metadata, effects & settings.",
  },
  {
    id: "svg",
    label: "Vector SVG Document",
    extension: ".svg",
    description: "Standard W3C SVG with vector shapes, styling, transforms, and SMIL keyframe animations.",
  },
  {
    id: "html_css",
    label: "HTML5 + CSS Keyframes",
    extension: ".html",
    description: "Zero-dependency standalone HTML webpage with pure CSS @keyframes animations.",
  },
  {
    id: "javascript_gsap",
    label: "GSAP JavaScript Animation",
    extension: ".js",
    description: "Production GSAP 3 timeline script with HTML template and CDN dependencies.",
  },
  {
    id: "react_component",
    label: "React Animation Component",
    extension: ".jsx",
    description: "Self-contained React component with GSAP lifecycle hooks, props, and install instructions.",
  },
];

/**
 * Analyzes active project against a specific target export format.
 * Returns { status: 'compatible'|'partially_compatible'|'unsupported', score: 0..100, warnings: [], supportedFeatures: [], limitations: [] }
 */
export function analyzeExportCompatibility(project, layers = [], keyframes = [], format = "json") {
  const warnings = [];
  const supportedFeatures = [];
  const limitations = [];

  const hasAudio = layers.some((l) => l.type === "audio");
  const hasEffects = layers.some((l) => Array.isArray(l.effects) && l.effects.length > 0);
  const hasExpressions = layers.some((l) => !!l.expression && l.expression.enabled !== false);
  const hasMotionPaths = layers.some((l) => !!l.motionPath);
  const hasParticles = layers.some((l) => l.effects?.some((e) => e.type === "particles"));
  const hasExternalImages = layers.some((l) => l.type === "image" && l.src);
  const hasRotations = keyframes.some((k) => k.property === "rotation");
  const hasColors = keyframes.some((k) => k.property === "fill" || k.property === "stroke");

  switch (format) {
    case "json":
      supportedFeatures.push("100% full project state fidelity", "Audio metadata preservation", "All visual effects & particle configs", "All keyframes, easing & motion paths");
      return {
        status: "compatible",
        score: 100,
        warnings: [],
        supportedFeatures,
        limitations: [],
      };

    case "svg":
      supportedFeatures.push("Vector geometries (<rect>, <circle>, <ellipse>, <polygon>, <path>)", "Text rendering & font sizing", "SVG SMIL <animateTransform> for position, scale, rotation", "Opacity & Fill color transitions");

      if (hasAudio) {
        warnings.push("SVG format does not support audio tracks. Audio will be omitted.");
        limitations.push("Audio tracks are stripped.");
      }
      if (hasEffects) {
        warnings.push("Complex canvas shaders (Glitch, Light Leak, CRT, Bloom) cannot be represented in standard SVG.");
        limitations.push("Custom effects simplified to drop-shadow and Gaussian blur filters.");
      }
      if (hasParticles) {
        warnings.push("Particle systems cannot be converted into static/SMIL SVG.");
        limitations.push("Particles omitted.");
      }
      if (hasExpressions) {
        warnings.push("Procedural expressions (wiggles, harmonic oscillators) are sampled as discrete keyframe approximations.");
      }

      return {
        status: warnings.length > 2 ? "partially_compatible" : "compatible",
        score: Math.max(50, 100 - warnings.length * 15),
        warnings,
        supportedFeatures,
        limitations,
      };

    case "html_css":
      supportedFeatures.push("Pure CSS @keyframes animations (GPU accelerated)", "Transforms: translation (x,y), scale, rotation", "Opacity & Color fades", "Web fonts & Typography formatting", "Responsive container sizing");

      if (hasAudio) {
        warnings.push("Pure HTML+CSS does not include automatic audio synchronization without JavaScript.");
        limitations.push("Audio track included as standard HTML5 <audio> element.");
      }
      if (hasParticles) {
        warnings.push("Dynamic canvas particle simulations require JavaScript/WebGL and cannot be compiled to pure CSS.");
        limitations.push("Particle systems omitted in CSS mode.");
      }
      if (hasEffects) {
        warnings.push("WebGL effects (Glitch, RGB Split, Neon Glow) are approximated using CSS filter (blur, drop-shadow, brightness).");
      }
      if (hasMotionPaths) {
        supportedFeatures.push("CSS offset-path (Motion Path) supported in modern Chromium & WebKit browsers.");
      }

      return {
        status: warnings.length > 2 ? "partially_compatible" : "compatible",
        score: Math.max(55, 100 - warnings.length * 12),
        warnings,
        supportedFeatures,
        limitations,
      };

    case "javascript_gsap":
      supportedFeatures.push("Native GSAP 3 Timeline orchestration", "Smooth cubic-bezier & custom easing", "Full 60 FPS transform & color tweening", "Audio playhead synchronization via Web Audio / HTMLAudio", "Loop, reverse, and stagger playback controls");

      if (hasParticles) {
        warnings.push("Particle physics requires an extra Canvas 2D render loop alongside GSAP DOM tweens.");
      }
      if (hasExpressions) {
        supportedFeatures.push("Procedural expressions compiled into GSAP ticker listeners.");
      }

      return {
        status: "compatible",
        score: Math.max(75, 100 - warnings.length * 8),
        warnings,
        supportedFeatures,
        limitations,
      };

    case "react_component":
      supportedFeatures.push("Modular React JSX/TSX component", "Clean lifecycle cleanup (useGSAP / useEffect)", "Interactive props (autoPlay, loop, width, height)", "Next.js & Vite SSR compatibility");

      if (hasAudio) {
        supportedFeatures.push("Embedded audio player ref with synchronized playback.");
      }
      if (hasParticles) {
        warnings.push("Particle simulations rendered on an embedded <canvas> overlay.");
      }

      return {
        status: "compatible",
        score: Math.max(80, 100 - warnings.length * 7),
        warnings,
        supportedFeatures,
        limitations,
      };

    default:
      return {
        status: "unsupported",
        score: 0,
        warnings: ["Unknown export target format."],
        supportedFeatures: [],
        limitations: [],
      };
  }
}
