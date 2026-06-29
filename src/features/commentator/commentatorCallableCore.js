/** Callable request builder + error mapping (Node-testable, no Firebase SDK). */

const CALLABLE_FUNCTION_NAME = "generateCommentatorComment";
const FUNCTIONS_REGION = "europe-west3";

function buildCallableRequest({
  lobbyId = null,
  eventType,
  style,
  context = {},
  sessionStats = null,
  dedupeContext = null,
  avoidRetry = false,
}) {
  const personalityForAi = context.personalityForAi ?? null;
  const {
    personalityForAi: _ignored,
    playerName,
    targetName,
    cardName,
    cardType,
    round,
    awards,
    ...rest
  } = context;

  const callableContext = {
    playerName: playerName ?? rest.playerName ?? null,
    targetName: targetName ?? rest.targetName ?? null,
    cardName: cardName ?? rest.cardName ?? null,
    cardType: cardType ?? rest.cardType ?? null,
    round: round ?? rest.round ?? null,
    awards: awards ?? rest.awards ?? null,
  };

  return {
    lobbyId: lobbyId ?? null,
    eventType,
    style: style || "locker",
    context: callableContext,
    sessionStats,
    personalityForAi,
    dedupeContext,
    avoidRetry: avoidRetry === true,
  };
}

function extractCallableComment(data) {
  if (!data || typeof data !== "object") return null;
  if (typeof data.comment === "string") {
    const trimmed = data.comment.trim();
    return trimmed || null;
  }
  return null;
}

/**
 * @param {unknown} error
 * @returns {{ code: string, message: string, fallback: boolean }}
 */
function mapCallableError(error) {
  const rawCode = String(error?.code || "");
  const message = String(error?.message || "Callable failed");

  if (rawCode.includes("failed-precondition")) {
    return {
      code: "not_configured",
      message: "AI commentator is not configured",
      fallback: true,
    };
  }

  if (rawCode.includes("resource-exhausted")) {
    return {
      code: "rate_limit",
      message: "AI commentator rate limit exceeded",
      fallback: true,
    };
  }

  if (rawCode.includes("unavailable")) {
    return {
      code: "unavailable",
      message: "AI commentator is temporarily unavailable",
      fallback: true,
    };
  }

  if (rawCode.includes("invalid-argument")) {
    return {
      code: "invalid_argument",
      message,
      fallback: true,
    };
  }

  return {
    code: "unknown",
    message,
    fallback: true,
  };
}

/**
 * @param {(payload: object) => Promise<{ data?: unknown }>} callableFn
 * @param {object} payload
 * @returns {Promise<{ comment: string|null, error: ReturnType<typeof mapCallableError>|null }>}
 */
async function executeCallableCall(callableFn, payload) {
  try {
    const result = await callableFn(payload);
    return {
      comment: extractCallableComment(result?.data),
      error: null,
    };
  } catch (err) {
    return {
      comment: null,
      error: mapCallableError(err),
    };
  }
}

module.exports = {
  CALLABLE_FUNCTION_NAME,
  FUNCTIONS_REGION,
  buildCallableRequest,
  extractCallableComment,
  mapCallableError,
  executeCallableCall,
};
