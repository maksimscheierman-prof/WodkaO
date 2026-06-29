import { getCommentary as getLocalCommentary, resolveLocalCommentary } from "./commentatorService";
import { fetchCommentaryViaCallable } from "./commentatorCallableService";
import { resolvePersonalityForComment } from "./commentatorPersonalityCommentCore";
import {
  buildCommentKeys,
  getAiDedupeContext,
  getNeutralFallback,
  inferPersonalityMeta,
  isCommentBlocked,
  recordCommentary,
} from "./commentatorDedupeCore";
import { isAiApiConfigured, sanitizeAiComment } from "./commentatorAiServiceCore";

/**
 * Optionaler AI-Kommentator via Firebase Callable — Fehler blockieren nie das Spiel.
 * Fallback: lokale Textbausteine via getLocalCommentary().
 */

/**
 * @param {{ lobbyId?: string|null, eventType: string, style: string, context?: object, sessionStats?: object, dedupeContext?: object, avoidRetry?: boolean }} input
 * @returns {Promise<string|null>}
 */
export async function fetchAiCommentary({
  lobbyId = null,
  eventType,
  style,
  context,
  sessionStats,
  dedupeContext = null,
  avoidRetry = false,
}) {
  if (!isAiApiConfigured()) return null;

  try {
    const raw = await fetchCommentaryViaCallable({
      lobbyId,
      eventType,
      style,
      context,
      sessionStats,
      dedupeContext,
      avoidRetry,
    });
    return sanitizeAiComment(raw);
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
  lobbyId = null,
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
        lobbyId,
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
          lobbyId,
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
