/**
 * Helper to parse and manage multiple Gemini API Keys and Models
 * Supports:
 * - Comma-separated keys: GEMINI_API_KEY=key1,key2,key3,
 * - Model fallback cascade: gemini-2.5-flash -> gemini-2.0-flash -> gemini-1.5-flash -> gemini-1.5-pro
 * - Automatic retry on 503 (high demand / UNAVAILABLE), 429 (rate limit / RESOURCE_EXHAUSTED), and auth errors (401, 403)
 */

let currentKeyIndex = 0;

/**
 * Ordered fallback models when a specific model experiences 503 high demand or quota limits.
 */
export const FALLBACK_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  "gemini-2.5-pro",
  "gemini-1.5-pro",
];

/**
 * Returns prioritized array of models to attempt.
 */
export function getModelCandidateList(preferredModel) {
  const chosen = preferredModel || process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const list = [chosen];
  for (const m of FALLBACK_MODELS) {
    if (!list.includes(m)) {
      list.push(m);
    }
  }
  return list;
}

/**
 * Extracts all non-empty API keys from environment variable.
 * Handles trailing commas, extra whitespace, and single keys.
 */
export function getGeminiApiKeys() {
  const raw = process.env.GEMINI_API_KEY || "";
  return raw
    .split(",")
    .map((k) => k.trim())
    .filter((k) => k.length > 0);
}

/**
 * Returns an ordered array of keys to attempt for a request.
 * Starts from the current round-robin index, wrapping around all available keys.
 */
export function getPrioritizedKeyPool() {
  const keys = getGeminiApiKeys();
  if (keys.length === 0) return [];

  const startIndex = currentKeyIndex % keys.length;
  currentKeyIndex = (currentKeyIndex + 1) % keys.length;

  const pool = [];
  for (let i = 0; i < keys.length; i++) {
    const idx = (startIndex + i) % keys.length;
    pool.push({ key: keys[idx], index: idx + 1, total: keys.length });
  }

  return pool;
}

/**
 * Checks if an error is eligible for fallback to another model or next API key:
 * - 503 High demand / Overloaded / UNAVAILABLE
 * - 429 Rate limit / Quota exceeded / RESOURCE_EXHAUSTED
 * - 401 / 403 Invalid key / Unauthorized
 */
export function isRetryableApiKeyError(error) {
  if (!error) return false;
  const msg = String(error.message || error).toLowerCase();
  const status = error.status || error.statusCode || 0;

  return (
    status === 503 ||
    status === 429 ||
    status === 401 ||
    status === 403 ||
    status === 500 ||
    msg.includes("503") ||
    msg.includes("high demand") ||
    msg.includes("unavailable") ||
    msg.includes("overloaded") ||
    msg.includes("429") ||
    msg.includes("quota") ||
    msg.includes("resource_exhausted") ||
    msg.includes("rate limit") ||
    msg.includes("api key not valid") ||
    msg.includes("api_key_invalid") ||
    msg.includes("unauthorized") ||
    msg.includes("forbidden")
  );
}

/**
 * Formats raw error into clean, user-friendly message.
 */
export function cleanErrorMessage(rawMessage) {
  if (!rawMessage) return "Terjadi kesalahan pada layanan Gemini AI.";
  const msg = String(rawMessage);

  // If it's a JSON string like {"error":{"code":503,"message":"..."}}
  try {
    const parsed = JSON.parse(msg);
    if (parsed.error?.message) {
      if (parsed.error.code === 503 || parsed.error.status === "UNAVAILABLE") {
        return "Server Gemini sedang mengalami lonjakan trafik tinggi (High Demand). Sistem telah mencoba auto-retry, silakan klik 'Coba Lagi' dalam beberapa saat.";
      }
      return parsed.error.message;
    }
  } catch (e) {
    // Not JSON, continue to string match
  }

  if (msg.includes("503") || msg.toLowerCase().includes("high demand") || msg.toLowerCase().includes("unavailable")) {
    return "Server Gemini sedang mengalami lonjakan trafik tinggi (High Demand). Silakan coba lagi sebentar lagi.";
  }

  if (msg.toLowerCase().includes("quota") || msg.includes("429")) {
    return "Batas kuota Gemini API tercapai. Jika Anda memiliki beberapa key, pastikan telah dimasukkan di GEMINI_API_KEY.";
  }

  return msg;
}
