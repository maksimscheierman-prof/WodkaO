/**
 * Erkennt Kommentator-Events aus Lobby-Zustandsübergängen (Node-testbar).
 */

const GAME_PHASE_PLAYING = "playing";
const GAME_PHASE_DRAWING_MONSTERS = "drawingMonsters";

function cardLabel(card) {
  if (!card) return null;
  return card.name || card.title || null;
}

function normalizeCardType(type) {
  return String(type || "magic").toLowerCase();
}

function drawEventType(cardType) {
  if (cardType === "magic") return "MAGIC_DRAWN";
  if (cardType === "trap") return "TRAP_DRAWN";
  if (cardType === "monster") return "MONSTER_DRAWN";
  return "CARD_DRAWN";
}

/**
 * @param {object|null} prev — vorheriger Lobby-Snapshot
 * @param {object|null} next — aktueller Lobby-Snapshot
 * @returns {Array<{ type: string, context: object }>}
 */
function detectCommentatorEvents(prev, next) {
  const events = [];
  if (!prev || !next) return events;

  const activePlayer = next.players?.[next.turn ?? 0]?.name ?? null;
  const prevRound = prev.round ?? 1;
  const nextRound = next.round ?? 1;

  if (prev.gamePhase !== GAME_PHASE_PLAYING && next.gamePhase === GAME_PHASE_PLAYING) {
    events.push({
      type: "GAME_STARTED",
      context: {
        playerCount: (next.players || []).length,
      },
    });
  }

  if (nextRound > prevRound && next.gamePhase === GAME_PHASE_PLAYING) {
    events.push({
      type: "ROUND_STARTED",
      context: { round: nextRound },
    });
    events.push({
      type: "MONSTER_EFFECT_ENABLED",
      context: { round: nextRound },
    });
  }

  const prevMagicLabel = cardLabel(prev.lastMagic);
  const nextMagicLabel = cardLabel(next.lastMagic);
  if (nextMagicLabel && nextMagicLabel !== prevMagicLabel) {
    const cardType = normalizeCardType(next.lastMagic?.type);
    events.push({
      type: drawEventType(cardType),
      context: {
        playerName: activePlayer,
        cardName: nextMagicLabel,
        cardType,
      },
    });
  }

  if (!prev.pendingTrapChoice && next.pendingTrapChoice) {
    const pending = next.pendingTrapChoice;
    const trapName =
      cardLabel(pending.newTrap) || cardLabel(pending.drawnTrap) || "Falle";
    events.push({
      type: "TRAP_DRAWN",
      context: {
        playerName: pending.playerKey ?? activePlayer,
        cardName: trapName,
        cardType: "trap",
      },
    });
  }

  if (prev.pendingTrapChoice && !next.pendingTrapChoice) {
    const pending = prev.pendingTrapChoice;
    const playerName = pending.playerKey;
    const nextPlayer = (next.players || []).find((p) => p.name === playerName);
    const keptLabel = cardLabel(nextPlayer?.trap);
    const newTrapLabel = cardLabel(pending.drawnTrap);
    if (playerName && keptLabel && newTrapLabel && keptLabel === newTrapLabel) {
      const prevPlayer = (prev.players || []).find((p) => p.name === playerName);
      const oldTrapLabel =
        cardLabel(prevPlayer?.trap) || cardLabel(pending.existingTrap);
      events.push({
        type: "TRAP_REPLACED",
        context: {
          playerName,
          cardName: keptLabel,
          oldCardName: oldTrapLabel || "alte Falle",
          cardType: "trap",
        },
      });
    }
  }

  for (const player of next.players || []) {
    const prevPlayer = (prev.players || []).find((p) => p.name === player.name);
    const prevTrap = cardLabel(prevPlayer?.trap);
    const nextTrap = cardLabel(player.trap);
    if (
      nextTrap &&
      nextTrap !== prevTrap &&
      !next.pendingTrapChoice &&
      !prev.pendingTrapChoice &&
      next.gamePhase === GAME_PHASE_PLAYING
    ) {
      events.push({
        type: "TRAP_DRAWN",
        context: {
          playerName: player.name,
          cardName: nextTrap,
          cardType: "trap",
        },
      });
    }
  }

  const inMonsterSetup =
    next.gamePhase === GAME_PHASE_DRAWING_MONSTERS ||
    prev.gamePhase === GAME_PHASE_DRAWING_MONSTERS;

  if (inMonsterSetup) {
    for (const player of next.players || []) {
      const prevPlayer = (prev.players || []).find((p) => p.name === player.name);
      const prevMonster = cardLabel(prevPlayer?.monster);
      const nextMonster = cardLabel(player.monster);
      if (nextMonster && nextMonster !== prevMonster) {
        events.push({
          type: "MONSTER_DRAWN",
          context: {
            playerName: player.name,
            cardName: nextMonster,
            cardType: "monster",
          },
        });
      }
    }
  }

  if (!prev.activeEffect && next.activeEffect) {
    const card = next.activeEffect.card;
    events.push({
      type: "EFFECT_SELECTED",
      context: {
        playerName: next.activeEffect.player,
        cardName: cardLabel(card) || "Effekt",
        cardType: normalizeCardType(card?.type),
      },
    });
  }

  if (!prev.votingOpen && next.votingOpen && next.activeEffect) {
    const card = next.activeEffect.card;
    events.push({
      type: "VOTE_STARTED",
      context: {
        playerName: next.activeEffect.player,
        cardName: cardLabel(card) || "Effekt",
        cardType: normalizeCardType(card?.type),
      },
    });
  }

  if (!prev.voteResult && next.voteResult && next.resolvedEffect) {
    const resolved = next.resolvedEffect;
    const card = resolved.card;
    const context = {
      playerName: resolved.player,
      cardName: cardLabel(card) || "Effekt",
      cardType: normalizeCardType(card?.type),
    };
    const tie = String(next.voteResult).includes("Gleichstand");
    if (resolved.approved) {
      events.push({ type: "VOTE_ACCEPTED", context });
    } else if (!tie) {
      events.push({ type: "VOTE_REJECTED", context });
    }
  }

  if (!prev.showMagic && next.showMagic && next.lastMagic) {
    events.push({
      type: "MAGIC_PLAYED",
      context: {
        playerName: activePlayer,
        cardName: cardLabel(next.lastMagic) || "Magiekarte",
        cardType: "magic",
      },
    });
  }

  const voteRejectDrinkPlayer =
    !prev.voteResult && next.voteResult && next.resolvedEffect && !next.resolvedEffect.approved
      ? next.resolvedEffect.player
      : null;

  for (const player of next.players || []) {
    const prevPlayer = (prev.players || []).find((p) => p.name === player.name);
    const prevShots = prevPlayer?.shots ?? 0;
    const nextShots = player.shots ?? 0;
    if (nextShots <= prevShots) continue;

    const delta = nextShots - prevShots;
    const isVoteRejectDrink = player.name === voteRejectDrinkPlayer;
    const turnPlayer = next.players?.[next.turn ?? 0]?.name ?? null;

    events.push({
      type: "PLAYER_PUNISHED",
      context: {
        playerName: player.name,
        delta,
        reason: isVoteRejectDrink ? "vote_rejected" : "other",
        givenBy:
          !isVoteRejectDrink && turnPlayer && turnPlayer !== player.name
            ? turnPlayer
            : null,
      },
    });
  }

  const prevMonsterUsed = prev.effectsUsed?.monster || {};
  const nextMonsterUsed = next.effectsUsed?.monster || {};
  const round = next.round ?? 1;
  for (const [playerName, usedRound] of Object.entries(nextMonsterUsed)) {
    if (usedRound === round && prevMonsterUsed[playerName] !== round) {
      events.push({
        type: "MONSTER_EFFECT_DISABLED",
        context: { playerName },
      });
    }
  }

  return events;
}

module.exports = {
  detectCommentatorEvents,
  drawEventType,
};
