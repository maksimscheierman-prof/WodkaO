/** Pure card display helpers (no React / Firebase imports). */

const DEFAULT_CARD_IMAGE_URI =
  "https://jerrichoz.github.io/DrinkingGameOh/assets/images/cards/default_card.png";

const DEFAULT_CARD_IMAGE = { uri: DEFAULT_CARD_IMAGE_URI };

const CARD_IMAGE_BASE_URL =
  "https://jerrichoz.github.io/DrinkingGameOh/assets/images/cards";

const SAFE_URI_PREFIXES = ["http://", "https://", "file://", "data:image"];

function pickCardPayload(card) {
  if (!card || typeof card !== "object") return {};
  return {
    name: card.name,
    title: card.title,
    effect: card.effect,
    type: card.type,
    image: card.image,
    imageName: card.imageName,
    atk: card.atk,
    def: card.def,
    stars: card.stars,
    monsterType: card.monsterType,
  };
}

function sanitizeImageUri(value) {
  if (value == null) return null;
  const uri = String(value).trim();
  if (!uri) return null;
  const lower = uri.toLowerCase();
  if (SAFE_URI_PREFIXES.some((prefix) => lower.startsWith(prefix))) {
    return uri;
  }
  return null;
}

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
  if (typeof image === "string") {
    const uri = sanitizeImageUri(image);
    return uri ? { uri } : DEFAULT_CARD_IMAGE;
  }
  if (typeof image === "object") {
    const uri = sanitizeImageUri(image.uri ?? image.url ?? image.src);
    if (uri) return { uri };
  }
  return DEFAULT_CARD_IMAGE;
}

function normalizeCardType(rawType, fallbackType) {
  if (typeof rawType === "string" && rawType.trim()) {
    return rawType.trim().toLowerCase();
  }
  if (typeof fallbackType === "string" && fallbackType.trim()) {
    return fallbackType.trim().toLowerCase();
  }
  return "unbekannt";
}

/**
 * @param {object | null | undefined} card
 * @param {{ defaultType?: string }} [options]
 */
function normalizeCardForDisplay(card, options = {}) {
  if (!card || typeof card !== "object") return null;

  const payload = pickCardPayload(card);
  const rawType = normalizeCardType(payload.type, options.defaultType);

  const starsRaw = parseInt(payload.stars, 10);
  const stars = Number.isFinite(starsRaw)
    ? Math.min(Math.max(starsRaw, 0), 12)
    : 0;

  const image = normalizeCardImage(resolveCardImageField(payload));

  return {
    name: payload.name || payload.title || "Unbekannte Karte",
    title: payload.title || payload.name || "Unbekannte Karte",
    effect: payload.effect || "Kein Effekttext verfügbar.",
    type: rawType,
    atk: Number(payload.atk) || 0,
    def: Number(payload.def) || 0,
    stars,
    monsterType: payload.monsterType || "[Effekt]",
    imageName: payload.imageName || null,
    image,
  };
}

function getNativeImageSourceFromCard(card) {
  if (!card || typeof card !== "object") return DEFAULT_CARD_IMAGE;
  return normalizeCardImage(resolveCardImageField(card));
}

function describeImageSource(image) {
  if (image == null) {
    return { sourceType: "missing", hasImage: false, imageUri: null };
  }
  if (typeof image === "number") {
    return { sourceType: "asset", hasImage: true, imageUri: null };
  }
  if (typeof image === "object" && image.uri) {
    return {
      sourceType: "uri",
      hasImage: true,
      imageUri: String(image.uri),
    };
  }
  return { sourceType: "invalid", hasImage: false, imageUri: null };
}

function getMonsterPressLog(card, context = {}) {
  const payload = pickCardPayload(card);
  const normalized = normalizeCardForDisplay(card, {
    defaultType: context.defaultType || "monster",
  });
  const thumbSource = getNativeImageSourceFromCard(card);
  const thumbMeta = describeImageSource(thumbSource);
  const modalMeta = describeImageSource(normalized?.image);

  return {
    playerKey: context.playerKey ?? null,
    playerName: context.playerName ?? null,
    cardName: normalized?.name ?? payload.name ?? null,
    imageName: payload.imageName ?? null,
    cardType: normalized?.type ?? null,
    hasImage: modalMeta.hasImage,
    sourceType: modalMeta.sourceType,
    imageUri: modalMeta.imageUri,
    thumbSourceType: thumbMeta.sourceType,
    thumbImageUri: thumbMeta.imageUri,
    valid: normalized != null,
  };
}

function getCardOpenLog(card, source = "unknown") {
  const normalized = normalizeCardForDisplay(card);
  const rawKeys =
    card && typeof card === "object" ? Object.keys(card) : [];
  const imageMeta = describeImageSource(normalized?.image);

  return {
    source,
    name: normalized?.name ?? null,
    type: normalized?.type ?? null,
    keys: rawKeys,
    imageKind: imageMeta.sourceType,
    imageUri: imageMeta.imageUri,
    valid: normalized != null,
  };
}

function isValidPlayableCard(card, options = {}) {
  return normalizeCardForDisplay(card, options) != null;
}

function getImageSourceForNative(img) {
  return getNativeImageSourceFromCard(
    img && typeof img === "object" && !img.image && !img.imageName
      ? { image: img }
      : img
  );
}

module.exports = {
  DEFAULT_CARD_IMAGE_URI,
  DEFAULT_CARD_IMAGE,
  pickCardPayload,
  sanitizeImageUri,
  normalizeCardImage,
  normalizeCardForDisplay,
  isValidPlayableCard,
  getImageSourceForNative,
  getNativeImageSourceFromCard,
  getMonsterPressLog,
  getCardOpenLog,
  resolveCardImageField,
  describeImageSource,
};
