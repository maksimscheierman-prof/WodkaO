// src/hooks/useLobby.js
import { doc, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "../../firebaseConfig";
import { DEFAULT_TIMERS } from "../config/timers";

export function useLobby(lobbyId) {
  const [lobby, setLobby] = useState(null);

  useEffect(() => {
    if (!lobbyId) return;
    const lobbyRef = doc(db, "lobbies", lobbyId);
    const unsub = onSnapshot(lobbyRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setLobby({
          players: data.players || [],
          turn: data.turn ?? 0,
          lastMagic: data.lastMagic || null,
          showMagic: data.showMagic || false,
          discardPile: data.discardPile || [],
          round: data.round || 1,
          effectsUsed: data.effectsUsed || {},
          ...data,
          activeEffect: data.activeEffect ?? null,
          votes: data.votes ?? { ja: [], nein: [] },
          votingOpen: data.votingOpen ?? false,
          reactions: data.reactions ?? {},
          timers: { ...DEFAULT_TIMERS, ...(data.timers || {}) },
          reactionsStartedAt: data.reactionsStartedAt ?? null,
          votingStartedAt: data.votingStartedAt ?? null,
          resultStartedAt: data.resultStartedAt ?? null,
          discardStartedAt: data.discardStartedAt ?? null,
          resultAcks: data.resultAcks ?? {},
        });
      }
    });
    return unsub;
  }, [lobbyId]);

  return lobby;
}
