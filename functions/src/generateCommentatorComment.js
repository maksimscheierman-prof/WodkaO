const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const {
  validateCallableRequest,
  buildOpenAiMessagesFromRequest,
  requestOpenAiComment,
  sanitizeAiComment,
  getNeutralFallbackComment,
  checkLobbyRateLimit,
} = require("./commentatorAiServerCore");

const OPENAI_API_KEY = defineSecret("OPENAI_API_KEY");
const REGION = "europe-west3";

function createGenerateCommentatorComment() {
  return onCall(
    {
      region: REGION,
      secrets: [OPENAI_API_KEY],
      timeoutSeconds: 30,
      memory: "256MiB",
    },
    async (request) => {
      const validation = validateCallableRequest(request.data);
      if (!validation.ok) {
        throw new HttpsError("invalid-argument", validation.message);
      }

      const apiKey = OPENAI_API_KEY.value()?.trim();
      if (!apiKey) {
        throw new HttpsError(
          "failed-precondition",
          "AI commentator is not configured"
        );
      }

      const { normalized } = validation;

      const rate = checkLobbyRateLimit(normalized.lobbyId);
      if (!rate.ok) {
        throw new HttpsError(
          "resource-exhausted",
          "AI commentator rate limit exceeded"
        );
      }

      try {
        const messages = buildOpenAiMessagesFromRequest(normalized);
        const raw = await requestOpenAiComment(apiKey, messages);
        const sanitized = sanitizeAiComment(raw);
        const comment =
          sanitized || getNeutralFallbackComment(normalized.eventType);

        if (!comment) {
          throw new HttpsError(
            "unavailable",
            "AI commentator is temporarily unavailable"
          );
        }

        return { ok: true, comment };
      } catch (err) {
        if (err instanceof HttpsError) {
          throw err;
        }

        console.error("[generateCommentatorComment] failed", {
          eventType: normalized.eventType,
          code: err?.code || "unknown",
          status: err?.status ?? null,
        });

        throw new HttpsError(
          "unavailable",
          "AI commentator is temporarily unavailable"
        );
      }
    }
  );
}

module.exports = {
  REGION,
  OPENAI_API_KEY,
  createGenerateCommentatorComment,
};
