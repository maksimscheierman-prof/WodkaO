/** Trap choice when drawing a second trap (Node-testable). */

const TRAP_CHOICE_SECONDS = 60;

function isTrapCard(card) {
  const t = String(card?.type ?? "").trim().toUpperCase();
  return t === "TRAP";
}

function hasActiveTrap(player) {
  return !!(player?.trap && typeof player.trap === "object");
}

/**
 * @returns {boolean} true if draw should open trap choice instead of auto-replace
 */
function shouldStartTrapChoice(activePlayer, drawnCard) {
  if (!activePlayer || !drawnCard) return false;
  if (!isTrapCard(drawnCard)) return false;
  return hasActiveTrap(activePlayer);
}

function buildPendingTrapChoice(playerKey, existingTrap, drawnTrap, startedAt = Date.now()) {
  return {
    playerKey,
    existingTrap,
    drawnTrap,
    startedAt,
  };
}

function isTrapChoiceForPlayer(pending, playerName) {
  return !!(
    pending &&
    playerName &&
    pending.playerKey === playerName
  );
}

function canResolveTrapChoice(lobby, playerName) {
  if (!lobby?.pendingTrapChoice) return false;
  if (!isTrapChoiceForPlayer(lobby.pendingTrapChoice, playerName)) return false;
  const turnIdx = lobby.turn ?? 0;
  const active = lobby.players?.[turnIdx];
  return active?.name === playerName;
}

/**
 * @param {"keep_existing" | "keep_drawn"} choice
 */
function applyTrapChoiceUpdate(lobby, choice) {
  const pending = lobby?.pendingTrapChoice;
  if (!pending) return null;
  if (choice !== "keep_existing" && choice !== "keep_drawn") return null;

  const turnIdx = lobby.turn ?? 0;
  const playerCount = lobby.players?.length || 1;
  const activePlayer = lobby.players?.[turnIdx];
  if (!activePlayer || activePlayer.name !== pending.playerKey) return null;

  const kept =
    choice === "keep_existing" ? pending.existingTrap : pending.drawnTrap;
  const discarded =
    choice === "keep_existing" ? pending.drawnTrap : pending.existingTrap;

  const discardPile = [...(lobby.discardPile || [])];
  if (discarded) discardPile.push(discarded);

  const updatedPlayers = (lobby.players || []).map((p) =>
    p.name === pending.playerKey ? { ...p, trap: kept } : p
  );

  const nextTurn = (turnIdx + 1) % playerCount;
  const round =
    nextTurn === 0 ? (lobby.round || 1) + 1 : lobby.round || 1;

  return {
    players: updatedPlayers,
    discardPile,
    turn: nextTurn,
    round,
    pendingTrapChoice: null,
    lastMagic: null,
    showMagic: false,
  };
}

/** Apply simple trap placement (no existing trap) — turn advances. */
function applyTrapDrawNoChoice(lobby, activeIdx, card) {
  const activePlayer = lobby.players?.[activeIdx];
  if (!activePlayer) return null;

  const updatedPlayers = (lobby.players || []).map((p) =>
    p.name === activePlayer.name ? { ...p, trap: card } : p
  );
  const playerCount = lobby.players?.length || 1;
  const nextTurn = (activeIdx + 1) % playerCount;
  const round =
    nextTurn === 0 ? (lobby.round || 1) + 1 : lobby.round || 1;

  return {
    players: updatedPlayers,
    turn: nextTurn,
    round,
    lastMagic: null,
    showMagic: false,
    pendingTrapChoice: null,
  };
}

function getTrapChoiceSecondsLeft(pending, now = Date.now()) {
  if (!pending?.startedAt) return TRAP_CHOICE_SECONDS;
  const elapsed = Math.max(0, Math.floor((now - pending.startedAt) / 1000));
  return Math.max(0, TRAP_CHOICE_SECONDS - elapsed);
}

function shouldAutoResolveTrapChoice(pending, now = Date.now()) {
  return getTrapChoiceSecondsLeft(pending, now) === 0;
}

/** Disconnect / timeout default: keep existing trap, discard drawn. */
const TRAP_CHOICE_TIMEOUT_CHOICE = "keep_existing";

function getTrapChoiceCardBounds(screenWidth, screenHeight, stacked = false) {
  const maxHeight = Math.round(screenHeight * (stacked ? 0.38 : 0.4));
  if (stacked) {
    return {
      maxWidth: Math.round(screenWidth * 0.9),
      maxHeight,
    };
  }
  const pairSlot = Math.floor((screenWidth - 40) / 2);
  return {
    maxWidth: Math.min(Math.round(screenWidth * 0.44), pairSlot),
    maxHeight,
  };
}

function usesStackedTrapLayout(screenWidth) {
  return screenWidth < 520;
}

module.exports = {
  TRAP_CHOICE_SECONDS,
  TRAP_CHOICE_TIMEOUT_CHOICE,
  isTrapCard,
  hasActiveTrap,
  shouldStartTrapChoice,
  buildPendingTrapChoice,
  isTrapChoiceForPlayer,
  canResolveTrapChoice,
  applyTrapChoiceUpdate,
  applyTrapDrawNoChoice,
  getTrapChoiceSecondsLeft,
  shouldAutoResolveTrapChoice,
  getTrapChoiceCardBounds,
  usesStackedTrapLayout,
};
