import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams } from "expo-router";
import { doc } from "firebase/firestore";
import { useState } from "react";
import { Text } from "react-native";
import { db } from "../firebaseConfig";
import CardModal from "../src/components/CardModal"; // ✅ FEHLTE
import GameBoard from "../src/components/GameBoard";
import MagicCardModal from "../src/components/MagicCardModal";
import VotePanel from "../src/components/VotePanel";
import { useLobby } from "../src/hooks/useLobby";
import { gameStyles } from "../src/styles/gameStyles";
import * as actions from "../src/utils/gameActions";

export default function Game() {
  const { lobbyId, playerName } = useLocalSearchParams();
  const lobby = useLobby(lobbyId);
  const lobbyRef = doc(db, "lobbies", lobbyId);
  const [selectedCard, setSelectedCard] = useState(null);
  const onShow = () => {
    actions.handleShow(lobbyRef, lobby);
    setSelectedCard(null); // 👈 lokale Magic schließen
  };

  const onDiscard = () => {
    actions.handleDiscard(lobbyRef, lobby);
    setSelectedCard(null); // 👈 lokale Magic schließen
  };

  const isMagicSelected =
    typeof selectedCard?.type === "string" &&
    selectedCard.type.toLowerCase() === "magic";

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
  const others = players.filter((p) => p.name !== playerName);
  const isMyTurn = players[lobby.turn]?.name === playerName;

  const onActivateEffect = (card) =>
    actions.handleActivateEffect(lobbyRef, card, me.name);

  return (
    <>
      {/* 🔒 Preview-Modal nur für Monster/Falle */}
      {!isMagicSelected && (
        <CardModal
          selectedCard={selectedCard}
          setSelectedCard={setSelectedCard}
        />
      )}

      <LinearGradient
        colors={["#1a0033", "#000000"]}
        style={gameStyles.container}
      >
        <Text style={{ color: "#fff", fontSize: 22, textAlign: "center" }}>
          🎴 Spiel läuft – Lobby {lobbyId}
        </Text>

        <Text
          style={{
            color: "#0f0",
            fontSize: 24,
            fontWeight: "bold",
            textAlign: "center",
            marginBottom: 10,
          }}
        >
          {isMyTurn
            ? "🎯 Du bist am Zug!"
            : `Warten auf ${lobby.players[lobby.turn]?.name}...`}
        </Text>

        <GameBoard
          lobby={lobby}
          me={me}
          others={others}
          isMyTurn={isMyTurn}
          onDraw={() => actions.handleDraw(lobbyRef, setSelectedCard)}
          onShow={onShow}
          onDiscard={onDiscard}
          setSelectedCard={setSelectedCard}
          handleActivateEffect={onActivateEffect}
        />

        {/* Magic-Modal nur für Magic */}
        <MagicCardModal
          lobby={lobby}
          me={me}
          isMyTurn={isMyTurn}
          selectedCard={isMagicSelected ? selectedCard : null} // ✅ nur Magic rein
          setSelectedCard={setSelectedCard}
          handleShow={() => actions.handleShow(lobbyRef, lobby)}
          handleDiscard={() => actions.handleDiscard(lobbyRef, lobby)}
          handleDrink={(player) => actions.handleDrink(lobbyRef, lobby, player)}
          handleActivateEffect={onActivateEffect}
          handleVote={(v) => actions.handleVote(lobbyRef, lobby, playerName, v)}
          handleCloseVoteResult={() => actions.handleCloseVoteResult(lobbyRef)}
          onDone={(name) => actions.handleReactionDone(lobbyRef, lobby, name)}
          onResultOk={(name) => actions.handleResultAck(lobbyRef, lobby, name)}
        />

        <VotePanel
          lobby={lobby}
          playerName={playerName}
          handleVote={(v) => actions.handleVote(lobbyRef, lobby, playerName, v)}
        />
      </LinearGradient>
    </>
  );
}
