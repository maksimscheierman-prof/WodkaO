import {
  createCardModalDebugStore,
  isCardModalDebugEnabled,
} from "./cardModalDebugCore";

const store = createCardModalDebugStore();

export function isCardModalDebugOn() {
  return isCardModalDebugEnabled();
}

export function shouldUseAndroidSafeCardModal() {
  const flag = (process.env.EXPO_PUBLIC_CARD_MODAL_SAFE_ANDROID || "").trim();
  if (flag === "1" || flag.toLowerCase() === "true") return true;
  return false;
}

export function recordCardModalDebug(phase, data = {}) {
  const entry = store.recordEvent(phase, data);
  const line = `[CARD MODAL DEBUG] ${phase}`;
  if (isCardModalDebugOn()) {
    console.log(line, data);
  } else {
    console.log(line, JSON.stringify(data));
  }
  return entry;
}

export function recordCardModalError(phase, error, extra = {}) {
  const message =
    error?.message || error?.nativeEvent?.error || String(error ?? "unknown");
  recordCardModalDebug(phase, { ...extra, error: message });
  console.error(`[CARD MODAL ERROR] ${phase}`, error, extra);
}

export function getCardModalDebugEvents() {
  return store.getEvents();
}

export function getCardModalDebugSnapshot() {
  return store.getSnapshot();
}

export function resetCardModalDebug() {
  store.reset();
}
