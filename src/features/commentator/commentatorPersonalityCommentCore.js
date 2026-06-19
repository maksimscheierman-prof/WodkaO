/** Phase 8 — Friend-Inputs in Kommentare (Node-testbar). */

const {
  allowsPersonalComments,
  collectFriendInputsAboutPlayer,
  getConsentForPlayer,
  topicMatchesNoGo,
} = require("./commentatorPersonalityCore.js");

const MAX_COMMENT_LENGTH = 160;

const PERSONAL_ELIGIBLE_EVENTS = new Set([
  "PLAYER_PUNISHED",
  "VOTE_REJECTED",
  "TRAP_DRAWN",
  "TRAP_REPLACED",
  "GAME_ENDED",
]);

function pickRandom(items, random = Math.random()) {
  if (!items?.length) return null;
  const idx = Math.floor(random * items.length) % items.length;
  return items[idx];
}

function normalizeWhitespace(text) {
  return String(text || "")
    .replace(/\s+/g, " ")
    .trim();
}

function truncateText(text, maxLen = MAX_COMMENT_LENGTH) {
  const clean = normalizeWhitespace(text);
  if (clean.length <= maxLen) return clean;
  return clean.slice(0, maxLen).trim();
}

function resolvePlayerId(players, playerName) {
  if (!playerName || !players?.length) return null;
  const match = players.find((p) => p.name === playerName);
  return match?.id ?? null;
}

function aggregateFriendFields(friendInputs = []) {
  const pick = (field) => friendInputs.map((item) => item[field]).filter(Boolean);

  return {
    suggestedNicknames: [...new Set(pick("suggestedNickname"))],
    runningJokes: pick("runningJoke"),
    typicalMoments: pick("typicalMoment"),
    harmlessRoasts: pick("harmlessRoast"),
    oneLiners: pick("oneLiner"),
  };
}

function buildPersonalityContextBundle({
  personality,
  players = [],
  targetPlayerName,
}) {
  const targetPlayerId = resolvePlayerId(players, targetPlayerName);
  if (!targetPlayerId || !personality) return null;

  const playerIds = players.map((p) => p.id).filter(Boolean);
  const targetPlayerCommentatorSettings = getConsentForPlayer(
    personality,
    targetPlayerId
  );
  const friendInputsForPlayer = collectFriendInputsAboutPlayer(
    personality,
    targetPlayerId,
    playerIds
  );

  if (
    !allowsPersonalComments(targetPlayerCommentatorSettings) ||
    !friendInputsForPlayer.length
  ) {
    return null;
  }

  const aggregated = aggregateFriendFields(friendInputsForPlayer);

  return {
    targetPlayerId,
    targetPlayerName,
    targetPlayerCommentatorSettings,
    friendInputsForPlayer,
    aggregated,
    suggestedNicknames: aggregated.suggestedNicknames,
    runningJokes: aggregated.runningJokes,
    typicalMoments: aggregated.typicalMoments,
    harmlessRoasts: aggregated.harmlessRoasts,
    oneLiners: aggregated.oneLiners,
  };
}

function enrichEventContext(context = {}, bundle) {
  if (!bundle) return { ...context };

  return {
    ...context,
    targetPlayerCommentatorSettings: bundle.targetPlayerCommentatorSettings,
    friendInputsForPlayer: bundle.friendInputsForPlayer,
    suggestedNicknames: bundle.suggestedNicknames,
    runningJokes: bundle.runningJokes,
    typicalMoments: bundle.typicalMoments,
    harmlessRoasts: bundle.harmlessRoasts,
    oneLiners: bundle.oneLiners,
  };
}

function pickUsableFromList(items = [], noGoTopics = [], random = Math.random()) {
  const clean = items.filter(
    (item) => item && !topicMatchesNoGo(item, noGoTopics)
  );
  return pickRandom(clean, random);
}

function isStatHighlight(eventType, playerName, sessionStats) {
  const stats = sessionStats?.players?.[playerName];
  if (!stats) return eventType === "GAME_ENDED";

  if (eventType === "PLAYER_PUNISHED") return stats.drinksReceived >= 2;
  if (eventType === "VOTE_REJECTED") return stats.votesLost >= 2;
  if (eventType === "TRAP_DRAWN" || eventType === "TRAP_REPLACED") {
    return stats.trapsDrawn >= 2;
  }
  if (eventType === "GAME_ENDED") return true;
  return false;
}

function getPersonalCommentChance(eventType, playerName, sessionStats) {
  if (!PERSONAL_ELIGIBLE_EVENTS.has(eventType)) return 0;

  let chance = 0.2;
  if (isStatHighlight(eventType, playerName, sessionStats)) chance += 0.12;
  if (eventType === "PLAYER_PUNISHED") chance += 0.08;
  if (eventType === "GAME_ENDED") chance += 0.1;
  return Math.min(chance, 0.42);
}

function shouldAttemptPersonalComment({
  eventType,
  playerName,
  sessionStats,
  bundle,
  random = Math.random(),
}) {
  if (!bundle || !playerName) return false;
  if (!PERSONAL_ELIGIBLE_EVENTS.has(eventType)) return false;
  return random < getPersonalCommentChance(eventType, playerName, sessionStats);
}

function filterListForRoast(items, roastLevel, noGoTopics) {
  return items.filter((item) => {
    if (!item || topicMatchesNoGo(item, noGoTopics)) return false;
    if (roastLevel === "mild") {
      return true;
    }
    return true;
  });
}

function compactPersonalityForAi(bundle) {
  if (!bundle) return null;

  const { roastLevel, noGoTopics } = bundle.targetPlayerCommentatorSettings;
  const agg = bundle.aggregated;
  const compact = { roastLevel };

  const nicknames = filterListForRoast(agg.suggestedNicknames, roastLevel, noGoTopics)
    .slice(0, 2)
    .map((t) => truncateText(t, 40));
  if (nicknames.length) compact.nicknames = nicknames;

  if (roastLevel === "mild") {
    const moments = filterListForRoast(agg.typicalMoments, roastLevel, noGoTopics)
      .slice(0, 2)
      .map((t) => truncateText(t, 60));
    const liners = filterListForRoast(agg.oneLiners, roastLevel, noGoTopics)
      .slice(0, 2)
      .map((t) => truncateText(t, 60));
    if (moments.length) compact.typicalMoments = moments;
    if (liners.length) compact.oneLiners = liners;
  } else if (roastLevel === "medium") {
    const jokes = filterListForRoast(agg.runningJokes, roastLevel, noGoTopics)
      .slice(0, 2)
      .map((t) => truncateText(t, 60));
    if (jokes.length) compact.runningGags = jokes;
  } else {
    const jokes = filterListForRoast(agg.runningJokes, roastLevel, noGoTopics)
      .slice(0, 2)
      .map((t) => truncateText(t, 60));
    const roasts = filterListForRoast(agg.harmlessRoasts, roastLevel, noGoTopics)
      .slice(0, 2)
      .map((t) => truncateText(t, 60));
    if (jokes.length) compact.runningGags = jokes;
    if (roasts.length) compact.harmlessRoasts = roasts;
  }

  if (!compact.nicknames && !compact.runningGags && !compact.typicalMoments && !compact.harmlessRoasts && !compact.oneLiners) {
    return null;
  }

  return compact;
}

function buildPersonalLocalComment({
  eventType,
  playerName,
  bundle,
  sessionStats = null,
  random = Math.random(),
}) {
  if (!bundle || !playerName) return null;

  const { roastLevel, noGoTopics } = bundle.targetPlayerCommentatorSettings;
  const agg = bundle.aggregated;
  const nickname = pickUsableFromList(agg.suggestedNicknames, noGoTopics, random);
  const runningJoke = pickUsableFromList(agg.runningJokes, noGoTopics, random);
  const typicalMoment = pickUsableFromList(agg.typicalMoments, noGoTopics, random);
  const harmlessRoast = pickUsableFromList(agg.harmlessRoasts, noGoTopics, random);
  const oneLiner = pickUsableFromList(agg.oneLiners, noGoTopics, random);

  const candidates = [];

  if (eventType === "PLAYER_PUNISHED") {
    if (roastLevel === "mild") {
      if (typicalMoment) candidates.push(`${playerName} muss trinken. ${typicalMoment}`);
      if (oneLiner) candidates.push(`${playerName} trinkt — ${oneLiner}`);
    }
    if (roastLevel === "medium") {
      if (runningJoke && nickname) {
        candidates.push(
          `${playerName} musste schon wieder trinken. Die ${nickname}-Verwandlung schreitet voran.`
        );
      }
      if (runningJoke) {
        candidates.push(`${playerName} musste schon wieder trinken. ${runningJoke}`);
      }
      if (nickname) {
        candidates.push(`${playerName} trinkt — ${nickname} meldet sich zu Wort.`);
      }
    }
    if (roastLevel === "hard") {
      if (harmlessRoast) candidates.push(`${playerName} trinkt wieder. ${harmlessRoast}`);
      if (runningJoke) candidates.push(`${playerName} musste schon wieder trinken. ${runningJoke}`);
    }
    if (roastLevel === "no_boundaries") {
      if (harmlessRoast) candidates.push(`${playerName}. ${harmlessRoast}`);
      if (runningJoke) candidates.push(`${playerName} trinkt — ${runningJoke}`);
      if (oneLiner) candidates.push(`${playerName} trinkt. ${oneLiner}`);
    }
  }

  if (eventType === "VOTE_REJECTED") {
    if (roastLevel === "mild" && oneLiner) {
      candidates.push(`${playerName} verliert die Abstimmung. ${oneLiner}`);
    }
    if (roastLevel === "medium" && runningJoke) {
      candidates.push(`${playerName} scheitert wieder — ${runningJoke}`);
    }
    if ((roastLevel === "hard" || roastLevel === "no_boundaries") && harmlessRoast) {
      candidates.push(`${playerName} verliert die Vote. ${harmlessRoast}`);
    }
  }

  if (eventType === "TRAP_DRAWN" || eventType === "TRAP_REPLACED") {
    const traps = sessionStats?.players?.[playerName]?.trapsDrawn ?? 0;
    if (roastLevel === "mild" && typicalMoment) {
      candidates.push(`${playerName} zieht eine Falle. ${typicalMoment}`);
    }
    if (roastLevel === "medium" && runningJoke) {
      candidates.push(`${playerName} und Fallen — ${runningJoke}`);
    }
    if (traps >= 2 && nickname) {
      candidates.push(`${playerName} zieht schon wieder eine Falle. ${nickname} lässt grüßen.`);
    }
  }

  if (eventType === "GAME_ENDED") {
    if (roastLevel === "mild" && oneLiner) {
      candidates.push(`Session vorbei — ${playerName}: ${oneLiner}`);
    }
    if (roastLevel === "medium" && runningJoke) {
      candidates.push(`Abschluss für ${playerName}. ${runningJoke}`);
    }
    if ((roastLevel === "hard" || roastLevel === "no_boundaries") && harmlessRoast) {
      candidates.push(`${playerName} geht als Legende. ${harmlessRoast}`);
    }
  }

  const viable = candidates
    .map((text) => truncateText(text))
    .filter(
      (text) =>
        text &&
        text.length <= MAX_COMMENT_LENGTH &&
        !topicMatchesNoGo(text, noGoTopics)
    );

  return pickRandom(viable, random);
}

function buildPersonalAwardComment({
  playerName,
  awardTitle,
  bundle,
  random = Math.random(),
}) {
  if (!bundle || !playerName || !awardTitle) return null;

  const { roastLevel, noGoTopics } = bundle.targetPlayerCommentatorSettings;
  const agg = bundle.aggregated;
  const nickname = pickUsableFromList(agg.suggestedNicknames, noGoTopics, random);
  const runningJoke = pickUsableFromList(agg.runningJokes, noGoTopics, random);
  const harmlessRoast = pickUsableFromList(agg.harmlessRoasts, noGoTopics, random);
  const oneLiner = pickUsableFromList(agg.oneLiners, noGoTopics, random);

  const candidates = [];

  if (roastLevel === "medium" && nickname && runningJoke) {
    candidates.push(
      `${playerName} — ${awardTitle}. Die ${nickname}-Verwandlung war legendär.`
    );
  }
  if (runningJoke) {
    candidates.push(`${playerName} holt ${awardTitle}. ${runningJoke}`);
  }
  if (oneLiner) {
    candidates.push(`${awardTitle} für ${playerName}: ${oneLiner}`);
  }
  if (nickname) {
    candidates.push(`${nickname}, alias ${playerName}, krönt sich als ${awardTitle}.`);
  }
  if ((roastLevel === "hard" || roastLevel === "no_boundaries") && harmlessRoast) {
    candidates.push(`${playerName} gewinnt ${awardTitle}. ${harmlessRoast}`);
  }

  const viable = candidates
    .map((text) => truncateText(text))
    .filter(
      (text) =>
        text &&
        text.length <= MAX_COMMENT_LENGTH &&
        !topicMatchesNoGo(text, noGoTopics)
    );

  return pickRandom(viable, random);
}

function resolvePersonalityForComment({
  commentatorPersonality,
  players,
  targetPlayerName,
  eventType,
  context = {},
  sessionStats = null,
  random = Math.random(),
}) {
  const bundle = buildPersonalityContextBundle({
    personality: commentatorPersonality,
    players,
    targetPlayerName,
  });

  const enrichedContext = enrichEventContext(context, bundle);
  let personalComment = null;

  if (
    bundle &&
    shouldAttemptPersonalComment({
      eventType,
      playerName: targetPlayerName,
      sessionStats,
      bundle,
      random,
    })
  ) {
    personalComment = buildPersonalLocalComment({
      eventType,
      playerName: targetPlayerName,
      bundle,
      sessionStats,
      random,
    });
  }

  return {
    bundle,
    enrichedContext,
    personalComment,
    personalityForAi: compactPersonalityForAi(bundle),
  };
}

module.exports = {
  PERSONAL_ELIGIBLE_EVENTS,
  buildPersonalityContextBundle,
  enrichEventContext,
  compactPersonalityForAi,
  shouldAttemptPersonalComment,
  buildPersonalLocalComment,
  buildPersonalAwardComment,
  resolvePersonalityForComment,
  getPersonalCommentChance,
  isStatHighlight,
};
