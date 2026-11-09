/**
 * SVG Sanitizer & Parser for MotionLab
 * Strips malicious tags, scripts, event listeners, and dangerous URIs.
 * Returns safe SVG XML and extracts geometry paths where available.
 */

const DANGEROUS_TAGS = new Set([
  "script",
  "iframe",
  "object",
  "embed",
  "foreignobject",
  "applet",
  "meta",
  "link",
]);

const DANGEROUS_ATTRIBUTES = [
  /^on/i,              // onload, onclick, onerror, etc.
  /^formaction$/i,
  /^xlink:href$/i,      // will validate protocol if present
];

/**
 * Sanitizes raw SVG text.
 * @param {string} rawSvgText
 * @returns {{ sanitizedSvg: string, width: number, height: number, paths: string[] }}
 */
export function sanitizeSvg(rawSvgText) {
  if (typeof window === "undefined" || !rawSvgText) {
    return { sanitizedSvg: "", width: 200, height: 200, paths: [] };
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(rawSvgText, "image/svg+xml");

  // Check for parser error
  const parserError = doc.querySelector("parsererror");
  if (parserError) {
    throw new Error("Invalid SVG format: unable to parse XML");
  }

  const svgEl = doc.querySelector("svg");
  if (!svgEl) {
    throw new Error("Invalid SVG format: missing <svg> root element");
  }

  // Recursive element cleaner
  const cleanElement = (el) => {
    // 1. Remove dangerous tags
    if (DANGEROUS_TAGS.has(el.tagName.toLowerCase())) {
      el.remove();
      return;
    }

    // 2. Remove dangerous attributes
    const attrs = Array.from(el.attributes || []);
    for (const attr of attrs) {
      const name = attr.name.toLowerCase();
      const value = (attr.value || "").trim().toLowerCase();

      // Check for inline event handlers (onclick, onload...)
      if (name.startsWith("on")) {
        el.removeAttribute(attr.name);
        continue;
      }

      // Check for javascript: pseudo-protocol in href or src
      if (name === "href" || name === "xlink:href" || name === "src") {
        if (value.startsWith("javascript:") || value.startsWith("data:text/html")) {
          el.removeAttribute(attr.name);
          continue;
        }
      }

      // Disallow external URLs in <use> elements
      if (el.tagName.toLowerCase() === "use" && (name === "href" || name === "xlink:href")) {
        if (!value.startsWith("#")) {
          el.removeAttribute(attr.name);
        }
      }

      // Check style attributes for javascript expressions
      if (name === "style") {
        if (value.includes("expression(") || value.includes("javascript:")) {
          el.removeAttribute(attr.name);
        }
      }
    }

    // Recurse over children
    const children = Array.from(el.children);
    for (const child of children) {
      cleanElement(child);
    }
  };

  cleanElement(svgEl);

  // Extract dimensions
  let width = 200;
  let height = 200;

  const viewBox = svgEl.getAttribute("viewBox");
  if (viewBox) {
    const parts = viewBox.split(/[\s,]+/).map(Number);
    if (parts.length === 4 && parts[2] > 0 && parts[3] > 0) {
      width = parts[2];
      height = parts[3];
    }
  } else {
    const wAttr = parseFloat(svgEl.getAttribute("width"));
    const hAttr = parseFloat(svgEl.getAttribute("height"));
    if (!isNaN(wAttr) && wAttr > 0) width = wAttr;
    if (!isNaN(hAttr) && hAttr > 0) height = hAttr;
  }

  // Extract vector path 'd' attributes for potential Konva Path rendering
  const paths = [];
  const pathElements = svgEl.querySelectorAll("path");
  pathElements.forEach((p) => {
    const d = p.getAttribute("d");
    if (d && d.trim()) paths.push(d.trim());
  });

  const serializer = new XMLSerializer();
  const sanitizedSvg = serializer.serializeToString(svgEl);

  return {
    sanitizedSvg,
    width: Math.round(width),
    height: Math.round(height),
    paths,
  };
}
