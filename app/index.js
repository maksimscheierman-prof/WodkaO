import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Text, TextInput, TouchableOpacity } from "react-native";
import { db } from "../firebaseConfig";

export default function Index() {
  const router = useRouter();
  const [playerName, setPlayerName] = useState("");
  const [dbStatus, setDbStatus] = useState("⏳ Firestore wird getestet...");

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

  // Firestore-Test
  useEffect(() => {
    const testFirestore = async () => {
      try {
        console.log("🔄 Firestore-Test startet...");

        const ref = doc(db, "tests", "connectionCheck");
        await setDoc(ref, { ok: true, time: Date.now() });

        const snap = await getDoc(ref);
        if (snap.exists()) {
          console.log("✅ Firestore verbunden:", snap.data());
          setDbStatus("✅ Firestore verbunden!");
        } else {
          console.warn("⚠️ Firestore verbunden, aber Dokument nicht gefunden.");
          setDbStatus("⚠️ Firestore verbunden, aber kein Dokument.");
        }
      } catch (error) {
        console.error("❌ Firestore-Verbindung fehlgeschlagen:", error);
        setDbStatus("❌ Keine Firestore-Verbindung!");
      }
    };

    testFirestore();
  }, []);

  return (
    <LinearGradient
      colors={["#1a0033", "#000000"]}
      style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
    >
      <Text style={{ fontSize: 28, color: "#fff", marginBottom: 20 }}>
        🔥 Vod-ka-Oh! Trinkspiel
      </Text>

      {/* Firestore Status */}
      <Text style={{ color: "#fff", marginBottom: 10 }}>{dbStatus}</Text>

      {/* Eingabe Spielername */}
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
          marginBottom: 30,
        }}
      />

      {/* Saufen -> Lobby */}
      <TouchableOpacity
        style={buttonStyle}
        onPress={() =>
          router.push({ pathname: "/lobby", params: { playerName } })
        }
        disabled={!playerName}
      >
        <Text style={textStyle}>🍻 Saufen</Text>
      </TouchableOpacity>

      {/* Karten-Galerie */}
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
