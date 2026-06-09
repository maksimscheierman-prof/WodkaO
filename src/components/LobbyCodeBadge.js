import { useState } from "react";
import {
  Platform,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";

export default function LobbyCodeBadge({ lobbyId, style }) {
  const [copied, setCopied] = useState(false);
  const canCopy = Platform.OS === "web" && typeof navigator !== "undefined";
  const { width: screenWidth } = useWindowDimensions();
  const compact = screenWidth < 400;
  const boxWidth = compact ? 168 : 200;

  const handleCopy = async () => {
    if (!canCopy || !lobbyId) return;
    try {
      await navigator.clipboard.writeText(String(lobbyId));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.warn("[COPY] Clipboard failed", e);
    }
  };

  return (
    <View
      style={[
        {
          width: boxWidth,
          maxWidth: 220,
          backgroundColor: "rgba(0,0,0,0.65)",
          borderRadius: 10,
          borderWidth: 1,
          borderColor: "rgba(217,201,163,0.5)",
          paddingVertical: compact ? 6 : 8,
          paddingHorizontal: compact ? 8 : 10,
        },
        style,
      ]}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 6,
        }}
      >
        <Text
          style={{
            color: "#ffe08a",
            fontSize: compact ? 13 : 14,
            fontWeight: "bold",
            letterSpacing: 1,
            flexShrink: 1,
          }}
          numberOfLines={1}
        >
          Lobby: {lobbyId}
        </Text>
        {canCopy && (
          <TouchableOpacity
            onPress={handleCopy}
            style={{
              backgroundColor: "#D9C9A3",
              paddingHorizontal: compact ? 6 : 8,
              paddingVertical: 3,
              borderRadius: 5,
            }}
          >
            <Text
              style={{
                color: "#2E1F12",
                fontSize: compact ? 10 : 11,
                fontWeight: "bold",
              }}
            >
              {copied ? "✓" : "Kopieren"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
      <Text
        style={{
          color: "#888",
          fontSize: compact ? 9 : 10,
          marginTop: 3,
        }}
        numberOfLines={1}
      >
        Freunde können beitreten
      </Text>
    </View>
  );
}
