/**
 * Zählt sichtbare Stapel-Werte aus vorhandenem Lobby-State.
 * Kein zentrales Deck im Firestore — Magie wird per randomMagic() ohne Abzug gezogen.
 */

export function getDiscardCount(lobby) {
  return lobby?.discardPile?.length ?? 0;
}

/** Fallen, die Spieler noch verdeckt halten (kein Reservestapel im State). */
export function getTrapsInPlayCount(lobby) {
  return (lobby?.players || []).filter((p) => p.trap).length;
}

export function getTableStackCounts(lobby, magicPoolSize = null) {
  return {
    magic: magicPoolSize,
    traps: getTrapsInPlayCount(lobby),
    discard: getDiscardCount(lobby),
  };
}

export const STACK_COUNT_SOURCES = {
  magic:
    "Nicht im Firestore. Anzeige = Größe des Magic-Pools aus Google Sheets (loadCards), nicht verbleibende Karten — Ziehen via randomMagic() ohne Deck-Abzug.",
  traps:
    "players[].trap — Anzahl verdeckter Fallen bei Spielern, kein zentraler Fallenstapel im State.",
  discard: "lobby.discardPile.length — exakt.",
};
