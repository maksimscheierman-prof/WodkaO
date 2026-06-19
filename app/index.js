import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text, TextInput, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { db } from "../firebaseConfig";
import { loadSession } from "../src/utils/sessionStorage";
import { resolveResumeSession } from "../src/utils/sessionResume";
import { hiddenHeaderScreenOptions } from "../src/utils/stackScreenOptions";

export const options = hiddenHeaderScreenOptions;

export default function Index() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [playerName, setPlayerName] = useState("");
  const [dbStatus, setDbStatus] = useState("⏳ Firestore wird getestet...");
  const [savedSession, setSavedSession] = useState(null);
  const [resumeLoading, setResumeLoading] = useState(false);
  const [resumeMessage, setResumeMessage] = useState(null);

  const buttonStyle = {
    backgroundColor: "#D9C9A3",
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: "#5C4033",
    marginTop: 20,
  };

  const textStyle = {
    color: "#2E1F12",
    fontSize: 18,
    fontWeight: "bold",
  };

  useEffect(() => {
    loadSession().then((session) => {
      if (session) {
        setSavedSession(session);
        if (!playerName) {
          setPlayerName(session.playerName || "");
        }
      }
    });
  }, []);

  useEffect(() => {
    const testFirestore = async () => {
      try {
        const ref = doc(db, "tests", "connectionCheck");
        await setDoc(ref, { ok: true, time: Date.now() });
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setDbStatus("✅ Firestore verbunden!");
        } else {
          setDbStatus("⚠️ Firestore verbunden, aber kein Dokument.");
        }
      } catch (error) {
        console.error("❌ Firestore-Verbindung fehlgeschlagen:", error);
        setDbStatus("❌ Keine Firestore-Verbindung!");
      }
    };

    testFirestore();
  }, []);

  const resumeLastSession = async () => {
    setResumeLoading(true);
    setResumeMessage(null);
    try {
      const result = await resolveResumeSession();
      if (!result.ok || !result.route) {
        setResumeMessage(result.message || "Session nicht mehr gültig.");
        setSavedSession(null);
        return;
      }

      const name = result.route.playerName || playerName;
      router.push({
        pathname: result.route.pathname,
        params: { lobbyId: result.route.lobbyId, playerName: name },
      });
    } catch (error) {
      console.error("[RESUME SESSION]", error);
      setResumeMessage("Fortsetzen fehlgeschlagen. Bitte neu beitreten.");
    } finally {
      setResumeLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={["#1a0033", "#000000"]}
      style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      <Text style={{ fontSize: 28, color: "#fff", marginBottom: 20 }}>
        🔥 Vod-ka-Oh! Trinkspiel
      </Text>

      <Text style={{ color: "#fff", marginBottom: 10 }}>{dbStatus}</Text>

      {savedSession ? (
        <TouchableOpacity
          style={{
            ...buttonStyle,
            backgroundColor: "#7cb87c",
            borderColor: "#3d6b3d",
            width: 280,
          }}
          onPress={resumeLastSession}
          disabled={resumeLoading}
        >
          {resumeLoading ? (
            <ActivityIndicator color="#2E1F12" />
          ) : (
            <>
              <Text style={textStyle}>▶️ Letztes Spiel fortsetzen</Text>
              <Text
                style={{
                  color: "#2E1F12",
                  fontSize: 13,
                  marginTop: 6,
                  textAlign: "center",
                }}
              >
                Lobby {savedSession.lobbyId} · {savedSession.playerName}
              </Text>
            </>
          )}
        </TouchableOpacity>
      ) : null}

      {resumeMessage ? (
        <Text style={{ color: "#ffb4b4", marginTop: 10, textAlign: "center" }}>
          {resumeMessage}
        </Text>
      ) : null}

      <TextInput
        placeholder="Dein Name"
        value={playerName}
        onChangeText={setPlayerName}
        style={{
          backgroundColor: "#fff",
          padding: 10,
          borderRadius: 8,
          width: 220,
          textAlign: "center",
          marginTop: savedSession ? 16 : 0,
          marginBottom: 10,
        }}
      />

      <TouchableOpacity
        style={buttonStyle}
        onPress={() =>
          router.push({ pathname: "/lobby", params: { playerName } })
        }
        disabled={!playerName}
      >
        <Text style={textStyle}>🍻 Saufen</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={buttonStyle}
        onPress={() => router.push("/settings/commentator")}
      >
        <Text style={textStyle}>🎙️ Kommentator</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={buttonStyle}
        onPress={() =>
          router.push({ pathname: "/gallery", params: { playerName } })
        }
        disabled={!playerName}
      >
        <Text style={textStyle}>📖 Karten-Galerie</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
}
