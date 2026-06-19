#!/usr/bin/env node
/**
 * Commentator event detection, settings + style text tests.
 * Run: npm run test:commentator
 */

const { detectCommentatorEvents, drawEventType } = require("../src/features/commentator/commentatorCore.js");
const {
  DEFAULT_COMMENTATOR_SETTINGS,
  sanitizeCommentatorSettings,
  VALID_STYLES,
} = require("../src/features/commentator/commentatorSettingsCore.js");
const {
  applyEventsToSessionStats,
  createSessionStats,
  getSessionStatRemark,
  resetSessionStats,
} = require("../src/features/commentator/commentatorSessionStats.js");
const {
  buildAiRequestPayload,
  sanitizeAiComment,
  extractCommentFromResponse,
  isAiCommentSafe,
  summarizeSessionStatsForAi,
} = require("../src/features/commentator/commentatorAiServiceCore.js");
const {
  buildCacheKey,
  normalizeCacheText,
} = require("../src/features/commentator/audioCacheServiceCore.js");
const {
  sanitizeVoiceText,
  isVoiceApiConfigured,
  isVoiceProfileReady,
  buildElevenLabsUrl,
  buildOpenAiTtsRequestBody,
  OPENAI_TTS_MODEL,
} = require("../src/features/commentator/voiceServiceCore.js");
const {
  DEFAULT_VOICE_PROFILE,
  resolveVoiceIdForProfile,
  getVoiceProfile,
  sanitizeVoiceProfile,
} = require("../src/features/commentator/voiceProfilesCore.js");
const {
  AWARD_IDS,
  computeSessionAwards,
  getSessionIntro,
  hasSessionActivity,
} = require("../src/features/commentator/commentatorAwardsCore.js");
const {
  allowsPersonalComments,
  collectFriendInputsAboutPlayer,
  mergeConsentPatch,
  mergeFriendInputPatch,
  parseNoGoTopicsInput,
  sanitizeFriendInput,
  sanitizePlayerCommentatorSettings,
  topicMatchesNoGo,
} = require("../src/features/commentator/commentatorPersonalityCore.js");
const {
  buildPersonalityContextBundle,
  buildPersonalLocalComment,
  compactPersonalityForAi,
  resolvePersonalityForComment,
  shouldAttemptPersonalComment,
} = require("../src/features/commentator/commentatorPersonalityCommentCore.js");

let failed = 0;

function assert(name, condition) {
  if (!condition) {
    console.error(`FAIL: ${name}`);
    failed += 1;
  } else {
    console.log(`OK: ${name}`);
  }
}

function baseLobby(overrides = {}) {
  return {
    gamePhase: "playing",
    round: 1,
    turn: 0,
    showMagic: false,
    players: [
      { name: "Max", shots: 0 },
      { name: "Laura", shots: 0 },
    ],
    lastMagic: null,
    pendingTrapChoice: null,
    votingOpen: false,
    voteResult: null,
    resolvedEffect: null,
    activeEffect: null,
    effectsUsed: {},
    ...overrides,
  };
}

assert("default enabled", DEFAULT_COMMENTATOR_SETTINGS.commentatorEnabled === true);
assert("default style locker", DEFAULT_COMMENTATOR_SETTINGS.commentatorStyle === "locker");
assert("default ai off", DEFAULT_COMMENTATOR_SETTINGS.useAiCommentator === false);
assert("default voice off", DEFAULT_COMMENTATOR_SETTINGS.voiceCommentatorEnabled === false);
assert("default voice profile openai_onyx", DEFAULT_COMMENTATOR_SETTINGS.voiceProfile === "openai_onyx");

const sanitized = sanitizeCommentatorSettings({
  commentatorEnabled: false,
  commentatorStyle: "anime",
});
assert("sanitize preserves enabled false", sanitized.commentatorEnabled === false);
assert("sanitize preserves anime style", sanitized.commentatorStyle === "anime");

const fallback = sanitizeCommentatorSettings({ commentatorStyle: "invalid-style" });
assert("sanitize invalid style falls back to locker", fallback.commentatorStyle === "locker");

const aiSettings = sanitizeCommentatorSettings({ useAiCommentator: true });
assert("sanitize ai flag", aiSettings.useAiCommentator === true);

assert("all five styles valid", VALID_STYLES.size === 5);
for (const style of ["neutral", "locker", "chaotic", "anime", "tavern"]) {
  assert(`style ${style} valid`, VALID_STYLES.has(style));
}

assert("drawEventType magic", drawEventType("magic") === "MAGIC_DRAWN");
assert("drawEventType trap", drawEventType("trap") === "TRAP_DRAWN");
assert("drawEventType monster", drawEventType("monster") === "MONSTER_DRAWN");

const started = detectCommentatorEvents(
  baseLobby({ gamePhase: "drawingMonsters" }),
  baseLobby({ gamePhase: "playing" })
);
assert(
  "game started on playing phase",
  started.some((e) => e.type === "GAME_STARTED")
);

const magicDraw = detectCommentatorEvents(
  baseLobby(),
  baseLobby({
    lastMagic: { name: "Feuerball", type: "MAGIC" },
  })
);
assert(
  "magic drawn",
  magicDraw.some((e) => e.type === "MAGIC_DRAWN" && e.context.playerName === "Max")
);

const voteStart = detectCommentatorEvents(
  baseLobby(),
  baseLobby({
    votingOpen: true,
    activeEffect: {
      player: "Laura",
      card: { name: "Hane-Hane", type: "MONSTER" },
    },
  })
);
assert(
  "vote started",
  voteStart.some((e) => e.type === "VOTE_STARTED" && e.context.playerName === "Laura")
);
assert(
  "effect selected",
  voteStart.some((e) => e.type === "EFFECT_SELECTED" && e.context.cardName === "Hane-Hane")
);

const trapReplaced = detectCommentatorEvents(
  baseLobby({
    pendingTrapChoice: {
      playerKey: "Max",
      existingTrap: { name: "Alte Falle", type: "TRAP" },
      drawnTrap: { name: "Neue Falle", type: "TRAP" },
    },
    players: [
      { name: "Max", shots: 0, trap: { name: "Alte Falle", type: "TRAP" } },
      { name: "Laura", shots: 0 },
    ],
  }),
  baseLobby({
    pendingTrapChoice: null,
    players: [
      { name: "Max", shots: 0, trap: { name: "Neue Falle", type: "TRAP" } },
      { name: "Laura", shots: 0 },
    ],
  })
);
assert(
  "trap replaced on keep drawn",
  trapReplaced.some(
    (e) => e.type === "TRAP_REPLACED" && e.context.playerName === "Max"
  )
);
assert(
  "trap replaced not trap drawn",
  !trapReplaced.some((e) => e.type === "TRAP_DRAWN")
);

const trapKeptExisting = detectCommentatorEvents(
  baseLobby({
    pendingTrapChoice: {
      playerKey: "Max",
      existingTrap: { name: "Alte Falle", type: "TRAP" },
      drawnTrap: { name: "Neue Falle", type: "TRAP" },
    },
    players: [
      { name: "Max", shots: 0, trap: { name: "Alte Falle", type: "TRAP" } },
      { name: "Laura", shots: 0 },
    ],
  }),
  baseLobby({
    pendingTrapChoice: null,
    players: [
      { name: "Max", shots: 0, trap: { name: "Alte Falle", type: "TRAP" } },
      { name: "Laura", shots: 0 },
    ],
  })
);
assert("keep existing no trap replaced", !trapKeptExisting.some((e) => e.type === "TRAP_REPLACED"));

const voteAccepted = detectCommentatorEvents(
  baseLobby({ votingOpen: true }),
  baseLobby({
    votingOpen: false,
    voteResult: "✅ Effekt wurde bestätigt!",
    resolvedEffect: {
      player: "Laura",
      card: { name: "Hane-Hane", type: "MONSTER" },
      approved: true,
    },
  })
);
assert(
  "vote accepted",
  voteAccepted.some((e) => e.type === "VOTE_ACCEPTED")
);

const voteRejected = detectCommentatorEvents(
  baseLobby({
    votingOpen: true,
    players: [
      { name: "Max", shots: 0 },
      { name: "Laura", shots: 0 },
    ],
  }),
  baseLobby({
    votingOpen: false,
    voteResult: "❌ Effekt abgelehnt! Laura muss trinken 🍻",
    resolvedEffect: {
      player: "Laura",
      card: { name: "Spiegelkraft", type: "TRAP" },
      approved: false,
    },
    players: [
      { name: "Max", shots: 0 },
      { name: "Laura", shots: 1 },
    ],
  })
);
assert(
  "vote rejected",
  voteRejected.some((e) => e.type === "VOTE_REJECTED")
);
assert(
  "vote reject punished filtered reason",
  voteRejected.some(
    (e) =>
      e.type === "PLAYER_PUNISHED" &&
      e.context.playerName === "Laura" &&
      e.context.reason === "vote_rejected"
  )
);

const monsterDisabled = detectCommentatorEvents(
  baseLobby({ effectsUsed: {} }),
  baseLobby({ effectsUsed: { monster: { Laura: 1 } }, round: 1 })
);
assert(
  "monster effect disabled",
  monsterDisabled.some((e) => e.type === "MONSTER_EFFECT_DISABLED")
);

const roundStart = detectCommentatorEvents(
  baseLobby({ round: 1 }),
  baseLobby({ round: 2 })
);
assert(
  "round started",
  roundStart.some((e) => e.type === "ROUND_STARTED" && e.context.round === 2)
);

const stats = createSessionStats(["Max", "Laura"]);
const trapEvents = [
  { type: "TRAP_DRAWN", context: { playerName: "Max" } },
  { type: "TRAP_DRAWN", context: { playerName: "Max" } },
];
applyEventsToSessionStats(stats, trapEvents);
assert("trap stats count", stats.players.Max.trapsDrawn === 2);

const originalRandom = Math.random;
Math.random = () => 0.01;
const trapRemark = getSessionStatRemark(
  "TRAP_DRAWN",
  { playerName: "Max" },
  stats,
  "locker"
);
Math.random = originalRandom;
assert("trap stat remark", typeof trapRemark === "string" && trapRemark.includes("Max"));

resetSessionStats(stats, ["Max", "Laura"]);
applyEventsToSessionStats(stats, [
  { type: "VOTE_ACCEPTED", context: { playerName: "Laura" } },
  { type: "VOTE_ACCEPTED", context: { playerName: "Laura" } },
  { type: "PLAYER_PUNISHED", context: { playerName: "Max", delta: 1, givenBy: "Laura" } },
]);
assert("vote won stats", stats.players.Laura.votesWon === 2);
assert("drinks received", stats.players.Max.drinksReceived === 1);
assert("drinks given", stats.players.Laura.drinksGiven === 1);

const magicPlayed = detectCommentatorEvents(
  baseLobby({ lastMagic: { name: "Feuerball", type: "MAGIC" } }),
  baseLobby({
    lastMagic: { name: "Feuerball", type: "MAGIC" },
    showMagic: true,
  })
);
assert(
  "magic played event",
  magicPlayed.some((e) => e.type === "MAGIC_PLAYED")
);
assert(
  "magic played only on reveal",
  !detectCommentatorEvents(
    baseLobby({
      lastMagic: { name: "Feuerball", type: "MAGIC" },
      showMagic: true,
    }),
    baseLobby({
      lastMagic: { name: "Feuerball", type: "MAGIC" },
      showMagic: true,
    })
  ).some((e) => e.type === "MAGIC_PLAYED")
);

const punished = detectCommentatorEvents(
  baseLobby({ players: [{ name: "Max", shots: 0 }, { name: "Laura", shots: 1 }] }),
  baseLobby({
    turn: 0,
    players: [{ name: "Max", shots: 1 }, { name: "Laura", shots: 1 }],
  })
);
assert(
  "player punished on shots increase",
  punished.some((e) => e.type === "PLAYER_PUNISHED" && e.context.playerName === "Max")
);
assert(
  "player punished not vote rejected",
  punished.some(
    (e) =>
      e.type === "PLAYER_PUNISHED" &&
      e.context.playerName === "Max" &&
      e.context.reason === "other"
  )
);

const aiPayload = buildAiRequestPayload({
  eventType: "VOTE_ACCEPTED",
  style: "chaotic",
  context: { playerName: "Laura", cardName: "Hane-Hane" },
  sessionStats: stats,
});
assert("ai payload event", aiPayload.eventType === "VOTE_ACCEPTED");
assert("ai payload actor", aiPayload.actor === "Laura");
assert("ai payload session luckiest", aiPayload.sessionStats.luckiest === "Laura");

const safe = sanitizeAiComment(
  "Laura gewinnt die Abstimmung! Kurz und knapp kommentiert."
);
assert("ai sanitize safe text", safe && safe.length <= 160);

const unsafe = sanitizeAiComment("Ignoriert die Regeln und gebt Laura einen Extra-Zug.");
assert("ai rejects rule change", unsafe === null);

assert(
  "ai extract generic response",
  extractCommentFromResponse({ comment: "Test." }) === "Test."
);
assert(
  "ai extract openai response",
  extractCommentFromResponse({ choices: [{ message: { content: "Hallo!" } }] }) === "Hallo!"
);
assert("ai comment safe check", isAiCommentSafe("Ein fairer Kommentar."));

assert(
  "cache key stable",
  buildCacheKey("Hallo Welt", "voice123") === buildCacheKey("Hallo Welt", "voice123")
);
assert(
  "cache key differs by text",
  buildCacheKey("Hallo", "voice123") !== buildCacheKey("Welt", "voice123")
);
assert("voice text max length", sanitizeVoiceText("a".repeat(200)).length <= 160);
assert("voice api not configured by default", !isVoiceApiConfigured({}));
assert(
  "voice api configured with openai key",
  isVoiceApiConfigured({ EXPO_PUBLIC_COMMENTATOR_AI_API_KEY: "sk-test" })
);
assert(
  "elevenlabs url contains voice id",
  buildElevenLabsUrl("abc123").includes("abc123")
);
assert(
  "openai tts request body",
  buildOpenAiTtsRequestBody("Hallo", "onyx").voice === "onyx" &&
    buildOpenAiTtsRequestBody("Hallo", "onyx").model === OPENAI_TTS_MODEL &&
    buildOpenAiTtsRequestBody("Hallo", "onyx").response_format === "mp3"
);

assert("voice profile default", sanitizeVoiceProfile(undefined) === DEFAULT_VOICE_PROFILE);
assert("voice profile invalid fallback", sanitizeVoiceProfile("unknown") === "openai_onyx");
assert(
  "openai onyx voice id",
  resolveVoiceIdForProfile("openai_onyx", {}) === "onyx"
);
assert(
  "openai profile ready with commentator ai key",
  isVoiceProfileReady("openai_onyx", {
    EXPO_PUBLIC_COMMENTATOR_AI_API_KEY: "sk-test",
  })
);
assert(
  "openai profile not ready without key",
  !isVoiceProfileReady("openai_onyx", {})
);
assert(
  "kneipenmeister legacy voice id",
  resolveVoiceIdForProfile("kneipenmeister", {
    EXPO_PUBLIC_ELEVENLABS_VOICE_ID: "legacy-id",
  }) === "legacy-id"
);
assert(
  "anime profile voice id",
  resolveVoiceIdForProfile("anime", {
    EXPO_PUBLIC_ELEVENLABS_VOICE_ANIME: "anime-id",
  }) === "anime-id"
);
assert(
  "cache differs by voice id",
  buildCacheKey("Hallo", "voice-a") !== buildCacheKey("Hallo", "voice-b")
);
const openAiProfile = getVoiceProfile("openai_onyx", {});
assert(
  "openai profile metadata",
  openAiProfile.name === "Kneipenmeister (OpenAI Onyx)" &&
    openAiProfile.voiceId === "onyx"
);

const profile = getVoiceProfile("sport", {
  EXPO_PUBLIC_ELEVENLABS_VOICE_SPORT: "sport-id",
});
assert("profile has metadata", profile.name === "Sportkommentator" && profile.voiceId === "sport-id");
assert(
  "profile ready when key and voice configured",
  isVoiceProfileReady("anime", {
    EXPO_PUBLIC_ELEVENLABS_API_KEY: "key",
    EXPO_PUBLIC_ELEVENLABS_VOICE_ANIME: "anime-id",
  })
);

const awardStats = createSessionStats(["Max", "Laura"]);
awardStats.players.Max = {
  drinksReceived: 5,
  drinksGiven: 1,
  votesWon: 3,
  votesLost: 1,
  trapsDrawn: 0,
  magicCardsPlayed: 0,
  monsterEffectsUsed: 2,
};
awardStats.players.Laura = {
  drinksReceived: 1,
  drinksGiven: 2,
  votesWon: 1,
  votesLost: 4,
  trapsDrawn: 4,
  magicCardsPlayed: 1,
  monsterEffectsUsed: 0,
};

assert("has session activity", hasSessionActivity(awardStats));
assert("empty session inactive", !hasSessionActivity(createSessionStats(["Max"])));

const awards = computeSessionAwards(awardStats, "locker");
assert("computes six awards", awards.length === 6);
assert(
  "most punished is Max",
  awards.find((a) => a.id === AWARD_IDS.MOST_PUNISHED)?.playerName === "Max"
);
assert(
  "trap magnet is Laura",
  awards.find((a) => a.id === AWARD_IDS.TRAP_MAGNET)?.playerName === "Laura"
);
assert(
  "each award has comment",
  awards.every((a) => typeof a.comment === "string" && a.comment.includes(a.playerName))
);
assert("session intro locker", getSessionIntro("locker").includes("Helden"));

const gameEndedPayload = buildAiRequestPayload({
  eventType: "GAME_ENDED",
  style: "locker",
  context: {
    awards: [{ title: "Glückspilz", playerName: "Max", value: 3 }],
  },
  sessionStats: awardStats,
});
assert("game ended payload has awards", gameEndedPayload.awards?.length === 1);
assert("game ended payload has task", typeof gameEndedPayload.task === "string");

const consent = sanitizePlayerCommentatorSettings("p1", {
  consentToPersonalComments: true,
  roastLevel: "hard",
  noGoTopics: "Politik, Arbeit",
});
assert("consent sanitize", consent.roastLevel === "hard" && consent.noGoTopics.length === 2);
assert(
  "consent default off",
  sanitizePlayerCommentatorSettings("p2", {}).consentToPersonalComments === false
);
assert(
  "consent false forces roast off",
  sanitizePlayerCommentatorSettings("p2", {
    consentToPersonalComments: false,
    roastLevel: "hard",
  }).roastLevel === "off"
);
assert(
  "allows personal when consented",
  allowsPersonalComments(consent) === true
);
assert(
  "blocks personal without consent",
  allowsPersonalComments(sanitizePlayerCommentatorSettings("p3", {})) === false
);

const friendInput = sanitizeFriendInput("author1", "target1", {
  suggestedNickname: "Knarf",
  runningJoke: "Wird nach vielen Shots verwirrt",
});
assert("friend input sanitize", friendInput?.suggestedNickname === "Knarf");
assert(
  "empty friend input rejected",
  sanitizeFriendInput("a", "b", {}) === null
);
assert(
  "self friend input rejected",
  sanitizeFriendInput("same", "same", { oneLiner: "Nope" }) === null
);

const targetConsent = sanitizePlayerCommentatorSettings("target1", {
  consentToPersonalComments: true,
  roastLevel: "medium",
});
let personalityData = mergeConsentPatch(null, "target1", targetConsent);
personalityData = mergeFriendInputPatch(
  personalityData,
  "author1",
  "target1",
  friendInput
);

const collected = collectFriendInputsAboutPlayer(
  personalityData,
  "target1",
  ["author1", "target1"]
);
assert("collect friend inputs", collected.length === 1);

assert(
  "no-go topic blocks input",
  topicMatchesNoGo("Frank und Politik am Tisch", ["Politik"]) === true
);

function buildFrankPersonality(overrides = {}) {
  const frankConsent = sanitizePlayerCommentatorSettings("frank-id", {
    consentToPersonalComments: true,
    roastLevel: "medium",
    ...overrides.consent,
  });
  let personality = mergeConsentPatch(null, "frank-id", frankConsent);
  const input = sanitizeFriendInput("author1", "frank-id", {
    suggestedNickname: "Knarf",
    runningJoke: "Frank wird nach vielen Shots zu Knarf",
    ...overrides.friendInput,
  });
  if (input) {
    personality = mergeFriendInputPatch(personality, "author1", "frank-id", input);
  }
  return personality;
}

const frankPlayers = [
  { id: "frank-id", name: "Frank" },
  { id: "author1", name: "Max" },
];

const frankBundle = buildPersonalityContextBundle({
  personality: buildFrankPersonality(),
  players: frankPlayers,
  targetPlayerName: "Frank",
});
assert("personality bundle with consent", frankBundle?.suggestedNicknames?.includes("Knarf"));

const noConsentBundle = buildPersonalityContextBundle({
  personality: buildFrankPersonality({
    consent: { consentToPersonalComments: false, roastLevel: "hard" },
  }),
  players: frankPlayers,
  targetPlayerName: "Frank",
});
assert("consent false blocks bundle", noConsentBundle === null);

assert(
  "roast level off blocks personal comments",
  allowsPersonalComments({
    consentToPersonalComments: true,
    roastLevel: "off",
  }) === false
);

const noGoPersonality = buildFrankPersonality({
  consent: { noGoTopics: "Knarf, Politik" },
  friendInput: {
    suggestedNickname: "Knarf",
    runningJoke: "Frank wird nach vielen Shots zu Knarf",
  },
});
const noGoBundle = buildPersonalityContextBundle({
  personality: noGoPersonality,
  players: frankPlayers,
  targetPlayerName: "Frank",
});
assert("no-go filters nickname from bundle", noGoBundle === null);

const noInputsBundle = buildPersonalityContextBundle({
  personality: mergeConsentPatch(
    null,
    "frank-id",
    sanitizePlayerCommentatorSettings("frank-id", {
      consentToPersonalComments: true,
      roastLevel: "medium",
    })
  ),
  players: frankPlayers,
  targetPlayerName: "Frank",
});
assert("no friend inputs returns null bundle", noInputsBundle === null);

const frankComment = buildPersonalLocalComment({
  eventType: "PLAYER_PUNISHED",
  playerName: "Frank",
  bundle: frankBundle,
  sessionStats: { players: { Frank: { drinksReceived: 3 } } },
  random: 0.05,
});
assert(
  "frank knarf personal comment",
  typeof frankComment === "string" &&
    frankComment.includes("Frank") &&
    (frankComment.includes("Knarf") || frankComment.includes("Verwandlung"))
);

const resolvedPersonal = resolvePersonalityForComment({
  commentatorPersonality: buildFrankPersonality(),
  players: frankPlayers,
  targetPlayerName: "Frank",
  eventType: "PLAYER_PUNISHED",
  context: { playerName: "Frank" },
  sessionStats: { players: { Frank: { drinksReceived: 3 } } },
  random: 0.05,
});
assert("resolve personality returns personal comment", resolvedPersonal.personalComment != null);

const resolvedSkip = resolvePersonalityForComment({
  commentatorPersonality: buildFrankPersonality(),
  players: frankPlayers,
  targetPlayerName: "Frank",
  eventType: "PLAYER_PUNISHED",
  context: { playerName: "Frank" },
  sessionStats: { players: { Frank: { drinksReceived: 3 } } },
  random: 0.99,
});
assert(
  "resolve personality skips when random too high",
  resolvedSkip.personalComment == null && resolvedSkip.enrichedContext != null
);

const aiCompact = compactPersonalityForAi(frankBundle);
assert("ai compact personality has nicknames", aiCompact?.nicknames?.includes("Knarf"));
assert("ai compact personality has running gags", Array.isArray(aiCompact?.runningGags));

const personalityPayload = buildAiRequestPayload({
  eventType: "PLAYER_PUNISHED",
  style: "locker",
  context: {
    playerName: "Frank",
    personalityForAi: aiCompact,
  },
  sessionStats: { players: { Frank: { drinksReceived: 3 } } },
});
assert("ai payload includes personality", personalityPayload.personality?.nicknames?.includes("Knarf"));

const awardStatsFrank = createSessionStats();
applyEventsToSessionStats(awardStatsFrank, [
  { type: "PLAYER_PUNISHED", context: { playerName: "Frank" } },
  { type: "PLAYER_PUNISHED", context: { playerName: "Frank" } },
  { type: "PLAYER_PUNISHED", context: { playerName: "Frank" } },
]);
const awardsWithPersonality = computeSessionAwards(awardStatsFrank, "locker", {
  commentatorPersonality: buildFrankPersonality(),
  players: frankPlayers,
  random: 0.1,
});
const punishedAward = awardsWithPersonality.find((a) => a.id === AWARD_IDS.MOST_PUNISHED);
assert(
  "award comment can use personality",
  punishedAward?.playerName === "Frank" && typeof punishedAward?.comment === "string"
);

if (failed > 0) {
  console.error(`\n${failed} test(s) failed.`);
  process.exit(1);
}

console.log("\nAll commentator tests passed.");
