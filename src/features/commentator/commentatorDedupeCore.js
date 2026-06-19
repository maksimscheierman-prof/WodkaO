/** Anti-Repetition für Kommentator — pro Lobby/Session (in-memory). */

const HISTORY_LIMIT = 10;

const COOLDOWN = {
  exactText: 10,
  cardKey: 3,
  playerJokeKey: 5,
  jokeKey: 8,
};

const NEUTRAL_FALLBACKS = {
  GAME_STARTED: ["Los geht's!", "Die Session startet."],
  ROUND_STARTED: ["Neue Runde.", "Weiter geht's in Runde {round}."],
  CARD_DRAWN: ["{playerName} zieht.", "Nächster Zug für {playerName}."],
  MONSTER_DRAWN: ["{playerName} zieht ein Monster.", "Monster-Zug für {playerName}."],
  MAGIC_DRAWN: ["{playerName} zieht eine Magie.", "Magie für {playerName}."],
  TRAP_DRAWN: ["{playerName} zieht eine Falle.", "Falle für {playerName}."],
  EFFECT_SELECTED: ["{playerName} wählt einen Effekt.", "Effekt von {playerName}."],
  VOTE_STARTED: ["Abstimmung läuft.", "Die Runde wird abgestimmt."],
  VOTE_ACCEPTED: ["Angenommen.", "Die Abstimmung ist durch."],
  VOTE_REJECTED: ["Abgelehnt.", "{playerName} verliert die Abstimmung."],
  MONSTER_EFFECT_DISABLED: ["Effekt deaktiviert.", "Monster-Effekt aus."],
  MONSTER_EFFECT_ENABLED: ["Effekt aktiv.", "Monster-Effekt an."],
  MAGIC_PLAYED: ["{playerName} spielt Magie.", "Magie von {playerName}."],
  PLAYER_PUNISHED: ["{playerName} trinkt.", "Strafe für {playerName}."],
  TRAP_REPLACED: ["{playerName} tauscht die Falle.", "Falle getauscht."],
  GAME_ENDED: ["Session vorbei.", "Das war's für heute."],
};

function normalizeKey(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .trim()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function createCommentaryDedupeState() {
  return { comments: [] };
}

function resetCommentaryDedupeState(state) {
  if (!state) return;
  state.comments = [];
}

function formatTemplate(template, context = {}) {
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    const value = context[key];
    return value != null && value !== "" ? String(value) : "";
  });
}

/**
 * @param {{ eventType: string, context?: object, text: string, templateId?: string, personalityMeta?: object }} input
 */
function buildCommentKeys({
  eventType,
  context = {},
  text,
  templateId = null,
  personalityMeta = null,
}) {
  const cardName = context?.cardName ?? null;
  const playerName = context?.playerName ?? null;
  const playerId = context?.playerId ?? personalityMeta?.playerId ?? null;

  let jokeKey = null;
  if (templateId) {
    jokeKey = normalizeKey(templateId);
  } else if (personalityMeta?.jokeKey) {
    jokeKey = normalizeKey(personalityMeta.jokeKey);
  } else if (personalityMeta?.oneLinerKey) {
    jokeKey = normalizeKey(personalityMeta.oneLinerKey);
  }

  let playerJokeKey = null;
  if (personalityMeta?.playerJokeKey) {
    playerJokeKey = normalizeKey(personalityMeta.playerJokeKey);
  } else if (playerName && personalityMeta?.runningJoke) {
    playerJokeKey = `${normalizeKey(playerId || playerName)}|${normalizeKey(personalityMeta.runningJoke)}`;
  }

  return {
    exactTextKey: normalizeKey(text),
    topicKey: normalizeKey(`${eventType}|${cardName || playerName || ""}`),
    cardKey: cardName ? normalizeKey(cardName) : null,
    playerJokeKey,
    jokeKey,
    templateId: templateId || null,
  };
}

function isCommentBlocked(state, keys) {
  if (!state?.comments?.length || !keys) return false;

  const recent = state.comments;

  if (
    keys.exactTextKey &&
    recent.slice(0, COOLDOWN.exactText).some((c) => c.exactTextKey === keys.exactTextKey)
  ) {
    return "exactText";
  }

  if (
    keys.cardKey &&
    recent.slice(0, COOLDOWN.cardKey).some((c) => c.cardKey && c.cardKey === keys.cardKey)
  ) {
    return "cardKey";
  }

  if (
    keys.playerJokeKey &&
    recent
      .slice(0, COOLDOWN.playerJokeKey)
      .some((c) => c.playerJokeKey && c.playerJokeKey === keys.playerJokeKey)
  ) {
    return "playerJokeKey";
  }

  if (
    keys.jokeKey &&
    recent.slice(0, COOLDOWN.jokeKey).some((c) => c.jokeKey && c.jokeKey === keys.jokeKey)
  ) {
    return "jokeKey";
  }

  return false;
}

function recordCommentary(state, keys, text) {
  if (!state) return;

  const entry = {
    text: String(text || ""),
    exactTextKey: keys?.exactTextKey ?? normalizeKey(text),
    topicKey: keys?.topicKey ?? null,
    cardKey: keys?.cardKey ?? null,
    playerJokeKey: keys?.playerJokeKey ?? null,
    jokeKey: keys?.jokeKey ?? null,
    templateId: keys?.templateId ?? null,
    at: Date.now(),
  };

  state.comments.unshift(entry);
  if (state.comments.length > HISTORY_LIMIT) {
    state.comments.length = HISTORY_LIMIT;
  }
}

function getAiDedupeContext(state) {
  const recent = state?.comments ?? [];

  const recentCommentaryTexts = recent
    .slice(0, COOLDOWN.exactText)
    .map((c) => c.text)
    .filter(Boolean);

  const recentCommentaryTopics = recent
    .slice(0, 8)
    .map((c) => c.topicKey)
    .filter(Boolean);

  const avoidTopics = [
    ...recent.slice(0, COOLDOWN.cardKey).map((c) => c.cardKey).filter(Boolean),
    ...recent.slice(0, COOLDOWN.jokeKey).map((c) => c.jokeKey).filter(Boolean),
    ...recent.slice(0, COOLDOWN.playerJokeKey).map((c) => c.playerJokeKey).filter(Boolean),
  ].filter((value, index, arr) => arr.indexOf(value) === index);

  return {
    recentCommentaryTexts,
    recentCommentaryTopics,
    avoidTopics,
  };
}

function inferPersonalityMeta(text, playerName, bundle) {
  if (!text || !playerName || !bundle?.aggregated) return null;

  const normText = normalizeKey(text);
  const normPlayer = normalizeKey(playerName);
  const agg = bundle.aggregated;

  const lists = [
    { field: "runningJokes", type: "runningJoke" },
    { field: "oneLiners", type: "oneLiner" },
    { field: "suggestedNicknames", type: "nickname" },
    { field: "harmlessRoasts", type: "roast" },
    { field: "typicalMoments", type: "moment" },
  ];

  for (const { field, type } of lists) {
    for (const phrase of agg[field] || []) {
      const normalized = normalizeKey(phrase);
      if (!normalized || !normText.includes(normalized)) continue;

      const meta = {
        jokeKey: type === "oneLiner" ? normalized : phrase,
        oneLinerKey: type === "oneLiner" ? normalized : null,
        runningJoke: type === "runningJoke" ? phrase : null,
      };

      if (type === "runningJoke" || type === "nickname") {
        meta.playerJokeKey = `${normPlayer}|${normalized}`;
      }

      return meta;
    }
  }

  return null;
}

function shuffleArray(items, random = Math.random()) {
  const copy = [...items];
  let seed = random;
  for (let i = copy.length - 1; i > 0; i -= 1) {
    seed = (seed * 9301 + 49297) % 233280;
    const j = Math.floor((seed / 233280) * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function pickCandidate(text, keys, dedupeState) {
  if (!text) return null;
  const blocked = dedupeState ? isCommentBlocked(dedupeState, keys) : false;
  if (blocked) return null;
  return { text, keys };
}

function getNeutralFallback(eventType, context = {}, dedupeState = null, random = Math.random()) {
  const pool = NEUTRAL_FALLBACKS[eventType] || ["Weiter geht's."];
  const shuffled = shuffleArray(pool, random);

  for (const template of shuffled) {
    const text = formatTemplate(template, context).replace(/\s+/g, " ").trim();
    if (!text) continue;
    const keys = buildCommentKeys({ eventType, context, text, templateId: `neutral:${template}` });
    const candidate = pickCandidate(text, keys, dedupeState);
    if (candidate) return candidate;
  }

  const playerName = context?.playerName || "Spiel";
  const text = `${playerName} – weiter geht's.`;
  const keys = buildCommentKeys({ eventType, context, text, templateId: "neutral:forced" });
  return { text, keys };
}

module.exports = {
  COOLDOWN,
  HISTORY_LIMIT,
  NEUTRAL_FALLBACKS,
  normalizeKey,
  createCommentaryDedupeState,
  resetCommentaryDedupeState,
  buildCommentKeys,
  isCommentBlocked,
  recordCommentary,
  getAiDedupeContext,
  inferPersonalityMeta,
  shuffleArray,
  pickCandidate,
  getNeutralFallback,
  formatTemplate,
};
