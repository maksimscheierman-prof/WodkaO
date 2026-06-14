import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { doc, getDoc, onSnapshot, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { db } from "../firebaseConfig";
import { DEFAULT_TIMERS, EMPTY_TIMER_STARTS } from "../src/config/timers";
import { useAsyncLock } from "../src/hooks/useAsyncLock";
import { buildGameDecks } from "../src/utils/gameLogic";
import { GAME_PHASES } from "../src/config/gamePhases";
import {
  activityPatch,
  ensureJoinableLobby,
  EXPIRED_LOBBY_MESSAGE,
  handleLeaveLobby,
  isLobbyExpired,
  isLobbyJoinable,
  LOBBY_STATUS,
  markLobbyExpired,
  withActivity,
} from "../src/utils/lobbyLifecycle";
import { joinLobbyTransaction } from "../src/utils/lateJoin";
import { clearSession, saveSession } from "../src/utils/sessionStorage";

// Lobby-Code Generator
const generateCode = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return Array.from({ length: 5 })
    .map(() => chars[Math.floor(Math.random() * chars.length)])
    .join("");
};

export default function Lobby() {
  const router = useRouter();
  const { playerName, expiredMessage } = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  const [joinCode, setJoinCode] = useState("");
  const [createdCode, setCreatedCode] = useState(null);
  const [lobbyId, setLobbyId] = useState(null);
  const [players, setPlayers] = useState([]);
  const [message, setMessage] = useState(null);

  const createLock = useAsyncLock();
  const joinLock = useAsyncLock();
  const readyLock = useAsyncLock();
  const leaveLock = useAsyncLock();
  const [isStarting, setIsStarting] = useState(false);
  const isStartingRef = useRef(false);

  useEffect(() => {
    if (expiredMessage) {
      setMessage({ type: "error", text: expiredMessage });
    }
  }, [expiredMessage]);

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
    const ref = doc(db, "lobbies", lobbyId);
    const unsub = onSnapshot(ref, async (snap) => {
      if (!snap.exists()) {
        setPlayers([]);
        setMessage({ type: "error", text: "❌ Lobby nicht mehr vorhanden." });
        setLobbyId(null);
        setCreatedCode(null);
        return;
      }

      const data = snap.data();
      console.log("[LOBBY SNAPSHOT]", JSON.stringify(data, null, 2));

      if (isLobbyExpired(data)) {
        if (data.status !== LOBBY_STATUS.EXPIRED) {
          await markLobbyExpired(ref).catch((err) =>
            console.error("[LOBBY EXPIRE]", err)
          );
        }
        await clearSession();
        setPlayers([]);
        setLobbyId(null);
        setCreatedCode(null);
        setMessage({ type: "error", text: EXPIRED_LOBBY_MESSAGE });
        return;
      }

      setPlayers(data.players || []);

      const me = (data.players || []).find((p) => p.name === playerName);
      await saveSession({
        playerName,
        lobbyId,
        playerId: me?.id,
        status: data.status,
        gamePhase: data.gamePhase ?? null,
      });

      if (data.status === LOBBY_STATUS.PLAYING) {
        console.log("[LOBBY] Spiel gestartet → Redirect zu /game");
        router.replace({
          pathname: "/game",
          params: { lobbyId, playerName },
        });
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
        status: LOBBY_STATUS.WAITING,
        createdAt: serverTimestamp(),
        ...activityPatch(),
        turn: 0,
        lastMagic: null,
        discardPile: [],
        round: 1,
        effectsUsed: {},
        showMagic: false,
        reactions: {},
        reactingPlayers: [],
        gamePhase: null,
        timers: DEFAULT_TIMERS,
        ...EMPTY_TIMER_STARTS,
      };

      await setDoc(doc(db, "lobbies", code), lobbyData);

      const hostId = lobbyData.players[0].id;
      await saveSession({
        playerName,
        lobbyId: code,
        playerId: hostId,
        status: LOBBY_STATUS.WAITING,
        gamePhase: null,
      });

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

      const alreadyJoined = data.players.some((p) => p.name === playerName);
      if (alreadyJoined) {
        if (!isLobbyJoinable(data)) {
          setMessage({ type: "error", text: EXPIRED_LOBBY_MESSAGE });
          return;
        }
        setMessage({
          type: "info",
          text: "ℹ️ Du bist bereits in dieser Lobby.",
        });
        setLobbyId(code);
        await saveSession({
          playerName,
          lobbyId: code,
          playerId: data.players.find((p) => p.name === playerName)?.id,
          status: data.status,
          gamePhase: data.gamePhase ?? null,
        });
        return;
      }

      const joinCheck = await ensureJoinableLobby(ref, data);
      if (!joinCheck.ok) {
        setMessage({ type: "error", text: joinCheck.message });
        return;
      }

      if (!data.timers) {
        await updateDoc(ref, withActivity({ timers: DEFAULT_TIMERS }));
      }

      const playerId = Date.now().toString();
      const joinResult = await joinLobbyTransaction(db, ref, playerName, playerId);

      if (!joinResult.ok) {
        setMessage({
          type: "error",
          text: `❌ ${joinResult.message || "Fehler beim Beitreten."}`,
        });
        return;
      }

      console.log(
        "[JOIN]",
        playerName,
        "in Lobby",
        code,
        joinResult.isLateJoin ? "(late join)" : ""
      );
      setLobbyId(code);
      setMessage({
        type: joinResult.isLateJoin ? "info" : "success",
        text: joinResult.message,
      });
      await saveSession({
        playerName,
        lobbyId: code,
        playerId,
        status: data.status,
        gamePhase: data.gamePhase ?? null,
      });
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
      if (isLobbyExpired(data)) {
        releaseStartLock();
        setMessage({ type: "error", text: EXPIRED_LOBBY_MESSAGE });
        return;
      }

      if (data.status === LOBBY_STATUS.PLAYING) {
        releaseStartLock();
        return;
      }

      const { monsterDeck, saufDeck } = await buildGameDecks();
      const playerNames = data.players.map((p) => p.name);

      await updateDoc(ref, withActivity({
        players: data.players.map((p) => ({
          ...p,
          monster: null,
          trap: null,
        })),
        status: LOBBY_STATUS.PLAYING,
        gamePhase: GAME_PHASES.ROLLING,
        diceRolls: {},
        diceRound: 1,
        rollingEligible: playerNames,
        startPlayerName: null,
        monsterDeck,
        saufDeck,
        turn: 0,
        discardPile: [],
        round: 1,
        effectsUsed: {},
        lastMagic: null,
        showMagic: false,
        reactions: Object.fromEntries(
          playerNames.map((name) => [name, { done: false }])
        ),
        reactingPlayers: [],
        timers: data.timers || DEFAULT_TIMERS,
        ...EMPTY_TIMER_STARTS,
      }));

      router.replace({ pathname: "/game", params: { lobbyId, playerName } });
    } catch (error) {
      console.error("Start Game Error:", error);
      setMessage({ type: "error", text: "❌ Fehler beim Starten des Spiels." });
      releaseStartLock();
    }
  };

  const leaveLobby = () => {
    if (!lobbyId || leaveLock.isLocked) return;

    leaveLock.runLocked(async () => {
      const ref = doc(db, "lobbies", lobbyId);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        await handleLeaveLobby(ref, snap.data(), playerName);
      }
      setLobbyId(null);
      setCreatedCode(null);
      setPlayers([]);
      await clearSession();
      setMessage({ type: "info", text: "Du hast die Lobby verlassen." });
    }).catch((error) => {
      console.error("Leave Lobby Error:", error);
      setMessage({ type: "error", text: "❌ Fehler beim Verlassen." });
    });
  };

  const me = players.find((p) => p.name === playerName);
  const allReady = players.length > 0 && players.every((p) => p.ready);
  const lobbyBusy =
    createLock.isLocked ||
    joinLock.isLocked ||
    readyLock.isLocked ||
    leaveLock.isLocked ||
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
        paddingTop: 20 + insets.top,
      }}
    >
      {message && (
        <View
          style={{
            position: "absolute",
            top: insets.top,
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

      {lobbyId && (
        <TouchableOpacity
          style={leaveLock.isLocked ? disabledButtonStyle : buttonStyle}
          onPress={leaveLobby}
          disabled={leaveLock.isLocked || isStarting}
        >
          <Text style={textStyle}>← Lobby verlassen</Text>
        </TouchableOpacity>
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
