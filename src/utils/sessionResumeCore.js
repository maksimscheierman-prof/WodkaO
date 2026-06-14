/** Pure session resume routing (no Firebase / AsyncStorage). */

const LOBBY_STATUS = {
  WAITING: "waiting",
  PLAYING: "playing",
  FINISHED: "finished",
  EXPIRED: "expired",
};

/**
 * Decide where to navigate after loading a saved session.
 * Firestore lobby data is source of truth; local session is only a pointer.
 */
function getResumeRoute(lobbyData, session = null) {
  if (!lobbyData) {
    return { action: "clear", reason: "not_found", message: "Lobby nicht mehr vorhanden." };
  }

  if (lobbyData.status === LOBBY_STATUS.EXPIRED) {
    return {
      action: "clear",
      reason: "expired",
      message: "Diese Lobby ist abgelaufen.",
    };
  }

  if (lobbyData.status === LOBBY_STATUS.FINISHED) {
    return {
      action: "clear",
      reason: "finished",
      message: "Dieses Spiel ist beendet.",
    };
  }

  if (lobbyData.status === LOBBY_STATUS.PLAYING) {
    return {
      action: "navigate",
      pathname: "/game",
      status: lobbyData.status,
      gamePhase: lobbyData.gamePhase ?? null,
      lobbyId: session?.lobbyId,
      playerName: session?.playerName,
    };
  }

  return {
    action: "navigate",
    pathname: "/lobby",
    status: lobbyData.status || LOBBY_STATUS.WAITING,
    gamePhase: null,
    lobbyId: session?.lobbyId,
    playerName: session?.playerName,
  };
}

function isSessionStale(session, maxAgeMs = 7 * 24 * 60 * 60 * 1000) {
  if (!session?.updatedAt) return true;
  return Date.now() - session.updatedAt > maxAgeMs;
}

module.exports = {
  LOBBY_STATUS,
  getResumeRoute,
  isSessionStale,
};
