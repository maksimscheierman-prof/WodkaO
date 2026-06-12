/** Basisgröße der Kartenvorlage (CardStyles). */
export const CARD_BASE_WIDTH = 320;
export const CARD_BASE_HEIGHT = 550;

export function isCompactWidth(screenWidth) {
  return screenWidth < 400;
}

export function isLandscape(screenWidth, screenHeight) {
  return screenWidth > screenHeight;
}

export function isShortScreen(screenHeight) {
  return screenHeight < 680;
}

/** Skalierung für Modal-/Detailkarten — passt in Viewport ohne Clipping. */
export function getModalCardDimensions(
  screenWidth,
  screenHeight,
  verticalPad = 160
) {
  const horizontalPad = 24;
  const maxW = Math.max(200, screenWidth - horizontalPad);
  const maxH = Math.max(280, screenHeight - verticalPad);
  const scale = Math.min(
    1,
    maxW / CARD_BASE_WIDTH,
    maxH / CARD_BASE_HEIGHT
  );
  return {
    scale,
    baseWidth: CARD_BASE_WIDTH,
    baseHeight: CARD_BASE_HEIGHT,
    width: Math.round(CARD_BASE_WIDTH * scale),
    height: Math.round(CARD_BASE_HEIGHT * scale),
  };
}

/** Abstimmungs-/Vorschau-Bilder in Modals. */
export function getPreviewImageSize(screenWidth, screenHeight) {
  const { scale } = getModalCardDimensions(screenWidth, screenHeight, 220);
  return {
    width: Math.round(200 * scale),
    height: Math.round(300 * scale),
  };
}

/** HUD + Tischversatz abhängig von Höhe / Querformat. */
export function getLayoutMetrics(screenWidth, screenHeight = 800) {
  const landscape = isLandscape(screenWidth, screenHeight);
  const veryShort = screenHeight < 520;
  const short = isShortScreen(screenHeight);

  return {
    topHudHeight: veryShort ? 40 : landscape ? 48 : short ? 64 : 80,
    tableShiftY: 0,
  };
}

/** Reaktionsphase: Karten untereinander statt nebeneinander. */
export function shouldStackReactionCards(screenWidth, screenHeight) {
  return screenWidth < 520 || isShortScreen(screenHeight);
}

/** Mindest-Touchgröße für Buttons (Apple HIG ~44pt). */
export const MIN_TOUCH_SIZE = 44;
