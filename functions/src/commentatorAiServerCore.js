/**
 * Server-side AI commentator core — validation, prompt, OpenAI call, sanitize.
 * Node-testable (no Firebase imports).
 */

const MAX_AI_COMMENT_LENGTH = 160;
const AI_REQUEST_TIMEOUT_MS = 8000;
const MAX_AI_SENTENCES = 2;
const MAX_PAYLOAD_JSON_BYTES = 8192;
const MAX_LOBBY_ID_LENGTH = 32;
const MAX_NAME_LENGTH = 64;
const MAX_CARD_NAME_LENGTH = 80;
const MAX_STYLE_LENGTH = 24;
const MAX_DEDUPE_ITEMS = 8;
const MAX_DEDUPE_TEXT_LENGTH = 120;
const MAX_PERSONALITY_LIST = 5;
const MAX_PERSONALITY_ITEM_LENGTH = 48;

const OPENAI_CHAT_URL = "https://api.openai.com/v1/chat/completions";
const OPENAI_MODEL = "gpt-4o-mini";

const ALLOWED_EVENT_TYPES = new Set([
  "GAME_STARTED",
  "ROUND_STARTED",
  "CARD_DRAWN",
  "MONSTER_DRAWN",
  "MAGIC_DRAWN",
  "TRAP_DRAWN",
  "EFFECT_SELECTED",
  "VOTE_STARTED",
  "VOTE_ACCEPTED",
  "VOTE_REJECTED",
  "MONSTER_EFFECT_DISABLED",
  "MONSTER_EFFECT_ENABLED",
  "MAGIC_PLAYED",
  "PLAYER_PUNISHED",
  "TRAP_REPLACED",
  "GAME_ENDED",
]);

const ALLOWED_STYLES = new Set([
  "neutral",
  "locker",
  "chaotic",
  "anime",
  "tavern",
]);

const STYLE_HINTS = {
  neutral: "sachlich und knapp",
  locker: "locker und freundlich",
  chaotic: "chaotisch und überraschend",
  anime: "dramatisch wie ein Anime-Duell",
  tavern: "wie ein Kneipenmeister",
};

const UNSAFE_PATTERNS = [
  /\b(?:idiot|arschloch|hurensohn|fotze|schwuchtel)\b/i,
  /\b(?:dumm(?:e|er|es)?|hass(?:e|t))\s+(?:dich|euch)\b/i,
  /neue?\s+regel/i,
  /regeln?\s+(?:ändern|ändert|überspringen|ignorier)/i,
  /(?:extra|zusätzlich(?:e|er)?)[-\s]+(?:zug|runde|karte)/i,
  /(?:count|zähl(?:t|e)?)\s+(?:nicht|ignorier)/i,
  /spiel\s+(?:abbrechen|beenden|neu\s+starten)/i,
];

const NEUTRAL_FALLBACKS = {
  GAME_STARTED: "Los geht's — möge das Glück mit euch sein.",
  ROUND_STARTED: "Neue Runde, neue Chancen.",
  CARD_DRAWN: "Eine Karte kommt ins Spiel.",
  MONSTER_DRAWN: "Ein Monster betritt das Feld.",
  MAGIC_DRAWN: "Magie liegt in der Luft.",
  TRAP_DRAWN: "Vorsicht, eine Falle!",
  EFFECT_SELECTED: "Der Effekt steht fest.",
  VOTE_STARTED: "Abstimmung — wer traut sich?",
  VOTE_ACCEPTED: "Angenommen — der Effekt gilt.",
  VOTE_REJECTED: "Abgelehnt — weiter ohne Effekt.",
  MONSTER_EFFECT_DISABLED: "Der Effekt bleibt heute aus.",
  MONSTER_EFFECT_ENABLED: "Der Effekt ist aktiv.",
  MAGIC_PLAYED: "Magie wird ausgespielt.",
  PLAYER_PUNISHED: "Das war teuer — ein Schluck mehr.",
  TRAP_REPLACED: "Die Falle wurde getauscht.",
  GAME_ENDED: "Session vorbei — stark gespielt!",
};

function clampString(value, maxLen) {
  if (value == null) return null;
  const s = String(value).replace(/[\r\n]+/g, " ").trim();
  if (!s) return null;
  return s.length > maxLen ? s.slice(0, maxLen).trim() : s;
}

function clampStringList(list, maxItems, maxItemLen) {
  if (!Array.isArray(list)) return [];
  return list
    .slice(0, maxItems)
    .map((item) => clampString(item, maxItemLen))
    .filter(Boolean);
}

function sanitizeStyle(style) {
  const raw = clampString(style, MAX_STYLE_LENGTH);
  if (!raw) return "locker";
  const key = raw.toLowerCase();
  return ALLOWED_STYLES.has(key) ? key : "locker";
}

function sanitizePersonalityForAi(personality) {
  if (!personality || typeof personality !== "object") return null;

  const nicknames = clampStringList(
    personality.nicknames,
    MAX_PERSONALITY_LIST,
    MAX_PERSONALITY_ITEM_LENGTH
  );
  const runningGags = clampStringList(
    personality.runningGags,
    MAX_PERSONALITY_LIST,
    MAX_PERSONALITY_ITEM_LENGTH
  );
  const roastLevel = clampString(personality.roastLevel, 16);

  if (!nicknames.length && !runningGags.length && !roastLevel) return null;

  const compact = {};
  if (nicknames.length) compact.nicknames = nicknames;
  if (runningGags.length) compact.runningGags = runningGags;
  if (roastLevel) compact.roastLevel = roastLevel;
  return compact;
}

function sanitizeDedupeContext(dedupeContext) {
  if (!dedupeContext || typeof dedupeContext !== "object") return null;

  const recentCommentaryTexts = clampStringList(
    dedupeContext.recentCommentaryTexts,
    MAX_DEDUPE_ITEMS,
    MAX_DEDUPE_TEXT_LENGTH
  );
  const recentCommentaryTopics = clampStringList(
    dedupeContext.recentCommentaryTopics,
    MAX_DEDUPE_ITEMS,
    MAX_DEDUPE_TEXT_LENGTH
  );
  const avoidTopics = clampStringList(
    dedupeContext.avoidTopics,
    MAX_DEDUPE_ITEMS,
    MAX_DEDUPE_TEXT_LENGTH
  );

  if (
    !recentCommentaryTexts.length &&
    !recentCommentaryTopics.length &&
    !avoidTopics.length
  ) {
    return null;
  }

  return {
    recentCommentaryTexts,
    recentCommentaryTopics,
    avoidTopics,
  };
}

function sanitizeSessionStats(sessionStats) {
  if (!sessionStats || typeof sessionStats !== "object") return null;

  const players = sessionStats.players;
  if (!players || typeof players !== "object") {
    return {
      mostPunished: clampString(sessionStats.mostPunished, MAX_NAME_LENGTH),
      luckiest: clampString(sessionStats.luckiest, MAX_NAME_LENGTH),
      trapMagnet: clampString(sessionStats.trapMagnet, MAX_NAME_LENGTH),
      actor: null,
    };
  }

  const compactPlayers = {};
  const names = Object.keys(players).slice(0, 12);
  for (const name of names) {
    const key = clampString(name, MAX_NAME_LENGTH);
    if (!key) continue;
    const p = players[name];
    if (!p || typeof p !== "object") continue;
    compactPlayers[key] = {
      drinksReceived: Number(p.drinksReceived) || 0,
      votesWon: Number(p.votesWon) || 0,
      votesLost: Number(p.votesLost) || 0,
      trapsDrawn: Number(p.trapsDrawn) || 0,
      magicCardsPlayed: Number(p.magicCardsPlayed) || 0,
      monsterEffectsUsed: Number(p.monsterEffectsUsed) || 0,
    };
  }

  return {
    mostPunished: clampString(sessionStats.mostPunished, MAX_NAME_LENGTH),
    luckiest: clampString(sessionStats.luckiest, MAX_NAME_LENGTH),
    trapMagnet: clampString(sessionStats.trapMagnet, MAX_NAME_LENGTH),
    players: compactPlayers,
  };
}

function sanitizeContext(context = {}) {
  if (!context || typeof context !== "object") return {};

  const roundRaw = Number(context.round);
  const round = Number.isFinite(roundRaw)
    ? Math.min(Math.max(Math.trunc(roundRaw), 0), 999)
    : null;

  const awards = Array.isArray(context.awards)
    ? context.awards.slice(0, 6).map((award) => {
        if (!award || typeof award !== "object") return null;
        return {
          title: clampString(award.title, 64),
          playerName: clampString(award.playerName, MAX_NAME_LENGTH),
        };
      }).filter(Boolean)
    : null;

  return {
    playerName: clampString(context.playerName, MAX_NAME_LENGTH),
    targetName: clampString(context.targetName, MAX_NAME_LENGTH),
    cardName: clampString(context.cardName, MAX_CARD_NAME_LENGTH),
    cardType: clampString(context.cardType, 24),
    round,
    awards: awards?.length ? awards : null,
  };
}

/**
 * @param {unknown} data
 * @returns {{ ok: true, normalized: object } | { ok: false, message: string }}
 */
function validateCallableRequest(data) {
  if (data == null || typeof data !== "object" || Array.isArray(data)) {
    return { ok: false, message: "Request body must be an object" };
  }

  try {
    const jsonSize = Buffer.byteLength(JSON.stringify(data), "utf8");
    if (jsonSize > MAX_PAYLOAD_JSON_BYTES) {
      return { ok: false, message: "Request payload is too large" };
    }
  } catch {
    return { ok: false, message: "Request payload is not serializable" };
  }

  const eventType = typeof data.eventType === "string" ? data.eventType.trim() : "";
  if (!ALLOWED_EVENT_TYPES.has(eventType)) {
    return { ok: false, message: "Invalid or missing eventType" };
  }

  const lobbyId =
    data.lobbyId == null
      ? null
      : clampString(data.lobbyId, MAX_LOBBY_ID_LENGTH);
  if (data.lobbyId != null && !lobbyId) {
    return { ok: false, message: "Invalid lobbyId" };
  }

  const style = sanitizeStyle(data.style);
  const context = sanitizeContext(data.context);
  const sessionStats = sanitizeSessionStats(data.sessionStats);
  const personalityForAi = sanitizePersonalityForAi(data.personalityForAi);
  const dedupeContext = sanitizeDedupeContext(data.dedupeContext);
  const avoidRetry = data.avoidRetry === true;

  const normalized = {
    lobbyId,
    eventType,
    style,
    context,
    sessionStats,
    personalityForAi,
    dedupeContext,
    avoidRetry,
  };

  return { ok: true, normalized };
}

function summarizeSessionStatsForAi(sessionStats, actorName) {
  if (!sessionStats) return null;

  if (sessionStats.players && typeof sessionStats.players === "object") {
    const players = sessionStats.players;
    let mostPunished = sessionStats.mostPunished ?? null;
    let luckiest = sessionStats.luckiest ?? null;
    let trapMagnet = sessionStats.trapMagnet ?? null;

    let maxDrinks = -1;
    let maxWins = -1;
    let maxTraps = -1;

    for (const name of Object.keys(players)) {
      const p = players[name];
      if (!p) continue;
      if (p.drinksReceived > maxDrinks) {
        maxDrinks = p.drinksReceived;
        mostPunished = name;
      }
      if (p.votesWon > maxWins) {
        maxWins = p.votesWon;
        luckiest = name;
      }
      if (p.trapsDrawn > maxTraps) {
        maxTraps = p.trapsDrawn;
        trapMagnet = name;
      }
    }

    const actorStats =
      actorName && players[actorName] ? players[actorName] : null;

    return {
      mostPunished: maxDrinks > 0 ? mostPunished : null,
      luckiest: maxWins > 0 ? luckiest : null,
      trapMagnet: maxTraps > 0 ? trapMagnet : null,
      actor: actorName
        ? {
            name: actorName,
            drinksReceived: actorStats?.drinksReceived ?? 0,
            votesWon: actorStats?.votesWon ?? 0,
            votesLost: actorStats?.votesLost ?? 0,
            trapsDrawn: actorStats?.trapsDrawn ?? 0,
            magicCardsPlayed: actorStats?.magicCardsPlayed ?? 0,
            monsterEffectsUsed: actorStats?.monsterEffectsUsed ?? 0,
          }
        : null,
    };
  }

  return {
    mostPunished: sessionStats.mostPunished ?? null,
    luckiest: sessionStats.luckiest ?? null,
    trapMagnet: sessionStats.trapMagnet ?? null,
    actor: actorName ? { name: actorName } : null,
  };
}

function buildAiRequestPayload(normalized) {
  const { eventType, style, context, sessionStats, personalityForAi, dedupeContext, avoidRetry } =
    normalized;

  const payload = {
    eventType,
    style,
    styleHint: STYLE_HINTS[style] || STYLE_HINTS.locker,
    actor: context.playerName ?? null,
    targetName: context.targetName ?? null,
    cardName: context.cardName ?? null,
    cardType: context.cardType ?? null,
    round: context.round ?? null,
    sessionStats: summarizeSessionStatsForAi(sessionStats, context.playerName),
  };

  if (eventType === "GAME_ENDED" && context.awards) {
    payload.awards = context.awards;
    payload.task =
      "Schreibe einen kurzen Abschlusssatz für den Session-Abschlussbericht (keine Awards einzeln aufzählen).";
  }

  if (personalityForAi) {
    payload.personality = personalityForAi;
    payload.personalCommentHint =
      "Nutze Spitznamen/Running Gags nur dezent, respektiere roastLevel und No-Go-Themen.";
  }

  if (dedupeContext) {
    if (dedupeContext.recentCommentaryTexts?.length) {
      payload.recentCommentaryTexts = dedupeContext.recentCommentaryTexts;
    }
    if (dedupeContext.recentCommentaryTopics?.length) {
      payload.recentCommentaryTopics = dedupeContext.recentCommentaryTopics;
    }
    if (dedupeContext.avoidTopics?.length) {
      payload.avoidTopics = dedupeContext.avoidTopics;
    }
  }

  if (avoidRetry) {
    payload.avoidPreviousJoke = true;
    payload.task =
      (payload.task ? `${payload.task} ` : "") +
      "Vermeide Wiederholungen der zuletzt genannten Kartenwitze, Spitznamen oder Running Gags.";
  }

  return payload;
}

function buildOpenAiMessages(payload) {
  const systemParts = [
    "Du bist ein humorvoller Spielekommentator für ein Kartenspiel.",
    "Antworte auf Deutsch mit maximal 1–2 kurzen Sätzen.",
    `Maximal ${MAX_AI_COMMENT_LENGTH} Zeichen.`,
    "Keine Beleidigungen, keine diskriminierenden Inhalte.",
    "Kein Druck zu exzessivem Trinken.",
    "Ändere keine Spielregeln und triff keine spieltechnischen Entscheidungen.",
    `Ton: ${payload.styleHint}.`,
    "Antworte nur mit dem Kommentartext — kein JSON, keine Anführungszeichen drumherum.",
  ];

  if (payload.eventType === "GAME_ENDED") {
    systemParts.push(
      "Du verkündest den Abschluss einer Spielsession mit Awards — ein einleitender Satz reicht."
    );
  }

  if (payload.personality) {
    systemParts.push(
      "Optional: leichte persönliche Anspielungen aus personality erlaubt — nur wenn passend."
    );
  }

  systemParts.push(
    "Vermeide Wiederholungen der letzten Kommentare."
  );

  return [
    { role: "system", content: systemParts.join(" ") },
    { role: "user", content: JSON.stringify(payload) },
  ];
}

function buildOpenAiMessagesFromRequest(normalized) {
  return buildOpenAiMessages(buildAiRequestPayload(normalized));
}

function normalizeWhitespace(text) {
  return String(text || "")
    .replace(/[\r\n]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function truncateToMaxLength(text, maxLen = MAX_AI_COMMENT_LENGTH) {
  const clean = normalizeWhitespace(text);
  if (clean.length <= maxLen) return clean;
  const cut = clean.slice(0, maxLen);
  const lastSpace = cut.lastIndexOf(" ");
  if (lastSpace > maxLen * 0.6) {
    return cut.slice(0, lastSpace).trim();
  }
  return cut.trim();
}

function limitSentences(text, maxSentences = MAX_AI_SENTENCES) {
  const parts = normalizeWhitespace(text)
    .split(/(?<=[.!?…])\s+/)
    .filter(Boolean);
  if (parts.length <= maxSentences) return parts.join(" ");
  return parts.slice(0, maxSentences).join(" ");
}

function isAiCommentSafe(text) {
  const value = normalizeWhitespace(text);
  if (!value) return false;
  return !UNSAFE_PATTERNS.some((pattern) => pattern.test(value));
}

function sanitizeAiComment(text) {
  const stripped = normalizeWhitespace(text).replace(/^["'`]+|["'`]+$/g, "");
  const limited = limitSentences(truncateToMaxLength(stripped));
  if (!limited || !isAiCommentSafe(limited)) return null;
  return limited;
}

function extractCommentFromResponse(data) {
  if (!data || typeof data !== "object") return null;

  if (typeof data.comment === "string") return data.comment;
  if (typeof data.text === "string") return data.text;

  const openAiText = data.choices?.[0]?.message?.content;
  if (typeof openAiText === "string") return openAiText;

  const alt = data.choices?.[0]?.text;
  if (typeof alt === "string") return alt;

  return null;
}

function getNeutralFallbackComment(eventType) {
  return NEUTRAL_FALLBACKS[eventType] || "Weiter geht's am Tisch.";
}

/**
 * @param {string} apiKey
 * @param {Array<{ role: string, content: string }>} messages
 * @returns {Promise<string|null>}
 */
async function requestOpenAiComment(apiKey, messages) {
  if (!apiKey || !messages?.length) return null;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), AI_REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(OPENAI_CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages,
        max_tokens: 80,
        temperature: 0.85,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const err = new Error(`openai_http_${response.status}`);
      err.code = "openai_http_error";
      err.status = response.status;
      throw err;
    }

    const data = await response.json();
    return extractCommentFromResponse(data);
  } finally {
    clearTimeout(timeoutId);
  }
}

/** Per-instance lobby rate limit (best-effort; see docs/COMMENTATOR_BACKEND.md). */
const RATE_LIMIT_WINDOW_MS = 10000;
const RATE_LIMIT_MAX_PER_WINDOW = 8;
const RATE_LIMIT_MIN_INTERVAL_MS = 2000;
const lobbyRateBuckets = new Map();

function checkLobbyRateLimit(lobbyId, now = Date.now()) {
  const key =
    lobbyId && String(lobbyId).trim() ? String(lobbyId).trim() : "_anonymous";
  let bucket = lobbyRateBuckets.get(key);
  if (!bucket) {
    bucket = { windowStart: now, count: 0, lastCallAt: 0 };
    lobbyRateBuckets.set(key, bucket);
  }

  if (now - bucket.lastCallAt < RATE_LIMIT_MIN_INTERVAL_MS) {
    return { ok: false, reason: "min_interval" };
  }

  if (now - bucket.windowStart > RATE_LIMIT_WINDOW_MS) {
    bucket.windowStart = now;
    bucket.count = 0;
  }

  if (bucket.count >= RATE_LIMIT_MAX_PER_WINDOW) {
    return { ok: false, reason: "rate_limit" };
  }

  bucket.count += 1;
  bucket.lastCallAt = now;
  return { ok: true };
}

function resetLobbyRateLimitState() {
  lobbyRateBuckets.clear();
}

module.exports = {
  ALLOWED_EVENT_TYPES,
  ALLOWED_STYLES,
  MAX_AI_COMMENT_LENGTH,
  MAX_PAYLOAD_JSON_BYTES,
  MAX_NAME_LENGTH,
  OPENAI_MODEL,
  validateCallableRequest,
  buildAiRequestPayload,
  buildOpenAiMessages,
  buildOpenAiMessagesFromRequest,
  sanitizeAiComment,
  extractCommentFromResponse,
  isAiCommentSafe,
  getNeutralFallbackComment,
  requestOpenAiComment,
  clampString,
  RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_MAX_PER_WINDOW,
  RATE_LIMIT_MIN_INTERVAL_MS,
  checkLobbyRateLimit,
  resetLobbyRateLimitState,
};
