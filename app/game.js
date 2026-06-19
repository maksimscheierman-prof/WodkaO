import { LinearGradient } from "expo-linear-gradient";

import { useLocalSearchParams, useRouter } from "expo-router";

import { doc, getDoc } from "firebase/firestore";

import { useCallback, useEffect, useRef, useState } from "react";

import { Text, TouchableOpacity, useWindowDimensions, View, Alert } from "react-native";

import { useSafeAreaInsets } from "react-native-safe-area-context";

import { db } from "../firebaseConfig";

import CardModal from "../src/components/CardModal";
import CardModalDebugOverlay from "../src/components/CardModalDebugOverlay";

import GameActionBar from "../src/components/GameActionBar";
import GameBoard from "../src/components/GameBoard";
import GameExitButton from "../src/components/GameExitButton";

import GameSetupPanel from "../src/components/GameSetupPanel";

import LobbyCodeBadge from "../src/components/LobbyCodeBadge";

import MagicCardModal from "../src/components/MagicCardModal";
import TrapChoiceModal from "../src/components/TrapChoiceModal";

import { useAsyncLock } from "../src/hooks/useAsyncLock";
import { confirmLeaveGame, useGameExitGuard } from "../src/hooks/useGameExit";

import { useLobby } from "../src/hooks/useLobby";

import { gameStyles } from "../src/styles/gameStyles";

import {
  getPhaseLabel,
  isPlayingPhase,
  isSetupPhase,
} from "../src/config/gamePhases";

import * as actions from "../src/utils/gameActions";

import { getBoardTopInset } from "../src/utils/tableLayout";

import { handleCloseVoteResult } from "../src/utils/gameActions";

import {
  EXPIRED_LOBBY_MESSAGE,
  FINISHED_LOBBY_MESSAGE,
  handleLeaveLobby,
  isLobbyExpired,
  isLobbyTerminated,
  LOBBY_STATUS,
  markLobbyExpired,
  markLobbyFinished,
} from "../src/utils/lobbyLifecycle";
import {
  getCardOpenLog,
  getMonsterPressLog,
  isValidPlayableCard,
  normalizeCardForTemplate,
} from "../src/utils/cardDisplay";
import {
  recordCardModalDebug,
  recordCardModalError,
} from "../src/utils/cardModalDebug";
import { clearSession, saveSession } from "../src/utils/sessionStorage";
import { hiddenHeaderScreenOptions } from "../src/utils/stackScreenOptions";
import { isTrapChoiceForPlayer } from "../src/utils/trapChoice";
import { COMMENTATOR_GAME_END_LEAVE_MS } from "../src/features/commentator/commentatorConfig";
import CommentatorBubble from "../src/features/commentator/CommentatorBubble";
import { hasSessionActivity } from "../src/features/commentator/commentatorAwards";
import { saveCommentatorSessionReport } from "../src/features/commentator/commentatorSessionReportStorage";
import { useCommentator } from "../src/features/commentator/useCommentator";

export const options = hiddenHeaderScreenOptions;

export default function Game() {

  const params = useLocalSearchParams();
  const lobbyId = Array.isArray(params.lobbyId) ? params.lobbyId[0] : params.lobbyId;
  const playerName = Array.isArray(params.playerName)
    ? params.playerName[0]
    : params.playerName;

  const router = useRouter();

  const lobby = useLobby(lobbyId);

  const lobbyRef = doc(db, "lobbies", String(lobbyId || ""));

  const { commentary, exportSessionReport, announceGameEnded } = useCommentator(
    lobby,
    lobbyId,
    playerName
  );

  const [selectedCard, setSelectedCard] = useState(null);
  const [joinToast, setJoinToast] = useState(null);

  const actionLock = useAsyncLock();
  const lastJoinSeenRef = useRef(null);

  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  const insets = useSafeAreaInsets();

  const compact = screenWidth < 400;

  const hudTop = Math.max(compact ? 4 : 6, insets.top + (compact ? 2 : 4));

  const performLeaveGame = useCallback(async () => {
    if (actionLock.isLocked) return;

    await actionLock.runLocked(async () => {
      if (lobby && playerName) {
        await actions
          .clearViewingCard(lobbyRef, lobby, playerName)
          .catch((err) => console.error("[VIEWING CARD CLEAR]", err));

        const snap = await getDoc(lobbyRef);
        if (snap.exists()) {
          await handleLeaveLobby(lobbyRef, snap.data(), playerName);
        }
      }

      const report = exportSessionReport?.();
      const showSessionSummary =
        report?.settings?.commentatorEnabled &&
        hasSessionActivity(report.sessionStats);

      if (report?.settings?.commentatorEnabled) {
        await announceGameEnded?.(report?.sessionStats, {
          commentatorPersonality:
            lobby?.commentatorPersonality ?? report?.commentatorPersonality,
          players: (lobby?.players ?? report?.players ?? [])
            .filter((p) => p?.id && p?.name)
            .map((p) => ({ id: p.id, name: p.name })),
        });
        await new Promise((resolve) => setTimeout(resolve, COMMENTATOR_GAME_END_LEAVE_MS));
      }

      await clearSession();
      if (showSessionSummary) {
        await saveCommentatorSessionReport({
          sessionStats: report.sessionStats,
          settings: report.settings,
          commentatorPersonality: report.commentatorPersonality,
          players: report.players,
          isHostDevice: report.isHostDevice,
          playerName,
          lobbyId,
          savedAt: Date.now(),
        });
        router.replace({ pathname: "/session-summary", params: { playerName } });
        return;
      }

      router.replace({ pathname: "/", params: { playerName } });
    });
  }, [actionLock, announceGameEnded, exportSessionReport, lobby, lobbyId, lobbyRef, playerName, router]);

  const performEndLobbyAsHost = useCallback(async () => {
    if (actionLock.isLocked) return;

    await actionLock.runLocked(async () => {
      await markLobbyFinished(lobbyRef, "host");

      const report = exportSessionReport?.();
      const showSessionSummary =
        report?.settings?.commentatorEnabled &&
        hasSessionActivity(report.sessionStats);

      if (report?.settings?.commentatorEnabled) {
        await announceGameEnded?.(report?.sessionStats, {
          commentatorPersonality:
            lobby?.commentatorPersonality ?? report?.commentatorPersonality,
          players: (lobby?.players ?? report?.players ?? [])
            .filter((p) => p?.id && p?.name)
            .map((p) => ({ id: p.id, name: p.name })),
        });
        await new Promise((resolve) => setTimeout(resolve, COMMENTATOR_GAME_END_LEAVE_MS));
      }

      await clearSession();
      if (showSessionSummary) {
        await saveCommentatorSessionReport({
          sessionStats: report.sessionStats,
          settings: report.settings,
          commentatorPersonality: report.commentatorPersonality,
          players: report.players,
          isHostDevice: report.isHostDevice,
          playerName,
          lobbyId,
          savedAt: Date.now(),
        });
        router.replace({ pathname: "/session-summary", params: { playerName } });
        return;
      }

      router.replace({
        pathname: "/",
        params: { playerName, finishedMessage: FINISHED_LOBBY_MESSAGE },
      });
    });
  }, [
    actionLock,
    announceGameEnded,
    exportSessionReport,
    lobby,
    lobbyId,
    lobbyRef,
    playerName,
    router,
  ]);

  const requestEndLobbyAsHost = useCallback(() => {
    Alert.alert(
      "Spiel für alle beenden?",
      "Alle Spieler werden aus der Lobby entfernt.",
      [
        { text: "Abbrechen", style: "cancel" },
        {
          text: "Beenden",
          style: "destructive",
          onPress: () => {
            performEndLobbyAsHost().catch((err) =>
              console.error("[HOST END LOBBY]", err)
            );
          },
        },
      ]
    );
  }, [performEndLobbyAsHost]);

  const requestLeaveGame = useCallback(() => {
    confirmLeaveGame(performLeaveGame);
  }, [performLeaveGame]);

  useGameExitGuard(requestLeaveGame, !!lobby);



  const runAction = useCallback(

    (fn) => {

      if (!lobby || isLobbyTerminated(lobby) || isLobbyExpired(lobby)) return;

      actionLock.runLocked(fn).catch((err) => {

        console.error("[GAME ACTION ERROR]", err);

      });

    },

    [actionLock, lobby]

  );



  const onShow = () => {

    runAction(async () => {

      await actions.handleShow(lobbyRef, lobby);

      setSelectedCard(null);

    });

  };



  const onDiscard = () => {

    runAction(async () => {

      await actions.handleDiscard(lobbyRef, lobby);

      setSelectedCard(null);

    });

  };



  const onDraw = () => {

    runAction(async () => {

      await actions.handleDraw(lobbyRef, lobby, setSelectedCard);

    });

  };



  const onRollDice = () => {

    runAction(async () => {

      await actions.handleRollDice(lobbyRef, lobby, playerName);

    });

  };



  const onDrawMonster = () => {

    runAction(async () => {

      await actions.handleDrawMonster(lobbyRef, lobby, playerName);

    });

  };



  const onActivateEffect = (card) => {

    if (!lobby?.players?.find((p) => p.name === playerName)) return;

    const me = lobby.players.find((p) => p.name === playerName);

    runAction(async () => {

      await actions.handleActivateEffect(lobbyRef, lobby, card, me.name);

    });

  };



  const onVote = (vote) => {

    runAction(async () => {

      await actions.handleVote(lobbyRef, lobby, playerName, vote);

    });

  };



  const onResultOk = (name) => {

    runAction(async () => {

      await actions.handleResultAck(lobbyRef, lobby, name);

    });

  };



  const onDone = (name) => {

    runAction(async () => {

      await actions.handleReactionDone(lobbyRef, lobby, name);

    });

  };



  const onDrink = (target) => {

    runAction(async () => {

      await actions.handleDrink(lobbyRef, lobby, target);

    });

  };



  const onCloseVoteResult = () => {

    runAction(async () => {

      await handleCloseVoteResult(lobbyRef);

    });

  };

  const onResolveTrapChoice = (choice) => {
    runAction(async () => {
      await actions.handleResolveTrapChoice(lobbyRef, lobby, playerName, choice);
    });
  };



  const isMagicSelected =

    typeof selectedCard?.type === "string" &&

    selectedCard.type.toLowerCase() === "magic";

  const handleSelectCard = useCallback(
    (card, ownerName) => {
      try {
        const defaultType =
          typeof card?.type === "string" ? card.type.toLowerCase() : "monster";
        const pressLog = getMonsterPressLog(card, {
          defaultType,
          playerKey: playerName,
          playerName: ownerName,
        });

        recordCardModalDebug("game_select_card", {
          ...pressLog,
          ownerName,
          lobbyId,
        });

        if (defaultType === "monster") {
          console.log("[MONSTER PRESS]", pressLog);
        }

        if (!isValidPlayableCard(card, { defaultType })) {
          recordCardModalDebug("game_select_invalid", pressLog);
          console.error("[CARD SELECT] Invalid card", {
            route: "game",
            lobbyId,
            playerName,
            ownerName,
            ...pressLog,
          });
          Alert.alert(
            "Karte nicht verfügbar",
            "Diese Karte konnte nicht geladen werden."
          );
          return;
        }

        const normalized = normalizeCardForTemplate(card, defaultType);
        if (!normalized) {
          recordCardModalDebug("game_select_normalize_failed", pressLog);
          console.error("[CARD SELECT] Normalize failed", pressLog);
          Alert.alert(
            "Karte nicht verfügbar",
            "Diese Karte konnte nicht angezeigt werden."
          );
          return;
        }

        console.log("[CARD SELECT]", getCardOpenLog(card, "game"));
        console.log("[CARD MODAL OPEN]", getCardOpenLog(normalized, "gameModal"));
        recordCardModalDebug("game_set_selected_card", {
          modalOpen: true,
          name: normalized.name,
          type: normalized.type,
          imageUri: normalized.image?.uri ?? null,
        });
        setSelectedCard(normalized);

        const type =
          typeof normalized.type === "string"
            ? normalized.type.toLowerCase()
            : "";
        if (
          ownerName === playerName &&
          (type === "monster" || type === "trap") &&
          lobby &&
          lobbyId
        ) {
          queueMicrotask(() => {
            actions
              .setViewingCard(lobbyRef, lobby, playerName, type)
              .catch((err) => {
                recordCardModalError("viewing_card_set", err, { type });
                console.error("[VIEWING CARD]", err);
              });
          });
        }
      } catch (err) {
        recordCardModalError("game_select_exception", err, { ownerName });
        Alert.alert("Fehler", "Karte konnte nicht geöffnet werden.");
      }
    },
    [lobby, lobbyId, lobbyRef, playerName]
  );

  const handleCloseCardModal = useCallback(() => {
    recordCardModalDebug("game_close_modal", { modalOpen: false });
    setSelectedCard(null);
    if (lobby) {
      actions
        .clearViewingCard(lobbyRef, lobby, playerName)
        .catch((err) => console.error("[VIEWING CARD CLEAR]", err));
    }
  }, [lobby, lobbyRef, playerName]);

  const presenceCleanupRef = useRef({ lobby: null, lobbyRef, playerName });
  presenceCleanupRef.current = { lobby, lobbyRef, playerName };

  useEffect(() => {
    const previousHandler = global.ErrorUtils?.getGlobalHandler?.();
    if (!global.ErrorUtils?.setGlobalHandler) return undefined;

    global.ErrorUtils.setGlobalHandler((error, isFatal) => {
      recordCardModalError("global_handler", error, { isFatal });
      previousHandler?.(error, isFatal);
    });

    return () => {
      if (previousHandler) {
        global.ErrorUtils.setGlobalHandler(previousHandler);
      }
    };
  }, []);

  useEffect(() => {
    return () => {
      const { lobby: l, lobbyRef: ref, playerName: name } =
        presenceCleanupRef.current;
      if (l && name) {
        actions.clearViewingCard(ref, l, name).catch(() => {});
      }
    };
  }, []);

  useEffect(() => {
    if (!lobby) return;

    if (lobby.status === LOBBY_STATUS.FINISHED) {
      clearSession().catch(() => {});
      router.replace({
        pathname: "/",
        params: { playerName, finishedMessage: FINISHED_LOBBY_MESSAGE },
      });
      return;
    }

    if (
      lobby.status === LOBBY_STATUS.EXPIRED ||
      isLobbyExpired(lobby)
    ) {
      if (lobby.status !== LOBBY_STATUS.EXPIRED) {
        markLobbyExpired(lobbyRef).catch((err) =>
          console.error("[GAME EXPIRE]", err)
        );
      }
      clearSession().catch(() => {});
      router.replace({
        pathname: "/lobby",
        params: { playerName, expiredMessage: EXPIRED_LOBBY_MESSAGE },
      });
    }
  }, [lobby, lobbyRef, playerName, router]);

  useEffect(() => {
    if (!lobbyId || !playerName || !lobby) return;
    const me = lobby.players?.find((p) => p.name === playerName);
    saveSession({
      playerName,
      lobbyId,
      playerId: me?.id,
      status: lobby.status,
      gamePhase: lobby.gamePhase ?? null,
    }).catch((err) => console.error("[SESSION SAVE]", err));
  }, [lobbyId, playerName, lobby?.status, lobby?.gamePhase, lobby?.players]);

  useEffect(() => {
    const ann = lobby?.lastJoinAnnouncement;
    if (!ann?.name || ann.name === playerName) return;
    if (lastJoinSeenRef.current === ann.at) return;
    lastJoinSeenRef.current = ann.at;
    setJoinToast(`${ann.name} ist dem Spiel beigetreten.`);
    const timer = setTimeout(() => setJoinToast(null), 5000);
    return () => clearTimeout(timer);
  }, [lobby?.lastJoinAnnouncement, playerName]);

  if (!lobby) {

    return (

      <LinearGradient

        colors={["#1a0033", "#000000"]}

        style={gameStyles.container}

      >

        <Text style={{ color: "#fff" }}>⏳ Lade Lobby...</Text>

      </LinearGradient>

    );

  }



  if (isLobbyTerminated(lobby)) {
    return (
      <LinearGradient colors={["#1a0033", "#000000"]} style={gameStyles.container}>
        <Text style={{ color: "#fff", textAlign: "center", padding: 24 }}>
          {lobby.status === LOBBY_STATUS.FINISHED
            ? FINISHED_LOBBY_MESSAGE
            : EXPIRED_LOBBY_MESSAGE}
        </Text>
      </LinearGradient>
    );
  }

  const players = lobby.players || [];

  const me = players.find((p) => p.name === playerName);

  const isMyTurn = players[lobby.turn]?.name === playerName;

  const activePlayer = players[lobby.turn]?.name;

  const setupPhase = isSetupPhase(lobby.gamePhase);

  const playingPhase = isPlayingPhase(lobby.gamePhase, lobby);

  const pendingTrapChoice = lobby.pendingTrapChoice ?? null;
  const isTrapChooser =
    pendingTrapChoice &&
    isTrapChoiceForPlayer(pendingTrapChoice, playerName);

  const boardTopInset = getBoardTopInset(screenHeight, insets.top);

  const overlayActive =
    !!selectedCard ||
    !!pendingTrapChoice ||
    !!(playingPhase && lobby.votingOpen) ||
    !!(playingPhase && lobby.voteResult) ||
    !!(
      playingPhase &&
      lobby.lastMagic &&
      (lobby.showMagic || isMagicSelected)
    );

  const actionBarLikelyVisible =
    playingPhase &&
    isMyTurn &&
    !lobby.votingOpen &&
    !lobby.activeEffect &&
    !lobby.voteResult &&
    !pendingTrapChoice;

  const commentatorBottomOffset = actionBarLikelyVisible
    ? Math.max(12, insets.bottom + 8) + 76
    : Math.max(12, insets.bottom + 8);

  return (

    <>

      {!isMagicSelected && (

        <CardModal

          selectedCard={selectedCard}

          onClose={handleCloseCardModal}

        />

      )}



      <LinearGradient

        colors={["#1a0033", "#000000"]}

        style={gameStyles.container}

      >

        <View style={{ flex: 1, position: "relative" }}>

          <LobbyCodeBadge

            lobbyId={lobbyId}

            style={{

              position: "absolute",

              top: hudTop,

              right: compact ? 4 : 6,

              zIndex: 20,

            }}

          />



          <View
            style={{
              position: "absolute",
              top: hudTop,
              left: compact ? 6 : 8,
              right: compact ? 4 : 6,
              zIndex: 20,
              flexDirection: "row",
              alignItems: "flex-start",
            }}
          >
            <GameExitButton
              onPress={requestLeaveGame}
              size={compact ? 34 : 36}
              style={{ marginTop: 0, flexShrink: 0 }}
            />

            {me?.isHost ? (
              <TouchableOpacity
                onPress={requestEndLobbyAsHost}
                disabled={actionLock.isLocked}
                style={{
                  marginLeft: 8,
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 8,
                  backgroundColor: "rgba(183, 28, 28, 0.85)",
                  borderWidth: 1,
                  borderColor: "rgba(255,120,120,0.55)",
                  opacity: actionLock.isLocked ? 0.6 : 1,
                }}
              >
                <Text style={{ color: "#fff", fontSize: compact ? 11 : 12, fontWeight: "700" }}>
                  Beenden
                </Text>
              </TouchableOpacity>
            ) : null}

            <View
              style={{
                flex: 1,
                marginLeft: 10,
                paddingRight: 8,
                maxWidth: screenWidth * (compact ? 0.52 : 0.58),
              }}
            >
              <Text
                style={{
                  color: isMyTurn ? "#7fff7f" : "#fff",
                  fontSize: compact ? 13 : 15,
                  fontWeight: "bold",
                }}
                numberOfLines={2}
              >
                {setupPhase
                  ? getPhaseLabel(lobby.gamePhase, lobby.diceRound)
                  : isMyTurn
                    ? "🎯 Du bist am Zug!"
                    : `⏳ ${activePlayer || "…"} ist am Zug`}
              </Text>

              {joinToast ? (
                <Text
                  style={{
                    color: "#b8d4ff",
                    fontSize: compact ? 11 : 12,
                    marginTop: 4,
                  }}
                  numberOfLines={2}
                >
                  {joinToast}
                </Text>
              ) : null}

              {pendingTrapChoice && !isTrapChooser ? (
                <Text
                  style={{
                    color: "#d4c4a8",
                    fontSize: compact ? 11 : 12,
                    marginTop: 4,
                  }}
                  numberOfLines={2}
                >
                  ⏳ {pendingTrapChoice.playerKey} wählt eine Falle…
                </Text>
              ) : null}
            </View>
          </View>



          {setupPhase ? (

            <View style={{ flex: 1, paddingTop: boardTopInset }}>

            <GameSetupPanel

              lobby={lobby}

              playerName={playerName}

              onRollDice={onRollDice}

              onDrawMonster={onDrawMonster}

              onSelectMonster={handleSelectCard}

              actionDisabled={actionLock.isLocked}

              compact={compact}

            />

            </View>

          ) : playingPhase ? (

            <View style={{ flex: 1, minHeight: 300, paddingTop: boardTopInset, position: "relative" }}>

            <GameBoard

              lobby={lobby}

              me={me}

              playerName={playerName}

              onSelectCard={handleSelectCard}

              setSelectedCard={setSelectedCard}

            />

            <GameActionBar

              lobby={lobby}

              isMyTurn={isMyTurn}

              onDraw={onDraw}

              onShow={onShow}

              onDiscard={onDiscard}

              actionDisabled={actionLock.isLocked}

              bottomInset={insets.bottom}

            />

            </View>

          ) : null}

        </View>



        {playingPhase && me && (

        <MagicCardModal

          lobby={lobby}

          me={me}

          isMyTurn={isMyTurn}

          selectedCard={isMagicSelected ? selectedCard : null}

          setSelectedCard={setSelectedCard}

          handleShow={onShow}

          handleDiscard={onDiscard}

          handleDrink={onDrink}

          handleActivateEffect={onActivateEffect}

          handleVote={onVote}

          handleCloseVoteResult={onCloseVoteResult}

          onDone={onDone}

          onResultOk={onResultOk}

          actionDisabled={actionLock.isLocked}

        />

        )}

        {playingPhase && pendingTrapChoice && (
          <TrapChoiceModal
            pending={pendingTrapChoice}
            isChooser={!!isTrapChooser}
            onChoose={onResolveTrapChoice}
            onTimeout={onResolveTrapChoice}
            actionDisabled={actionLock.isLocked}
          />
        )}

        <CommentatorBubble
          text={commentary}
          compact={compact}
          overlayActive={overlayActive}
          bottomOffset={commentatorBottomOffset}
          topOffset={hudTop + 52}
        />

      </LinearGradient>

      <CardModalDebugOverlay />

    </>

  );

}

