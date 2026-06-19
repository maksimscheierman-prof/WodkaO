/** AI-Kommentator — reine Logik (Node-testbar). */

const MAX_AI_COMMENT_LENGTH = 160;
const AI_REQUEST_TIMEOUT_MS = 8000;
const MAX_AI_SENTENCES = 2;

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

function summarizeSessionStatsForAi(sessionStats, actorName) {
  const players = sessionStats?.players ?? {};
  const names = Object.keys(players);

  let mostPunished = null;
  let maxDrinks = -1;
  let luckiest = null;
  let maxWins = -1;
  let trapMagnet = null;
  let maxTraps = -1;

  for (const name of names) {
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

  const actorStats = actorName && players[actorName] ? players[actorName] : null;

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

function buildAiRequestPayload({
  eventType,
  style,
  context = {},
  sessionStats = null,
  dedupeContext = null,
  avoidRetry = false,
}) {
  const payload = {
    eventType,
    style: style || "locker",
    styleHint: STYLE_HINTS[style] || STYLE_HINTS.locker,
    actor: context.playerName ?? null,
    cardName: context.cardName ?? null,
    cardType: context.cardType ?? null,
    round: context.round ?? null,
    sessionStats: summarizeSessionStatsForAi(sessionStats, context.playerName),
  };

  if (eventType === "GAME_ENDED" && Array.isArray(context.awards)) {
    payload.awards = context.awards;
    payload.task =
      "Schreibe einen kurzen Abschlusssatz für den Session-Abschlussbericht (keine Awards einzeln aufzählen).";
  }

  if (context.personalityForAi) {
    payload.personality = context.personalityForAi;
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
  ];

  if (payload.eventType === "GAME_ENDED") {
    systemParts.push(
      "Du verkündest den Abschluss einer Spielsession mit Awards — ein einleitender Satz reicht."
    );
  }

  if (payload.personality) {
    systemParts.push(
      "Optional: leichte persönliche Anspielungen aus personality erlaubt — nur wenn passend und nie verbotene Themen."
    );
  }

  systemParts.push(
    "Vermeide Wiederholungen. Verwende nicht denselben Kartenwitz, Spitznamenwitz oder Running Gag wie in den letzten Kommentaren."
  );

  const system = systemParts.join(" ");

  const user = JSON.stringify(payload);

  return [
    { role: "system", content: system },
    { role: "user", content: user },
  ];
}

function normalizeWhitespace(text) {
  return String(text || "")
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
  const limited = limitSentences(truncateToMaxLength(text));
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

function isOpenAiEndpoint(url) {
  return /openai\.com/i.test(url || "");
}

function getAiEndpointUrl(env = process.env) {
  return (env.EXPO_PUBLIC_COMMENTATOR_AI_URL || "").trim();
}

function getAiApiKey(env = process.env) {
  return (env.EXPO_PUBLIC_COMMENTATOR_AI_API_KEY || "").trim();
}

function isAiApiConfigured(env = process.env) {
  return !!getAiEndpointUrl(env);
}

module.exports = {
  MAX_AI_COMMENT_LENGTH,
  AI_REQUEST_TIMEOUT_MS,
  buildAiRequestPayload,
  buildOpenAiMessages,
  summarizeSessionStatsForAi,
  sanitizeAiComment,
  extractCommentFromResponse,
  isAiCommentSafe,
  isOpenAiEndpoint,
  getAiEndpointUrl,
  getAiApiKey,
  isAiApiConfigured,
};
