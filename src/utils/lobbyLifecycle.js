import { serverTimestamp, updateDoc } from "firebase/firestore";
import {
  EXPIRED_LOBBY_MESSAGE,
  FINISHED_LOBBY_MESSAGE,
  LOBBY_STATUS,
  isLobbyExpired,
} from "./lobbyLifecycleCore";

export { FINISHED_LOBBY_MESSAGE } from "./lobbyLifecycleCore";

export {
  EXPIRED_LOBBY_MESSAGE,
  LOBBY_INACTIVITY_MS,
  LOBBY_PLAYING_INACTIVITY_MS,
  LOBBY_WAITING_INACTIVITY_MS,
  LOBBY_STATUS,
  getInactivityLimitMs,
  getLastActivityMillis,
  isLobbyExpired,
  isLobbyJoinable,
  isLobbyTerminated,
  shouldRunLobbyBackgroundServices,
  toMillis,
} from "./lobbyLifecycleCore";

export function activityPatch() {
  return {
    lastActivityAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
}

export function withActivity(updates = {}) {
  return {
    ...updates,
    lastActivityAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
}

export async function markLobbyExpired(lobbyRef) {
  await updateDoc(
    lobbyRef,
    withActivity({
      status: LOBBY_STATUS.EXPIRED,
      expiredAt: serverTimestamp(),
    })
  );
}

export async function markLobbyFinished(lobbyRef, reason = "host") {
  await updateDoc(
    lobbyRef,
    withActivity({
      status: LOBBY_STATUS.FINISHED,
      finishedAt: serverTimestamp(),
      finishReason: reason,
    })
  );
}

export async function ensureJoinableLobby(lobbyRef, data) {
  if (data.status === LOBBY_STATUS.EXPIRED) {
    return { ok: false, message: EXPIRED_LOBBY_MESSAGE };
  }
  if (data.status === LOBBY_STATUS.FINISHED) {
    return { ok: false, message: FINISHED_LOBBY_MESSAGE };
  }
  if (isLobbyExpired(data)) {
    await markLobbyExpired(lobbyRef);
    return { ok: false, message: EXPIRED_LOBBY_MESSAGE };
  }
  return { ok: true };
}

export async function handleLeaveLobby(lobbyRef, lobby, playerName) {
  if (!lobby?.players?.length || !playerName) return { lobbyClosed: false };

  const remaining = lobby.players.filter((p) => p.name !== playerName);
  const leavingWasHost = lobby.players.some(
    (p) => p.name === playerName && p.isHost
  );

  if (remaining.length === 0) {
    await updateDoc(
      lobbyRef,
      withActivity({
        players: [],
        status: LOBBY_STATUS.FINISHED,
        finishedAt: serverTimestamp(),
        finishReason: "last_player_left",
      })
    );
    return { lobbyClosed: true };
  }

  const updates = { players: remaining };
  if (leavingWasHost) {
    updates.players = remaining.map((p, i) =>
      i === 0 ? { ...p, isHost: true } : { ...p, isHost: false }
    );
  }

  await updateDoc(lobbyRef, withActivity(updates));
  return { lobbyClosed: false };
}
