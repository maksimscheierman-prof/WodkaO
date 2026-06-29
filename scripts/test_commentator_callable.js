#!/usr/bin/env node
/**
 * Commentator Firebase Callable client tests (no OpenAI key in client).
 * Run: npm run test:commentator-callable
 */

const fs = require("fs");
const path = require("path");
const {
  CALLABLE_FUNCTION_NAME,
  FUNCTIONS_REGION,
  buildCallableRequest,
  extractCallableComment,
  mapCallableError,
  executeCallableCall,
} = require("../src/features/commentator/commentatorCallableCore.js");
const { isAiApiConfigured } = require("../src/features/commentator/commentatorAiServiceCore.js");
const { getNeutralFallback } = require("../src/features/commentator/commentatorDedupeCore.js");

let failed = 0;

function assert(name, condition) {
  if (!condition) {
    console.error(`FAIL: ${name}`);
    failed += 1;
  } else {
    console.log(`OK: ${name}`);
  }
}

assert("callable function name", CALLABLE_FUNCTION_NAME === "generateCommentatorComment");
assert("callable region matches server", FUNCTIONS_REGION === "europe-west3");

assert(
  "isAiApiConfigured without OpenAI key when Firebase project set",
  isAiApiConfigured({
    EXPO_PUBLIC_FIREBASE_PROJECT_ID: "demo-project",
  })
);
assert(
  "isAiApiConfigured false without Firebase project",
  !isAiApiConfigured({ EXPO_PUBLIC_FIREBASE_PROJECT_ID: "" })
);
assert(
  "isAiApiConfigured disabled via EXPO_PUBLIC_COMMENTATOR_CALLABLE=0",
  !isAiApiConfigured({
    EXPO_PUBLIC_FIREBASE_PROJECT_ID: "demo-project",
    EXPO_PUBLIC_COMMENTATOR_CALLABLE: "0",
  })
);

const payload = buildCallableRequest({
  lobbyId: "lobby-1",
  eventType: "VOTE_ACCEPTED",
  style: "locker",
  context: {
    playerName: "Alex",
    targetName: "Sam",
    personalityForAi: { nicknames: ["Boss"] },
    extraField: "ignored",
  },
  sessionStats: { players: {} },
  dedupeContext: { recentTexts: ["Hi"] },
  avoidRetry: true,
});

assert("buildCallableRequest eventType", payload.eventType === "VOTE_ACCEPTED");
assert("buildCallableRequest lobbyId", payload.lobbyId === "lobby-1");
assert("buildCallableRequest strips extra context", payload.context.playerName === "Alex");
assert(
  "buildCallableRequest personalityForAi top-level",
  payload.personalityForAi?.nicknames?.[0] === "Boss"
);
assert("buildCallableRequest avoidRetry", payload.avoidRetry === true);

assert(
  "extractCallableComment trims",
  extractCallableComment({ comment: "  Hallo!  " }) === "Hallo!"
);
assert(
  "extractCallableComment empty → null",
  extractCallableComment({ comment: "   " }) === null
);

const notConfigured = mapCallableError({
  code: "functions/failed-precondition",
  message: "AI not configured",
});
assert("map failed-precondition", notConfigured.code === "not_configured" && notConfigured.fallback);

const rateLimit = mapCallableError({
  code: "functions/resource-exhausted",
  message: "Too many requests",
});
assert("map resource-exhausted", rateLimit.code === "rate_limit" && rateLimit.fallback);

const unavailable = mapCallableError({
  code: "functions/unavailable",
  message: "OpenAI down",
});
assert("map unavailable", unavailable.code === "unavailable" && unavailable.fallback);

const unknown = mapCallableError({ code: "functions/internal", message: "boom" });
assert("map unknown", unknown.code === "unknown" && unknown.fallback);

(async () => {
  const okResult = await executeCallableCall(async () => ({
    data: { ok: true, comment: "Starker Zug!" },
  }), payload);
  assert("executeCallableCall success", okResult.comment === "Starker Zug!" && !okResult.error);

  const rateResult = await executeCallableCall(async () => {
    const err = new Error("Too many requests");
    err.code = "functions/resource-exhausted";
    throw err;
  }, payload);
  assert(
    "resource-exhausted returns null comment, no throw",
    rateResult.comment === null && rateResult.error?.code === "rate_limit"
  );

  const localFallback = await (async () => {
    const configured = isAiApiConfigured({ EXPO_PUBLIC_FIREBASE_PROJECT_ID: "demo-project" });
    let aiText = null;
    if (configured) {
      const failed = await executeCallableCall(async () => {
        const err = new Error("OpenAI down");
        err.code = "functions/unavailable";
        throw err;
      }, payload);
      aiText = failed.comment;
    }
    if (aiText) return aiText;
    const neutral = getNeutralFallback("VOTE_ACCEPTED", { playerName: "Alex" }, null, 0.5);
    return neutral?.text ?? null;
  })();
  assert(
    "Callable failure → local fallback text",
    typeof localFallback === "string" && localFallback.length > 0
  );

  const aiServicePath = path.join(
    __dirname,
    "../src/features/commentator/commentatorAiService.js"
  );
  const aiServiceSrc = fs.readFileSync(aiServicePath, "utf8");
  assert("commentatorAiService uses Callable", aiServiceSrc.includes("fetchCommentaryViaCallable"));
  assert("commentatorAiService no Bearer auth", !aiServiceSrc.includes("Authorization"));
  assert("commentatorAiService no getAiApiKey", !aiServiceSrc.includes("getAiApiKey"));
  assert("commentatorAiService no direct OpenAI URL", !/api\.openai\.com/i.test(aiServiceSrc));

  const firebaseConfigPath = path.join(__dirname, "../firebaseConfig.js");
  const firebaseConfigSrc = fs.readFileSync(firebaseConfigPath, "utf8");
  assert("firebaseConfig exports functions", firebaseConfigSrc.includes("export const functions"));
  assert(
    "firebaseConfig region europe-west3",
    firebaseConfigSrc.includes("europe-west3")
  );

  if (failed > 0) {
    console.error(`\n${failed} test(s) failed.`);
    process.exit(1);
  }

  console.log("\nAll commentator callable tests passed.");
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
