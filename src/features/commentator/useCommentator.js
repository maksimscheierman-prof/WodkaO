import { useCallback, useEffect, useRef, useState } from "react";
import { resolveCommentary } from "./commentatorAiService";
import { COMMENTATOR_DISPLAY_MS } from "./commentatorConfig";
import { detectCommentatorEvents } from "./commentatorCore";
import {
  applyEventsToSessionStats,
  createSessionStats,
  resetSessionStats,
} from "./commentatorSessionStats";
import { useCommentatorSettings } from "./useCommentatorSettings";
import {
  isCommentaryVoicePlaying,
  speakCommentary,
  stopCommentaryVoice,
} from "./voiceService";
import { buildVoiceContextFromLobby, isHostDeviceForVoice } from "./voiceServiceCore";
import {
  createCommentaryDedupeState,
  resetCommentaryDedupeState,
} from "./commentatorDedupeCore";
import {
  canDequeueForOutput,
  createThrottleState,
  dequeueEvent,
  markOutputEnded,
  markOutputStarted,
  planEventEnqueue,
  recordSpokenEvent,
  resetThrottleState,
  setVoicePlaying,
} from "./commentatorThrottle";
import { shouldRunLobbyBackgroundServices } from "../../utils/lobbyLifecycleCore";

const COMMENTARY_EVENT_TYPES = new Set([
  "GAME_STARTED",
  "ROUND_STARTED",
  "CARD_DRAWN",
  "MONSTER_DRAWN",
  "MAGIC_DRAWN",
  "TRAP_DRAWN",
  "EFFECT_SELECTED",
  "VOTE_STARTED",
  "VOTE_ACCEPTED",
  "VOTE_REJECTED",
  "MONSTER_EFFECT_DISABLED",
  "MONSTER_EFFECT_ENABLED",
  "MAGIC_PLAYED",
  "PLAYER_PUNISHED",
  "TRAP_REPLACED",
  "GAME_ENDED",
]);

function snapshotLobby(lobby) {
  if (!lobby) return null;
  return {
    gamePhase: lobby.gamePhase ?? null,
    round: lobby.round ?? 1,
    turn: lobby.turn ?? 0,
    lastMagic: lobby.lastMagic ?? null,
    showMagic: lobby.showMagic ?? false,
    pendingTrapChoice: lobby.pendingTrapChoice ?? null,
    commentatorPersonality: lobby.commentatorPersonality ?? null,
    players: (lobby.players ?? []).map((p) => ({
      id: p.id,
      name: p.name,
      shots: p.shots ?? 0,
      trap: p.trap ?? null,
      monster: p.monster ?? null,
    })),
    votingOpen: lobby.votingOpen ?? false,
    voteResult: lobby.voteResult ?? null,
    resolvedEffect: lobby.resolvedEffect ?? null,
    activeEffect: lobby.activeEffect ?? null,
    effectsUsed: lobby.effectsUsed ?? {},
  };
}

function playersForPersonality(lobby) {
  return (lobby?.players ?? [])
    .filter((p) => p?.id && p?.name)
    .map((p) => ({ id: p.id, name: p.name }));
}

function playerNamesFromLobby(lobby) {
  return (lobby?.players ?? []).map((p) => p.name).filter(Boolean);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Beobachtet Lobby-Updates und liefert den aktuellen Kommentar-Text.
 * @param {object|null} lobby
 * @param {string|null} lobbyId
 * @param {string|null} playerName — lokaler Spieler für Host-only Voice
 */
export function useCommentator(lobby, lobbyId = null, playerName = null) {
  const { settings } = useCommentatorSettings();
  const [commentary, setCommentary] = useState(null);
  const prevRef = useRef(null);
  const hideTimerRef = useRef(null);
  const showingRef = useRef(false);
  const settingsRef = useRef(settings);
  const sessionStatsRef = useRef(createSessionStats());
  const lobbyIdRef = useRef(lobbyId);
  const personalityRef = useRef(null);
  const playersRef = useRef([]);
  const playerNameRef = useRef(playerName);
  const lobbyRef = useRef(lobby);
  const resolveGenRef = useRef(0);
  const dedupeStateRef = useRef(createCommentaryDedupeState());
  const throttleRef = useRef(createThrottleState());
  const queueWorkerRef = useRef(false);
  const lastSpokenTextRef = useRef(null);

  settingsRef.current = settings;
  playerNameRef.current = playerName;
  lobbyRef.current = lobby;

  personalityRef.current = lobby?.commentatorPersonality ?? null;
  playersRef.current = playersForPersonality(lobby);

  const getVoiceContext = (lobbySnapshot = lobbyRef.current) =>
    buildVoiceContextFromLobby(lobbySnapshot, playerNameRef.current);

  const clearDisplayTimer = () => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  };

  const finishDisplay = () => {
    clearDisplayTimer();
    showingRef.current = false;
    markOutputEnded(throttleRef.current);
    setCommentary(null);
  };

  const processCommentaryQueue = useCallback(async (generation) => {
    if (queueWorkerRef.current) return;
    queueWorkerRef.current = true;

    try {
      while (generation === resolveGenRef.current) {
        const throttle = throttleRef.current;
        setVoicePlaying(throttle, isCommentaryVoicePlaying());

        const gate = canDequeueForOutput(throttle, Date.now());
        if (!gate.ok) {
          if (gate.reason === "empty") break;
          if (gate.reason === "cooldown" && gate.waitMs > 0) {
            await sleep(gate.waitMs);
            continue;
          }
          if (gate.reason === "voice_busy") {
            await sleep(250);
            continue;
          }
          break;
        }

        const entry = dequeueEvent(throttle);
        if (!entry) break;

        if (gate.interrupt) {
          finishDisplay();
          await stopCommentaryVoice();
          setVoicePlaying(throttle, false);
        }

        markOutputStarted(throttle, entry.priority, Date.now());

        let text = null;
        try {
          text = await resolveCommentary({
            eventType: entry.eventType,
            context: entry.context,
            settings: settingsRef.current,
            sessionStats: sessionStatsRef.current,
            commentatorPersonality: personalityRef.current,
            players: playersRef.current,
            lobbyId: lobbyIdRef.current,
            dedupeState: dedupeStateRef.current,
          });
        } catch (err) {
          console.warn("[COMMENTATOR RESOLVE]", err?.message || err);
        }

        if (generation !== resolveGenRef.current) break;

        if (!text) {
          markOutputEnded(throttle);
          continue;
        }

        recordSpokenEvent(throttle, entry.eventType, entry.context, Date.now());
        lastSpokenTextRef.current = text;
        showingRef.current = true;
        setCommentary(text);

        try {
          await speakCommentary(text, settingsRef.current, getVoiceContext());
        } catch (err) {
          console.warn("[COMMENTATOR VOICE]", err?.message || err);
        } finally {
          setVoicePlaying(throttle, isCommentaryVoicePlaying());
        }

        await new Promise((resolve) => {
          clearDisplayTimer();
          hideTimerRef.current = setTimeout(() => {
            finishDisplay();
            resolve();
          }, COMMENTATOR_DISPLAY_MS);
        });
      }
    } finally {
      queueWorkerRef.current = false;
      if (
        throttleRef.current.queue.length > 0 &&
        generation === resolveGenRef.current
      ) {
        processCommentaryQueue(generation);
      }
    }
  }, []);

  const enqueueCommentaryEvents = useCallback(
    (events, generation) => {
      const throttle = throttleRef.current;
      let needsInterrupt = false;

      for (const { type, context } of events) {
        const plan = planEventEnqueue(throttle, {
          eventType: type,
          context,
        });
        if (plan.interrupt) {
          needsInterrupt = true;
        }
      }

      if (needsInterrupt) {
        finishDisplay();
        stopCommentaryVoice().catch(() => {});
        setVoicePlaying(throttle, false);
      }

      processCommentaryQueue(generation);
    },
    [processCommentaryQueue]
  );

  useEffect(() => {
    if (lobbyId && lobbyId !== lobbyIdRef.current) {
      lobbyIdRef.current = lobbyId;
      sessionStatsRef.current = createSessionStats(playerNamesFromLobby(lobby));
      dedupeStateRef.current = createCommentaryDedupeState();
      resetThrottleState(throttleRef.current);
      prevRef.current = null;
    }
  }, [lobbyId, lobby]);

  useEffect(() => {
    if (!shouldRunLobbyBackgroundServices(lobby)) {
      resolveGenRef.current += 1;
      stopCommentaryVoice().catch(() => {});
      finishDisplay();
      resetThrottleState(throttleRef.current);
      queueWorkerRef.current = false;
    }
  }, [lobby?.status]);

  useEffect(() => {
    if (!settings.commentatorEnabled || !lobby) return;
    if (!shouldRunLobbyBackgroundServices(lobby)) return;

    const prev = prevRef.current;
    const next = snapshotLobby(lobby);
    prevRef.current = next;

    if (!prev) return;

    const detected = detectCommentatorEvents(prev, next);
    if (!detected.length) return;

    if (detected.some((e) => e.type === "GAME_STARTED")) {
      resetSessionStats(sessionStatsRef.current, playerNamesFromLobby(lobby));
      resetCommentaryDedupeState(dedupeStateRef.current);
      resetThrottleState(throttleRef.current);
    }

    applyEventsToSessionStats(sessionStatsRef.current, detected);

    const hasEffectSelected = detected.some((e) => e.type === "EFFECT_SELECTED");
    const commentaryEvents = detected.filter(({ type, context }) => {
      if (!COMMENTARY_EVENT_TYPES.has(type)) return false;
      if (type === "PLAYER_PUNISHED" && context.reason === "vote_rejected") {
        return false;
      }
      if (type === "VOTE_STARTED" && hasEffectSelected) return false;
      return true;
    });

    if (!commentaryEvents.length) return;

    const generation = ++resolveGenRef.current;
    enqueueCommentaryEvents(commentaryEvents, generation);
  }, [lobby, settings.commentatorEnabled, settings.useAiCommentator, enqueueCommentaryEvents]);

  useEffect(() => {
    if (!settings.commentatorEnabled || !settings.voiceCommentatorEnabled) {
      stopCommentaryVoice().catch(() => {});
      setVoicePlaying(throttleRef.current, false);
    }
  }, [settings.commentatorEnabled, settings.voiceCommentatorEnabled]);

  useEffect(() => {
    if (!settings.commentatorEnabled) {
      finishDisplay();
      resetThrottleState(throttleRef.current);
      queueWorkerRef.current = false;
    }
  }, [settings.commentatorEnabled]);

  useEffect(() => {
    return () => {
      clearDisplayTimer();
      stopCommentaryVoice().catch(() => {});
    };
  }, []);

  const announceGameEnded = useCallback(
    async (sessionStats = null, personalityOverride = null) => {
      if (!settingsRef.current.commentatorEnabled) return null;

      if (sessionStats) {
        sessionStatsRef.current = sessionStats;
      }
      if (personalityOverride?.commentatorPersonality) {
        personalityRef.current = personalityOverride.commentatorPersonality;
      }
      if (personalityOverride?.players) {
        playersRef.current = personalityOverride.players;
      }

      const generation = ++resolveGenRef.current;
      enqueueCommentaryEvents([{ type: "GAME_ENDED", context: {} }], generation);

      while (
        generation === resolveGenRef.current &&
        (queueWorkerRef.current || throttleRef.current.queue.length > 0)
      ) {
        await sleep(50);
      }

      return lastSpokenTextRef.current;
    },
    [enqueueCommentaryEvents]
  );

  if (!settings.commentatorEnabled) {
    return { commentary: null, exportSessionReport: () => null, announceGameEnded: () => null };
  }

  const exportSessionReport = () => {
    const voiceContext = getVoiceContext();
    return {
      sessionStats: JSON.parse(JSON.stringify(sessionStatsRef.current)),
      settings: { ...settingsRef.current },
      commentatorPersonality: personalityRef.current,
      players: playersRef.current,
      isHostDevice: isHostDeviceForVoice(voiceContext),
      voiceContext,
    };
  };

  return { commentary, exportSessionReport, announceGameEnded };
}
