/**
 * Helper to parse and manage multiple Gemini API Keys
 * Supports comma-separated list: GEMINI_API_KEY=key1,key2,key3,
 * Provides round-robin balancing and automatic retry/failover on quota (429) or auth errors.
 */

let currentKeyIndex = 0;

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
 * Checks if an error is eligible for fallback to next API key:
 * - Rate limit / Quota exceeded (429, RESOURCE_EXHAUSTED, quota)
 * - Invalid key / Unauthorized (401, 403, API_KEY_INVALID)
 */
export function isRetryableApiKeyError(error) {
  if (!error) return false;
  const msg = String(error.message || error).toLowerCase();
  const status = error.status || error.statusCode || 0;

  return (
    status === 429 ||
    status === 401 ||
    status === 403 ||
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
