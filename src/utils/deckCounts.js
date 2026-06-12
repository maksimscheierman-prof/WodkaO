/**
 * Sichtbare Stapel-Werte aus Lobby-State.
 * monsterDeck / saufDeck liegen als Arrays in Firestore.
 */

export function getDiscardCount(lobby) {
  return lobby?.discardPile?.length ?? 0;
}

export function getSaufstapelCount(lobby) {
  return lobby?.saufDeck?.length ?? 0;
}

export function getMonsterDeckCount(lobby) {
  return lobby?.monsterDeck?.length ?? 0;
}

/** Fallen, die Spieler verdeckt halten. */
export function getTrapsInPlayCount(lobby) {
  return (lobby?.players || []).filter((p) => p.trap).length;
}

export function getTableStackCounts(lobby) {
  return {
    sauf: getSaufstapelCount(lobby),
    monster: getMonsterDeckCount(lobby),
    discard: getDiscardCount(lobby),
    trapsInPlay: getTrapsInPlayCount(lobby),
  };
}

export const STACK_COUNT_SOURCES = {
  sauf: "lobby.saufDeck.length — Magie + Fallen (gemischt)",
  monster: "lobby.monsterDeck.length — nur während Monster-Ziehphase relevant",
  discard: "lobby.discardPile.length",
  trapsInPlay: "Anzahl verdeckter Fallen bei Spielern",
};
