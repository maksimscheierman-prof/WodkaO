import { doc, updateDoc } from "firebase/firestore";
import { useState } from "react";
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from "react-native";
import { db } from "../../firebaseConfig";
import { DEFAULT_TIMERS, sanitizeTimers } from "../../src/config/timers";
import { useAsyncLock } from "../../src/hooks/useAsyncLock";

export default function TimerSettings({ route }) {
  const { lobbyId } = route.params;
  const lobbyRef = doc(db, "lobbies", lobbyId);
  const saveLock = useAsyncLock();

  const [values, setValues] = useState(DEFAULT_TIMERS);

  const Field = ({ label, keyName }) => (
    <View style={{ marginVertical: 8 }}>
      <Text style={{ color: "#fff", marginBottom: 4 }}>{label}</Text>
      <TextInput
        keyboardType="numeric"
        value={String(values[keyName])}
        onChangeText={(t) =>
          setValues((v) => ({ ...v, [keyName]: Math.max(1, Number(t) || 0) }))
        }
        editable={!saveLock.isLocked}
        style={{
          backgroundColor: "#fff",
          padding: 10,
          borderRadius: 8,
          width: 120,
          opacity: saveLock.isLocked ? 0.6 : 1,
        }}
      />
    </View>
  );

  const save = () => {
    saveLock.runLocked(async () => {
      const next = sanitizeTimers(values);
      await updateDoc(lobbyRef, { timers: next });
    }).catch((err) => {
      console.error("[TIMER SAVE ERROR]", err);
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#000", padding: 20 }}>
      <Text style={{ color: "#fff", fontSize: 20, marginBottom: 10 }}>
        Timer
      </Text>
      <Field label="Reaktionsphase (Sek.)" keyName="reactionSeconds" />
      <Field label="Voting (Sek.)" keyName="votingSeconds" />
      <Field label="Ergebnis-OK (Sek.)" keyName="ackSeconds" />
      <Field label="Ablage (Sek.)" keyName="discardSeconds" />
      <TouchableOpacity
        onPress={save}
        disabled={saveLock.isLocked}
        style={{
          marginTop: 20,
          backgroundColor: "#D9C9A3",
          padding: 12,
          borderRadius: 10,
          opacity: saveLock.isLocked ? 0.6 : 1,
        }}
      >
        {saveLock.isLocked ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <ActivityIndicator size="small" color="#2E1F12" />
            <Text style={{ color: "#2E1F12", fontWeight: "bold" }}>
              Speichern...
            </Text>
          </View>
        ) : (
          <Text style={{ color: "#2E1F12", fontWeight: "bold" }}>Speichern</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}
