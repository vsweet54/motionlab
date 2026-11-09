/**
 * Professional Cubic Bezier Curve Solver & Easing Engine for MotionLab
 * Computes exact timing curves using Newton-Raphson approximation with bisection fallback.
 */

const NEWTON_ITERATIONS = 8;
const NEWTON_MIN_SLOPE = 0.001;
const SUBDIVISION_PRECISION = 0.0000001;
const SUBDIVISION_MAX_ITERATIONS = 10;

export const BEZIER_PRESETS = {
  linear: { name: "Linear", p1: [0.0, 0.0], p2: [1.0, 1.0], css: "linear" },
  ease: { name: "Ease", p1: [0.25, 0.1], p2: [0.25, 1.0], css: "ease" },
  easeIn: { name: "Ease In (Quad)", p1: [0.42, 0.0], p2: [1.0, 1.0], css: "cubic-bezier(0.42, 0.0, 1.0, 1.0)" },
  easeOut: { name: "Ease Out (Quad)", p1: [0.0, 0.0], p2: [0.58, 1.0], css: "cubic-bezier(0.0, 0.0, 0.58, 1.0)" },
  easeInOut: { name: "Ease In-Out", p1: [0.42, 0.0], p2: [0.58, 1.0], css: "cubic-bezier(0.42, 0.0, 0.58, 1.0)" },
  backIn: { name: "Anticipate (Back In)", p1: [0.36, 0.0], p2: [0.66, -0.56], css: "cubic-bezier(0.36, 0.0, 0.66, -0.56)" },
  backOut: { name: "Overshoot (Back Out)", p1: [0.34, 1.56], p2: [0.64, 1.0], css: "cubic-bezier(0.34, 1.56, 0.64, 1.0)" },
  backInOut: { name: "Back In-Out", p1: [0.68, -0.6], p2: [0.32, 1.6], css: "cubic-bezier(0.68, -0.6, 0.32, 1.6)" },
  snappy: { name: "Snappy Pop", p1: [0.16, 1.0], p2: [0.3, 1.0], css: "cubic-bezier(0.16, 1.0, 0.3, 1.0)" },
  smoothDecel: { name: "Smooth Decel", p1: [0.05, 0.7], p2: [0.1, 1.0], css: "cubic-bezier(0.05, 0.7, 0.1, 1.0)" },
  slowMo: { name: "Slow Motion", p1: [0.8, 0.2], p2: [0.2, 0.8], css: "cubic-bezier(0.8, 0.2, 0.2, 0.8)" },
};

function A(aA1, aA2) {
  return 1.0 - 3.0 * aA2 + 3.0 * aA1;
}

function B(aA1, aA2) {
  return 3.0 * aA2 - 6.0 * aA1;
}

function C(aA1) {
  return 3.0 * aA1;
}

// Returns x(t) given t, x1, and x2
function calcBezier(aT, aA1, aA2) {
  return ((A(aA1, aA2) * aT + B(aA1, aA2)) * aT + C(aA1)) * aT;
}

// Returns dx/dt given t, x1, and x2
function getSlope(aT, aA1, aA2) {
  return 3.0 * A(aA1, aA2) * aT * aT + 2.0 * B(aA1, aA2) * aT + C(aA1);
}

function binarySubdivide(aX, aA, aB, mX1, mX2) {
  let currentX;
  let currentT;
  let i = 0;
  do {
    currentT = aA + (aB - aA) / 2.0;
    currentX = calcBezier(currentT, mX1, mX2) - aX;
    if (currentX > 0.0) {
      aB = currentT;
    } else {
      aA = currentT;
    }
  } while (Math.abs(currentX) > SUBDIVISION_PRECISION && ++i < SUBDIVISION_MAX_ITERATIONS);
  return currentT;
}

function newtonRaphsonIterate(aX, aGuessT, mX1, mX2) {
  for (let i = 0; i < NEWTON_ITERATIONS; ++i) {
    const currentSlope = getSlope(aGuessT, mX1, mX2);
    if (currentSlope === 0.0) {
      return aGuessT;
    }
    const currentX = calcBezier(aGuessT, mX1, mX2) - aX;
    aGuessT -= currentX / currentSlope;
  }
  return aGuessT;
}

/**
 * Creates a Bezier easing function for the control points (x1, y1, x2, y2)
 */
export function createCubicBezierEasing(mX1, mY1, mX2, mY2) {
  const x1 = Math.max(0, Math.min(1, Number(mX1)));
  const y1 = Number(mY1);
  const x2 = Math.max(0, Math.min(1, Number(mX2)));
  const y2 = Number(mY2);

  if (x1 === y1 && x2 === y2) {
    return (t) => t; // Linear optimization
  }

  // Precompute sample table for fast initial guess
  const kSplineTableSize = 11;
  const kSampleStepSize = 1.0 / (kSplineTableSize - 1.0);
  const sampleValues = new Float32Array(kSplineTableSize);

  for (let i = 0; i < kSplineTableSize; ++i) {
    sampleValues[i] = calcBezier(i * kSampleStepSize, x1, x2);
  }

  function getTForX(aX) {
    let intervalStart = 0.0;
    let currentSample = 1;
    const lastSample = kSplineTableSize - 1;

    for (; currentSample !== lastSample && sampleValues[currentSample] <= aX; ++currentSample) {
      intervalStart += kSampleStepSize;
    }
    --currentSample;

    // Interpolate to provide an initial guess for t
    const dist = (aX - sampleValues[currentSample]) / (sampleValues[currentSample + 1] - sampleValues[currentSample]);
    const guessForT = intervalStart + dist * kSampleStepSize;

    const initialSlope = getSlope(guessForT, x1, x2);
    if (initialSlope >= NEWTON_MIN_SLOPE) {
      return newtonRaphsonIterate(aX, guessForT, x1, x2);
    } else if (initialSlope === 0.0) {
      return guessForT;
    } else {
      return binarySubdivide(aX, intervalStart, intervalStart + kSampleStepSize, x1, x2);
    }
  }

  return function (x) {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    return calcBezier(getTForX(x), y1, y2);
  };
}

/**
 * Evaluates progress through a cubic bezier curve given normalized input t [0..1]
 */
export function evaluateCubicBezier(x1, y1, x2, y2, t) {
  const solver = createCubicBezierEasing(x1, y1, x2, y2);
  return solver(Math.max(0, Math.min(1, t)));
}

/**
 * Formats control points into CSS cubic-bezier string
 */
export function formatBezierCss(x1, y1, x2, y2) {
  const r = (val) => Number(Number(val).toFixed(2));
  return `cubic-bezier(${r(x1)}, ${r(y1)}, ${r(x2)}, ${r(y2)})`;
}

/**
 * Parses a bezier definition or returns default easeInOut control points
 */
export function parseBezierPoints(bezierData) {
  if (Array.isArray(bezierData) && bezierData.length >= 4) {
    return [
      Math.max(0, Math.min(1, Number(bezierData[0]))),
      Number(bezierData[1]),
      Math.max(0, Math.min(1, Number(bezierData[2]))),
      Number(bezierData[3]),
    ];
  }
  return [0.42, 0.0, 0.58, 1.0];
}
