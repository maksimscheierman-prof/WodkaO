import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { doc, getDoc, onSnapshot, setDoc, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import { db } from "../firebaseConfig";
import { DEFAULT_TIMERS, EMPTY_TIMER_STARTS } from "../src/config/timers";
import { randomMonster, randomTrap } from "../src/utils/gameLogic";

const random = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Lobby-Code Generator
const generateCode = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return Array.from({ length: 5 })
    .map(() => chars[Math.floor(Math.random() * chars.length)])
    .join("");
};

export default function Lobby() {
  const router = useRouter();
  const { playerName } = useLocalSearchParams();

  const [joinCode, setJoinCode] = useState("");
  const [createdCode, setCreatedCode] = useState(null);
  const [lobbyId, setLobbyId] = useState(null);
  const [players, setPlayers] = useState([]);
  const [message, setMessage] = useState(null);

  const buttonStyle = {
    backgroundColor: "#D9C9A3",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: "#5C4033",
    marginTop: 20,
  };

  const textStyle = {
    color: "#2E1F12",
    fontSize: 16,
    fontWeight: "bold",
  };

  // 🔴 Live-Updates der Lobby
  useEffect(() => {
    if (!lobbyId) return;
    const unsub = onSnapshot(doc(db, "lobbies", lobbyId), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        console.log("[LOBBY SNAPSHOT]", JSON.stringify(data, null, 2));
        setPlayers(data.players || []);

        // 🚀 Redirect für ALLE Spieler
        if (data.status === "playing") {
          console.log("[LOBBY] Spiel gestartet → Redirect zu /game");
          router.replace({
            pathname: "/game",
            params: { lobbyId, playerName },
          });
        }
      }
    });
    return unsub;
  }, [lobbyId]);

  // Neue Lobby erstellen
  const createLobby = async () => {
    try {
      const code = generateCode();
      setCreatedCode(code);
      setLobbyId(code);

      const lobbyData = {
        players: [
          {
            id: Date.now().toString(),
            name: playerName,
            ready: false,
            isHost: true,
            monster: null,
            trap: null,
            shots: 0,
          },
        ],
        status: "waiting",
        createdAt: Date.now(),
        turn: 0,
        lastMagic: null,
        discardPile: [],
        round: 1,
        effectsUsed: {},
        showMagic: true, // Karte wird angezeigt
        reactions: { [playerName]: { done: false } }, // wer hat reagiert
        reactingPlayers: [], // alle, die noch reagieren müssen (optional)

        // ✅ Timer-Config und Startpunkte
        timers: DEFAULT_TIMERS,
        ...EMPTY_TIMER_STARTS,
      };

      await setDoc(doc(db, "lobbies", code), lobbyData);

      console.log("[CREATE LOBBY]", lobbyData);
      setMessage({ type: "success", text: `Lobby ${code} erstellt!` });
    } catch (error) {
      console.error("Create Lobby Error:", error);
      setMessage({
        type: "error",
        text: "❌ Fehler beim Erstellen der Lobby.",
      });
    }
  };

  // Lobby beitreten
  const joinLobby = async () => {
    if (!joinCode) {
      setMessage({ type: "error", text: "⚠️ Bitte gib einen Lobby-Code ein." });
      return;
    }

    try {
      const code = joinCode.trim().toUpperCase();
      const ref = doc(db, "lobbies", code);
      const snap = await getDoc(ref);

      if (!snap.exists()) {
        setMessage({ type: "error", text: `❌ Lobby ${code} nicht gefunden.` });
        return;
      }

      const data = snap.data();
      if (data.players.some((p) => p.name === playerName)) {
        setMessage({
          type: "info",
          text: "ℹ️ Du bist bereits in dieser Lobby.",
        });
        setLobbyId(code);
        return;
      }
      if (!data.timers) {
        await updateDoc(ref, { timers: DEFAULT_TIMERS });
      }

      const newPlayer = {
        id: Date.now().toString(),
        name: playerName,
        ready: false,
        isHost: false,
        monster: null,
        trap: null,
        shots: 0,
      };

      const updatedPlayers = [...data.players, newPlayer];
      await updateDoc(ref, { players: updatedPlayers });

      console.log("[JOIN]", playerName, "in Lobby", code);
      setLobbyId(code);
      setMessage({ type: "success", text: `✅ Lobby ${code} beigetreten!` });
    } catch (error) {
      console.error("[JOIN ERROR]", error);
      setMessage({ type: "error", text: "❌ Fehler beim Beitreten." });
    }
  };

  // Ready umschalten
  const toggleReady = async () => {
    if (!lobbyId) return;
    try {
      const ref = doc(db, "lobbies", lobbyId);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        const updatedPlayers = data.players.map((p) =>
          p.name === playerName ? { ...p, ready: !p.ready } : p
        );
        await updateDoc(ref, { players: updatedPlayers });
      }
    } catch (error) {
      console.error("Toggle Ready Error:", error);
    }
  };

  // Host startet das Spiel
  const startGame = async () => {
    try {
      const ref = doc(db, "lobbies", lobbyId);
      const snap = await getDoc(ref);
      if (!snap.exists()) return;

      const data = snap.data();

      // 🚀 Monster & Falle jetzt aus Google Sheet / GitHub
      const playersWithCards = await Promise.all(
        data.players.map(async (p) => ({
          ...p,
          monster: await randomMonster(),
          trap: await randomTrap(),
        }))
      );

      await updateDoc(ref, {
        players: playersWithCards,
        status: "playing",
        discardPile: [],
        round: 1,
        effectsUsed: {},
        lastMagic: null,
        showMagic: true, // Karte wird angezeigt
        reactions: { [playerName]: { done: false } }, // wer hat reagiert
        reactingPlayers: [], // alle, die noch reagieren müssen (optional)

        // ✅ Timer-Config sicher vorhanden lassen
        timers: data.timers || DEFAULT_TIMERS,

        // ✅ Timer-Startpunkte resetten
        ...EMPTY_TIMER_STARTS,
      });

      router.replace({ pathname: "/game", params: { lobbyId, playerName } });
    } catch (error) {
      console.error("Start Game Error:", error);
      setMessage({ type: "error", text: "❌ Fehler beim Starten des Spiels." });
    }
  };

  const me = players.find((p) => p.name === playerName);
  const allReady = players.length > 0 && players.every((p) => p.ready);

  return (
    <LinearGradient
      colors={["#1a0033", "#000000"]}
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        gap: 16,
        padding: 20,
      }}
    >
      {message && (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            padding: 10,
            backgroundColor:
              message?.type === "error"
                ? "#b71c1c"
                : message?.type === "success"
                ? "#1b5e20"
                : "#f57f17",
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "bold" }}>
            {message.text}
          </Text>
        </View>
      )}

      <Text style={{ fontSize: 22, color: "#fff", marginBottom: 10 }}>
        🔥 Lobby
      </Text>
      <Text style={{ color: "#fff" }}>👤 Spielername: {playerName}</Text>

      {!lobbyId && (
        <>
          <TouchableOpacity style={buttonStyle} onPress={createLobby}>
            <Text style={textStyle}>✨ Lobby erstellen</Text>
          </TouchableOpacity>

          <TextInput
            placeholder="Lobby-Code eingeben"
            value={joinCode}
            onChangeText={setJoinCode}
            style={{
              marginTop: 20,
              backgroundColor: "#fff",
              padding: 10,
              borderRadius: 8,
              width: 200,
              textAlign: "center",
            }}
          />
          <TouchableOpacity style={buttonStyle} onPress={joinLobby}>
            <Text style={textStyle}>➡️ Beitreten</Text>
          </TouchableOpacity>
        </>
      )}

      {createdCode && (
        <Text style={{ color: "#fff", marginTop: 10 }}>
          📢 Dein Lobby-Code:{" "}
          <Text style={{ fontWeight: "bold" }}>{createdCode}</Text>
        </Text>
      )}

      {players.length > 0 && (
        <View style={{ marginTop: 30, alignItems: "center" }}>
          <Text style={{ color: "#fff", fontWeight: "bold" }}>
            Spieler in Lobby:
          </Text>
          {players.map((p) => (
            <Text key={p.id} style={{ color: p.ready ? "#0f0" : "#fff" }}>
              {p.name} {p.isHost ? "(Host)" : ""} {p.ready ? "✅" : "⏳"}
            </Text>
          ))}
        </View>
      )}

      {me && (
        <TouchableOpacity style={buttonStyle} onPress={toggleReady}>
          <Text style={textStyle}>
            {me.ready ? "❌ Nicht bereit" : "✅ Bereit"}
          </Text>
        </TouchableOpacity>
      )}

      {me?.isHost && allReady && (
        <TouchableOpacity style={buttonStyle} onPress={startGame}>
          <Text style={textStyle}>▶️ Spiel starten</Text>
        </TouchableOpacity>
      )}
    </LinearGradient>
  );
}
