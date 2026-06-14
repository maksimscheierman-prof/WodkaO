import { runTransaction, serverTimestamp } from "firebase/firestore";
import { applyLateJoin } from "./lateJoinCore.js";
import {
  EXPIRED_LOBBY_MESSAGE,
  LOBBY_STATUS,
} from "./lobbyLifecycle.js";

/**
 * Atomically join a lobby (waiting or playing).
 * During playing: draws one monster from monsterDeck, appends player at end of turn order.
 */
export async function joinLobbyTransaction(db, lobbyRef, playerName, playerId) {
  return runTransaction(db, async (transaction) => {
    const snap = await transaction.get(lobbyRef);
    if (!snap.exists()) {
      return { ok: false, code: "NOT_FOUND", message: "Lobby nicht gefunden." };
    }

    const data = snap.data();
    const result = applyLateJoin(data, playerName, playerId);

    if (result.error) {
      const messages = {
        EXPIRED: EXPIRED_LOBBY_MESSAGE,
        FINISHED: "Dieses Spiel ist beendet.",
        LOBBY_FULL: result.message,
      };
      return {
        ok: false,
        code: result.error,
        message: messages[result.error] || "Beitritt nicht möglich.",
      };
    }

    transaction.update(lobbyRef, {
      ...result.updates,
      lastActivityAt: serverTimestamp(),
    });

    const successPrefix = data.status === LOBBY_STATUS.PLAYING ? "ℹ️ " : "✅ ";
    return {
      ok: true,
      isLateJoin: result.isLateJoin,
      hadMonster: result.hadMonster,
      message: `${successPrefix}${result.message}`,
    };
  });
}
