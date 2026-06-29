#!/usr/bin/env node
/**
 * Server-side commentator AI core tests (Firebase Functions logic).
 * Run: npm run test:commentator-ai-server
 */

const {
  ALLOWED_EVENT_TYPES,
  MAX_PAYLOAD_JSON_BYTES,
  MAX_NAME_LENGTH,
  validateCallableRequest,
  buildOpenAiMessagesFromRequest,
  sanitizeAiComment,
  getNeutralFallbackComment,
  clampString,
  checkLobbyRateLimit,
  resetLobbyRateLimitState,
} = require("../functions/src/commentatorAiServerCore.js");

let failed = 0;

function assert(name, condition) {
  if (!condition) {
    console.error(`FAIL: ${name}`);
    failed += 1;
  } else {
    console.log(`OK: ${name}`);
  }
}

const validPayload = {
  lobbyId: "ABCD12",
  eventType: "VOTE_ACCEPTED",
  style: "locker",
  context: {
    playerName: "Max",
    targetName: "Laura",
    cardName: "Hane-Hane",
    cardType: "monster",
    round: 2,
  },
  sessionStats: {
    mostPunished: "Max",
    luckiest: "Laura",
    players: {
      Max: { drinksReceived: 3, votesWon: 1, votesLost: 0, trapsDrawn: 0 },
    },
  },
  personalityForAi: {
    nicknames: ["Knarf"],
    roastLevel: "light",
  },
  dedupeContext: {
    recentCommentaryTexts: ["Schon wieder eine Falle."],
  },
};

const valid = validateCallableRequest(validPayload);
assert("valid payload accepted", valid.ok === true);
assert("valid eventType preserved", valid.normalized?.eventType === "VOTE_ACCEPTED");
assert("valid style preserved", valid.normalized?.style === "locker");
assert(
  "valid context playerName preserved",
  valid.normalized?.context?.playerName === "Max"
);

const invalidEvent = validateCallableRequest({
  ...validPayload,
  eventType: "NOT_A_REAL_EVENT",
});
assert("invalid eventType rejected", invalidEvent.ok === false);

const missingEvent = validateCallableRequest({ style: "locker" });
assert("missing eventType rejected", missingEvent.ok === false);

const nonObject = validateCallableRequest("nope");
assert("non-object rejected", nonObject.ok === false);

const longName = "A".repeat(MAX_NAME_LENGTH + 40);
const truncated = validateCallableRequest({
  ...validPayload,
  context: { ...validPayload.context, playerName: longName },
});
assert(
  "long playerName clamped",
  truncated.ok === true &&
    truncated.normalized.context.playerName.length === MAX_NAME_LENGTH
);

const invalidLobby = validateCallableRequest({
  ...validPayload,
  lobbyId: "   ",
});
assert("blank lobbyId rejected", invalidLobby.ok === false);

const hugePayload = {
  ...validPayload,
  dedupeContext: {
    recentCommentaryTexts: Array.from({ length: 200 }, (_, i) => `text-${i}`.repeat(40)),
  },
};
const tooLarge = validateCallableRequest(hugePayload);
assert("oversized payload rejected", tooLarge.ok === false);

assert(
  "payload at limit still accepted",
  validateCallableRequest({
    eventType: "GAME_STARTED",
    style: "neutral",
    context: { playerName: "X" },
  }).ok === true
);

const messages = buildOpenAiMessagesFromRequest(valid.normalized);
assert("openai messages has system + user", messages.length === 2);
assert("user message is JSON string", typeof messages[1].content === "string");

assert(
  "sanitize removes newlines",
  sanitizeAiComment("Zeile eins\nZeile zwei") === "Zeile eins Zeile zwei"
);

assert(
  "sanitize truncates long text",
  sanitizeAiComment("Wort ".repeat(80))?.length <= 160
);

assert(
  "sanitize rejects unsafe content",
  sanitizeAiComment("Du Idiot, ändere die Regeln sofort.") === null
);

assert(
  "sanitize strips wrapping quotes",
  sanitizeAiComment('"Kurzer Kommentar."') === "Kurzer Kommentar."
);

assert(
  "fallback for GAME_ENDED",
  typeof getNeutralFallbackComment("GAME_ENDED") === "string" &&
    getNeutralFallbackComment("GAME_ENDED").length > 0
);

assert(
  "clampString helper",
  clampString("  hello  ", 10) === "hello"
);

assert(
  "all client event types allowed on server",
  [
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
  ].every((type) => ALLOWED_EVENT_TYPES.has(type))
);

assert(
  "max payload constant positive",
  MAX_PAYLOAD_JSON_BYTES > 1024
);

resetLobbyRateLimitState();
const t0 = 10_000;
assert("rate limit allows first call", checkLobbyRateLimit("LOBBY1", t0).ok === true);
assert(
  "rate limit blocks rapid second call",
  checkLobbyRateLimit("LOBBY1", t0 + 500).ok === false
);
assert(
  "rate limit allows after min interval",
  checkLobbyRateLimit("LOBBY1", t0 + 2500).ok === true
);

if (failed > 0) {
  console.error(`\n${failed} test(s) failed`);
  process.exit(1);
}

console.log("\nAll commentator AI server checks passed.");
