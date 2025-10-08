// src/utils/gameActions.js
import { updateDoc } from "firebase/firestore";
import { EMPTY_TIMER_STARTS } from "../config/timers";
import { randomMagic } from "./gameLogic";

/* --------------------------------
 * Ziehen
 * -------------------------------- */
export const handleDraw = async (lobbyRef, setSelectedCard) => {
  try {
    const newMagic = await randomMagic();

    await updateDoc(lobbyRef, {
      lastMagic: newMagic,
      showMagic: false,
      // Vorsichtshalber alte Zustände leeren
      activeEffect: null,
      votingOpen: false,
      votes: { ja: [], nein: [] },
      voteResult: null,
      resolvedEffect: null,
      resultAcks: {},
      reactions: {},
      allReactionsDone: false,

      // ✅ Timer-Startpunkte zurücksetzen
      ...EMPTY_TIMER_STARTS,
    });

    // nur lokal: gezogene Magiekarte im Modal zeigen
    setSelectedCard({ ...newMagic, type: "MAGIC" });
  } catch (err) {
    console.error("[DRAW ERROR]", err);
  }
};

/* --------------------------------
 * Karte zeigen (Reaktionsphase starten)
 * -------------------------------- */
export const handleShow = async (lobbyRef, lobby) => {
  if (!lobby?.lastMagic) return;

  const reactions = {};
  for (const p of lobby.players ?? []) reactions[p.name] = { done: false };

  await updateDoc(lobbyRef, {
    showMagic: true,
    reactions,
    allReactionsDone: false,

    // Voting/Ergebnis sauber resetten
    activeEffect: null,
    votingOpen: false,
    votes: { ja: [], nein: [] },
    voteResult: null,
    resolvedEffect: null,
    resultAcks: {},

    // ✅ Timer setzen
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
  try {
    const discardPile = [...(lobby.discardPile || []), lobby.lastMagic];
    const nextTurn = ((lobby.turn ?? 0) + 1) % (lobby.players?.length || 1);
    const round = nextTurn === 0 ? (lobby.round || 1) + 1 : lobby.round || 1;

    await updateDoc(lobbyRef, {
      discardPile,
      lastMagic: null,
      turn: nextTurn,
      round,
      showMagic: false,

      // Phase-States zurücksetzen
      activeEffect: null,
      votingOpen: false,
      votes: { ja: [], nein: [] },
      voteResult: null,
      resolvedEffect: null,
      resultAcks: {},
      reactions: {},
      allReactionsDone: false,

      // ✅ Timer beenden
      reactionsStartedAt: null,
      votingStartedAt: null,
      resultStartedAt: null,
      discardStartedAt: null,
    });
  } catch (err) {
    console.error("[DISCARD ERROR]", err);
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
export const handleActivateEffect = async (lobbyRef, card, sourcePlayer) => {
  try {
    await updateDoc(lobbyRef, {
      activeEffect: { player: sourcePlayer, card },
      votes: { ja: [], nein: [] },
      votingOpen: true,

      // ✅ Voting-Timer starten
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

      const eff = lobby.activeEffect; // { player, card }
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
        resultAcks: {}, // ACK-Map initialisieren

        // ✅ Voting-Timer stoppen, Ergebnis-Timer starten
        votingStartedAt: null,
        resultStartedAt: Date.now(),
      };

      // Konsequenzen bei bestätigtem Effekt
      if (ja > nein) {
        if (cardType === "trap") {
          // Falle verbrauchen
          updates.players = (lobby.players || []).map((p) =>
            p.name === eff.player ? { ...p, trap: null } : p
          );
        } else if (cardType === "monster") {
          // Monster in dieser Runde markiert
          updates.effectsUsed = {
            ...(lobby.effectsUsed || {}),
            [eff.player]: {
              ...(lobby.effectsUsed?.[eff.player] || {}),
              monster: true,
            },
          };
        }
      }

      // Konsequenz bei abgelehntem Effekt
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

/* --------------------------------
 * Ergebnis-ACK: Spieler klickt "OK"
 * Overlay bleibt, bis ALLE bestätigt haben
 * -------------------------------- */
export const handleResultAck = async (lobbyRef, lobby, playerName) => {
  try {
    const acks = { ...(lobby.resultAcks || {}), [playerName]: true };
    const allAcked = (lobby.players || []).every((p) => !!acks[p.name]);

    const updates = { resultAcks: acks };
    if (allAcked) {
      // Alle haben bestätigt → Ergebnis schließen, zurück in Reaktionsphase
      updates.voteResult = null;
      updates.resolvedEffect = null;
      updates.resultAcks = {};
      // ✅ Ergebnis-Timer stoppen
      updates.resultStartedAt = null;
    }

    await updateDoc(lobbyRef, updates);
  } catch (e) {
    console.error("[RESULT ACK ERROR]", e);
  }
};

/* --------------------------------
 * Reaktion "Done" (nur Nicht-Zugspieler)
 * -------------------------------- */
// src/utils/gameActions.js
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

    // 👉 Discard-Countdown starten, wenn alle reagiert haben
    if (othersDone) updates.discardStartedAt = Date.now();

    await updateDoc(lobbyRef, updates);
  } catch (err) {
    console.error("[REACTION ERROR]", err);
  }
};
