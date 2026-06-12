/** Pure lobby expiry helpers (no Firebase imports). */

const LOBBY_INACTIVITY_MS = 2 * 60 * 60 * 1000;

const LOBBY_STATUS = {
  WAITING: "waiting",
  PLAYING: "playing",
  FINISHED: "finished",
  EXPIRED: "expired",
};

const EXPIRED_LOBBY_MESSAGE =
  "Diese Lobby ist abgelaufen. Bitte erstelle eine neue Lobby.";

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

function isLobbyExpired(data, now = Date.now()) {
  if (!data) return true;
  if (data.status === LOBBY_STATUS.EXPIRED) return true;
  if (data.status === LOBBY_STATUS.FINISHED) return false;

  const last = getLastActivityMillis(data);
  if (last == null) return false;
  return now - last > LOBBY_INACTIVITY_MS;
}

function isLobbyJoinable(data, now = Date.now()) {
  if (!data) return false;
  if (data.status === LOBBY_STATUS.EXPIRED) return false;
  if (isLobbyExpired(data, now)) return false;
  return true;
}

module.exports = {
  LOBBY_INACTIVITY_MS,
  LOBBY_STATUS,
  EXPIRED_LOBBY_MESSAGE,
  toMillis,
  getLastActivityMillis,
  getActivityFieldSource,
  isLobbyExpired,
  isLobbyJoinable,
};
