/** Cache-Schlüssel und Hilfsfunktionen (Node-testbar). */

const CACHE_KEY_MAX_LEN = 120;

function normalizeCacheText(text) {
  return String(text || "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function hashString(value) {
  let hash = 5381;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 33) ^ value.charCodeAt(i);
  }
  return (hash >>> 0).toString(36);
}

function buildCacheKey(text, voiceId) {
  const normalized = normalizeCacheText(text).slice(0, CACHE_KEY_MAX_LEN);
  const voice = String(voiceId || "default").trim();
  return `${voice}_${hashString(`${voice}:${normalized}`)}`;
}

function getCacheFileName(cacheKey) {
  return `${cacheKey}.mp3`;
}

module.exports = {
  buildCacheKey,
  getCacheFileName,
  normalizeCacheText,
  hashString,
};
