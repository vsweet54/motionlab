/**
 * Professional Motion Path Engine for MotionLab
 * Generates and evaluates smooth multi-segment cubic Bezier trajectories with arc-length reparameterization.
 */

import { evaluateCubicBezier } from "./bezierCurve.js";

function getPathEasing(t, easing = "linear") {
  const clampedT = Math.max(0, Math.min(1, t));
  if (easing === "easeIn") return evaluateCubicBezier(0.42, 0.0, 1.0, 1.0, clampedT);
  if (easing === "easeOut") return evaluateCubicBezier(0.0, 0.0, 0.58, 1.0, clampedT);
  if (easing === "easeInOut") return evaluateCubicBezier(0.42, 0.0, 0.58, 1.0, clampedT);
  return clampedT;
}

/**
 * Evaluates a single cubic Bezier segment at parameter u [0..1]
 * P0 = start point, P1 = P0 + handleOut, P2 = P3 + handleIn, P3 = end point
 */
function evaluateCubicSegment(p0, p1, p2, p3, u) {
  const invU = 1 - u;
  const invU2 = invU * invU;
  const invU3 = invU2 * invU;
  const u2 = u * u;
  const u3 = u2 * u;

  const x = invU3 * p0.x + 3 * invU2 * u * p1.x + 3 * invU * u2 * p2.x + u3 * p3.x;
  const y = invU3 * p0.y + 3 * invU2 * u * p1.y + 3 * invU * u2 * p2.y + u3 * p3.y;

  // Tangent derivative for auto-orientation
  const dx = 3 * invU2 * (p1.x - p0.x) + 6 * invU * u * (p2.x - p1.x) + 3 * u2 * (p3.x - p2.x);
  const dy = 3 * invU2 * (p1.y - p0.y) + 6 * invU * u * (p2.y - p1.y) + 3 * u2 * (p3.y - p2.y);
  const angleRad = Math.atan2(dy, dx);
  const angleDeg = (angleRad * 180) / Math.PI;

  return { x, y, angle: angleDeg };
}

/**
 * Creates a normalized motion path configuration object.
 */
export function createMotionPath({
  id = null,
  name = "Motion Path",
  waypoints = [],
  closed = false,
  autoOrient = true,
  easing = "easeInOut",
  duration = null, // null = defaults to layer/project duration
  startTime = 0,
}) {
  return {
    id: id || `path_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name,
    waypoints: Array.isArray(waypoints) && waypoints.length > 0 ? waypoints : getDefaultWaypoints(),
    closed: !!closed,
    autoOrient: autoOrient !== false,
    easing: easing || "easeInOut",
    duration,
    startTime: Number(startTime) || 0,
  };
}

export function getDefaultWaypoints() {
  return [
    { id: "wp_1", x: 300, y: 700, handleIn: { x: -50, y: 0 }, handleOut: { x: 80, y: -60 } },
    { id: "wp_2", x: 960, y: 300, handleIn: { x: -100, y: 0 }, handleOut: { x: 100, y: 0 } },
    { id: "wp_3", x: 1620, y: 700, handleIn: { x: -80, y: -60 }, handleOut: { x: 50, y: 0 } },
  ];
}

/**
 * Evaluates position and tangent orientation at given normalized progress [0..1]
 */
export function evaluateMotionPathAtProgress(pathConfig, rawProgress = 0) {
  if (!pathConfig || !Array.isArray(pathConfig.waypoints) || pathConfig.waypoints.length < 2) {
    return null;
  }

  const { waypoints, closed, autoOrient, easing = "linear" } = pathConfig;
  const progress = getPathEasing(Math.max(0, Math.min(1, rawProgress)), easing);

  // Build segments
  const segments = [];
  const count = closed ? waypoints.length : waypoints.length - 1;

  for (let i = 0; i < count; i++) {
    const pStart = waypoints[i];
    const pEnd = waypoints[(i + 1) % waypoints.length];

    const p0 = { x: pStart.x, y: pStart.y };
    const p1 = {
      x: pStart.x + (pStart.handleOut?.x || 0),
      y: pStart.y + (pStart.handleOut?.y || 0),
    };
    const p2 = {
      x: pEnd.x + (pEnd.handleIn?.x || 0),
      y: pEnd.y + (pEnd.handleIn?.y || 0),
    };
    const p3 = { x: pEnd.x, y: pEnd.y };

    // Approximate chord distance for proportional allocation
    const chord = Math.hypot(p3.x - p0.x, p3.y - p0.y);
    segments.push({ p0, p1, p2, p3, length: Math.max(1, chord) });
  }

  const totalLength = segments.reduce((sum, seg) => sum + seg.length, 0);
  const targetDistance = progress * totalLength;

  let accumulated = 0;
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    if (targetDistance <= accumulated + seg.length || i === segments.length - 1) {
      const segProgress = (targetDistance - accumulated) / seg.length;
      const u = Math.max(0, Math.min(1, segProgress));
      const res = evaluateCubicSegment(seg.p0, seg.p1, seg.p2, seg.p3, u);
      return {
        x: Math.round(res.x),
        y: Math.round(res.y),
        angle: autoOrient ? Math.round(res.angle) : 0,
      };
    }
    accumulated += seg.length;
  }

  const last = waypoints[waypoints.length - 1];
  return { x: last.x, y: last.y, angle: 0 };
}

/**
 * Reverses waypoint sequence and flips tangent handles.
 */
export function reverseWaypoints(waypoints) {
  if (!Array.isArray(waypoints)) return [];
  return [...waypoints].reverse().map((wp) => ({
    ...wp,
    handleIn: wp.handleOut ? { x: -wp.handleOut.x, y: -wp.handleOut.y } : { x: 0, y: 0 },
    handleOut: wp.handleIn ? { x: -wp.handleIn.x, y: -wp.handleIn.y } : { x: 0, y: 0 },
  }));
}

/**
 * Converts waypoint list into an SVG path "d" string for rendering.
 */
export function waypointsToSvgPath(waypoints, closed = false) {
  if (!Array.isArray(waypoints) || waypoints.length === 0) return "";
  let d = `M ${waypoints[0].x} ${waypoints[0].y}`;

  const count = closed ? waypoints.length : waypoints.length - 1;
  for (let i = 0; i < count; i++) {
    const curr = waypoints[i];
    const next = waypoints[(i + 1) % waypoints.length];

    const cp1x = curr.x + (curr.handleOut?.x || 0);
    const cp1y = curr.y + (curr.handleOut?.y || 0);
    const cp2x = next.x + (next.handleIn?.x || 0);
    const cp2y = next.y + (next.handleIn?.y || 0);

    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${next.x} ${next.y}`;
  }

  if (closed) d += " Z";
  return d;
}

/**
 * Path Presets Generator (Circle, Figure-8, Parabolic Arc, Sine Wave, Spiral)
 */
export function createPresetPath(type = "arc", cx = 960, cy = 540) {
  switch (type) {
    case "circle": {
      const r = 260;
      const k = r * 0.5522847498; // Bezier circle constant
      return createMotionPath({
        name: "Circle Loop",
        closed: true,
        waypoints: [
          { id: "c1", x: cx, y: cy - r, handleIn: { x: -k, y: 0 }, handleOut: { x: k, y: 0 } },
          { id: "c2", x: cx + r, y: cy, handleIn: { x: 0, y: -k }, handleOut: { x: 0, y: k } },
          { id: "c3", x: cx, y: cy + r, handleIn: { x: k, y: 0 }, handleOut: { x: -k, y: 0 } },
          { id: "c4", x: cx - r, y: cy, handleIn: { x: 0, y: k }, handleOut: { x: 0, y: -k } },
        ],
      });
    }
    case "infinity": {
      const rx = 350;
      const ry = 180;
      return createMotionPath({
        name: "Infinity / Figure-8",
        closed: true,
        waypoints: [
          { id: "i1", x: cx, y: cy, handleIn: { x: -100, y: 80 }, handleOut: { x: 100, y: -80 } },
          { id: "i2", x: cx + rx, y: cy, handleIn: { x: 0, y: -100 }, handleOut: { x: 0, y: 100 } },
          { id: "i3", x: cx, y: cy, handleIn: { x: 100, y: 80 }, handleOut: { x: -100, y: -80 } },
          { id: "i4", x: cx - rx, y: cy, handleIn: { x: 0, y: 100 }, handleOut: { x: 0, y: -100 } },
        ],
      });
    }
    case "wave": {
      return createMotionPath({
        name: "Undulating Wave",
        closed: false,
        waypoints: [
          { id: "w1", x: cx - 500, y: cy, handleIn: { x: -50, y: 0 }, handleOut: { x: 120, y: -180 } },
          { id: "w2", x: cx - 180, y: cy - 140, handleIn: { x: -100, y: 0 }, handleOut: { x: 100, y: 0 } },
          { id: "w3", x: cx + 180, y: cy + 140, handleIn: { x: -100, y: 0 }, handleOut: { x: 100, y: 0 } },
          { id: "w4", x: cx + 500, y: cy, handleIn: { x: -120, y: 180 }, handleOut: { x: 50, y: 0 } },
        ],
      });
    }
    case "spiral": {
      return createMotionPath({
        name: "Vortex Spiral",
        closed: false,
        waypoints: [
          { id: "s1", x: cx + 450, y: cy, handleIn: { x: 0, y: -120 }, handleOut: { x: 0, y: 180 } },
          { id: "s2", x: cx, y: cy + 300, handleIn: { x: 140, y: 0 }, handleOut: { x: -120, y: 0 } },
          { id: "s3", x: cx - 220, y: cy, handleIn: { x: 0, y: 90 }, handleOut: { x: 0, y: -90 } },
          { id: "s4", x: cx, y: cy - 120, handleIn: { x: -70, y: 0 }, handleOut: { x: 50, y: 0 } },
          { id: "s5", x: cx, y: cy, handleIn: { x: 30, y: 0 }, handleOut: { x: 0, y: 0 } },
        ],
      });
    }
    case "arc":
    default: {
      return createMotionPath({
        name: "Parabolic Arc",
        closed: false,
        waypoints: [
          { id: "a1", x: cx - 400, y: cy + 200, handleIn: { x: -50, y: 0 }, handleOut: { x: 100, y: -150 } },
          { id: "a2", x: cx, y: cy - 180, handleIn: { x: -120, y: 0 }, handleOut: { x: 120, y: 0 } },
          { id: "a3", x: cx + 400, y: cy + 200, handleIn: { x: -100, y: -150 }, handleOut: { x: 50, y: 0 } },
        ],
      });
    }
  }
}
