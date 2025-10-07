// src/utils/gameActions.js
import { updateDoc } from "firebase/firestore";
import { randomMagic } from "./gameLogic";

// --- Karte ziehen ---
export const handleDraw = async (lobbyRef, setSelectedCard) => {
  try {
    const newMagic = await randomMagic();
    console.log("[DRAW] Neue Karte:", newMagic);

    await updateDoc(lobbyRef, {
      lastMagic: newMagic,
      showMagic: false,
    });

    setSelectedCard({ ...newMagic, type: "MAGIC" });
  } catch (err) {
    console.error("[DRAW ERROR]", err);
  }
};

// --- Karte zeigen ---
export const handleShow = async (lobbyRef, lobby) => {
  if (!lobby?.lastMagic) return;

  const reactions = {};
  for (const p of lobby.players) reactions[p.name] = { done: false };

  await updateDoc(lobbyRef, { showMagic: true, reactions });
};

// --- Karte ablegen & nächster Spieler ---
export const handleDiscard = async (lobbyRef, lobby) => {
  try {
    const discardPile = [...(lobby.discardPile || []), lobby.lastMagic];
    const nextTurn = ((lobby.turn ?? 0) + 1) % (lobby.players?.length || 1);

    await updateDoc(lobbyRef, {
      discardPile,
      lastMagic: null,
      turn: nextTurn,
      showMagic: false,
    });
  } catch (err) {
    console.error("[DISCARD ERROR]", err);
  }
};

// --- Spieler trinken lassen ---
export const handleDrink = async (lobbyRef, lobby, targetPlayerName) => {
  try {
    const updatedPlayers = lobby.players.map((p) =>
      p.name === targetPlayerName ? { ...p, shots: (p.shots || 0) + 1 } : p
    );

    await updateDoc(lobbyRef, { players: updatedPlayers });

    console.log(`[DRINK] ${targetPlayerName} hat einen Kurzen getrunken 🍻`);
  } catch (err) {
    console.error("[DRINK ERROR]", err);
  }
};

// --- Effekt aktivieren ---
export const handleActivateEffect = async (
  lobbyRef,
  lobby,
  card,
  sourcePlayer
) => {
  try {
    const effectData = {
      player: sourcePlayer,
      card,
    };

    await updateDoc(lobbyRef, {
      activeEffect: effectData,
      votes: { ja: [], nein: [] },
      votingOpen: true,
    });

    console.log(`[EFFECT] ${sourcePlayer} aktiviert ${card.name}`);
  } catch (err) {
    console.error("[EFFECT ERROR]", err);
  }
};

// --- Abstimmung abgeben ---
export const handleVote = async (lobbyRef, lobby, playerName, vote) => {
  if (!lobby || !lobby.activeEffect || !lobby.votingOpen) return;

  try {
    const votes = lobby.votes || { ja: [], nein: [] };

    // prüfen ob Spieler schon abgestimmt hat
    if (votes.ja.includes(playerName) || votes.nein.includes(playerName)) {
      console.log(`[VOTE] ${playerName} hat bereits abgestimmt`);
      return;
    }

    const updatedVotes = {
      ja: vote === "ja" ? [...votes.ja, playerName] : votes.ja,
      nein: vote === "nein" ? [...votes.nein, playerName] : votes.nein,
    };

    await updateDoc(lobbyRef, { votes: updatedVotes });

    console.log(`[VOTE] ${playerName} stimmt mit ${vote}`);

    // check ob alle abgestimmt haben
    if (
      updatedVotes.ja.length + updatedVotes.nein.length ===
      lobby.players.length
    ) {
      const jaCount = updatedVotes.ja.length;
      const neinCount = updatedVotes.nein.length;

      let updates = { votingOpen: false };

      if (jaCount > neinCount) {
        updates.voteResult = "✅ Effekt wurde bestätigt!";
      } else if (neinCount > jaCount) {
        updates.voteResult = `❌ Effekt abgelehnt! ${lobby.activeEffect.player} muss trinken 🍻`;

        const updatedPlayers = lobby.players.map((p) =>
          p.name === lobby.activeEffect.player
            ? { ...p, shots: (p.shots || 0) + 1 }
            : p
        );
        updates.players = updatedPlayers;
      } else {
        updates.voteResult = "⚖️ Gleichstand – nix passiert.";
      }

      updates.activeEffect = null;
      updates.votes = { ja: [], nein: [] };

      await updateDoc(lobbyRef, updates);
    }
  } catch (err) {
    console.error("[VOTE ERROR]", err);
  }
};

/**
 * Markiert einen Spieler als "hat reagiert" (Done gedrückt)
 * und prüft, ob alle anderen Spieler ebenfalls fertig sind.
 */
export const handleReactionDone = async (lobbyRef, lobby, playerName) => {
  try {
    const reactions = lobby.reactions || {};
    const updatedReactions = {
      ...reactions,
      [playerName]: { done: true },
    };

    await updateDoc(lobbyRef, { reactions: updatedReactions });

    console.log(`[REACTION] ${playerName} hat reagiert`);

    // Prüfen, ob alle bis auf den Zugspieler fertig sind
    const allDone =
      Object.values(updatedReactions).filter((r) => r.done).length >=
      (lobby.players?.length || 0) - 1;

    if (allDone) {
      console.log("[REACTION] Alle anderen Spieler fertig ✅");
      await updateDoc(lobbyRef, {
        reactions: updatedReactions,
        allReactionsDone: true,
      });
    }
  } catch (err) {
    console.error("[REACTION ERROR]", err);
  }
};
