/** Card template frame resolution (Node-testable, no asset requires). */

export const CARD_TEMPLATE_WIDTH = 320;
export const CARD_TEMPLATE_HEIGHT = 550;

export const TEMPLATES_DIR = "assets/images/templates/";

export const FRAME_FILES = {
  monster: "monster_frame.png",
  magic: "magic_frame.png",
  trap: "trap_frame.png",
};

/** Absolute layout slots on the 320×550 template (matches CardStyles.js). */
export const CARD_LAYOUT = {
  template: { width: CARD_TEMPLATE_WIDTH, height: CARD_TEMPLATE_HEIGHT },
  titleWrap: { top: 27, left: 20, right: 20, height: 24 },
  cardTitle: { fontSize: 20 },
  starLevel: { top: 65, right: 30, width: 25, height: 25, stepX: 25 },
  imageBox: { top: 95, left: 34, width: 250, height: 295 },
  topTypeLabel: { top: 70, right: 32, fontSize: 14 },
  monsterDescription: { top: 415, left: 28, right: 20, bottom: 40, fontSize: 12, lineHeight: 16 },
  monsterAtk: { bottom: 13, right: 80, fontSize: 12 },
  monsterDef: { bottom: 13, right: 20, fontSize: 12 },
};

/**
 * Resolve playable card type → frame key (monster | magic | trap).
 * @param {string | undefined | null} rawType
 * @param {string} [fallback="monster"]
 */
export function resolveCardFrameType(rawType, fallback = "monster") {
  const t = String(rawType ?? fallback ?? "monster")
    .trim()
    .toLowerCase();
  if (["magic", "spell", "zauber", "zauberkarte"].includes(t)) return "magic";
  if (["trap", "falle", "fallenkarte"].includes(t)) return "trap";
  if (["monster", "monsters", "unbekannt"].includes(t) || !t) return "monster";
  return "monster";
}

export function getFrameFileName(frameType) {
  return FRAME_FILES[frameType] || FRAME_FILES.monster;
}

export function getFrameAssetPath(rawType, fallback = "monster") {
  const frameType = resolveCardFrameType(rawType, fallback);
  return `${TEMPLATES_DIR}${getFrameFileName(frameType)}`;
}

export function getTypeLabel(frameType, monsterType) {
  if (frameType === "magic") return "[ZAUBERKARTE]";
  if (frameType === "trap") return "[FALLENKARTE]";
  const mt =
    typeof monsterType === "string" && monsterType.trim()
      ? monsterType.trim()
      : "[MONSTER]";
  return mt;
}

/** Collect numeric text metrics from CARD_LAYOUT for validation tests. */
export function getCardLayoutTextMetrics() {
  const entries = [];
  for (const [key, block] of Object.entries(CARD_LAYOUT)) {
    if (block.fontSize != null) {
      entries.push({ component: `CARD_LAYOUT.${key}`, fontSize: block.fontSize, lineHeight: block.lineHeight ?? null, letterSpacing: block.letterSpacing ?? null });
    }
  }
  return entries;
}
