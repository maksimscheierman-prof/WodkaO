/** Pure test-access gate logic (no React / AsyncStorage). */

/**
 * @typedef {'web' | 'all' | 'none'} TestAccessPlatforms
 */

function getTestAccessCode() {
  return (process.env.EXPO_PUBLIC_TEST_ACCESS_CODE || "").trim();
}

/** @returns {TestAccessPlatforms} */
function getTestAccessPlatforms() {
  const raw = (process.env.EXPO_PUBLIC_TEST_ACCESS_PLATFORMS || "web")
    .trim()
    .toLowerCase();
  if (raw === "all" || raw === "none") return raw;
  return "web";
}

/**
 * Whether the access gate should be shown for this platform/build.
 * @param {string} platformOS - e.g. "web", "android", "ios"
 * @param {boolean} isDev
 */
function isGateRequiredForPlatform(platformOS, isDev) {
  const platforms = getTestAccessPlatforms();
  if (platforms === "none") return false;
  if (platforms === "web" && platformOS !== "web") return false;

  const code = getTestAccessCode();
  if (!code && isDev) return false;

  return true;
}

/**
 * @param {string} input
 * @param {string} [expectedCode]
 * @returns {{ ok: true } | { ok: false, reason: 'empty' | 'wrong' | 'not_configured' }}
 */
function validateAccessCode(input, expectedCode = getTestAccessCode()) {
  if (!expectedCode) {
    return { ok: false, reason: "not_configured" };
  }
  const normalized = (input || "").trim();
  if (!normalized) return { ok: false, reason: "empty" };
  if (normalized !== expectedCode) return { ok: false, reason: "wrong" };
  return { ok: true };
}

/**
 * Production gate without configured code — block with warning.
 * @param {boolean} isDev
 * @returns {'missing_env' | null}
 */
function getGateBlockReason(isDev) {
  if (isDev) return null;
  if (!getTestAccessCode()) return "missing_env";
  return null;
}

module.exports = {
  getTestAccessCode,
  getTestAccessPlatforms,
  isGateRequiredForPlatform,
  validateAccessCode,
  getGateBlockReason,
};
