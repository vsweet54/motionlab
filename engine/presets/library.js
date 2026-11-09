import { createEffect } from "@/engine/effects/definitions";
import { createKeyframe } from "@/engine/keyframes";

/**
 * 9 Professional Full Motion Graphics Project Presets
 * Each preset generates real editable layers, keyframes, effects, and transitions.
 */
export const MOTION_PRESETS = [
  // 1. Logo Reveal
  {
    id: "logo_reveal",
    name: "Logo Reveal",
    category: "Intros",
    description: "Circular iris reveal with cyan luminous glow, floating particles, and title pop.",
    thumbnailBg: "from-blue-600/30 to-cyan-500/10",
    tags: ["Logo", "Iris", "Glow", "Particles"],
    duration: 5.0,
    generate: (canvasW = 1920, canvasH = 1080) => {
      const cx = canvasW / 2;
      const cy = canvasH / 2;

      const logoStar = {
        id: `layer_${Date.now()}_logo`,
        name: "Logo Emblem",
        type: "star",
        x: cx,
        y: cy - 60,
        numPoints: 5,
        innerRadius: 50,
        outerRadius: 110,
        fill: "#06b6d4",
        stroke: "#22d3ee",
        strokeWidth: 4,
        startTime: 0,
        duration: 5.0,
        transitionIn: { type: "circular_reveal", duration: 0.8, easing: "power3Out" },
        transitionOut: { type: "zoom", duration: 0.6, easing: "power2In" },
        effects: [
          createEffect("glow", { color: "#38bdf8", radius: 35, opacity: 0.95 }),
          createEffect("floatingParticles", { count: 30, color: "#67e8f9", size: 4, speed: 1.5 }),
        ],
      };

      const titleText = {
        id: `layer_${Date.now()}_title`,
        name: "Brand Title",
        type: "text",
        text: "MOTIONLAB STUDIO",
        fontSize: 54,
        fontFamily: "Inter",
        fontWeight: "bold",
        align: "center",
        fill: "#ffffff",
        x: cx - 350,
        y: cy + 90,
        width: 700,
        height: 80,
        startTime: 0.5,
        duration: 4.5,
        transitionIn: { type: "slide", duration: 0.7, easing: "power3Out", direction: "up" },
        transitionOut: { type: "fade", duration: 0.5, easing: "power2In" },
        effects: [
          createEffect("glow", { color: "#0ea5e9", radius: 18, opacity: 0.8 }),
        ],
      };

      const keyframes = [
        createKeyframe({ objectId: logoStar.id, property: "scaleX", time: 0, value: 0.2 }),
        createKeyframe({ objectId: logoStar.id, property: "scaleX", time: 1.0, value: 1.0, easing: "backOut" }),
        createKeyframe({ objectId: logoStar.id, property: "scaleY", time: 0, value: 0.2 }),
        createKeyframe({ objectId: logoStar.id, property: "scaleY", time: 1.0, value: 1.0, easing: "backOut" }),
      ];

      return { layers: [logoStar, titleText], keyframes, duration: 5.0 };
    },
  },

  // 2. Cinematic Intro
  {
    id: "cinematic_intro",
    name: "Cinematic Intro",
    category: "Intros",
    description: "Anamorphic light leak burn with Gaussian blur focus pull and slow dramatic zoom.",
    thumbnailBg: "from-amber-600/30 to-orange-500/10",
    tags: ["Cinematic", "Light Leak", "Blur Focus"],
    duration: 6.0,
    generate: (canvasW = 1920, canvasH = 1080) => {
      const cx = canvasW / 2;
      const cy = canvasH / 2;

      const mainTitle = {
        id: `layer_${Date.now()}_cine`,
        name: "Cinematic Title",
        type: "text",
        text: "THE HORIZON",
        fontSize: 84,
        fontFamily: "Georgia",
        fontWeight: "bold",
        letterSpacing: 14,
        align: "center",
        fill: "#f8fafc",
        x: cx - 450,
        y: cy - 70,
        width: 900,
        height: 120,
        startTime: 0,
        duration: 6.0,
        transitionIn: { type: "blur", duration: 1.2, easing: "power2Out" },
        transitionOut: { type: "fade", duration: 0.8, easing: "power2In" },
        effects: [
          createEffect("lightLeak", { color: "#f97316", angle: 30, opacity: 0.7 }),
          createEffect("noise", { noise: 0.18 }),
          createEffect("dropShadow", { color: "#000000", blur: 24, offsetX: 0, offsetY: 15, opacity: 0.9 }),
        ],
      };

      const subtitle = {
        id: `layer_${Date.now()}_cinesub`,
        name: "Chapter Subtitle",
        type: "text",
        text: "A MOTION GRAPHICS GENERATION",
        fontSize: 24,
        fontFamily: "Inter",
        fontWeight: "normal",
        letterSpacing: 8,
        align: "center",
        fill: "#94a3b8",
        x: cx - 350,
        y: cy + 50,
        width: 700,
        height: 40,
        startTime: 0.8,
        duration: 5.2,
        transitionIn: { type: "fade", duration: 1.0, easing: "power2Out" },
        effects: [],
      };

      const keyframes = [
        createKeyframe({ objectId: mainTitle.id, property: "scaleX", time: 0, value: 0.95 }),
        createKeyframe({ objectId: mainTitle.id, property: "scaleX", time: 6.0, value: 1.08, easing: "linear" }),
        createKeyframe({ objectId: mainTitle.id, property: "scaleY", time: 0, value: 0.95 }),
        createKeyframe({ objectId: mainTitle.id, property: "scaleY", time: 6.0, value: 1.08, easing: "linear" }),
      ];

      return { layers: [mainTitle, subtitle], keyframes, duration: 6.0 };
    },
  },

  // 3. Neon Title
  {
    id: "neon_title",
    name: "Cyberpunk Neon",
    category: "Titles",
    description: "Vibrant neon sign tube with hot pink glow, spark ignition, and pulse heartbeat.",
    thumbnailBg: "from-pink-600/30 to-purple-500/10",
    tags: ["Neon", "Glow", "Sparks", "Pulse"],
    duration: 5.0,
    generate: (canvasW = 1920, canvasH = 1080) => {
      const cx = canvasW / 2;
      const cy = canvasH / 2;

      const neonFrame = {
        id: `layer_${Date.now()}_frame`,
        name: "Neon Border Frame",
        type: "rect",
        width: 700,
        height: 220,
        cornerRadius: 24,
        fill: "#00000000",
        stroke: "#ec4899",
        strokeWidth: 4,
        x: cx - 350,
        y: cy - 110,
        startTime: 0,
        duration: 5.0,
        transitionIn: { type: "zoom", duration: 0.6, easing: "backOut" },
        effects: [
          createEffect("neon", { color: "#ec4899", glowRadius: 32 }),
          createEffect("spark", { count: 20, color: "#f472b6", speed: 2.5 }),
        ],
      };

      const neonText = {
        id: `layer_${Date.now()}_text`,
        name: "Neon Sign Text",
        type: "text",
        text: "NEON NIGHTS",
        fontSize: 76,
        fontFamily: "Inter",
        fontWeight: "bold",
        letterSpacing: 6,
        align: "center",
        fill: "#ffffff",
        stroke: "#f472b6",
        strokeWidth: 2,
        x: cx - 325,
        y: cy - 45,
        width: 650,
        height: 90,
        startTime: 0.2,
        duration: 4.8,
        transitionIn: { type: "glitch", duration: 0.5, easing: "power2Out" },
        effects: [
          createEffect("glow", { color: "#f43f5e", radius: 28, opacity: 0.9 }),
          createEffect("flicker", { frequency: 16, minOpacity: 0.5, maxOpacity: 1.0 }),
        ],
      };

      const keyframes = [
        createKeyframe({ objectId: neonFrame.id, property: "scaleX", time: 1.5, value: 1.0 }),
        createKeyframe({ objectId: neonFrame.id, property: "scaleX", time: 1.8, value: 1.05, easing: "power2Out" }),
        createKeyframe({ objectId: neonFrame.id, property: "scaleX", time: 2.1, value: 1.0, easing: "bounceOut" }),
        createKeyframe({ objectId: neonFrame.id, property: "scaleY", time: 1.5, value: 1.0 }),
        createKeyframe({ objectId: neonFrame.id, property: "scaleY", time: 1.8, value: 1.05, easing: "power2Out" }),
        createKeyframe({ objectId: neonFrame.id, property: "scaleY", time: 2.1, value: 1.0, easing: "bounceOut" }),
      ];

      return { layers: [neonFrame, neonText], keyframes, duration: 5.0 };
    },
  },

  // 4. Glitch Title
  {
    id: "glitch_title",
    name: "Glitch Cyberpunk",
    category: "Titles",
    description: "Heavy chromatic RGB separation with digital raster slices and strobe flicker.",
    thumbnailBg: "from-red-600/30 to-cyan-500/10",
    tags: ["Glitch", "RGB Split", "Flicker"],
    duration: 4.5,
    generate: (canvasW = 1920, canvasH = 1080) => {
      const cx = canvasW / 2;
      const cy = canvasH / 2;

      const glitchHeader = {
        id: `layer_${Date.now()}_glitch`,
        name: "Glitch Main Title",
        type: "text",
        text: "SYSTEM OVERRIDE",
        fontSize: 72,
        fontFamily: "Inter",
        fontWeight: "bold",
        letterSpacing: 4,
        align: "center",
        fill: "#22d3ee",
        x: cx - 400,
        y: cy - 50,
        width: 800,
        height: 100,
        startTime: 0,
        duration: 4.5,
        transitionIn: { type: "glitch", duration: 0.6, easing: "power1InOut" },
        effects: [
          createEffect("rgbSplit", { offset: 12, angle: 0 }),
          createEffect("digitalGlitch", { slices: 10, displacement: 22, speed: 10 }),
          createEffect("flicker", { frequency: 18, minOpacity: 0.3, maxOpacity: 1.0 }),
        ],
      };

      return { layers: [glitchHeader], keyframes: [], duration: 4.5 };
    },
  },

  // 5. Kinetic Typography
  {
    id: "kinetic_typography",
    name: "Kinetic Typography",
    category: "Text",
    description: "Energetic oversized bold typography with typewriter characters and bounce overshoot.",
    thumbnailBg: "from-indigo-600/30 to-violet-500/10",
    tags: ["Typewriter", "Kinetic", "Bounce"],
    duration: 4.0,
    generate: (canvasW = 1920, canvasH = 1080) => {
      const cx = canvasW / 2;
      const cy = canvasH / 2;

      const kineticLine1 = {
        id: `layer_${Date.now()}_kin1`,
        name: "Kinetic Header",
        type: "text",
        text: "CREATE WITHOUT LIMITS",
        fontSize: 68,
        fontFamily: "Inter",
        fontWeight: "bold",
        align: "center",
        fill: "#ffffff",
        x: cx - 450,
        y: cy - 70,
        width: 900,
        height: 90,
        startTime: 0,
        duration: 4.0,
        transitionIn: { type: "slide", duration: 0.6, easing: "bounceOut", direction: "down" },
        effects: [
          createEffect("dropShadow", { color: "#4f46e5", blur: 20, offsetX: 0, offsetY: 10, opacity: 0.8 }),
        ],
      };

      const kineticLine2 = {
        id: `layer_${Date.now()}_kin2`,
        name: "Kinetic Subtext",
        type: "text",
        text: "Professional Browser Motion Graphics",
        fontSize: 32,
        fontFamily: "Inter",
        fontWeight: "normal",
        align: "center",
        fill: "#a5b4fc",
        x: cx - 350,
        y: cy + 30,
        width: 700,
        height: 50,
        startTime: 0.6,
        duration: 3.4,
        transitionIn: { type: "fade", duration: 0.5, easing: "power2Out" },
        effects: [],
      };

      return { layers: [kineticLine1, kineticLine2], keyframes: [], duration: 4.0 };
    },
  },

  // 6. Social Media Intro
  {
    id: "social_media_intro",
    name: "Social Media Badge",
    category: "Social",
    description: "Vibrant call-to-action badge with drop shadow, floating orbs, and spin reveal.",
    thumbnailBg: "from-emerald-600/30 to-teal-500/10",
    tags: ["Badge", "Spin", "Particles", "Social"],
    duration: 5.0,
    generate: (canvasW = 1920, canvasH = 1080) => {
      const cx = canvasW / 2;
      const cy = canvasH / 2;

      const badgeCard = {
        id: `layer_${Date.now()}_badge`,
        name: "Social Card",
        type: "rect",
        width: 600,
        height: 200,
        cornerRadius: 32,
        fill: "#0f172a",
        stroke: "#10b981",
        strokeWidth: 3,
        x: cx - 300,
        y: cy - 100,
        startTime: 0,
        duration: 5.0,
        transitionIn: { type: "zoom", duration: 0.7, easing: "backOut" },
        effects: [
          createEffect("glow", { color: "#10b981", radius: 25, opacity: 0.8 }),
          createEffect("floatingParticles", { count: 20, color: "#34d399", size: 3, speed: 1.0 }),
          createEffect("dropShadow", { color: "#000000", blur: 30, offsetX: 0, offsetY: 20, opacity: 0.9 }),
        ],
      };

      const badgeTitle = {
        id: `layer_${Date.now()}_badgetext`,
        name: "Call To Action",
        type: "text",
        text: "SUBSCRIBE & FOLLOW",
        fontSize: 48,
        fontFamily: "Inter",
        fontWeight: "bold",
        align: "center",
        fill: "#10b981",
        x: cx - 280,
        y: cy - 35,
        width: 560,
        height: 70,
        startTime: 0.4,
        duration: 4.6,
        transitionIn: { type: "slide", duration: 0.5, easing: "power2Out", direction: "up" },
        effects: [],
      };

      return { layers: [badgeCard, badgeTitle], keyframes: [], duration: 5.0 };
    },
  },

  // 7. Animated Background
  {
    id: "animated_background",
    name: "Atmospheric Background",
    category: "Backgrounds",
    description: "Deep galactic backdrop with wave displacement and continuous ambient dust motes.",
    thumbnailBg: "from-purple-800/40 to-indigo-900/40",
    tags: ["Background", "Dust", "Wave", "Atmosphere"],
    duration: 8.0,
    generate: (canvasW = 1920, canvasH = 1080) => {
      const bgRect = {
        id: `layer_${Date.now()}_bg`,
        name: "Galactic Backdrop",
        type: "rect",
        width: canvasW,
        height: canvasH,
        fill: "#090914",
        strokeWidth: 0,
        x: 0,
        y: 0,
        startTime: 0,
        duration: 8.0,
        effects: [
          createEffect("dust", { count: 45, color: "#a5b4fc", speed: 0.7, size: 3 }),
          createEffect("wave", { amplitude: 8, frequency: 0.03, speed: 1.5 }),
          createEffect("noise", { noise: 0.15 }),
        ],
      };

      return { layers: [bgRect], keyframes: [], duration: 8.0 };
    },
  },

  // 8. Lower Thirds
  {
    id: "lower_thirds",
    name: "Broadcast Lower Third",
    category: "Titles",
    description: "Broadcast-ready horizontal wipe accent bar with clean presenter title & subtitle.",
    thumbnailBg: "from-sky-600/30 to-blue-500/10",
    tags: ["Lower Third", "Wipe", "Broadcast"],
    duration: 6.0,
    generate: (canvasW = 1920, canvasH = 1080) => {
      const barY = canvasH - 260;

      const accentBar = {
        id: `layer_${Date.now()}_ltbar`,
        name: "Lower Third Bar",
        type: "rect",
        width: 650,
        height: 100,
        cornerRadius: 16,
        fill: "#1e1b4b",
        stroke: "#6366f1",
        strokeWidth: 3,
        x: 120,
        y: barY,
        startTime: 0,
        duration: 6.0,
        transitionIn: { type: "wipe", duration: 0.7, easing: "power3Out", direction: "left" },
        transitionOut: { type: "wipe", duration: 0.6, easing: "power2In", direction: "right" },
        effects: [
          createEffect("dropShadow", { color: "#000000", blur: 18, offsetX: 8, offsetY: 10, opacity: 0.8 }),
          createEffect("glow", { color: "#818cf8", radius: 20, opacity: 0.6 }),
        ],
      };

      const nameText = {
        id: `layer_${Date.now()}_ltname`,
        name: "Presenter Name",
        type: "text",
        text: "ALEXANDER RIVERA",
        fontSize: 34,
        fontFamily: "Inter",
        fontWeight: "bold",
        align: "left",
        fill: "#ffffff",
        x: 145,
        y: barY + 16,
        width: 580,
        height: 40,
        startTime: 0.3,
        duration: 5.4,
        transitionIn: { type: "fade", duration: 0.5, easing: "power2Out" },
        effects: [],
      };

      const titleSub = {
        id: `layer_${Date.now()}_ltsub`,
        name: "Presenter Role",
        type: "text",
        text: "LEAD MOTION GRAPHICS DESIGNER",
        fontSize: 18,
        fontFamily: "Inter",
        fontWeight: "medium",
        letterSpacing: 2,
        align: "left",
        fill: "#818cf8",
        x: 145,
        y: barY + 58,
        width: 580,
        height: 30,
        startTime: 0.5,
        duration: 5.2,
        transitionIn: { type: "fade", duration: 0.5, easing: "power2Out" },
        effects: [],
      };

      return { layers: [accentBar, nameText, titleSub], keyframes: [], duration: 6.0 };
    },
  },

  // 9. Outro Animation
  {
    id: "outro_animation",
    name: "Spin Outro Card",
    category: "Outros",
    description: "Cinematic closing outro with spin exit, spark particles, and luminous fade.",
    thumbnailBg: "from-purple-600/30 to-pink-500/10",
    tags: ["Outro", "Spin", "Sparks", "Exit"],
    duration: 5.0,
    generate: (canvasW = 1920, canvasH = 1080) => {
      const cx = canvasW / 2;
      const cy = canvasH / 2;

      const outroCard = {
        id: `layer_${Date.now()}_outro`,
        name: "Outro Card",
        type: "rect",
        width: 680,
        height: 260,
        cornerRadius: 28,
        fill: "#0c0a1f",
        stroke: "#a855f7",
        strokeWidth: 4,
        x: cx - 340,
        y: cy - 130,
        startTime: 0,
        duration: 5.0,
        transitionIn: { type: "zoom", duration: 0.7, easing: "backOut" },
        transitionOut: { type: "spin", duration: 0.8, easing: "power2In" },
        effects: [
          createEffect("glow", { color: "#c084fc", radius: 30, opacity: 0.85 }),
          createEffect("spark", { count: 25, color: "#e879f9", speed: 2.0 }),
        ],
      };

      const outroText = {
        id: `layer_${Date.now()}_outrotext`,
        name: "Thanks Text",
        type: "text",
        text: "THANKS FOR WATCHING",
        fontSize: 52,
        fontFamily: "Inter",
        fontWeight: "bold",
        align: "center",
        fill: "#ffffff",
        x: cx - 320,
        y: cy - 35,
        width: 640,
        height: 70,
        startTime: 0.3,
        duration: 4.7,
        transitionIn: { type: "fade", duration: 0.5, easing: "power2Out" },
        effects: [],
      };

      return { layers: [outroCard, outroText], keyframes: [], duration: 5.0 };
    },
  },
];
