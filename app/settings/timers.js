import { doc, updateDoc } from "firebase/firestore";
import { useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import { db } from "../../firebaseConfig";
import { DEFAULT_TIMERS, sanitizeTimers } from "../../src/config/timers";

export default function TimerSettings({ route }) {
  const { lobbyId } = route.params; // oder useLocalSearchParams() bei expo-router
  const lobbyRef = doc(db, "lobbies", lobbyId);

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
        style={{
          backgroundColor: "#fff",
          padding: 10,
          borderRadius: 8,
          width: 120,
        }}
      />
    </View>
  );

  const save = async () => {
    const next = sanitizeTimers(formValues); // clamped & numeric
    await updateDoc(lobbyRef, { timers: next });
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
        style={{
          marginTop: 20,
          backgroundColor: "#D9C9A3",
          padding: 12,
          borderRadius: 10,
        }}
      >
        <Text style={{ color: "#2E1F12", fontWeight: "bold" }}>Speichern</Text>
      </TouchableOpacity>
    </View>
  );
}
