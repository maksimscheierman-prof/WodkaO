import { getCommentary as getLocalCommentary, resolveLocalCommentary } from "./commentatorService";
import { resolvePersonalityForComment } from "./commentatorPersonalityCommentCore";
import {
  buildCommentKeys,
  getAiDedupeContext,
  getNeutralFallback,
  inferPersonalityMeta,
  isCommentBlocked,
  recordCommentary,
} from "./commentatorDedupeCore";
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
 * @param {{ eventType: string, style: string, context?: object, sessionStats?: object, dedupeContext?: object, avoidRetry?: boolean }} input
 * @returns {Promise<string|null>}
 */
export async function fetchAiCommentary({
  eventType,
  style,
  context,
  sessionStats,
  dedupeContext = null,
  avoidRetry = false,
}) {
  if (!isAiApiConfigured()) return null;

  try {
    const payload = buildAiRequestPayload({
      eventType,
      style,
      context,
      sessionStats,
      dedupeContext,
      avoidRetry,
    });
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

function acceptCommentaryCandidate(text, keys, dedupeState) {
  if (!text) return null;
  if (dedupeState && isCommentBlocked(dedupeState, keys)) return null;
  if (dedupeState) {
    recordCommentary(dedupeState, keys, text);
  }
  return text;
}

function buildAiCommentKeys(eventType, aiContext, text, personalityBundle) {
  const personalityMeta = inferPersonalityMeta(
    text,
    aiContext?.playerName,
    personalityBundle
  );
  return buildCommentKeys({
    eventType,
    context: aiContext,
    text,
    personalityMeta,
  });
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
  dedupeState = null,
}) {
  const playerName = context?.playerName ?? null;
  const { enrichedContext, personalityForAi, bundle } = resolvePersonalityForComment({
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

  const dedupeContext = dedupeState ? getAiDedupeContext(dedupeState) : null;

  try {
    if (settings?.useAiCommentator && settings?.commentatorEnabled !== false) {
      let aiText = await fetchAiCommentary({
        eventType,
        style: settings.commentatorStyle,
        context: aiContext,
        sessionStats,
        dedupeContext,
      });

      if (aiText) {
        const keys = buildAiCommentKeys(eventType, aiContext, aiText, bundle);
        const accepted = acceptCommentaryCandidate(aiText, keys, dedupeState);
        if (accepted) return accepted;

        aiText = await fetchAiCommentary({
          eventType,
          style: settings.commentatorStyle,
          context: aiContext,
          sessionStats,
          dedupeContext,
          avoidRetry: true,
        });

        if (aiText) {
          const retryKeys = buildAiCommentKeys(eventType, aiContext, aiText, bundle);
          const retryAccepted = acceptCommentaryCandidate(aiText, retryKeys, dedupeState);
          if (retryAccepted) return retryAccepted;
        }
      }
    }
  } catch (err) {
    console.warn("[COMMENTATOR AI RESOLVE]", err?.message || err);
  }

  try {
    const local = resolveLocalCommentary(eventType, context, settings, sessionStats, {
      commentatorPersonality,
      players,
      random,
      dedupeState,
    });

    if (local?.text) {
      if (dedupeState) {
        recordCommentary(dedupeState, local.keys, local.text);
      }
      return local.text;
    }

    const neutral = getNeutralFallback(eventType, context, dedupeState, random);
    if (neutral?.text) {
      if (dedupeState) {
        recordCommentary(dedupeState, neutral.keys, neutral.text);
      }
      return neutral.text;
    }

    return getLocalCommentary(eventType, context, settings, sessionStats, {
      commentatorPersonality,
      players,
      random,
    });
  } catch (err) {
    console.warn("[COMMENTATOR LOCAL]", err?.message || err);
    const neutral = getNeutralFallback(eventType, context, dedupeState, random);
    if (neutral?.text) {
      if (dedupeState) {
        recordCommentary(dedupeState, neutral.keys, neutral.text);
      }
      return neutral.text;
    }
    return null;
  }
}

export { isAiApiConfigured } from "./commentatorAiServiceCore";
