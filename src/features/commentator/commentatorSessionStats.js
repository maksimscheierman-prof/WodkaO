/**
 * Session-Statistiken für den Kommentator (nur laufende Partie, kein Persist).
 */

const SESSION_STAT_REMARK_CHANCE = 0.38;

const SESSION_STAT_REMARKS = {
  neutral: {
    trap_repeat: [
      "{playerName} zieht bereits die {count}. Falle in dieser Session.",
      "Wieder eine Falle für {playerName} — insgesamt {count}.",
    ],
    vote_streak: [
      "{playerName} gewinnt erneut eine Abstimmung ({count}×).",
      "{playerName} dominiert die Votes mit {count} Siegen.",
    ],
    lucky: [
      "{playerName} hatte bisher auffällig viel Erfolg.",
      "{playerName} scheint heute oft im Recht zu liegen.",
    ],
    drink_magnet: [
      "{playerName} musste in dieser Session schon {count}× trinken.",
    ],
    monster_regular: [
      "{playerName} setzt das Monster zum {count}. Mal ein.",
    ],
  },
  locker: {
    trap_repeat: [
      "{playerName} zieht schon wieder eine Falle. Das wird verdächtig.",
      "Falle Nr. {count} für {playerName} — jemand mag Fallen.",
    ],
    vote_streak: [
      "{playerName} gewinnt heute jede Abstimmung. Fast schon unfair.",
      "Vote-Sieg Nr. {count} für {playerName}!",
    ],
    lucky: [
      "{playerName} scheint Glück gepachtet zu haben.",
      "{playerName} läuft heute wie am Schnürchen.",
    ],
    drink_magnet: [
      "{playerName} trinkt schon wieder. Zähler: {count}.",
    ],
    monster_regular: [
      "{playerName} schickt das Monster schon wieder los ({count}×).",
    ],
  },
  chaotic: {
    trap_repeat: [
      "{playerName} und Fallen — eine Liebesgeschichte. Kapitel {count}.",
      "Schon wieder eine Falle für {playerName}. Das Universum grinst.",
    ],
    vote_streak: [
      "{playerName} gewinnt schon wieder. Das ist kein Zufall mehr ({count}×).",
      "Demokratie? {playerName} macht, was {playerName} will ({count} Siege).",
    ],
    lucky: [
      "{playerName} hat offenbar mit dem Schicksal einen Deal.",
      "Pech für alle außer {playerName}. Glücksrad kaputt?",
    ],
    drink_magnet: [
      "{playerName} trinkt zum {count}. Mal. Der Abend eskaliert.",
    ],
    monster_regular: [
      "{playerName} entfesselt Chaos — Monstereinsatz Nr. {count}.",
    ],
  },
  anime: {
    trap_repeat: [
      "{playerName} beschwört erneut eine Falle! ({count}. Mal)!",
      "Fallenkarte Nr. {count} für {playerName} — das Schicksal winkt!",
    ],
    vote_streak: [
      "{playerName} gewinnt das Duell der Stimmen! ({count} Siege!)",
      "Erneuter Triumph für {playerName}! Vote-Sieg {count}!",
    ],
    lucky: [
      "{playerName} trägt das Aura des Siegers!",
      "Die Macht ist mit {playerName} — bisher unschlagbar!",
    ],
    drink_magnet: [
      "{playerName} zahlt den Preis der Niederlage ({count}×)!",
    ],
    monster_regular: [
      "{playerName} aktiviert die Monstermacht zum {count}. Mal!",
    ],
  },
  tavern: {
    trap_repeat: [
      "{playerName} zieht schon wieder eine Falle. Der Wirt notiert mit.",
      "Falle {count} für {playerName}. Der Abend wird lauter.",
    ],
    vote_streak: [
      "{playerName} gewinnt schon wieder die Runde am Tresen ({count}×).",
      "Die Stammgäste stimmen für {playerName} — Sieg Nr. {count}.",
    ],
    lucky: [
      "{playerName} hat heute den besten Platz am Tisch.",
      "Dem {playerName} läuft's — Glück oder gutes Bier?",
    ],
    drink_magnet: [
      "{playerName} setzt schon wieder an. Schluck {count}.",
    ],
    monster_regular: [
      "{playerName} schickt das Monster los — zum {count}. Mal heute.",
    ],
  },
};

function createEmptyPlayerStats() {
  return {
    drinksReceived: 0,
    drinksGiven: 0,
    votesWon: 0,
    votesLost: 0,
    trapsDrawn: 0,
    magicCardsPlayed: 0,
    monsterEffectsUsed: 0,
  };
}

function createSessionStats(playerNames = []) {
  const players = {};
  for (const name of playerNames) {
    if (name) players[name] = createEmptyPlayerStats();
  }
  return { players };
}

function resetSessionStats(stats, playerNames = []) {
  stats.players = {};
  for (const name of playerNames) {
    if (name) stats.players[name] = createEmptyPlayerStats();
  }
}

function ensurePlayer(stats, playerName) {
  if (!stats.players[playerName]) {
    stats.players[playerName] = createEmptyPlayerStats();
  }
  return stats.players[playerName];
}

function pickRandom(items) {
  if (!items?.length) return null;
  return items[Math.floor(Math.random() * items.length)];
}

function formatTemplate(template, context = {}) {
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    const value = context[key];
    return value != null && value !== "" ? String(value) : "";
  });
}

function applyEventToSessionStats(stats, event) {
  if (!stats || !event?.type) return;
  const { type, context = {} } = event;
  const playerName = context.playerName;
  if (!playerName) return;

  const player = ensurePlayer(stats, playerName);
  const delta = context.delta ?? 1;

  switch (type) {
    case "TRAP_DRAWN":
      player.trapsDrawn += 1;
      break;
    case "VOTE_ACCEPTED":
      player.votesWon += 1;
      break;
    case "VOTE_REJECTED":
      player.votesLost += 1;
      break;
    case "MONSTER_EFFECT_DISABLED":
      player.monsterEffectsUsed += 1;
      break;
    case "MAGIC_PLAYED":
      player.magicCardsPlayed += 1;
      break;
    case "PLAYER_PUNISHED":
      player.drinksReceived += delta;
      if (context.givenBy && context.givenBy !== playerName) {
        ensurePlayer(stats, context.givenBy).drinksGiven += delta;
      }
      break;
    default:
      break;
  }
}

function applyEventsToSessionStats(stats, events = []) {
  for (const event of events) {
    applyEventToSessionStats(stats, event);
  }
}

function resolveRemarkStyle(style) {
  return SESSION_STAT_REMARKS[style] || SESSION_STAT_REMARKS.locker;
}

/**
 * Liefert optional einen Statistik-Spruch passend zum Event (Zufall + Schwellwert).
 */
function getSessionStatRemark(eventType, context, stats, style = "locker") {
  if (!stats?.players || Math.random() > SESSION_STAT_REMARK_CHANCE) return null;

  const playerName = context?.playerName;
  if (!playerName) return null;

  const player = stats.players[playerName];
  if (!player) return null;

  const templates = resolveRemarkStyle(style);
  let pool = null;
  let formatContext = { playerName, count: 0 };

  if (eventType === "TRAP_DRAWN" && player.trapsDrawn >= 2) {
    pool = templates.trap_repeat;
    formatContext.count = player.trapsDrawn;
  } else if (eventType === "VOTE_ACCEPTED" && player.votesWon >= 2) {
    pool =
      player.votesLost === 0 && Math.random() < 0.45
        ? templates.lucky
        : templates.vote_streak;
    formatContext.count = player.votesWon;
  } else if (eventType === "PLAYER_PUNISHED" && player.drinksReceived >= 2) {
    pool = templates.drink_magnet;
    formatContext.count = player.drinksReceived;
  } else if (eventType === "MONSTER_EFFECT_DISABLED" && player.monsterEffectsUsed >= 2) {
    pool = templates.monster_regular;
    formatContext.count = player.monsterEffectsUsed;
  }

  const template = pickRandom(pool);
  if (!template) return null;

  const text = formatTemplate(template, formatContext).replace(/\s+/g, " ").trim();
  return text || null;
}

function getPlayerSessionStats(stats, playerName) {
  return stats?.players?.[playerName] ?? createEmptyPlayerStats();
}

module.exports = {
  SESSION_STAT_REMARK_CHANCE,
  createEmptyPlayerStats,
  createSessionStats,
  resetSessionStats,
  applyEventToSessionStats,
  applyEventsToSessionStats,
  getSessionStatRemark,
  getPlayerSessionStats,
};
