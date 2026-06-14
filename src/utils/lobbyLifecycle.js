import { serverTimestamp, updateDoc } from "firebase/firestore";
import {
  EXPIRED_LOBBY_MESSAGE,
  LOBBY_STATUS,
  isLobbyExpired,
} from "./lobbyLifecycleCore";

export const FINISHED_LOBBY_MESSAGE = "Dieses Spiel ist beendet.";

export {
  EXPIRED_LOBBY_MESSAGE,
  LOBBY_INACTIVITY_MS,
  LOBBY_STATUS,
  getLastActivityMillis,
  isLobbyExpired,
  isLobbyJoinable,
  toMillis,
} from "./lobbyLifecycleCore";

export function activityPatch() {
  return { lastActivityAt: serverTimestamp() };
}

export function withActivity(updates = {}) {
  return { ...updates, lastActivityAt: serverTimestamp() };
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
  if (!lobby?.players?.length || !playerName) return;

  const remaining = lobby.players.filter((p) => p.name !== playerName);
  const leavingWasHost = lobby.players.some(
    (p) => p.name === playerName && p.isHost
  );

  const updates = { players: remaining };
  if (remaining.length > 0 && leavingWasHost) {
    updates.players = remaining.map((p, i) =>
      i === 0 ? { ...p, isHost: true } : { ...p, isHost: false }
    );
  }

  await updateDoc(lobbyRef, withActivity(updates));
}
