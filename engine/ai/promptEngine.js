/**
 * MotionLab AI Prompt Engine & System Prompt
 * Directs Google Gemini to act as a professional Motion Graphics Designer, Art Director, and Animation Planner.
 */

export const AI_VISUAL_STYLES = [
  { id: "modern_corporate", label: "Modern Corporate", desc: "Clean geometric layouts, subtle gradients, polished professional typography" },
  { id: "minimalist", label: "Minimalist", desc: "High whitespace, stark contrast, purposeful restrained kinetic motion" },
  { id: "cinematic", label: "Cinematic Motion Graphics", desc: "Dramatic lighting, particle glow, deep atmospheric colors, rich depth" },
  { id: "educational", label: "Educational / Science", desc: "Diagrammatic visual aids, informative callouts, step-by-step clarity" },
  { id: "infographic", label: "Data & Infographic", desc: "Dynamic bar/circle charts, metrics counters, statistical callouts" },
  { id: "typography_motion", label: "Motion Typography", desc: "Bold kinetic text, scale-pops, staggered title sequences" },
  { id: "abstract", label: "Abstract & Fluid", desc: "Geometric waves, pulsating morphs, vibrant gradient palettes" },
  { id: "futuristic_cyber", label: "Futuristic / Cyberpunk", desc: "Neon glows, HUD telemetry, scanline glitches, electric accents" },
  { id: "social_media", label: "Social Media / Viral", desc: "Fast pacing, dynamic emojis/badges, attention-grabbing hooks" },
  { id: "explainer", label: "Explainer Video", desc: "Sequential narrative storytelling, highlighted points, guided flow" },
];

export const ASPECT_RATIOS = {
  "16:9": { width: 1920, height: 1080, label: "16:9 (Landscape HD / YouTube)" },
  "9:16": { width: 1080, height: 1920, label: "9:16 (Vertical Reel / TikTok / Shorts)" },
  "1:1": { width: 1080, height: 1080, label: "1:1 (Square Feed / Instagram)" },
  "4:5": { width: 1080, height: 1350, label: "4:5 (Portrait Feed)" },
};

export const MOTIONLAB_SYSTEM_INSTRUCTION = `You are the Lead Motion Graphics Art Director and Technical Animation Engine for MotionLab, a professional 60fps in-browser motion studio.
Your role is to translate natural language user requests into a complete, executable, multi-scene motion graphics composition.

### Canvas Coordinate & Design Rules:
1. Coordinates:
   - Top-left is (0, 0).
   - Canvas center is (width/2, height/2).
   - For 1920x1080: Center is (960, 540).
   - For 1080x1920: Center is (540, 960).
   - Position layers intentionally: titles should be centered or placed in readable safe zones.
2. Layer Types Supported:
   - "text": Must have "text", "fontSize" (e.g. 28 to 110), "fontFamily" ("Inter", "sans-serif"), "fontWeight" ("bold", "600", "normal"), "fill" (hex color), "align" ("center", "left", "right").
   - "rect": Standard boxes, accent divider lines, cards. Has "width", "height", "fill", "cornerRadius" (optional).
   - "circle": Circular badges, node points, pulsating focal points. Has "radius" or "width"/"height", "fill".
   - "star": Decorative accents. Has "numPoints" (usually 4 to 6), "innerRadius", "outerRadius", "fill".
   - "polygon": Hexagons, triangles, diamonds. Has "sides" (e.g. 3, 6), "radius", "fill".
3. Timing & Keyframe Animation Rules:
   - Animatable properties: "x", "y", "scaleX", "scaleY", "rotation", "opacity".
   - Keyframe times MUST be within [0, scene.duration] seconds relative to the scene's start.
   - Every animated layer should have at least 2 keyframes per animated property (e.g., entrance from 0 to 0.8s, hold or settle).
   - Supported easings: "power2Out", "backOut", "elasticOut", "power1InOut", "linear", "easeInOut".
4. Visual Composition:
   - Maintain strong visual contrast with dark background (#09090b or deep dark palette).
   - Include 2 to 5 distinct sequential scenes that tell a coherent story.
   - Add purposeful layers: Background accent elements, focal subject, headline text, explanatory subtitle, and metric/badge chips.
5. Transitions & Effects:
   - Supported layer transitions: "fade", "zoom", "slide" (direction: "left", "right", "up", "down").
   - Supported effects: "glow" (color, radius), "gaussianBlur" (radius), "shadow" (blur, offsetX, offsetY).
6. Security Constraints:
   - Output PURE JSON adhering strictly to the JSON schema.
   - DO NOT include raw executable JavaScript or HTML tags.`;

/**
 * Builds the user prompt sent to Gemini with explicit design parameters.
 */
export function buildMotionGenerationPrompt({
  userPrompt,
  duration = 15,
  aspectRatio = "16:9",
  fps = 60,
  visualStyle = "modern_corporate",
  language = "en",
  sceneCount = "auto",
}) {
  const dimensions = ASPECT_RATIOS[aspectRatio] || ASPECT_RATIOS["16:9"];
  const styleObj = AI_VISUAL_STYLES.find((s) => s.id === visualStyle) || AI_VISUAL_STYLES[0];

  return `User Request: "${userPrompt}"

Target Technical Specifications:
- Total Composition Duration: ${duration} seconds
- Canvas Dimensions: ${dimensions.width}x${dimensions.height} (${aspectRatio})
- Frame Rate: ${fps} FPS
- Art Direction / Style: ${styleObj.label} (${styleObj.desc})
- Text Language: ${language}
- Requested Scene Count: ${sceneCount} (distribute the total ${duration} seconds evenly across scenes)

Create a production-ready motion graphics storyboard and layer timeline. Generate expressive, high-impact titles, explanatory callouts, geometric graphic elements, and smooth GSAP keyframes for every layer.`;
}
