/** Scale CardStyles numeric values without transform (Android-safe). */

import { cardStyles } from "../styles/CardStyles";
import { safeFontSize, safeLineHeight } from "./safeTextMetricsCore";

const CARD_BASE_WIDTH = 320;
const CARD_BASE_HEIGHT = 550;

const SCALE_KEYS = new Set([
  "top",
  "left",
  "right",
  "bottom",
  "width",
  "height",
  "margin",
  "marginTop",
  "marginBottom",
  "marginHorizontal",
  "padding",
  "paddingVertical",
  "paddingHorizontal",
  "borderRadius",
  "zIndex",
  "elevation",
]);

function scaleStyleBlock(block, scale) {
  if (!block || scale >= 0.999) return block;
  const out = { ...block };
  for (const [key, value] of Object.entries(out)) {
    if (typeof value !== "number") continue;
    if (key === "fontSize") {
      out[key] = safeFontSize(value * scale, 10);
    } else if (key === "lineHeight") {
      out[key] = safeLineHeight(value * scale, 12);
    } else if (key === "letterSpacing") {
      out[key] = value * scale;
    } else if (SCALE_KEYS.has(key) || key.endsWith("Width") || key.endsWith("Height")) {
      out[key] = Math.round(value * scale);
    }
  }
  return out;
}

export function computeLayoutScale(maxWidth, maxHeight) {
  const scale = Math.min(
    1,
    maxWidth / CARD_BASE_WIDTH,
    maxHeight / CARD_BASE_HEIGHT
  );
  return {
    scale,
    width: Math.round(CARD_BASE_WIDTH * scale),
    height: Math.round(CARD_BASE_HEIGHT * scale),
  };
}

export function buildScaledCardStyles(layoutScale = 1) {
  if (layoutScale >= 0.999) return cardStyles;
  return {
    cardTemplate: scaleStyleBlock(cardStyles.cardTemplate, layoutScale),
    titleWrap: scaleStyleBlock(cardStyles.titleWrap, layoutScale),
    cardTitle: scaleStyleBlock(cardStyles.cardTitle, layoutScale),
    starLevel: scaleStyleBlock(cardStyles.starLevel, layoutScale),
    imageBox: scaleStyleBlock(cardStyles.imageBox, layoutScale),
    typeLabel: scaleStyleBlock(cardStyles.typeLabel, layoutScale),
    topTypeLabel: scaleStyleBlock(cardStyles.topTypeLabel, layoutScale),
    monsterDescription: scaleStyleBlock(cardStyles.monsterDescription, layoutScale),
    monsterAtk: scaleStyleBlock(cardStyles.monsterAtk, layoutScale),
    monsterDef: scaleStyleBlock(cardStyles.monsterDef, layoutScale),
  };
}

export { CARD_BASE_WIDTH, CARD_BASE_HEIGHT };
