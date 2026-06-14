import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  getTestAccessCode,
  validateAccessCode,
} from "../utils/testAccessCore";

const DISCLAIMER_LINES = [
  "Privater Testbuild",
  "Nur für Erwachsene",
  "Kein öffentliches oder lizenziertes Produkt",
  "Bitte verantwortungsbewusst spielen",
];

/**
 * @param {{
 *   onSuccess: () => void | Promise<void>,
 *   onReset?: () => void | Promise<void>,
 *   blockReason?: 'missing_env' | null,
 *   showReset?: boolean,
 * }} props
 */
export default function TestAccessGate({
  onSuccess,
  onReset,
  blockReason = null,
  showReset = __DEV__,
}) {
  const [code, setCode] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const configured = !!getTestAccessCode();
  const blocked = blockReason === "missing_env";

  const handleSubmit = async () => {
    if (blocked) return;

    setError(null);
    const result = validateAccessCode(code);
    if (!result.ok) {
      if (result.reason === "wrong") {
        setError("Zugangscode ist falsch.");
      } else if (result.reason === "not_configured") {
        setError("Testzugang ist nicht konfiguriert.");
      } else {
        setError("Bitte Zugangscode eingeben.");
      }
      return;
    }

    setSubmitting(true);
    try {
      await onSuccess();
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = async () => {
    if (!onReset) return;
    setCode("");
    setError(null);
    await onReset();
  };

  return (
    <LinearGradient
      colors={["#1a0033", "#000000"]}
      style={{ flex: 1, justifyContent: "center", padding: 24 }}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          alignItems: "center",
          paddingVertical: 24,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <Text
          style={{
            fontSize: 26,
            color: "#fff",
            fontWeight: "bold",
            marginBottom: 8,
            textAlign: "center",
          }}
        >
          Privater Testbuild
        </Text>

        <Text
          style={{
            color: "#d4c4e8",
            fontSize: 15,
            marginBottom: 20,
            textAlign: "center",
          }}
        >
          Nur für eingeladene Tester
        </Text>

        <View
          style={{
            backgroundColor: "rgba(255,255,255,0.08)",
            borderRadius: 12,
            padding: 16,
            width: "100%",
            maxWidth: 360,
            marginBottom: 24,
          }}
        >
          {DISCLAIMER_LINES.map((line) => (
            <Text
              key={line}
              style={{
                color: "#c9b8dc",
                fontSize: 13,
                marginBottom: 6,
                textAlign: "center",
              }}
            >
              • {line}
            </Text>
          ))}
        </View>

        {blocked ? (
          <View style={{ width: "100%", maxWidth: 360 }}>
            <Text
              style={{
                color: "#ffb4b4",
                fontSize: 14,
                textAlign: "center",
                marginBottom: 12,
              }}
            >
              Testzugang nicht konfiguriert. Setze EXPO_PUBLIC_TEST_ACCESS_CODE
              vor dem Web-Deploy.
            </Text>
          </View>
        ) : (
          <View style={{ width: "100%", maxWidth: 360 }}>
            <TextInput
              placeholder="Zugangscode"
              placeholderTextColor="#9a8aaa"
              value={code}
              onChangeText={setCode}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              onSubmitEditing={handleSubmit}
              style={{
                backgroundColor: "#fff",
                padding: 12,
                borderRadius: 8,
                textAlign: "center",
                marginBottom: 12,
              }}
            />

            {error ? (
              <Text
                style={{
                  color: "#ffb4b4",
                  fontSize: 13,
                  textAlign: "center",
                  marginBottom: 12,
                }}
              >
                {error}
              </Text>
            ) : null}

            <TouchableOpacity
              onPress={handleSubmit}
              disabled={submitting || !configured}
              style={{
                backgroundColor: "#D9C9A3",
                paddingVertical: 14,
                borderRadius: 12,
                borderWidth: 3,
                borderColor: "#5C4033",
                alignItems: "center",
                opacity: submitting || !configured ? 0.6 : 1,
              }}
            >
              {submitting ? (
                <ActivityIndicator color="#2E1F12" />
              ) : (
                <Text
                  style={{ color: "#2E1F12", fontSize: 18, fontWeight: "bold" }}
                >
                  Betreten
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {showReset && onReset ? (
          <TouchableOpacity onPress={handleReset} style={{ marginTop: 20 }}>
            <Text style={{ color: "#9a8aaa", fontSize: 13 }}>
              Zugang zurücksetzen
            </Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>
    </LinearGradient>
  );
}
