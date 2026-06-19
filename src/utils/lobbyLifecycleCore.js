/** Pure lobby expiry helpers (no Firebase imports). */

const LOBBY_WAITING_INACTIVITY_MS = 30 * 60 * 1000;
const LOBBY_PLAYING_INACTIVITY_MS = 2 * 60 * 60 * 1000;

/** @deprecated Use LOBBY_PLAYING_INACTIVITY_MS — kept for backward-compatible imports */
const LOBBY_INACTIVITY_MS = LOBBY_PLAYING_INACTIVITY_MS;

const LOBBY_STATUS = {
  WAITING: "waiting",
  /** Active game — stored as `playing` in Firestore (alias: active) */
  PLAYING: "playing",
  ACTIVE: "playing",
  FINISHED: "finished",
  EXPIRED: "expired",
};

const EXPIRED_LOBBY_MESSAGE =
  "Diese Lobby ist abgelaufen. Bitte erstelle eine neue Lobby.";

const FINISHED_LOBBY_MESSAGE = "Dieses Spiel ist beendet.";

function toMillis(value) {
  if (value == null) return null;
  if (typeof value === "number") return value;
  if (typeof value.toMillis === "function") return value.toMillis();
  if (typeof value.seconds === "number") return value.seconds * 1000;
  return null;
}

function getLastActivityMillis(data) {
  if (!data) return null;
  for (const field of ["lastActivityAt", "updatedAt", "createdAt"]) {
    const ms = toMillis(data[field]);
    if (ms != null) return ms;
  }
  return null;
}

function getActivityFieldSource(data) {
  if (!data) return null;
  for (const field of ["lastActivityAt", "updatedAt", "createdAt"]) {
    if (toMillis(data[field]) != null) return field;
  }
  return null;
}

function getInactivityLimitMs(data) {
  if (!data) return LOBBY_PLAYING_INACTIVITY_MS;
  if (data.status === LOBBY_STATUS.WAITING) return LOBBY_WAITING_INACTIVITY_MS;
  if (data.status === LOBBY_STATUS.PLAYING) return LOBBY_PLAYING_INACTIVITY_MS;
  return LOBBY_PLAYING_INACTIVITY_MS;
}

function isLobbyTerminated(data) {
  if (!data) return true;
  return (
    data.status === LOBBY_STATUS.FINISHED || data.status === LOBBY_STATUS.EXPIRED
  );
}

function isLobbyExpired(data, now = Date.now()) {
  if (!data) return true;
  if (data.status === LOBBY_STATUS.EXPIRED) return true;
  if (data.status === LOBBY_STATUS.FINISHED) return false;

  const last = getLastActivityMillis(data);
  if (last == null) return false;
  return now - last > getInactivityLimitMs(data);
}

function isLobbyJoinable(data, now = Date.now()) {
  if (!data) return false;
  if (isLobbyTerminated(data)) return false;
  if (isLobbyExpired(data, now)) return false;
  return true;
}

/** Background listeners, AI/TTS, and auto-writes should stop when false. */
function shouldRunLobbyBackgroundServices(data, now = Date.now()) {
  if (!data) return false;
  if (isLobbyTerminated(data)) return false;
  if (isLobbyExpired(data, now)) return false;
  return true;
}

module.exports = {
  LOBBY_WAITING_INACTIVITY_MS,
  LOBBY_PLAYING_INACTIVITY_MS,
  LOBBY_INACTIVITY_MS,
  LOBBY_STATUS,
  EXPIRED_LOBBY_MESSAGE,
  FINISHED_LOBBY_MESSAGE,
  toMillis,
  getLastActivityMillis,
  getActivityFieldSource,
  getInactivityLimitMs,
  isLobbyTerminated,
  isLobbyExpired,
  isLobbyJoinable,
  shouldRunLobbyBackgroundServices,
};
