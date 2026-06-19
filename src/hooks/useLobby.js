// src/hooks/useLobby.js
import { doc, onSnapshot } from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
import { db } from "../../firebaseConfig";
import { DEFAULT_TIMERS } from "../config/timers";
import { isLobbyTerminated } from "../utils/lobbyLifecycleCore";

function normalizeLobbyData(data) {
  return {
    players: data.players || [],
    turn: data.turn ?? 0,
    lastMagic: data.lastMagic || null,
    showMagic: data.showMagic || false,
    discardPile: data.discardPile || [],
    round: data.round || 1,
    effectsUsed: data.effectsUsed || {},
    gamePhase: data.gamePhase ?? null,
    diceRolls: data.diceRolls ?? {},
    diceRound: data.diceRound ?? 1,
    rollingEligible: data.rollingEligible ?? [],
    startPlayerName: data.startPlayerName ?? null,
    monsterDeck: data.monsterDeck ?? [],
    saufDeck: data.saufDeck ?? [],
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
    status: data.status ?? null,
  };
}

export function useLobby(lobbyId) {
  const [lobby, setLobby] = useState(null);
  const unsubRef = useRef(null);

  useEffect(() => {
    if (!lobbyId) {
      setLobby(null);
      return undefined;
    }

    const lobbyRef = doc(db, "lobbies", lobbyId);
    const unsub = onSnapshot(lobbyRef, (snap) => {
      if (!snap.exists()) {
        setLobby(null);
        return;
      }

      const data = snap.data();
      setLobby(normalizeLobbyData(data));

      if (isLobbyTerminated(data) && unsubRef.current) {
        unsubRef.current();
        unsubRef.current = null;
      }
    });

    unsubRef.current = unsub;

    return () => {
      unsubRef.current?.();
      unsubRef.current = null;
    };
  }, [lobbyId]);

  return lobby;
}
