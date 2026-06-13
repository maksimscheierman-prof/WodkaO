import * as Clipboard from "expo-clipboard";
import { useState } from "react";
import {
  Platform,
  Pressable,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

async function copyLobbyCode(code) {
  const text = String(code ?? "");
  if (!text) return false;
  if (Platform.OS === "web" && typeof navigator !== "undefined" && navigator.clipboard) {
    await navigator.clipboard.writeText(text);
    return true;
  }
  await Clipboard.setStringAsync(text);
  return true;
}

export default function LobbyCodeBadge({ lobbyId, style }) {
  const [copied, setCopied] = useState(false);
  const { width: screenWidth } = useWindowDimensions();
  const compact = screenWidth < 400;
  const narrow = screenWidth < 360;

  const boxWidth = narrow
    ? Math.min(screenWidth * 0.52, 220)
    : compact
      ? Math.min(screenWidth * 0.48, 280)
      : Math.min(screenWidth * 0.38, 360);

  const minHeight = narrow ? 72 : compact ? 80 : 88;

  const handleCopy = async () => {
    if (!lobbyId || copied) return;
    try {
      await copyLobbyCode(lobbyId);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (e) {
      console.warn("[COPY] Clipboard failed", e);
    }
  };

  const codeLabel = lobbyId ? `Lobby: ${lobbyId}` : "Lobby: …";
  const hintText = copied
    ? "Kopiert!"
    : "(klicken zum Kopieren des Codes)";

  return (
    <Pressable
      onPress={handleCopy}
      accessibilityRole="button"
      accessibilityLabel="Lobby-Code kopieren"
      accessibilityHint="Kopiert den Lobby-Code in die Zwischenablage"
      style={({ pressed, hovered }) => [
        {
          width: boxWidth,
          minHeight,
          backgroundColor: pressed
            ? "rgba(30,22,12,0.88)"
            : hovered && Platform.OS === "web"
              ? "rgba(0,0,0,0.78)"
              : "rgba(0,0,0,0.72)",
          borderRadius: 14,
          borderWidth: 1.5,
          borderColor: copied
            ? "rgba(127,255,127,0.75)"
            : "rgba(217,201,163,0.55)",
          paddingVertical: narrow ? 10 : 12,
          paddingHorizontal: narrow ? 12 : 16,
          justifyContent: "center",
          ...(Platform.OS === "web"
            ? { cursor: "pointer", transition: "background-color 0.15s ease" }
            : {}),
        },
        style,
      ]}
    >
      <View style={{ flex: 1, justifyContent: "center" }}>
        <Text
          style={{
            color: "#ffe08a",
            fontSize: narrow ? 17 : compact ? 19 : 22,
            fontWeight: "800",
            letterSpacing: 1.2,
          }}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.75}
        >
          {codeLabel}
        </Text>
        <Text
          style={{
            color: copied ? "#7fff7f" : "rgba(200,190,160,0.9)",
            fontSize: narrow ? 11 : 12,
            marginTop: 6,
            fontWeight: copied ? "700" : "500",
          }}
          numberOfLines={2}
        >
          {hintText}
        </Text>
      </View>
    </Pressable>
  );
}
