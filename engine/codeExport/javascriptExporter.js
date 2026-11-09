/**
 * Professional GSAP JavaScript Animation Script Exporter for MotionLab
 * Generates an executable GSAP 3 timeline script with HTML template, DOM targets,
 * CDN script tags, and clear usage instructions.
 */

export function exportProjectToJavaScript(project, layers = [], keyframes = []) {
  const width = Number(project?.width || 1920);
  const height = Number(project?.height || 1080);
  const duration = Number(project?.duration || 5.0);
  const bgColor = project?.backgroundColor || "#0a0a0f";
  const title = project?.name || "MotionLab Animation";

  let domElements = "";
  let gsapTweens = "";

  for (const layer of layers) {
    if (layer.visible === false || layer.type === "audio") continue;

    const layerId = `layer_${layer.id.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
    const layerKfs = keyframes.filter((k) => k.objectId === layer.id);

    const baseX = Number(layer.x ?? 0);
    const baseY = Number(layer.y ?? 0);
    const baseW = Number(layer.width ?? 100);
    const baseH = Number(layer.height ?? 100);
    const baseRot = Number(layer.rotation ?? 0);
    const baseOp = Number(layer.opacity ?? 1);
    const baseFill = layer.fill || "#6366f1";

    let extraStyle = `width: ${baseW}px; height: ${baseH}px; background-color: ${baseFill};`;
    if (layer.type === "circle") {
      extraStyle = `width: ${baseW}px; height: ${baseW}px; border-radius: 50%; background-color: ${baseFill};`;
    } else if (layer.type === "text") {
      extraStyle = `color: ${baseFill}; font-size: ${layer.fontSize || 48}px; font-weight: ${layer.fontWeight || "bold"}; font-family: ${layer.fontFamily || "Inter"}, sans-serif; white-space: nowrap;`;
    }

    const textContent = layer.type === "text" ? layer.text || "" : "";
    domElements += `    <div id="${layerId}" class="motion-layer" style="${extraStyle}">${textContent}</div>\n`;

    // Generate GSAP tweens if animated
    if (layerKfs.length > 0) {
      // Group keyframes by property
      const kfsByProp = {};
      for (const kf of layerKfs) {
        if (!kfsByProp[kf.property]) kfsByProp[kf.property] = [];
        kfsByProp[kf.property].push(kf);
      }

      // Sort each property by time
      for (const prop of Object.keys(kfsByProp)) {
        kfsByProp[prop].sort((a, b) => a.time - b.time);
      }

      gsapTweens += `  // --- Layer: ${layer.name} (${layer.type}) ---\n`;
      gsapTweens += `  gsap.set("#${layerId}", { x: ${baseX}, y: ${baseY}, rotation: ${baseRot}, opacity: ${baseOp} });\n`;

      // Build sequential tweens
      const times = Array.from(new Set(layerKfs.map((k) => k.time))).sort((a, b) => a - b);
      let prevTime = 0;

      for (let i = 0; i < times.length; i++) {
        const t = times[i];
        const span = Math.max(0.01, t - prevTime);

        const tweenProps = {};
        for (const [prop, list] of Object.entries(kfsByProp)) {
          const match = list.find((k) => Math.abs(k.time - t) < 0.001);
          if (match) {
            let gsapProp = prop;
            if (prop === "rotation") gsapProp = "rotation";
            else if (prop === "scaleX") gsapProp = "scaleX";
            else if (prop === "scaleY") gsapProp = "scaleY";
            tweenProps[gsapProp] = match.value;
          }
        }

        if (Object.keys(tweenProps).length > 0) {
          gsapTweens += `  tl.to("#${layerId}", {\n`;
          gsapTweens += `    duration: ${span.toFixed(3)},\n`;
          for (const [k, v] of Object.entries(tweenProps)) {
            gsapTweens += `    ${k}: ${typeof v === "string" ? `"${v}"` : v},\n`;
          }
          gsapTweens += `    ease: "power2.inOut",\n`;
          gsapTweens += `  }, ${prevTime.toFixed(3)});\n`;
        }

        prevTime = t;
      }
      gsapTweens += `\n`;
    }
  }

  const jsScript = `/**
 * MotionLab Stage 11 - Exported GSAP 3 Animation
 * Project: ${title}
 * Dimensions: ${width}x${height} | Duration: ${duration}s
 * 
 * Dependencies:
 *   - GSAP 3 (GreenSock Animation Platform): https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js
 * 
 * Usage Instructions:
 *   1. Include the HTML elements inside your container with position: relative.
 *   2. Ensure GSAP 3 is imported via <script> tag or npm ('npm install gsap').
 *   3. Call initMotionLabAnimation() once the DOM is ready.
 */

function initMotionLabAnimation() {
  const tl = gsap.timeline({
    repeat: -1, // Infinite loop (-1) or 0 for play once
    defaults: { ease: "power1.inOut" }
  });

${gsapTweens}
  return tl;
}

// Auto-run if executed in browser environment
if (typeof window !== "undefined") {
  window.addEventListener("DOMContentLoaded", () => {
    if (typeof gsap !== "undefined") {
      initMotionLabAnimation();
    } else {
      console.warn("MotionLab: GSAP is not loaded. Please include GSAP 3 CDN before running this script.");
    }
  });
}
`;

  return {
    code: jsScript,
    filename: `${title.toLowerCase().replace(/\s+/g, "-")}.gsap.js`,
    mimeType: "text/javascript",
  };
}
