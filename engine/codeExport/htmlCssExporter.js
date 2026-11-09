/**
 * Professional HTML5 + CSS Keyframes Exporter for MotionLab
 * Generates a clean, standalone, zero-dependency HTML document with pure CSS @keyframes animations.
 */

export function exportProjectToHtmlCss(project, layers = [], keyframes = []) {
  const width = Number(project?.width || 1920);
  const height = Number(project?.height || 1080);
  const duration = Number(project?.duration || 5.0);
  const bgColor = project?.backgroundColor || "#0a0a0f";
  const title = project?.name || "MotionLab CSS Animation";

  let cssRules = "";
  let htmlElements = "";

  for (const layer of layers) {
    if (layer.visible === false || layer.type === "audio") continue;

    const layerClass = `layer-${layer.id.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
    const layerKfs = keyframes.filter((k) => k.objectId === layer.id);

    // Initial base styling
    const baseWidth = Number(layer.width ?? 100);
    const baseHeight = Number(layer.height ?? 100);
    const baseFill = layer.fill || "#6366f1";
    const baseOpacity = layer.opacity !== undefined ? Number(layer.opacity) : 1;
    const baseRot = Number(layer.rotation ?? 0);
    const baseX = Number(layer.x ?? 0);
    const baseY = Number(layer.y ?? 0);

    let borderStyle = "";
    if (layer.stroke && layer.stroke !== "transparent") {
      borderStyle = `border: ${layer.strokeWidth || 1}px solid ${layer.stroke};`;
    }

    let shapeStyle = "";
    if (layer.type === "circle") {
      shapeStyle = `border-radius: 50%; width: ${baseWidth}px; height: ${baseWidth}px; background-color: ${baseFill};`;
    } else if (layer.type === "rect") {
      const br = layer.cornerRadius ? `border-radius: ${layer.cornerRadius}px;` : "";
      shapeStyle = `width: ${baseWidth}px; height: ${baseHeight}px; background-color: ${baseFill}; ${br}`;
    } else if (layer.type === "text") {
      shapeStyle = `font-size: ${layer.fontSize || 48}px; font-weight: ${layer.fontWeight || "bold"}; color: ${baseFill}; font-family: ${layer.fontFamily || "Inter"}, sans-serif; white-space: nowrap; user-select: none;`;
    } else {
      shapeStyle = `width: ${baseWidth}px; height: ${baseHeight}px; background-color: ${baseFill};`;
    }

    // Animation Keyframes Builder
    let animationProp = "";
    if (layerKfs.length > 0) {
      const animName = `anim_${layerClass}`;
      animationProp = `animation: ${animName} ${duration}s infinite linear;`;

      // Collect all keyframe times
      const times = Array.from(new Set([0, ...layerKfs.map((k) => k.time), duration])).sort((a, b) => a - b);

      let keyframesCss = `@keyframes ${animName} {\n`;
      for (const t of times) {
        const percent = Math.min(100, Math.max(0, (t / duration) * 100)).toFixed(1);

        const xVal = layerKfs.find((k) => k.property === "x" && k.time === t)?.value ?? baseX;
        const yVal = layerKfs.find((k) => k.property === "y" && k.time === t)?.value ?? baseY;
        const rotVal = layerKfs.find((k) => k.property === "rotation" && k.time === t)?.value ?? baseRot;
        const scaleX = layerKfs.find((k) => k.property === "scaleX" && k.time === t)?.value ?? 1;
        const scaleY = layerKfs.find((k) => k.property === "scaleY" && k.time === t)?.value ?? 1;
        const opVal = layerKfs.find((k) => k.property === "opacity" && k.time === t)?.value ?? baseOpacity;

        keyframesCss += `  ${percent}% {\n`;
        keyframesCss += `    transform: translate(${xVal}px, ${yVal}px) rotate(${rotVal}deg) scale(${scaleX}, ${scaleY});\n`;
        keyframesCss += `    opacity: ${opVal};\n`;
        keyframesCss += `  }\n`;
      }
      keyframesCss += `}\n\n`;
      cssRules += keyframesCss;
    }

    cssRules += `.${layerClass} {
  position: absolute;
  top: 0;
  left: 0;
  transform: translate(${baseX}px, ${baseY}px) rotate(${baseRot}deg);
  opacity: ${baseOpacity};
  transform-origin: center center;
  ${shapeStyle}
  ${borderStyle}
  ${animationProp}
  will-change: transform, opacity;
}\n\n`;

    const textContent = layer.type === "text" ? layer.text || "" : "";
    htmlElements += `    <!-- Layer: ${layer.name} -->\n    <div class="${layerClass}">${textContent}</div>\n`;
  }

  const htmlCode = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - MotionLab</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      background-color: #050508;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      overflow: hidden;
    }
    .motionlab-stage-wrapper {
      position: relative;
      width: ${width}px;
      height: ${height}px;
      background-color: ${bgColor};
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
      overflow: hidden;
      max-width: 100vw;
      max-height: 100vh;
      aspect-ratio: ${width} / ${height};
    }
    ${cssRules}
  </style>
</head>
<body>
  <div class="motionlab-stage-wrapper">
${htmlElements}  </div>
</body>
</html>`;

  return {
    code: htmlCode,
    filename: `${title.toLowerCase().replace(/\s+/g, "-")}.html`,
    mimeType: "text/html",
  };
}
