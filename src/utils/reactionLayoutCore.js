/** Reaction-phase layout + view state (Node-testable). */

const { isValidPlayableCard } = require("./cardDisplayCore.js");

const CARD_BASE_WIDTH = 320;
const CARD_BASE_HEIGHT = 550;

const MAGIC_HEIGHT_RATIO = 0.55;
const MAGIC_WIDTH_RATIO = 0.9;
const DETAIL_HEIGHT_RATIO = 0.68;
const DETAIL_WIDTH_RATIO = 0.92;
const VOTING_HEIGHT_RATIO = 0.65;
const VOTING_WIDTH_RATIO = 0.9;

function getReactionMagicCardBounds(screenWidth, screenHeight) {
  return {
    maxWidth: Math.round(screenWidth * MAGIC_WIDTH_RATIO),
    maxHeight: Math.round(screenHeight * MAGIC_HEIGHT_RATIO),
  };
}

function getReactionDetailCardBounds(screenWidth, screenHeight) {
  return {
    maxWidth: Math.round(screenWidth * DETAIL_WIDTH_RATIO),
    maxHeight: Math.round(screenHeight * DETAIL_HEIGHT_RATIO),
  };
}

function getVotingCardBounds(screenWidth, screenHeight) {
  return {
    maxWidth: Math.round(screenWidth * VOTING_WIDTH_RATIO),
    maxHeight: Math.round(screenHeight * VOTING_HEIGHT_RATIO),
  };
}

function computeScaledCardSize(maxWidth, maxHeight) {
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

function hasOwnReactionMonster(me) {
  if (!me?.monster || typeof me.monster !== "object") return false;
  return isValidPlayableCard(me.monster, { defaultType: "monster" });
}

function hasOwnReactionTrap(me) {
  if (!me?.trap || typeof me.trap !== "object") return false;
  return isValidPlayableCard(me.trap, { defaultType: "trap" });
}

/**
 * @param {null | "monster" | "trap"} selectedReactionCard
 * @param {object} [options]
 * @param {boolean} [options.canActivateMonster=true]
 */
function getReactionViewUi(selectedReactionCard, me, options = {}) {
  const canActivateMonster = options.canActivateMonster !== false;
  const showMonsterOption = hasOwnReactionMonster(me);
  const showTrapOption = hasOwnReactionTrap(me);
  const isDefault = selectedReactionCard == null;
  const isMonsterDetail = selectedReactionCard === "monster";
  const isTrapDetail = selectedReactionCard === "trap";

  return {
    selectedReactionCard,
    isDefault,
    isMonsterDetail,
    isTrapDetail,
    showMonsterOption,
    showTrapOption,
    showDrink: true,
    showDone: true,
    showMonsterActivate:
      isMonsterDetail && showMonsterOption && canActivateMonster,
    showMonsterUsedHint:
      isMonsterDetail && showMonsterOption && !canActivateMonster,
    showTrapActivate: isTrapDetail && showTrapOption,
    showBackToMagic: isMonsterDetail || isTrapDetail,
    showMagicCard: isDefault,
    showMonsterCard: isMonsterDetail && showMonsterOption,
    showTrapCard: isTrapDetail && showTrapOption,
  };
}

function cardFitsViewport(scaled, screenWidth, screenHeight, mode = "magic") {
  const bounds =
    mode === "detail"
      ? getReactionDetailCardBounds(screenWidth, screenHeight)
      : getReactionMagicCardBounds(screenWidth, screenHeight);
  return (
    scaled.width <= bounds.maxWidth &&
    scaled.height <= bounds.maxHeight &&
    scaled.width > 0 &&
    scaled.height > 0
  );
}

module.exports = {
  CARD_BASE_WIDTH,
  CARD_BASE_HEIGHT,
  MAGIC_HEIGHT_RATIO,
  MAGIC_WIDTH_RATIO,
  DETAIL_HEIGHT_RATIO,
  DETAIL_WIDTH_RATIO,
  VOTING_HEIGHT_RATIO,
  VOTING_WIDTH_RATIO,
  getReactionMagicCardBounds,
  getReactionDetailCardBounds,
  getVotingCardBounds,
  computeScaledCardSize,
  hasOwnReactionMonster,
  hasOwnReactionTrap,
  getReactionViewUi,
  cardFitsViewport,
};
