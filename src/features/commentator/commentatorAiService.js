import { getCommentary as getLocalCommentary } from "./commentatorService";
import { resolvePersonalityForComment } from "./commentatorPersonalityCommentCore";
import {
  AI_REQUEST_TIMEOUT_MS,
  buildAiRequestPayload,
  buildOpenAiMessages,
  extractCommentFromResponse,
  getAiApiKey,
  getAiEndpointUrl,
  isAiApiConfigured,
  isOpenAiEndpoint,
  sanitizeAiComment,
} from "./commentatorAiServiceCore";

/**
 * Optionaler AI-Kommentator — Fehler blockieren nie das Spiel.
 * Fallback: lokale Textbausteine via getLocalCommentary().
 */

async function postJson(url, body, headers = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), AI_REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function requestOpenAiCommentary(payload) {
  const url = getAiEndpointUrl();
  const apiKey = getAiApiKey();
  if (!url || !apiKey) return null;

  const response = await postJson(
    url,
    {
      model: "gpt-4o-mini",
      messages: buildOpenAiMessages(payload),
      max_tokens: 80,
      temperature: 0.85,
    },
    {
      Authorization: `Bearer ${apiKey}`,
    }
  );

  if (!response.ok) return null;
  const data = await response.json();
  return sanitizeAiComment(extractCommentFromResponse(data));
}

async function requestGenericAiCommentary(payload) {
  const url = getAiEndpointUrl();
  if (!url) return null;

  const headers = {};
  const apiKey = getAiApiKey();
  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`;
  }

  const response = await postJson(url, payload, headers);
  if (!response.ok) return null;
  const data = await response.json();
  return sanitizeAiComment(extractCommentFromResponse(data));
}

/**
 * @param {{ eventType: string, style: string, context?: object, sessionStats?: object }} input
 * @returns {Promise<string|null>}
 */
export async function fetchAiCommentary({ eventType, style, context, sessionStats }) {
  if (!isAiApiConfigured()) return null;

  try {
    const payload = buildAiRequestPayload({ eventType, style, context, sessionStats });
    const url = getAiEndpointUrl();

    if (isOpenAiEndpoint(url)) {
      return await requestOpenAiCommentary(payload);
    }
    return await requestGenericAiCommentary(payload);
  } catch (err) {
    console.warn("[COMMENTATOR AI]", err?.message || err);
    return null;
  }
}

/**
 * AI-Kommentar mit Fallback auf lokale Texte.
 * Wirft nie — sicher für den Spiel-Loop.
 */
export async function resolveCommentary({
  eventType,
  context = {},
  settings = {},
  sessionStats = null,
  commentatorPersonality = null,
  players = [],
  random = Math.random(),
}) {
  const playerName = context?.playerName ?? null;
  const { enrichedContext, personalityForAi } = resolvePersonalityForComment({
    commentatorPersonality,
    players,
    targetPlayerName: playerName,
    eventType,
    context,
    sessionStats,
    random,
  });

  const aiContext = {
    ...enrichedContext,
    ...(personalityForAi ? { personalityForAi } : {}),
  };

  try {
    if (settings?.useAiCommentator && settings?.commentatorEnabled !== false) {
      const aiText = await fetchAiCommentary({
        eventType,
        style: settings.commentatorStyle,
        context: aiContext,
        sessionStats,
      });
      if (aiText) return aiText;
    }
  } catch (err) {
    console.warn("[COMMENTATOR AI RESOLVE]", err?.message || err);
  }

  try {
    return getLocalCommentary(eventType, context, settings, sessionStats, {
      commentatorPersonality,
      players,
      random,
    });
  } catch (err) {
    console.warn("[COMMENTATOR LOCAL]", err?.message || err);
    return null;
  }
}

export { isAiApiConfigured } from "./commentatorAiServiceCore";
