import { LinearGradient } from "expo-linear-gradient";

import { useLocalSearchParams, useRouter } from "expo-router";

import { doc, getDoc } from "firebase/firestore";

import { useCallback, useEffect, useRef, useState } from "react";

import { Text, useWindowDimensions, View, Alert } from "react-native";

import { useSafeAreaInsets } from "react-native-safe-area-context";

import { db } from "../firebaseConfig";

import CardModal from "../src/components/CardModal";

import GameActionBar from "../src/components/GameActionBar";
import GameBoard from "../src/components/GameBoard";
import GameExitButton from "../src/components/GameExitButton";

import GameSetupPanel from "../src/components/GameSetupPanel";

import LobbyCodeBadge from "../src/components/LobbyCodeBadge";

import MagicCardModal from "../src/components/MagicCardModal";

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
  handleLeaveLobby,
  isLobbyExpired,
  LOBBY_STATUS,
  markLobbyExpired,
} from "../src/utils/lobbyLifecycle";
import {
  getCardOpenLog,
  isValidPlayableCard,
  normalizeCardForDisplay,
} from "../src/utils/cardDisplay";
import { clearSession, saveSession } from "../src/utils/sessionStorage";



export default function Game() {

  const { lobbyId, playerName } = useLocalSearchParams();

  const router = useRouter();

  const lobby = useLobby(lobbyId);

  const lobbyRef = doc(db, "lobbies", lobbyId);

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

      await clearSession();
      router.replace({ pathname: "/", params: { playerName } });
    });
  }, [actionLock, lobby, lobbyRef, playerName, router]);

  const requestLeaveGame = useCallback(() => {
    confirmLeaveGame(performLeaveGame);
  }, [performLeaveGame]);

  useGameExitGuard(requestLeaveGame, !!lobby);



  const runAction = useCallback(

    (fn) => {

      if (!lobby) return;

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

      await actions.handleActivateEffect(lobbyRef, card, me.name);

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



  const isMagicSelected =

    typeof selectedCard?.type === "string" &&

    selectedCard.type.toLowerCase() === "magic";

  const handleSelectCard = useCallback(
    (card, ownerName) => {
      if (!isValidPlayableCard(card)) {
        console.error("[CARD SELECT] Invalid card", {
          route: "game",
          lobbyId,
          playerName,
          ownerName,
          cardType: card?.type,
          cardName: card?.name || card?.title,
        });
        Alert.alert(
          "Karte nicht verfügbar",
          "Diese Karte konnte nicht geladen werden."
        );
        return;
      }

      const normalized = normalizeCardForDisplay(card);
      console.log("[CARD SELECT]", getCardOpenLog(card, "game"));
      setSelectedCard(normalized);

      const type =
        typeof normalized.type === "string"
          ? normalized.type.toLowerCase()
          : "";
      if (
        ownerName === playerName &&
        (type === "monster" || type === "trap") &&
        lobby
      ) {
        actions
          .setViewingCard(lobbyRef, lobby, playerName, type)
          .catch((err) => console.error("[VIEWING CARD]", err));
      }
    },
    [lobby, lobbyId, lobbyRef, playerName]
  );

  const handleCloseCardModal = useCallback(() => {
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



  const players = lobby.players || [];

  const me = players.find((p) => p.name === playerName);

  const isMyTurn = players[lobby.turn]?.name === playerName;

  const activePlayer = players[lobby.turn]?.name;

  const setupPhase = isSetupPhase(lobby.gamePhase);

  const playingPhase = isPlayingPhase(lobby.gamePhase, lobby);

  const boardTopInset = getBoardTopInset(screenHeight, insets.top);



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
            </View>
          </View>



          {setupPhase ? (

            <View style={{ flex: 1, paddingTop: boardTopInset }}>

            <GameSetupPanel

              lobby={lobby}

              playerName={playerName}

              onRollDice={onRollDice}

              onDrawMonster={onDrawMonster}

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

      </LinearGradient>

    </>

  );

}

