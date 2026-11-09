/**
 * MotionLab Stage 12 Comprehensive Test Suite
 * Validates core engines, mathematics, code exports, security sanitizers, and schemas.
 */

import { evaluateCubicBezier, BEZIER_PRESETS } from "../../engine/advanced/bezierCurve.js";
import { createPresetPath, evaluateMotionPathAtProgress, reverseWaypoints, waypointsToSvgPath } from "../../engine/advanced/motionPath.js";
import { evaluateExpression, EXPRESSION_TYPES } from "../../engine/advanced/expressionEngine.js";
import { alignLayers, distributeLayers, groupLayers, ungroupLayer, applyParentTransform, ANCHOR_PRESETS } from "../../engine/advanced/transformHierarchy.js";
import { runProjectDiagnostics, formatDiagnosticReport } from "../../engine/advanced/diagnostics.js";
import { analyzeExportCompatibility, exportProjectCode } from "../../engine/codeExport/index.js";
import { sanitizeSvg, validateProjectJson, sanitizeFilename } from "../security/sanitizer.js";
import { detectBrowserCapabilities } from "../compatibility/browserCapabilities.js";

let passedCount = 0;
let failedCount = 0;

function it(desc, fn) {
  try {
    fn();
    console.log(`  ✓ ${desc}`);
    passedCount++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${desc}\n     ${err.message}`);
    failedCount++;
  }
}

function assert(condition, msg = "Assertion failed") {
  if (!condition) throw new Error(msg);
}

console.log("\n=========================================");
console.log("🚀 MOTIONLAB STAGE 12 AUTOMATED TEST SUITE");
console.log("=========================================\n");

// 1. BEZIER ENGINE TESTS
console.log("1. Cubic Bezier Easing & Root Solver:");
it("evaluates boundaries t=0 and t=1 cleanly", () => {
  assert(Math.abs(evaluateCubicBezier(0.42, 0, 0.58, 1, 0) - 0) < 0.001);
  assert(Math.abs(evaluateCubicBezier(0.42, 0, 0.58, 1, 1) - 1) < 0.001);
});
it("correctly calculates easeInOut midpoint", () => {
  const mid = evaluateCubicBezier(0.42, 0, 0.58, 1, 0.5);
  assert(Math.abs(mid - 0.5) < 0.05);
});
it("supports standard bezier presets", () => {
  assert(BEZIER_PRESETS.linear && BEZIER_PRESETS.easeInOut && BEZIER_PRESETS.backOut);
});

// 2. MOTION PATH TESTS
console.log("\n2. Motion Path Trajectory Engine:");
it("generates valid preset arc and evaluates waypoints", () => {
  const arc = createPresetPath("arc", 960, 540);
  assert(arc.waypoints.length === 3);
  const ptStart = evaluateMotionPathAtProgress(arc, 0);
  assert(typeof ptStart.x === "number" && typeof ptStart.y === "number");
});
it("calculates tangent auto-orientation angle", () => {
  const wave = createPresetPath("wave", 960, 540);
  const ptMid = evaluateMotionPathAtProgress(wave, 0.5);
  assert(typeof ptMid.angle === "number");
});
it("converts waypoints to valid SVG bezier path string", () => {
  const arc = createPresetPath("arc", 960, 540);
  const d = waypointsToSvgPath(arc.waypoints, false);
  assert(d.startsWith("M ") && d.includes(" C "));
});

// 3. PROCEDURAL EXPRESSION TESTS (ZERO EVAL)
console.log("\n3. Procedural Expression Engine (Strict Security):");
it("evaluates sine wave oscillation deterministically", () => {
  const layer = { id: "l1", startTime: 0 };
  const val = evaluateExpression(
    { type: "sineWave", params: { amplitude: 100, frequency: 1, phase: 0 } },
    layer,
    [layer],
    0.25,
    200
  );
  assert(Math.abs(val - 300) < 3);
});
it("evaluates constant rotation loop", () => {
  const layer = { id: "l1", startTime: 0 };
  const rot = evaluateExpression(
    { type: "rotationLoop", params: { speed: 90, clockwise: 1 } },
    layer,
    [layer],
    2.0,
    0
  );
  assert(rot === 180);
});
it("contains all 10 approved procedural presets", () => {
  assert(EXPRESSION_TYPES.length >= 10);
});

// 4. TRANSFORM HIERARCHY TESTS
console.log("\n4. Transform Hierarchy, Alignment & Grouping:");
it("aligns layers horizontally to the left", () => {
  const l1 = { id: "1", x: 100, y: 50, width: 200, height: 100 };
  const l2 = { id: "2", x: 300, y: 50, width: 200, height: 100 };
  const aligned = alignLayers([l1, l2], "left");
  assert(aligned[0].x === aligned[1].x);
});
it("groups multiple layers into group container", () => {
  const l1 = { id: "1", x: 100, y: 50, width: 200, height: 100 };
  const l2 = { id: "2", x: 400, y: 50, width: 200, height: 100 };
  const grouped = groupLayers(["1", "2"], [l1, l2]);
  assert(grouped.groupLayer.type === "group");
  assert(grouped.updatedLayers.find((l) => l.id === "1").parentId === grouped.groupLayer.id);
});
it("ungroups group container cleanly", () => {
  const l1 = { id: "1", x: 100, y: 50, parentId: "grp1" };
  const grp = { id: "grp1", type: "group" };
  const ungrouped = ungroupLayer("grp1", [l1, grp]);
  assert(ungrouped.length === 1 && !ungrouped[0].parentId);
});

// 5. SECURITY SANITIZATION TESTS
console.log("\n5. Security & Input Sanitization:");
it("strips malicious script tags from SVG vectors", () => {
  const rawSvg = `<svg><script>alert('xss')</script><rect width="100" height="100" fill="red" /></svg>`;
  const clean = sanitizeSvg(rawSvg);
  assert(!clean.includes("<script>") && clean.includes("<rect"));
});
it("strips inline javascript: handlers from SVG", () => {
  const rawSvg = `<svg><a href="javascript:alert(1)"><circle r="50" onload="evil()" /></a></svg>`;
  const clean = sanitizeSvg(rawSvg);
  assert(!clean.includes("javascript:") && !clean.includes("onload="));
});
it("validates project JSON schema", () => {
  const validProj = { project: { name: "Test" }, layers: [{ id: "l1" }] };
  assert(validateProjectJson(validProj).valid === true);
  const badProj = "not an object";
  assert(validateProjectJson(badProj).valid === false);
});
it("sanitizes filenames preventing directory traversal", () => {
  const dangerous = "../../../etc/passwd.json";
  assert(!sanitizeFilename(dangerous).includes("../"));
});

// 6. CODE EXPORT TESTS
console.log("\n6. Code Export Studio & Compilers:");
const mockProject = {
  id: "p1",
  name: "Banner",
  width: 1920,
  height: 1080,
  duration: 5.0,
  fps: 60,
  backgroundColor: "#0a0a0f",
};
const mockLayers = [
  { id: "box", name: "Box", type: "rect", x: 100, y: 100, width: 200, height: 200, fill: "#6366f1" },
];
const mockKeyframes = [
  { id: "k1", objectId: "box", property: "x", time: 0, value: 100 },
  { id: "k2", objectId: "box", property: "x", time: 2, value: 500 },
];

it("exports valid JSON project bundle", () => {
  const res = exportProjectCode(mockProject, mockLayers, mockKeyframes, "json");
  const parsed = JSON.parse(res.code);
  assert(parsed.project.name === "Banner" && parsed.layers.length === 1);
});
it("exports valid XML SVG with animation tags", () => {
  const res = exportProjectCode(mockProject, mockLayers, mockKeyframes, "svg");
  assert(res.code.includes("<svg") && res.code.includes("</svg>"));
});
it("exports standalone HTML5 + CSS keyframes", () => {
  const res = exportProjectCode(mockProject, mockLayers, mockKeyframes, "html_css");
  assert(res.code.includes("<!DOCTYPE html>") && res.code.includes("@keyframes"));
});
it("exports runnable GSAP JavaScript timeline", () => {
  const res = exportProjectCode(mockProject, mockLayers, mockKeyframes, "javascript_gsap");
  assert(res.code.includes("gsap.timeline") && res.code.includes("initMotionLabAnimation"));
});
it("exports modular React JSX animation component", () => {
  const res = exportProjectCode(mockProject, mockLayers, mockKeyframes, "react_component");
  assert(res.code.includes("export default function") && res.code.includes("useRef"));
});

// 7. COMPATIBILITY ANALYZER TESTS
console.log("\n7. Code Compatibility Analyzer:");
it("rates JSON format as 100% compatible", () => {
  const comp = analyzeExportCompatibility(mockProject, mockLayers, mockKeyframes, "json");
  assert(comp.status === "compatible" && comp.score === 100);
});
it("warns when audio is exported to SVG", () => {
  const layersWithAudio = [...mockLayers, { id: "a1", type: "audio" }];
  const comp = analyzeExportCompatibility(mockProject, layersWithAudio, mockKeyframes, "svg");
  assert(comp.warnings.some((w) => w.toLowerCase().includes("audio")));
});

// 8. PROJECT DIAGNOSTICS TESTS
console.log("\n8. Project Diagnostics & Health Meter:");
it("computes health score for clean project", () => {
  const diag = runProjectDiagnostics({ project: mockProject, layers: mockLayers, keyframes: mockKeyframes });
  assert(diag.healthScore >= 90 && diag.status === "healthy");
});
it("detects keyframe with NaN or invalid value", () => {
  const badKfs = [...mockKeyframes, { id: "k_bad", objectId: "box", property: "y", time: 1, value: NaN }];
  const diag = runProjectDiagnostics({ project: mockProject, layers: mockLayers, keyframes: badKfs });
  assert(diag.issues.some((iss) => iss.type === "invalid_keyframe"));
});

console.log("\n=========================================");
console.log(`📊 RESULTS: ${passedCount} PASSED, ${failedCount} FAILED`);
console.log("=========================================\n");

if (failedCount > 0) {
  process.exit(1);
}
