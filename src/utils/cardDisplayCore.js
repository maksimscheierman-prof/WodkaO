/** Pure card display helpers (no React / Firebase imports). */

const DEFAULT_CARD_IMAGE_URI =
  "https://jerrichoz.github.io/DrinkingGameOh/assets/images/cards/default_card.png";

const DEFAULT_CARD_IMAGE = { uri: DEFAULT_CARD_IMAGE_URI };

const CARD_IMAGE_BASE_URL =
  "https://jerrichoz.github.io/DrinkingGameOh/assets/images/cards";

function resolveCardImageField(card) {
  if (!card || typeof card !== "object") return null;
  if (card.image != null) return card.image;
  if (card.imageName != null && String(card.imageName).trim()) {
    let file = String(card.imageName).trim();
    if (!file.toLowerCase().endsWith(".png")) file = `${file}.png`;
    return { uri: `${CARD_IMAGE_BASE_URL}/${file}` };
  }
  return null;
}

function normalizeCardImage(image) {
  if (image == null) return DEFAULT_CARD_IMAGE;
  if (typeof image === "number") return image;
  if (typeof image === "string" && image.trim()) {
    return { uri: image.trim() };
  }
  if (typeof image === "object") {
    const uri = image.uri ?? image.url ?? image.src;
    if (uri != null && String(uri).trim()) {
      return { uri: String(uri).trim() };
    }
  }
  return DEFAULT_CARD_IMAGE;
}

function normalizeCardForDisplay(card) {
  if (!card || typeof card !== "object") return null;

  const rawType =
    typeof card.type === "string" && card.type.trim()
      ? card.type.trim().toLowerCase()
      : "unbekannt";

  const starsRaw = parseInt(card.stars, 10);
  const stars = Number.isFinite(starsRaw)
    ? Math.min(Math.max(starsRaw, 0), 12)
    : 0;

  return {
    ...card,
    name: card.name || card.title || "Unbekannte Karte",
    title: card.title || card.name || "Unbekannte Karte",
    effect: card.effect || "Kein Effekttext verfügbar.",
    type: rawType,
    atk: Number(card.atk) || 0,
    def: Number(card.def) || 0,
    stars,
    monsterType: card.monsterType || "[Effekt]",
    image: normalizeCardImage(resolveCardImageField(card)),
  };
}

function getCardOpenLog(card, source = "unknown") {
  const normalized = normalizeCardForDisplay(card);
  const rawKeys =
    card && typeof card === "object" ? Object.keys(card) : [];
  const image = normalized?.image;
  let imageKind = "missing";
  if (typeof image === "number") imageKind = "asset";
  else if (image?.uri) imageKind = "uri";

  return {
    source,
    name: normalized?.name ?? null,
    type: normalized?.type ?? null,
    keys: rawKeys,
    imageKind,
    imageUri: typeof image === "number" ? null : image?.uri ?? null,
    valid: normalized != null,
  };
}

function isValidPlayableCard(card) {
  return normalizeCardForDisplay(card) != null;
}

function getImageSourceForNative(img) {
  const normalized = normalizeCardImage(img);
  if (typeof normalized === "number") return normalized;
  if (normalized?.uri) return normalized;
  return DEFAULT_CARD_IMAGE;
}

module.exports = {
  DEFAULT_CARD_IMAGE_URI,
  DEFAULT_CARD_IMAGE,
  normalizeCardImage,
  normalizeCardForDisplay,
  isValidPlayableCard,
  getImageSourceForNative,
  getCardOpenLog,
  resolveCardImageField,
};
