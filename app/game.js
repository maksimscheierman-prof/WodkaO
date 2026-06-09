import { LinearGradient } from "expo-linear-gradient";

import { useLocalSearchParams } from "expo-router";

import { doc } from "firebase/firestore";

import { useCallback, useEffect, useRef, useState } from "react";

import { Text, useWindowDimensions, View } from "react-native";

import { db } from "../firebaseConfig";

import CardModal from "../src/components/CardModal";

import GameBoard from "../src/components/GameBoard";

import LobbyCodeBadge from "../src/components/LobbyCodeBadge";

import MagicCardModal from "../src/components/MagicCardModal";

import VotePanel from "../src/components/VotePanel";

import { useAsyncLock } from "../src/hooks/useAsyncLock";

import { useLobby } from "../src/hooks/useLobby";

import { gameStyles } from "../src/styles/gameStyles";

import * as actions from "../src/utils/gameActions";

import { handleCloseVoteResult } from "../src/utils/gameActions";



export default function Game() {

  const { lobbyId, playerName } = useLocalSearchParams();

  const lobby = useLobby(lobbyId);

  const lobbyRef = doc(db, "lobbies", lobbyId);

  const [selectedCard, setSelectedCard] = useState(null);

  const actionLock = useAsyncLock();

  const { width: screenWidth } = useWindowDimensions();

  const compact = screenWidth < 400;



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

      await actions.handleDraw(lobbyRef, setSelectedCard);

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
      if (!card) return;
      setSelectedCard(card);

      const type =
        typeof card.type === "string" ? card.type.toLowerCase() : "";
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
    [lobby, lobbyRef, playerName]
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

              top: compact ? 4 : 6,

              right: compact ? 4 : 6,

              zIndex: 20,

            }}

          />



          <View

            style={{

              position: "absolute",

              top: compact ? 4 : 6,

              left: compact ? 6 : 8,

              zIndex: 20,

              maxWidth: screenWidth * 0.55,

              paddingRight: 8,

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

              {isMyTurn

                ? "🎯 Du bist am Zug!"

                : `⏳ ${activePlayer || "…"} ist am Zug`}

            </Text>

          </View>



          <GameBoard

            lobby={lobby}

            me={me}

            playerName={playerName}

            isMyTurn={isMyTurn}

            onDraw={onDraw}

            onShow={onShow}

            onDiscard={onDiscard}

            onSelectCard={handleSelectCard}

            setSelectedCard={setSelectedCard}

            actionDisabled={actionLock.isLocked}

          />

        </View>



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



        <VotePanel

          lobby={lobby}

          playerName={playerName}

          handleVote={onVote}

          actionDisabled={actionLock.isLocked}

        />

      </LinearGradient>

    </>

  );

}

