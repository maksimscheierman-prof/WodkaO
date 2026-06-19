/** Phase 8 — Group Personality / Inside Jokes (lobby-scoped, Node-testbar). */

const ROAST_LEVELS = ["off", "mild", "medium", "hard", "no_boundaries"];

const DEFAULT_ROAST_LEVEL = "mild";

const MAX_FIELD_LENGTH = 120;
const MAX_NO_GO_TOPICS = 12;
const MAX_NO_GO_TOPIC_LENGTH = 40;

/** Immer verboten — unabhängig vom roastLevel. */
const FORBIDDEN_GLOBAL_TOPICS = [
  "hassrede",
  "diskriminierung",
  "herkunft",
  "religion",
  "politik",
  "sexualität",
  "sexualitaet",
  "körpermerkmale",
  "koerpermerkmale",
  "gewaltandrohung",
  "gewalt",
  "krankheit",
];

const ROAST_LEVEL_LABELS = {
  off: "Aus — nur neutral",
  mild: "Mild",
  medium: "Medium",
  hard: "Hard",
  no_boundaries: "No boundaries",
};

const FRIEND_INPUT_FIELDS = [
  "suggestedNickname",
  "typicalMoment",
  "runningJoke",
  "harmlessRoast",
  "oneLiner",
];

function normalizeWhitespace(text) {
  return String(text || "")
    .replace(/\s+/g, " ")
    .trim();
}

function truncateField(text, maxLen = MAX_FIELD_LENGTH) {
  const clean = normalizeWhitespace(text);
  if (clean.length <= maxLen) return clean;
  return clean.slice(0, maxLen).trim();
}

function sanitizeRoastLevel(value) {
  const level = String(value || DEFAULT_ROAST_LEVEL).toLowerCase();
  return ROAST_LEVELS.includes(level) ? level : DEFAULT_ROAST_LEVEL;
}

function parseNoGoTopicsInput(raw) {
  if (Array.isArray(raw)) {
    return raw
      .map((t) => truncateField(t, MAX_NO_GO_TOPIC_LENGTH))
      .filter(Boolean)
      .slice(0, MAX_NO_GO_TOPICS);
  }

  return String(raw || "")
    .split(/[,;\n]+/)
    .map((t) => truncateField(t, MAX_NO_GO_TOPIC_LENGTH))
    .filter(Boolean)
    .slice(0, MAX_NO_GO_TOPICS);
}

function formatNoGoTopicsForInput(topics = []) {
  return (topics || []).filter(Boolean).join(", ");
}

function sanitizePlayerCommentatorSettings(playerId, raw = {}) {
  const id = String(playerId || raw.playerId || "").trim();
  if (!id) return null;

  const consentToPersonalComments =
    raw.consentToPersonalComments === undefined
      ? false
      : !!raw.consentToPersonalComments;

  let roastLevel = sanitizeRoastLevel(raw.roastLevel);

  if (!consentToPersonalComments) {
    roastLevel = "off";
  } else if (roastLevel === "off") {
    roastLevel = DEFAULT_ROAST_LEVEL;
  }

  return {
    playerId: id,
    consentToPersonalComments,
    roastLevel,
    noGoTopics: parseNoGoTopicsInput(raw.noGoTopics),
    updatedAt: Date.now(),
  };
}

function emptyFriendInput(authorPlayerId, targetPlayerId) {
  return {
    authorPlayerId,
    targetPlayerId,
    suggestedNickname: "",
    typicalMoment: "",
    runningJoke: "",
    harmlessRoast: "",
    oneLiner: "",
    updatedAt: 0,
  };
}

function sanitizeFriendInput(authorPlayerId, targetPlayerId, raw = {}) {
  const authorId = String(authorPlayerId || raw.authorPlayerId || "").trim();
  const targetId = String(targetPlayerId || raw.targetPlayerId || "").trim();
  if (!authorId || !targetId || authorId === targetId) return null;

  const input = { ...emptyFriendInput(authorId, targetId) };

  for (const field of FRIEND_INPUT_FIELDS) {
    input[field] = truncateField(raw[field]);
  }

  const hasContent = FRIEND_INPUT_FIELDS.some((field) => input[field]);
  if (!hasContent) return null;

  input.updatedAt = Date.now();
  return input;
}

function getDefaultConsentSettings(playerId) {
  return sanitizePlayerCommentatorSettings(playerId, {
    consentToPersonalComments: false,
    roastLevel: "off",
    noGoTopics: [],
  });
}

function getConsentForPlayer(personality, playerId) {
  const stored =
    personality?.consentByPlayerId?.[playerId] ??
    personality?.consent?.[playerId] ??
    null;
  if (!stored) return getDefaultConsentSettings(playerId);
  return sanitizePlayerCommentatorSettings(playerId, stored);
}

function getFriendInputForAuthorTarget(personality, authorPlayerId, targetPlayerId) {
  const byAuthor =
    personality?.friendInputsByAuthor?.[authorPlayerId] ??
    personality?.friendInputs?.[authorPlayerId] ??
    {};
  const stored = byAuthor[targetPlayerId];
  if (!stored) return emptyFriendInput(authorPlayerId, targetPlayerId);
  return {
    ...emptyFriendInput(authorPlayerId, targetPlayerId),
    ...stored,
  };
}

function allowsPersonalComments(consentSettings) {
  if (!consentSettings) return false;
  if (!consentSettings.consentToPersonalComments) return false;
  if (consentSettings.roastLevel === "off") return false;
  return true;
}

function topicMatchesNoGo(text, noGoTopics = []) {
  const hay = normalizeWhitespace(text).toLowerCase();
  if (!hay) return false;

  for (const topic of noGoTopics) {
    const needle = normalizeWhitespace(topic).toLowerCase();
    if (needle && hay.includes(needle)) return true;
  }

  for (const forbidden of FORBIDDEN_GLOBAL_TOPICS) {
    if (hay.includes(forbidden)) return true;
  }

  return false;
}

function isFriendInputUsable(input, targetConsent) {
  if (!input || !allowsPersonalComments(targetConsent)) return false;
  const combined = FRIEND_INPUT_FIELDS.map((f) => input[f]).filter(Boolean).join(" ");
  if (!combined) return false;
  return !topicMatchesNoGo(combined, targetConsent.noGoTopics);
}

function collectFriendInputsAboutPlayer(personality, targetPlayerId, playerIds = []) {
  const targetConsent = getConsentForPlayer(personality, targetPlayerId);
  if (!allowsPersonalComments(targetConsent)) return [];

  const results = [];

  for (const authorId of playerIds) {
    if (authorId === targetPlayerId) continue;
    const input = getFriendInputForAuthorTarget(personality, authorId, targetPlayerId);
    if (isFriendInputUsable(input, targetConsent)) {
      results.push(input);
    }
  }

  return results;
}

function mergeConsentPatch(existingPersonality, playerId, rawConsent) {
  const consent = sanitizePlayerCommentatorSettings(playerId, rawConsent);
  if (!consent) return null;

  const base = existingPersonality && typeof existingPersonality === "object"
    ? existingPersonality
    : {};

  return {
    ...base,
    consentByPlayerId: {
      ...(base.consentByPlayerId || {}),
      [playerId]: consent,
    },
  };
}

function mergeFriendInputPatch(
  existingPersonality,
  authorPlayerId,
  targetPlayerId,
  rawInput
) {
  const input = sanitizeFriendInput(authorPlayerId, targetPlayerId, rawInput);
  const base = existingPersonality && typeof existingPersonality === "object"
    ? existingPersonality
    : {};

  const prevAuthor =
    base.friendInputsByAuthor?.[authorPlayerId] ||
    base.friendInputs?.[authorPlayerId] ||
    {};

  const nextAuthor = { ...prevAuthor };

  if (input) {
    nextAuthor[targetPlayerId] = input;
  } else {
    delete nextAuthor[targetPlayerId];
  }

  return {
    ...base,
    friendInputsByAuthor: {
      ...(base.friendInputsByAuthor || {}),
      [authorPlayerId]: nextAuthor,
    },
  };
}

module.exports = {
  ROAST_LEVELS,
  ROAST_LEVEL_LABELS,
  DEFAULT_ROAST_LEVEL,
  MAX_FIELD_LENGTH,
  FORBIDDEN_GLOBAL_TOPICS,
  FRIEND_INPUT_FIELDS,
  sanitizeRoastLevel,
  parseNoGoTopicsInput,
  formatNoGoTopicsForInput,
  sanitizePlayerCommentatorSettings,
  sanitizeFriendInput,
  getDefaultConsentSettings,
  getConsentForPlayer,
  getFriendInputForAuthorTarget,
  allowsPersonalComments,
  topicMatchesNoGo,
  isFriendInputUsable,
  collectFriendInputsAboutPlayer,
  mergeConsentPatch,
  mergeFriendInputPatch,
  emptyFriendInput,
};
