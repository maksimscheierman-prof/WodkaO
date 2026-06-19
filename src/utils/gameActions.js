import { updateDoc } from "firebase/firestore";
import { applyApprovedEffectUsage, canActivateMonsterEffect } from "./effectsUsedCore";
import { GAME_PHASES } from "../config/gamePhases";
import { EMPTY_TIMER_STARTS } from "../config/timers";
import { drawTopCard } from "./gameLogic";
import { withActivity } from "./lobbyLifecycle";

const PHASE_RESET = {
  activeEffect: null,
  votingOpen: false,
  votes: { ja: [], nein: [] },
  voteResult: null,
  resolvedEffect: null,
  resultAcks: {},
  reactions: {},
  allReactionsDone: false,
  ...EMPTY_TIMER_STARTS,
};

function rollD6() {
  return Math.floor(Math.random() * 6) + 1;
}

function resolveDiceRolls(lobby, newRolls) {
  const eligible = lobby.rollingEligible || [];
  const max = Math.max(...eligible.map((n) => newRolls[n] ?? 0));
  const winners = eligible.filter((n) => newRolls[n] === max);

  if (winners.length === 1) {
    const winnerName = winners[0];
    const turn = Math.max(
      0,
      (lobby.players || []).findIndex((p) => p.name === winnerName)
    );
    return {
      diceRolls: newRolls,
      startPlayerName: winnerName,
      turn,
      gamePhase: GAME_PHASES.DRAWING_MONSTERS,
      rollingEligible: [],
    };
  }

  return {
    diceRolls: {},
    diceRound: (lobby.diceRound || 1) + 1,
    rollingEligible: winners,
    gamePhase: GAME_PHASES.RESOLVING_TIE,
  };
}

/* --------------------------------
 * Würfeln — Startspieler bestimmen
 * -------------------------------- */
export const handleRollDice = async (lobbyRef, lobby, playerName) => {
  const phase = lobby?.gamePhase;
  if (
    phase !== GAME_PHASES.ROLLING &&
    phase !== GAME_PHASES.RESOLVING_TIE
  ) {
    return;
  }

  const eligible = lobby.rollingEligible || [];
  if (!eligible.includes(playerName)) return;

  const rolls = { ...(lobby.diceRolls || {}) };
  if (rolls[playerName] != null) return;

  rolls[playerName] = rollD6();

  const allRolled = eligible.every((name) => rolls[name] != null);
  const updates = allRolled
    ? resolveDiceRolls(lobby, rolls)
    : { diceRolls: rolls };

  await updateDoc(lobbyRef, withActivity(updates));
};

/* --------------------------------
 * Monster ziehen (Startphase)
 * -------------------------------- */
export const handleDrawMonster = async (lobbyRef, lobby, playerName) => {
  if (lobby?.gamePhase !== GAME_PHASES.DRAWING_MONSTERS) return;

  const player = (lobby.players || []).find((p) => p.name === playerName);
  if (!player || player.monster) return;

  const { card, deck } = drawTopCard(lobby.monsterDeck);
  if (!card) return;

  const updatedPlayers = (lobby.players || []).map((p) =>
    p.name === playerName ? { ...p, monster: card } : p
  );

  const allHaveMonster = updatedPlayers.every((p) => p.monster);

  await updateDoc(
    lobbyRef,
    withActivity({
      players: updatedPlayers,
      monsterDeck: deck,
      ...(allHaveMonster
        ? {
            gamePhase: GAME_PHASES.PLAYING,
            round: 1,
            lastMagic: null,
            showMagic: false,
            ...PHASE_RESET,
          }
        : {}),
    })
  );
};

/* --------------------------------
 * Ziehen aus dem Saufstapel (Spielphase)
 * -------------------------------- */
export const handleDraw = async (lobbyRef, lobby, setSelectedCard) => {
  if (lobby?.gamePhase !== GAME_PHASES.PLAYING) return;
  if (lobby?.lastMagic) return;

  try {
    const { card, deck } = drawTopCard(lobby.saufDeck);
    if (!card) return;

    const type = (card.type || "").toUpperCase();
    const activeIdx = lobby.turn ?? 0;
    const activePlayer = lobby.players?.[activeIdx];

    if (type === "MAGIC") {
      await updateDoc(
        lobbyRef,
        withActivity({
          saufDeck: deck,
          lastMagic: card,
          showMagic: false,
          ...PHASE_RESET,
        })
      );
      setSelectedCard({ ...card, type: "MAGIC" });
      return;
    }

    if (type === "TRAP" && activePlayer) {
      const discardPile = [...(lobby.discardPile || [])];
      if (activePlayer.trap) discardPile.push(activePlayer.trap);

      const updatedPlayers = (lobby.players || []).map((p) =>
        p.name === activePlayer.name ? { ...p, trap: card } : p
      );
      const nextTurn = (activeIdx + 1) % (lobby.players?.length || 1);
      const round =
        nextTurn === 0 ? (lobby.round || 1) + 1 : lobby.round || 1;

      await updateDoc(
        lobbyRef,
        withActivity({
          saufDeck: deck,
          discardPile,
          players: updatedPlayers,
          turn: nextTurn,
          round,
          lastMagic: null,
          showMagic: false,
          ...PHASE_RESET,
        })
      );
    }
  } catch (err) {
    console.error("[DRAW ERROR]", err);
  }
};

/* --------------------------------
 * Karte zeigen (Reaktionsphase starten)
 * -------------------------------- */
export const handleShow = async (lobbyRef, lobby) => {
  if (lobby?.gamePhase !== GAME_PHASES.PLAYING) return;
  if (!lobby?.lastMagic) return;

  const reactions = {};
  for (const p of lobby.players ?? []) reactions[p.name] = { done: false };

  await updateDoc(lobbyRef, {
    showMagic: true,
    reactions,
    allReactionsDone: false,
    activeEffect: null,
    votingOpen: false,
    votes: { ja: [], nein: [] },
    voteResult: null,
    resolvedEffect: null,
    resultAcks: {},
    reactionsStartedAt: Date.now(),
    votingStartedAt: null,
    resultStartedAt: null,
    discardStartedAt: null,
  });
};

/* --------------------------------
 * Magiekarte ablegen & nächster Spieler
 * -------------------------------- */
export const handleDiscard = async (lobbyRef, lobby) => {
  if (lobby?.gamePhase !== GAME_PHASES.PLAYING) return;

  try {
    const discardPile = [...(lobby.discardPile || []), lobby.lastMagic];
    const nextTurn = ((lobby.turn ?? 0) + 1) % (lobby.players?.length || 1);
    const round = nextTurn === 0 ? (lobby.round || 1) + 1 : lobby.round || 1;

    await updateDoc(
      lobbyRef,
      withActivity({
        discardPile,
        lastMagic: null,
        turn: nextTurn,
        round,
        showMagic: false,
        ...PHASE_RESET,
      })
    );
  } catch (err) {
    console.error("[DISCARD ERROR]", err);
  }
};

/* --------------------------------
 * Karte am Tisch ansehen (Presence / Denkblase)
 * -------------------------------- */
export const setViewingCard = async (lobbyRef, lobby, playerName, type) => {
  if (!lobbyRef || !lobby || !playerName || !type) {
    console.warn("[VIEWING CARD SET] skipped — missing args", {
      hasLobbyRef: !!lobbyRef,
      hasLobby: !!lobby,
      playerName,
      type,
    });
    return;
  }

  try {
    const updatedPlayers = (lobby.players || []).map((p) =>
      p.name === playerName
        ? { ...p, viewingCard: { type, startedAt: Date.now() } }
        : p
    );
    await updateDoc(lobbyRef, { players: updatedPlayers });
  } catch (err) {
    console.error("[VIEWING CARD SET]", err);
  }
};

export const clearViewingCard = async (lobbyRef, lobby, playerName) => {
  if (!lobbyRef || !lobby || !playerName) {
    console.warn("[VIEWING CARD CLEAR] skipped — missing args", {
      hasLobbyRef: !!lobbyRef,
      hasLobby: !!lobby,
      playerName,
    });
    return;
  }

  try {
    const updatedPlayers = (lobby.players || []).map((p) => {
      if (p.name !== playerName) return p;
      const next = { ...p };
      delete next.viewingCard;
      return next;
    });
    await updateDoc(lobbyRef, { players: updatedPlayers });
  } catch (err) {
    console.error("[VIEWING CARD CLEAR]", err);
  }
};

/* --------------------------------
 * Trinken (+1)
 * -------------------------------- */
export const handleDrink = async (lobbyRef, lobby, targetPlayerName) => {
  try {
    const updatedPlayers = (lobby.players || []).map((p) =>
      p.name === targetPlayerName ? { ...p, shots: (p.shots || 0) + 1 } : p
    );

    await updateDoc(lobbyRef, { players: updatedPlayers });
  } catch (err) {
    console.error("[DRINK ERROR]", err);
  }
};

/* --------------------------------
 * Effekt aktivieren (Monster / Falle)
 * -------------------------------- */
export const handleActivateEffect = async (lobbyRef, lobby, card, sourcePlayer) => {
  const cardType = (card?.type || "").toLowerCase();
  const currentRound = lobby?.round ?? 1;

  if (cardType === "monster") {
    if (!canActivateMonsterEffect(lobby?.effectsUsed, sourcePlayer, currentRound)) {
      console.warn(
        `[EFFECT] ${sourcePlayer} — Monster-Effekt in Runde ${currentRound} bereits genutzt`
      );
      return;
    }
  }

  try {
    await updateDoc(lobbyRef, {
      activeEffect: { player: sourcePlayer, card },
      votes: { ja: [], nein: [] },
      votingOpen: true,
      votingStartedAt: Date.now(),
    });
    console.log(
      `[EFFECT] ${sourcePlayer} aktiviert ${card?.name || card?.title}`
    );
  } catch (err) {
    console.error("[EFFECT ERROR]", err);
  }
};

/* --------------------------------
 * Abstimmung
 * -------------------------------- */
export const handleVote = async (lobbyRef, lobby, playerName, vote) => {
  if (!lobby?.activeEffect || !lobby?.votingOpen) return;

  try {
    const votes = lobby.votes || { ja: [], nein: [] };
    if (votes.ja.includes(playerName) || votes.nein.includes(playerName))
      return;

    const updatedVotes = {
      ja: vote === "ja" ? [...votes.ja, playerName] : votes.ja,
      nein: vote === "nein" ? [...votes.nein, playerName] : votes.nein,
    };
    await updateDoc(lobbyRef, { votes: updatedVotes });

    const total = lobby.players?.length || 0;
    if (updatedVotes.ja.length + updatedVotes.nein.length === total) {
      const ja = updatedVotes.ja.length;
      const nein = updatedVotes.nein.length;

      const eff = lobby.activeEffect;
      const cardType = (eff?.card?.type || "").toLowerCase();

      const updates = {
        votingOpen: false,
        activeEffect: null,
        votes: { ja: [], nein: [] },
        voteResult:
          ja > nein
            ? "✅ Effekt wurde bestätigt!"
            : ja < nein
              ? `❌ Effekt abgelehnt! ${eff.player} muss trinken 🍻`
              : "⚖️ Gleichstand – nix passiert.",
        resolvedEffect: {
          player: eff.player,
          card: eff.card,
          approved: ja > nein,
        },
        resultAcks: {},
        votingStartedAt: null,
        resultStartedAt: Date.now(),
      };

      if (ja > nein) {
        if (cardType === "trap") {
          updates.players = (lobby.players || []).map((p) =>
            p.name === eff.player ? { ...p, trap: null } : p
          );
        } else if (cardType === "monster") {
          updates.effectsUsed = applyApprovedEffectUsage(
            lobby.effectsUsed,
            eff.player,
            "monster",
            lobby.round ?? 1
          );
        }
      }

      if (nein > ja) {
        updates.players = (lobby.players || []).map((p) =>
          p.name === eff.player ? { ...p, shots: (p.shots || 0) + 1 } : p
        );
      }

      await updateDoc(lobbyRef, updates);
    }
  } catch (err) {
    console.error("[VOTE ERROR]", err);
  }
};

export const handleResultAck = async (lobbyRef, lobby, playerName) => {
  try {
    const acks = { ...(lobby.resultAcks || {}), [playerName]: true };
    const allAcked = (lobby.players || []).every((p) => !!acks[p.name]);

    const updates = { resultAcks: acks };
    if (allAcked) {
      updates.voteResult = null;
      updates.resolvedEffect = null;
      updates.resultAcks = {};
      updates.resultStartedAt = null;
    }

    await updateDoc(lobbyRef, updates);
  } catch (e) {
    console.error("[RESULT ACK ERROR]", e);
  }
};

export const handleCloseVoteResult = async (lobbyRef) => {
  try {
    await updateDoc(lobbyRef, {
      voteResult: null,
      resolvedEffect: null,
      resultAcks: {},
      resultStartedAt: null,
    });
  } catch (e) {
    console.error("[CLOSE VOTE RESULT ERROR]", e);
  }
};

export const handleReactionDone = async (lobbyRef, lobby, playerName) => {
  try {
    const reactions = lobby.reactions || {};
    if (reactions[playerName]?.done) return;

    const updatedReactions = { ...reactions, [playerName]: { done: true } };
    const othersDone =
      Object.values(updatedReactions).filter((r) => r?.done).length >=
      Math.max((lobby.players?.length || 0) - 1, 0);

    const updates = {
      reactions: updatedReactions,
      allReactionsDone: othersDone,
    };

    if (othersDone) updates.discardStartedAt = Date.now();

    await updateDoc(lobbyRef, updates);
  } catch (err) {
    console.error("[REACTION ERROR]", err);
  }
};
