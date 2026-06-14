/** Pure card modal helpers (no React). */

const { normalizeCardForDisplay } = require("./cardDisplayCore.js");

const CARD_MODAL_SOURCES = {
  GALLERY: "gallery",
  GAME_MONSTER: "gameMonster",
  GAME_TRAP: "gameTrap",
  MAGIC: "magic",
};

function getGameCardModalSource(type) {
  const raw = typeof type === "string" ? type.trim().toLowerCase() : "";
  if (raw === "trap") return CARD_MODAL_SOURCES.GAME_TRAP;
  if (raw === "magic") return CARD_MODAL_SOURCES.MAGIC;
  if (raw === "monster") return CARD_MODAL_SOURCES.GAME_MONSTER;
  return "game";
}

function shouldShowCardModal(visible, card) {
  if (!visible || !card) return false;
  return normalizeCardForDisplay(card) != null;
}

function isGalleryCardType(type) {
  const raw = typeof type === "string" ? type.trim().toLowerCase() : "";
  return raw === "monster" || raw === "magic" || raw === "trap" || raw === "unbekannt";
}

module.exports = {
  CARD_MODAL_SOURCES,
  getGameCardModalSource,
  shouldShowCardModal,
  isGalleryCardType,
};
