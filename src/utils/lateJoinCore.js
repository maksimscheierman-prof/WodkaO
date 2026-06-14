/** Pure late-join helpers (no Firebase imports). */

const { LOBBY_STATUS } = require("./lobbyLifecycleCore.js");

const MAX_PLAYERS = 8;

const FINISHED_LOBBY_MESSAGE = "Dieses Spiel ist beendet.";

function findLowestFreeSeat(players = []) {
  const used = new Set(
    players.map((p, i) => (p.seatIndex != null ? p.seatIndex : i))
  );
  for (let i = 0; i < MAX_PLAYERS; i += 1) {
    if (!used.has(i)) return i;
  }
  return players.length;
}

function drawRandomMonster(monsterDeck, randomFn = Math.random) {
  const deck = Array.isArray(monsterDeck) ? monsterDeck : [];
  if (deck.length === 0) {
    return { monster: null, monsterDeck: deck };
  }
  const idx = Math.floor(randomFn() * deck.length);
  return {
    monster: deck[idx],
    monsterDeck: [...deck.slice(0, idx), ...deck.slice(idx + 1)],
  };
}

/**
 * Build Firestore patch for joining a lobby (waiting or playing).
 * Does not mutate turn, gamePhase, votes, activeEffect, or discardPile.
 */
function applyLateJoin(data, playerName, playerId, options = {}) {
  const { randomFn = Math.random, now = Date.now() } = options;

  if (!data) {
    return { error: "NOT_FOUND", message: "Lobby nicht gefunden." };
  }
  if (data.status === LOBBY_STATUS.EXPIRED) {
    return { error: "EXPIRED", message: "Diese Lobby ist abgelaufen." };
  }
  if (data.status === LOBBY_STATUS.FINISHED) {
    return { error: "FINISHED", message: FINISHED_LOBBY_MESSAGE };
  }
  if (data.players?.some((p) => p.name === playerName)) {
    return { error: "ALREADY_JOINED" };
  }
  if ((data.players?.length ?? 0) >= MAX_PLAYERS) {
    return {
      error: "LOBBY_FULL",
      message: "Lobby ist voll (max. 8 Spieler).",
    };
  }

  const isPlaying = data.status === LOBBY_STATUS.PLAYING;
  const seatIndex = findLowestFreeSeat(data.players || []);

  let monster = null;
  let monsterDeck = data.monsterDeck ?? [];
  let hadMonster = false;

  if (isPlaying) {
    const draw = drawRandomMonster(monsterDeck, randomFn);
    monster = draw.monster;
    monsterDeck = draw.monsterDeck;
    hadMonster = monster != null;
  }

  const newPlayer = {
    id: playerId,
    name: playerName,
    ready: isPlaying,
    isHost: false,
    monster,
    trap: null,
    shots: 0,
    seatIndex,
  };

  const players = [...(data.players || []), newPlayer];
  const updates = { players };

  if (isPlaying) {
    updates.monsterDeck = monsterDeck;
    updates.lastJoinAnnouncement = {
      name: playerName,
      at: now,
      hadMonster,
    };
    const joinLog = [...(data.joinLog || []), { name: playerName, at: now }].slice(
      -20
    );
    updates.joinLog = joinLog;

    if (data.reactions && typeof data.reactions === "object") {
      updates.reactions = { ...data.reactions, [playerName]: { done: false } };
    }
  }

  let message;
  if (isPlaying) {
    message = hadMonster
      ? "Du bist dem laufenden Spiel beigetreten und erhältst ein Monster."
      : "Du bist dem laufenden Spiel beigetreten. Kein Monster mehr verfügbar.";
  } else {
    message = "Lobby beigetreten!";
  }

  return {
    updates,
    isLateJoin: isPlaying,
    hadMonster,
    message,
    newPlayer,
  };
}

module.exports = {
  MAX_PLAYERS,
  FINISHED_LOBBY_MESSAGE,
  findLowestFreeSeat,
  drawRandomMonster,
  applyLateJoin,
};
