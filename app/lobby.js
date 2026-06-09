import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { doc, getDoc, onSnapshot, setDoc, updateDoc } from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from "react-native";
import { db } from "../firebaseConfig";
import { DEFAULT_TIMERS, EMPTY_TIMER_STARTS } from "../src/config/timers";
import { useAsyncLock } from "../src/hooks/useAsyncLock";
import { randomMonster, randomTrap } from "../src/utils/gameLogic";

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

  const createLock = useAsyncLock();
  const joinLock = useAsyncLock();
  const readyLock = useAsyncLock();
  const [isStarting, setIsStarting] = useState(false);
  const isStartingRef = useRef(false);

  const buttonStyle = {
    backgroundColor: "#D9C9A3",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: "#5C4033",
    marginTop: 20,
  };

  const disabledButtonStyle = {
    ...buttonStyle,
    backgroundColor: "#9a8f78",
    opacity: 0.7,
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
  }, [lobbyId, playerName, router]);

  // Neue Lobby erstellen
  const createLobby = () => {
    createLock.runLocked(async () => {
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
        showMagic: true,
        reactions: { [playerName]: { done: false } },
        reactingPlayers: [],
        timers: DEFAULT_TIMERS,
        ...EMPTY_TIMER_STARTS,
      };

      await setDoc(doc(db, "lobbies", code), lobbyData);

      console.log("[CREATE LOBBY]", lobbyData);
      setMessage({ type: "success", text: `Lobby ${code} erstellt!` });
    }).catch((error) => {
      console.error("Create Lobby Error:", error);
      setMessage({
        type: "error",
        text: "❌ Fehler beim Erstellen der Lobby.",
      });
    });
  };

  // Lobby beitreten
  const joinLobby = () => {
    if (!joinCode) {
      setMessage({ type: "error", text: "⚠️ Bitte gib einen Lobby-Code ein." });
      return;
    }

    joinLock.runLocked(async () => {
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

      if (data.players.length >= 8) {
        setMessage({
          type: "error",
          text: "❌ Lobby ist voll (max. 8 Spieler).",
        });
        return;
      }

      if (!data.timers) {
        await updateDoc(ref, { timers: DEFAULT_TIMERS });
      }

      const joiningDuringGame = data.status === "playing";

      const newPlayer = {
        id: Date.now().toString(),
        name: playerName,
        ready: joiningDuringGame ? true : false,
        isHost: false,
        monster: joiningDuringGame ? await randomMonster() : null,
        trap: joiningDuringGame ? await randomTrap() : null,
        shots: 0,
      };

      const updatedPlayers = [...data.players, newPlayer];
      await updateDoc(ref, { players: updatedPlayers });

      console.log("[JOIN]", playerName, "in Lobby", code);
      setLobbyId(code);
      setMessage({ type: "success", text: `✅ Lobby ${code} beigetreten!` });
    }).catch((error) => {
      console.error("[JOIN ERROR]", error);
      setMessage({ type: "error", text: "❌ Fehler beim Beitreten." });
    });
  };

  // Ready umschalten
  const toggleReady = () => {
    if (!lobbyId || readyLock.isLocked) return;

    readyLock.runLocked(async () => {
      const ref = doc(db, "lobbies", lobbyId);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        const updatedPlayers = data.players.map((p) =>
          p.name === playerName ? { ...p, ready: !p.ready } : p
        );
        await updateDoc(ref, { players: updatedPlayers });
      }
    }).catch((error) => {
      console.error("Toggle Ready Error:", error);
    });
  };

  const releaseStartLock = () => {
    isStartingRef.current = false;
    setIsStarting(false);
  };

  // Host startet das Spiel
  const startGame = async () => {
    if (isStartingRef.current) return;
    isStartingRef.current = true;
    setIsStarting(true);

    try {
      const ref = doc(db, "lobbies", lobbyId);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        releaseStartLock();
        return;
      }

      const data = snap.data();
      if (data.status === "playing") {
        releaseStartLock();
        return;
      }

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
        showMagic: true,
        reactions: { [playerName]: { done: false } },
        reactingPlayers: [],
        timers: data.timers || DEFAULT_TIMERS,
        ...EMPTY_TIMER_STARTS,
      });

      router.replace({ pathname: "/game", params: { lobbyId, playerName } });
    } catch (error) {
      console.error("Start Game Error:", error);
      setMessage({ type: "error", text: "❌ Fehler beim Starten des Spiels." });
      releaseStartLock();
    }
  };

  const me = players.find((p) => p.name === playerName);
  const allReady = players.length > 0 && players.every((p) => p.ready);
  const lobbyBusy =
    createLock.isLocked ||
    joinLock.isLocked ||
    readyLock.isLocked ||
    isStarting;

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
          <TouchableOpacity
            style={createLock.isLocked ? disabledButtonStyle : buttonStyle}
            onPress={createLobby}
            disabled={createLock.isLocked || lobbyBusy}
          >
            {createLock.isLocked ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <ActivityIndicator size="small" color="#2E1F12" />
                <Text style={textStyle}>Lobby wird erstellt...</Text>
              </View>
            ) : (
              <Text style={textStyle}>✨ Lobby erstellen</Text>
            )}
          </TouchableOpacity>

          <TextInput
            placeholder="Lobby-Code eingeben"
            value={joinCode}
            onChangeText={setJoinCode}
            editable={!joinLock.isLocked}
            style={{
              marginTop: 20,
              backgroundColor: "#fff",
              padding: 10,
              borderRadius: 8,
              width: 200,
              textAlign: "center",
              opacity: joinLock.isLocked ? 0.6 : 1,
            }}
          />
          <TouchableOpacity
            style={joinLock.isLocked ? disabledButtonStyle : buttonStyle}
            onPress={joinLobby}
            disabled={joinLock.isLocked || lobbyBusy}
          >
            {joinLock.isLocked ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <ActivityIndicator size="small" color="#2E1F12" />
                <Text style={textStyle}>Beitritt läuft...</Text>
              </View>
            ) : (
              <Text style={textStyle}>➡️ Beitreten</Text>
            )}
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
        <TouchableOpacity
          style={readyLock.isLocked ? disabledButtonStyle : buttonStyle}
          onPress={toggleReady}
          disabled={readyLock.isLocked || isStarting}
        >
          <Text style={textStyle}>
            {me.ready ? "❌ Nicht bereit" : "✅ Bereit"}
          </Text>
        </TouchableOpacity>
      )}

      {me?.isHost && allReady && (
        <TouchableOpacity
          style={isStarting ? disabledButtonStyle : buttonStyle}
          onPress={startGame}
          disabled={isStarting}
        >
          {isStarting ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <ActivityIndicator size="small" color="#2E1F12" />
              <Text style={textStyle}>Spiel wird gestartet...</Text>
            </View>
          ) : (
            <Text style={textStyle}>▶️ Spiel starten</Text>
          )}
        </TouchableOpacity>
      )}
    </LinearGradient>
  );
}
