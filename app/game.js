import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams } from "expo-router";
import { doc } from "firebase/firestore";
import { useState } from "react";
import { Text } from "react-native";
import { db } from "../firebaseConfig";
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

  if (!lobby)
    return (
      <LinearGradient
        colors={["#1a0033", "#000000"]}
        style={gameStyles.container}
      >
        <Text style={{ color: "#fff" }}>⏳ Lade Lobby...</Text>
      </LinearGradient>
    );

  const players = lobby.players || [];
  const me = players.find((p) => p.name === playerName);
  const others = players.filter((p) => p.name !== playerName);
  const isMyTurn = players[lobby.turn]?.name === playerName;

  return (
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
        onShow={() => actions.handleShow(lobbyRef, lobby)}
        onDiscard={() => actions.handleDiscard(lobbyRef, lobby)}
        setSelectedCard={setSelectedCard}
      />

      <MagicCardModal
        lobby={lobby}
        me={me}
        isMyTurn={isMyTurn}
        selectedCard={selectedCard}
        setSelectedCard={setSelectedCard}
        handleShow={() => actions.handleShow(lobbyRef, lobby)}
        handleDiscard={() => actions.handleDiscard(lobbyRef, lobby)}
        handleDrink={(player) => actions.handleDrink(lobbyRef, lobby, player)}
        handleActivateEffect={(card, type) =>
          actions.handleActivateEffect(lobbyRef, lobby, card, me.name)
        }
        handleVote={(v) => actions.handleVote(lobbyRef, lobby, playerName, v)}
      />

      <VotePanel
        lobby={lobby}
        playerName={playerName}
        handleVote={(v) => actions.handleVote(lobby, lobbyRef, playerName, v)}
      />
    </LinearGradient>
  );
}
