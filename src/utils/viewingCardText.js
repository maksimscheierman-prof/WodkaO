export function getViewingCardLabel(type) {
  if (type === "monster") return "👀 Monsterkarte";
  if (type === "trap") return "👀 Fallenkarte";
  return null;
}

export const VIEWING_CARD_TIMEOUT_MS = 15000;
