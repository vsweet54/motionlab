import { analyzeExportCompatibility, EXPORT_FORMATS } from "./compatibilityAnalyzer.js";
import { exportProjectToJson } from "./jsonExporter.js";
import { exportProjectToSvg } from "./svgExporter.js";
import { exportProjectToHtmlCss } from "./htmlCssExporter.js";
import { exportProjectToJavaScript } from "./javascriptExporter.js";
import { exportProjectToReact } from "./reactExporter.js";

export {
  analyzeExportCompatibility,
  EXPORT_FORMATS,
  exportProjectToJson,
  exportProjectToSvg,
  exportProjectToHtmlCss,
  exportProjectToJavaScript,
  exportProjectToReact,
};

/**
 * Master Code Exporter Router
 */
export function exportProjectCode(project, layers = [], keyframes = [], format = "json", options = {}) {
  switch (format) {
    case "json":
      return exportProjectToJson(project, layers, keyframes, options);
    case "svg":
      return exportProjectToSvg(project, layers, keyframes, options);
    case "html_css":
      return exportProjectToHtmlCss(project, layers, keyframes, options);
    case "javascript_gsap":
      return exportProjectToJavaScript(project, layers, keyframes, options);
    case "react_component":
      return exportProjectToReact(project, layers, keyframes, options);
    default:
      throw new Error(`Unsupported export format: "${format}"`);
  }
}
