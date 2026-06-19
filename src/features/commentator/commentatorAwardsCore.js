/** Session-Awards aus Kommentator-Statistiken (Node-testbar). */

const {
  buildPersonalityContextBundle,
  buildPersonalAwardComment,
} = require("./commentatorPersonalityCommentCore.js");

const AWARD_IDS = {
  LUCKY_STAR: "lucky_star",
  TRAP_MAGNET: "trap_magnet",
  VOTE_KING: "vote_king",
  MOST_PUNISHED: "most_punished",
  MONSTER_MVP: "monster_mvp",
  DRAMA: "drama",
};

const AWARD_DEFINITIONS = [
  {
    id: AWARD_IDS.LUCKY_STAR,
    title: "Glückspilz",
    emoji: "🍀",
    minValue: 1,
    metric: (p) => Math.max(0, (p.votesWon ?? 0) - (p.votesLost ?? 0)) + (p.votesWon > 0 ? 1 : 0),
  },
  {
    id: AWARD_IDS.TRAP_MAGNET,
    title: "Fallenmagnet",
    emoji: "🪤",
    minValue: 1,
    metric: (p) => p.trapsDrawn ?? 0,
  },
  {
    id: AWARD_IDS.VOTE_KING,
    title: "König der Abstimmungen",
    emoji: "👑",
    minValue: 1,
    metric: (p) => p.votesWon ?? 0,
  },
  {
    id: AWARD_IDS.MOST_PUNISHED,
    title: "Meistbestrafter",
    emoji: "🍻",
    minValue: 1,
    metric: (p) => p.drinksReceived ?? 0,
  },
  {
    id: AWARD_IDS.MONSTER_MVP,
    title: "Monster-MVP",
    emoji: "👹",
    minValue: 1,
    metric: (p) => p.monsterEffectsUsed ?? 0,
  },
  {
    id: AWARD_IDS.DRAMA,
    title: "Drama des Abends",
    emoji: "🎭",
    minValue: 2,
    metric: (p) =>
      (p.votesLost ?? 0) * 2 + (p.drinksReceived ?? 0) + (p.trapsDrawn ?? 0),
  },
];

const AWARD_COMMENTS = {
  neutral: {
    lucky_star: ["{playerName} ist der Glückspilz der Session.", "{playerName} hatte heute die meiste Glücksfügung."],
    trap_magnet: ["{playerName} zog {value} Fallen — Fallenmagnet.", "{playerName} und Fallen — eine enge Freundschaft."],
    vote_king: ["{playerName} gewann {value} Abstimmungen.", "{playerName} — König der Abstimmungen."],
    most_punished: ["{playerName} trank {value}×.", "{playerName} war am meisten betroffen."],
    monster_mvp: ["{playerName} nutzte das Monster {value}×.", "{playerName} — Monster-MVP."],
    drama: ["{playerName} lieferte das Drama des Abends.", "{playerName} sorgte für die meiste Action."],
  },
  locker: {
    lucky_star: ["{playerName} ist der Glückspilz des Abends!", "Dem {playerName} läuft's — klarer Glückspilz."],
    trap_magnet: ["{playerName} zieht Fallen wie andere Luft holen ({value}×).", "Fallenmagnet: {playerName}."],
    vote_king: ["{playerName} regiert die Abstimmungen ({value} Siege).", "König der Votes: {playerName}!"],
    most_punished: ["{playerName} trinkt am häufigsten ({value}×). Respekt.", "Meistbestraft: {playerName}."],
    monster_mvp: ["{playerName} schickt das Monster öfter als alle ({value}×).", "Monster-MVP: {playerName}!"],
    drama: ["{playerName} liefert das Drama des Abends.", "Hauptdarsteller: {playerName}."],
  },
  chaotic: {
    lucky_star: ["{playerName} hat das Schicksal bestochen.", "Glückspilz {playerName} — unfair gut."],
    trap_magnet: ["{playerName} und Fallen — {value} Kapitel Chaos.", "Fallenmagnet {playerName} — das Universum lacht."],
    vote_king: ["{playerName} gewinnt {value} Votes. Demokratie? Eher Monarchie.", "Vote-König {playerName}."],
    most_punished: ["{playerName} trinkt {value}×. Legendär.", "Meistbestraft: {playerName} — Held des Abends."],
    monster_mvp: ["{playerName} entfesselt Monster {value}×.", "Monster-MVP {playerName} — zerstörerisch."],
    drama: ["{playerName} IST das Drama.", "Drama-Level: {playerName}."],
  },
  anime: {
    lucky_star: ["{playerName} trägt die Aura des Siegers!", "Glückspilz {playerName} — das Schicksal wählt dich!"],
    trap_magnet: ["{playerName} beschwört Fallen ({value}×)!", "Fallenmagnet {playerName} — Vorsicht!"],
    vote_king: ["{playerName} dominiert die Abstimmungen ({value} Siege)!", "König der Votes: {playerName}!"],
    most_punished: ["{playerName} zahlt {value}× den Preis!", "Meistbestraft: {playerName} — epische Niederlagen."],
    monster_mvp: ["{playerName} aktiviert Monstermacht {value}×!", "Monster-MVP {playerName}!"],
    drama: ["{playerName} liefert das Drama des finalen Akts!", "Drama des Abends: {playerName}!"],
  },
  tavern: {
    lucky_star: ["{playerName} hat heute Glück am Tresen.", "Glückspilz {playerName} — der Wirt nickt."],
    trap_magnet: ["{playerName} zieht Fallen wie Bier bestellt ({value}×).", "Fallenmagnet: {playerName}."],
    vote_king: ["{playerName} gewinnt {value} Runden am Tresen.", "König der Abstimmungen: {playerName}."],
    most_punished: ["{playerName} trinkt {value}× — Stammgast.", "Meistbestraft: {playerName}."],
    monster_mvp: ["{playerName} schickt das Monster {value}× los.", "Monster-MVP: {playerName}."],
    drama: ["{playerName} liefert die Story des Abends.", "Drama des Abends: {playerName}."],
  },
};

const SESSION_INTRO = {
  neutral: "Session beendet. Hier die Auszeichnungen:",
  locker: "Das war's für heute! Der Kommentator kürt die Helden des Abends:",
  chaotic: "Die Session ist vorbei — Zeit für die Chaos-Awards!",
  anime: "Finale Phase! Die Awards des Abends werden verkündet!",
  tavern: "Letzte Runde am Tresen — Zeit für die Auszeichnungen!",
};

function formatTemplate(template, context = {}) {
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    const value = context[key];
    return value != null && value !== "" ? String(value) : "";
  });
}

function pickRandom(items) {
  if (!items?.length) return null;
  return items[Math.floor(Math.random() * items.length)];
}

function pickWinner(players, metricFn, minValue) {
  let bestName = null;
  let bestValue = -1;

  for (const [name, stats] of Object.entries(players || {})) {
    const value = metricFn(stats || {});
    if (value >= minValue && value > bestValue) {
      bestValue = value;
      bestName = name;
    }
  }

  if (!bestName) return null;
  return { playerName: bestName, value: bestValue };
}

function getAwardComment(awardId, winner, style = "locker", options = {}) {
  const { commentatorPersonality, players, random = Math.random() } = options;

  if (commentatorPersonality && players?.length && random < 0.35) {
    const def = AWARD_DEFINITIONS.find((item) => item.id === awardId);
    const bundle = buildPersonalityContextBundle({
      personality: commentatorPersonality,
      players,
      targetPlayerName: winner.playerName,
    });
    if (bundle) {
      const personal = buildPersonalAwardComment({
        playerName: winner.playerName,
        awardTitle: def?.title ?? "Award",
        bundle,
        random,
      });
      if (personal) return personal;
    }
  }

  const pool = AWARD_COMMENTS[style]?.[awardId] || AWARD_COMMENTS.locker[awardId];
  const template = pickRandom(pool);
  if (!template) return null;
  return formatTemplate(template, {
    playerName: winner.playerName,
    value: winner.value,
  });
}

function getSessionIntro(style = "locker") {
  return SESSION_INTRO[style] || SESSION_INTRO.locker;
}

function hasSessionActivity(sessionStats) {
  const players = sessionStats?.players ?? {};
  for (const stats of Object.values(players)) {
    if (!stats) continue;
    if (
      stats.drinksReceived > 0 ||
      stats.drinksGiven > 0 ||
      stats.votesWon > 0 ||
      stats.votesLost > 0 ||
      stats.trapsDrawn > 0 ||
      stats.magicCardsPlayed > 0 ||
      stats.monsterEffectsUsed > 0
    ) {
      return true;
    }
  }
  return false;
}

function computeSessionAwards(sessionStats, style = "locker", options = {}) {
  const players = sessionStats?.players ?? {};
  const awards = [];

  for (const def of AWARD_DEFINITIONS) {
    const winner = pickWinner(players, def.metric, def.minValue);
    if (!winner) continue;

    awards.push({
      id: def.id,
      title: def.title,
      emoji: def.emoji,
      playerName: winner.playerName,
      value: winner.value,
      comment: getAwardComment(def.id, winner, style, options),
    });
  }

  return awards;
}

module.exports = {
  AWARD_IDS,
  AWARD_DEFINITIONS,
  computeSessionAwards,
  getAwardComment,
  getSessionIntro,
  hasSessionActivity,
};
