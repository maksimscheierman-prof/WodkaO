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
import { speakCommentary, stopCommentaryVoice } from "./voiceService";

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

/**
 * Beobachtet Lobby-Updates und liefert den aktuellen Kommentar-Text.
 */
export function useCommentator(lobby, lobbyId = null) {
  const { settings } = useCommentatorSettings();
  const [commentary, setCommentary] = useState(null);
  const prevRef = useRef(null);
  const hideTimerRef = useRef(null);
  const queueRef = useRef([]);
  const showingRef = useRef(false);
  const settingsRef = useRef(settings);
  const sessionStatsRef = useRef(createSessionStats());
  const lobbyIdRef = useRef(lobbyId);
  const personalityRef = useRef(null);
  const playersRef = useRef([]);
  const resolveGenRef = useRef(0);

  settingsRef.current = settings;

  personalityRef.current = lobby?.commentatorPersonality ?? null;
  playersRef.current = playersForPersonality(lobby);

  useEffect(() => {
    if (lobbyId && lobbyId !== lobbyIdRef.current) {
      lobbyIdRef.current = lobbyId;
      sessionStatsRef.current = createSessionStats(playerNamesFromLobby(lobby));
      prevRef.current = null;
    }
  }, [lobbyId, lobby]);

  useEffect(() => {
    if (!settings.commentatorEnabled || !lobby) return;

    const prev = prevRef.current;
    const next = snapshotLobby(lobby);
    prevRef.current = next;

    if (!prev) return;

    const detected = detectCommentatorEvents(prev, next);
    if (!detected.length) return;

    if (detected.some((e) => e.type === "GAME_STARTED")) {
      resetSessionStats(sessionStatsRef.current, playerNamesFromLobby(lobby));
    }

    applyEventsToSessionStats(sessionStatsRef.current, detected);

    const activeSettings = settingsRef.current;
    const stats = sessionStatsRef.current;
    const hasEffectSelected = detected.some((e) => e.type === "EFFECT_SELECTED");
    const commentaryEvents = detected.filter(({ type, context }) => {
      if (!COMMENTARY_EVENT_TYPES.has(type)) return false;
      if (type === "PLAYER_PUNISHED" && context.reason === "vote_rejected") return false;
      if (type === "VOTE_STARTED" && hasEffectSelected) return false;
      return true;
    });

    if (!commentaryEvents.length) return;

    const generation = ++resolveGenRef.current;

    (async () => {
      try {
        for (const { type, context } of commentaryEvents) {
          if (generation !== resolveGenRef.current) return;

          const text = await resolveCommentary({
            eventType: type,
            context,
            settings: activeSettings,
            sessionStats: stats,
            commentatorPersonality: personalityRef.current,
            players: playersRef.current,
          });

          if (generation !== resolveGenRef.current) return;
          if (text) queueRef.current.push(text);
        }

        if (generation !== resolveGenRef.current) return;

        const showNext = () => {
          if (showingRef.current || !queueRef.current.length) return;
          showingRef.current = true;
          const text = queueRef.current.shift();
          setCommentary(text);
          speakCommentary(text, settingsRef.current).catch(() => {});

          if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
          hideTimerRef.current = setTimeout(() => {
            showingRef.current = false;
            if (queueRef.current.length) {
              showNext();
            } else {
              setCommentary(null);
            }
          }, COMMENTATOR_DISPLAY_MS);
        };

        showNext();
      } catch (err) {
        console.warn("[COMMENTATOR RESOLVE]", err?.message || err);
      }
    })();
  }, [lobby, settings.commentatorEnabled, settings.useAiCommentator]);

  useEffect(() => {
    if (!settings.commentatorEnabled || !settings.voiceCommentatorEnabled) {
      stopCommentaryVoice().catch(() => {});
    }
  }, [settings.commentatorEnabled, settings.voiceCommentatorEnabled]);

  useEffect(() => {
    if (!settings.commentatorEnabled) {
      setCommentary(null);
      queueRef.current = [];
      showingRef.current = false;
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    }
  }, [settings.commentatorEnabled]);

  useEffect(() => {
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      stopCommentaryVoice().catch(() => {});
    };
  }, []);

  const announceGameEnded = useCallback(async (sessionStats = null, personalityOverride = null) => {
    if (!settingsRef.current.commentatorEnabled) return null;

    try {
      const text = await resolveCommentary({
        eventType: "GAME_ENDED",
        context: {},
        settings: settingsRef.current,
        sessionStats: sessionStats ?? sessionStatsRef.current,
        commentatorPersonality:
          personalityOverride?.commentatorPersonality ?? personalityRef.current,
        players: personalityOverride?.players ?? playersRef.current,
      });

      if (text) {
        setCommentary(text);
        speakCommentary(text, settingsRef.current).catch(() => {});
      }

      return text;
    } catch (err) {
      console.warn("[COMMENTATOR GAME ENDED]", err?.message || err);
      return null;
    }
  }, []);

  if (!settings.commentatorEnabled) {
    return { commentary: null, exportSessionReport: () => null, announceGameEnded: () => null };
  }

  const exportSessionReport = () => ({
    sessionStats: JSON.parse(JSON.stringify(sessionStatsRef.current)),
    settings: { ...settingsRef.current },
    commentatorPersonality: personalityRef.current,
    players: playersRef.current,
  });

  return { commentary, exportSessionReport, announceGameEnded };
}
