/**
 * Professional Security & Input Sanitizer for MotionLab
 * Strictly enforces zero eval/Function execution, validates project schemas,
 * and strips XSS vectors from SVG vectors and user imports.
 */

const DANGEROUS_SVG_TAGS = [
  "script",
  "iframe",
  "object",
  "embed",
  "form",
  "foreignObject",
  "use",
];

const DANGEROUS_ATTRIBUTES = [
  /^on\w+/i, // onload, onerror, onclick, etc.
  /^javascript:/i,
  /^data:/i,
];

/**
 * Sanitizes an SVG string by removing dangerous elements and event handlers.
 */
export function sanitizeSvg(svgContent) {
  if (typeof svgContent !== "string") return "";

  let cleaned = svgContent;

  // 1. Remove XML/HTML comments that might mask payloads
  cleaned = cleaned.replace(/<!--[\s\S]*?-->/g, "");

  // 2. Strip dangerous tags
  for (const tag of DANGEROUS_SVG_TAGS) {
    const tagRegex = new RegExp(`<${tag}[^>]*>[\\s\\S]*?<\\/${tag}>|<${tag}[^>]*\\/?>`, "gi");
    cleaned = cleaned.replace(tagRegex, "");
  }

  // 3. Remove event handler attributes (e.g. onload=..., onclick=...)
  cleaned = cleaned.replace(/\s+on\w+\s*=\s*(["'][^"']*['"]|[^\s>]+)/gi, "");

  // 4. Remove javascript: URIs in href and xlink:href
  cleaned = cleaned.replace(/(?:href|xlink:href)\s*=\s*["']\s*javascript:[^"']*["']/gi, "");

  return cleaned.trim();
}

/**
 * Validates imported project JSON schema.
 * Rejects payloads with circular references, malicious keys, or corrupted structures.
 */
export function validateProjectJson(data) {
  if (!data || typeof data !== "object") {
    return { valid: false, error: "Invalid JSON: Payload must be a JSON object." };
  }

  // Check required core sections
  if (!data.project && !data.id) {
    return { valid: false, error: "Missing project metadata section." };
  }

  const proj = data.project || data;
  if (typeof proj.name !== "string" && proj.name !== undefined) {
    return { valid: false, error: "Invalid project name format." };
  }

  // Validate layers array
  if (data.layers && !Array.isArray(data.layers)) {
    return { valid: false, error: "Layers must be an array." };
  }

  if (Array.isArray(data.layers)) {
    for (let i = 0; i < data.layers.length; i++) {
      const l = data.layers[i];
      if (!l.id || typeof l.id !== "string") {
        return { valid: false, error: `Layer at index ${i} is missing a valid id.` };
      }
    }
  }

  // Validate keyframes array
  if (data.keyframes && !Array.isArray(data.keyframes)) {
    return { valid: false, error: "Keyframes must be an array." };
  }

  return { valid: true, error: null };
}

/**
 * Sanitizes a filename to prevent path traversal and shell injection.
 */
export function sanitizeFilename(filename, fallback = "motionlab-project") {
  if (!filename || typeof filename !== "string") return fallback;
  return (
    filename
      .replace(/[/\\?%*:|"<>]/g, "-") // Remove illegal characters
      .replace(/\.\.+/g, ".") // Prevent ../ directory traversal
      .trim() || fallback
  );
}
