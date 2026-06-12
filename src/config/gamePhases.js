/** Makro-Phasen des Spiels (Firestore: `gamePhase`). */
export const GAME_PHASES = {
  SETUP: "setup",
  ROLLING: "rollingForStartPlayer",
  RESOLVING_TIE: "resolvingTie",
  DRAWING_MONSTERS: "drawingMonsters",
  PLAYING: "playing",
};

export const SETUP_PHASES = [
  GAME_PHASES.ROLLING,
  GAME_PHASES.RESOLVING_TIE,
  GAME_PHASES.DRAWING_MONSTERS,
];

export function isSetupPhase(gamePhase) {
  return SETUP_PHASES.includes(gamePhase);
}

export function isPlayingPhase(gamePhase, lobby) {
  if (gamePhase === GAME_PHASES.PLAYING) return true;
  // Legacy-Lobbies ohne gamePhase, aber mit bereits verteilten Karten
  if (!gamePhase && lobby?.status === "playing") {
    return (lobby.players || []).some((p) => p.monster);
  }
  return false;
}

export function getPhaseLabel(gamePhase, diceRound = 1) {
  switch (gamePhase) {
    case GAME_PHASES.ROLLING:
      return "🎲 Startspieler würfeln";
    case GAME_PHASES.RESOLVING_TIE:
      return `🎲 Gleichstand — Auswürfeln (Runde ${diceRound})`;
    case GAME_PHASES.DRAWING_MONSTERS:
      return "👹 Monster ziehen";
    case GAME_PHASES.PLAYING:
      return "🎮 Spiel läuft";
    default:
      return "⏳ Vorbereitung";
  }
}
