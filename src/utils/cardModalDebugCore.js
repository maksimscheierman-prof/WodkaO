/** Pure card-modal debug ring buffer (no React). */

const MAX_EVENTS = 40;

function isCardModalDebugEnabled(env = process.env) {
  const flag = (env.EXPO_PUBLIC_CARD_MODAL_DEBUG || "").trim();
  if (flag === "1" || flag.toLowerCase() === "true") return true;
  return env.NODE_ENV !== "production" && env.EXPO_PUBLIC_CARD_MODAL_DEBUG !== "0";
}

function isAndroidSafeModalForced(env = process.env) {
  const flag = (env.EXPO_PUBLIC_CARD_MODAL_SAFE_ANDROID || "").trim();
  if (flag === "1" || flag.toLowerCase() === "true") return true;
  if (flag === "0" || flag.toLowerCase() === "false") return false;
  return false;
}

function createCardModalDebugStore() {
  let events = [];
  let snapshot = {
    modalOpen: false,
    lastTapName: null,
    lastTapType: null,
    lastImageUri: null,
    lastError: null,
    renderMode: "auto",
    lastPhase: null,
  };

  function recordEvent(phase, data = {}) {
    const entry = {
      ts: Date.now(),
      phase,
      ...data,
    };
    events = [entry, ...events].slice(0, MAX_EVENTS);
    snapshot = {
      ...snapshot,
      lastPhase: phase,
      ...(data.modalOpen != null ? { modalOpen: data.modalOpen } : {}),
      ...(data.name != null ? { lastTapName: data.name } : {}),
      ...(data.type != null ? { lastTapType: data.type } : {}),
      ...(data.imageUri != null ? { lastImageUri: data.imageUri } : {}),
      ...(data.renderMode != null ? { renderMode: data.renderMode } : {}),
      ...(data.error != null ? { lastError: String(data.error) } : {}),
    };
    return entry;
  }

  function getEvents() {
    return [...events];
  }

  function getSnapshot() {
    return { ...snapshot };
  }

  function reset() {
    events = [];
    snapshot = {
      modalOpen: false,
      lastTapName: null,
      lastTapType: null,
      lastImageUri: null,
      lastError: null,
      renderMode: "auto",
      lastPhase: null,
    };
  }

  return { recordEvent, getEvents, getSnapshot, reset };
}

module.exports = {
  MAX_EVENTS,
  isCardModalDebugEnabled,
  isAndroidSafeModalForced,
  createCardModalDebugStore,
};
