/**
 * Professional SVG Exporter for MotionLab
 * Generates standards-compliant W3C XML SVG with vector primitives, text, styling,
 * and declarative SMIL <animate> / <animateTransform> elements.
 */

export function exportProjectToSvg(project, layers = [], keyframes = []) {
  const width = Number(project?.width || 1920);
  const height = Number(project?.height || 1080);
  const duration = Number(project?.duration || 5.0);
  const bgColor = project?.backgroundColor || "#0a0a0f";

  let svgElements = "";

  // Render each visible visual layer
  for (const layer of layers) {
    if (layer.visible === false || layer.type === "audio") continue;

    const layerKfs = keyframes.filter((k) => k.objectId === layer.id);
    const hasAnimations = layerKfs.length > 0;

    let elemStr = "";
    const fill = layer.fill || "#6366f1";
    const stroke = layer.stroke && layer.stroke !== "transparent" ? ` stroke="${layer.stroke}" stroke-width="${layer.strokeWidth || 1}"` : "";
    const opacity = layer.opacity !== undefined ? ` opacity="${layer.opacity}"` : "";

    // Base position
    const x = Number(layer.x ?? 0);
    const y = Number(layer.y ?? 0);
    const w = Number(layer.width ?? 100);
    const h = Number(layer.height ?? 100);
    const rot = Number(layer.rotation ?? 0);

    let innerContent = "";

    // Add SMIL animation tags if animated
    if (hasAnimations) {
      // 1. Transform animation (translate & rotate)
      const xKfs = layerKfs.filter((k) => k.property === "x").sort((a, b) => a.time - b.time);
      const yKfs = layerKfs.filter((k) => k.property === "y").sort((a, b) => a.time - b.time);
      const rotKfs = layerKfs.filter((k) => k.property === "rotation").sort((a, b) => a.time - b.time);
      const opKfs = layerKfs.filter((k) => k.property === "opacity").sort((a, b) => a.time - b.time);

      if (xKfs.length > 1 || yKfs.length > 1) {
        // Collect timestamps
        const times = Array.from(new Set([...xKfs.map((k) => k.time), ...yKfs.map((k) => k.time)])).sort((a, b) => a - b);
        const keyTimes = times.map((t) => (t / duration).toFixed(3)).join(";");
        const values = times.map((t) => {
          const valX = xKfs.find((k) => k.time === t)?.value ?? x;
          const valY = yKfs.find((k) => k.time === t)?.value ?? y;
          return `${valX} ${valY}`;
        }).join(";");

        innerContent += `\n    <animateTransform attributeName="transform" type="translate" dur="${duration}s" repeatCount="indefinite" keyTimes="${keyTimes}" values="${values}" />`;
      }

      if (rotKfs.length > 1) {
        const keyTimes = rotKfs.map((k) => (k.time / duration).toFixed(3)).join(";");
        const values = rotKfs.map((k) => `${k.value} 0 0`).join(";");
        innerContent += `\n    <animateTransform attributeName="transform" type="rotate" additive="sum" dur="${duration}s" repeatCount="indefinite" keyTimes="${keyTimes}" values="${values}" />`;
      }

      if (opKfs.length > 1) {
        const keyTimes = opKfs.map((k) => (k.time / duration).toFixed(3)).join(";");
        const values = opKfs.map((k) => k.value).join(";");
        innerContent += `\n    <animate attributeName="opacity" dur="${duration}s" repeatCount="indefinite" keyTimes="${keyTimes}" values="${values}" />`;
      }
    }

    const transformAttr = !hasAnimations && (x !== 0 || y !== 0 || rot !== 0)
      ? ` transform="translate(${x}, ${y}) rotate(${rot})"`
      : "";

    switch (layer.type) {
      case "text": {
        const fontSize = layer.fontSize || 48;
        const fontFamily = layer.fontFamily || "sans-serif";
        const fontWeight = layer.fontWeight || "normal";
        const textContent = (layer.text || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        elemStr = `<g id="${layer.id}"${transformAttr}${opacity}>
    <text x="0" y="0" text-anchor="middle" dominant-baseline="central" fill="${fill}" font-size="${fontSize}" font-family="${fontFamily}" font-weight="${fontWeight}"${stroke}>${textContent}</text>${innerContent}
  </g>`;
        break;
      }

      case "circle": {
        const r = layer.radius || w / 2 || 50;
        elemStr = `<g id="${layer.id}"${transformAttr}${opacity}>
    <circle cx="0" cy="0" r="${r}" fill="${fill}"${stroke} />${innerContent}
  </g>`;
        break;
      }

      case "ellipse": {
        const rx = layer.radiusX || w / 2 || 60;
        const ry = layer.radiusY || h / 2 || 40;
        elemStr = `<g id="${layer.id}"${transformAttr}${opacity}>
    <ellipse cx="0" cy="0" rx="${rx}" ry="${ry}" fill="${fill}"${stroke} />${innerContent}
  </g>`;
        break;
      }

      case "star":
      case "polygon": {
        const points = layer.points ? layer.points.join(" ") : "-50,-50 50,-50 0,50";
        elemStr = `<g id="${layer.id}"${transformAttr}${opacity}>
    <polygon points="${points}" fill="${fill}"${stroke} />${innerContent}
  </g>`;
        break;
      }

      case "rect":
      default: {
        const rx = layer.cornerRadius ? ` rx="${layer.cornerRadius}"` : "";
        elemStr = `<g id="${layer.id}"${transformAttr}${opacity}>
    <rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" fill="${fill}"${rx}${stroke} />${innerContent}
  </g>`;
        break;
      }
    }

    svgElements += `  <!-- Layer: ${layer.name} (${layer.type}) -->\n  ${elemStr}\n\n`;
  }

  const svgCode = `<?xml version="1.0" encoding="UTF-8"?>
<!-- Generated by MotionLab Stage 11 - Vector SVG Exporter -->
<!-- Note: Declarative SMIL keyframe animations are included. For full interactive control, use JavaScript (GSAP) or HTML+CSS export. -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <defs>
    <style>
      text { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    </style>
  </defs>

  <!-- Canvas Background -->
  <rect width="100%" height="100%" fill="${bgColor}" />

  <!-- MotionLab Objects Hierarchy -->
${svgElements}</svg>`;

  return {
    code: svgCode,
    filename: `${(project?.name || "motionlab-vector").toLowerCase().replace(/\s+/g, "-")}.svg`,
    mimeType: "image/svg+xml",
  };
}
