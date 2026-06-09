import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { VIEWING_CARD_TIMEOUT_MS } from "../utils/viewingCardText";

/**
 * Weiße Sprechblase — nur lokal ausblenden nach Timeout, kein Firestore-Write.
 */
export default function ViewingCardBubble({
  bubbleText,
  startedAt,
  compact = false,
}) {
  const [hiddenByTimeout, setHiddenByTimeout] = useState(false);

  useEffect(() => {
    if (!bubbleText) {
      setHiddenByTimeout(false);
      return;
    }

    setHiddenByTimeout(false);

    if (typeof startedAt !== "number" || startedAt <= 0) {
      return;
    }

    const elapsed = Date.now() - startedAt;
    const remaining = VIEWING_CARD_TIMEOUT_MS - elapsed;

    if (remaining <= 0) {
      setHiddenByTimeout(true);
      return;
    }

    const timer = setTimeout(() => setHiddenByTimeout(true), remaining);
    return () => clearTimeout(timer);
  }, [bubbleText, startedAt]);

  if (!bubbleText || hiddenByTimeout) return null;

  return (
    <View
      style={{
        position: "absolute",
        bottom: "100%",
        marginBottom: 6,
        alignItems: "center",
        zIndex: 5,
        maxWidth: 140,
      }}
    >
      <View
        style={{
          backgroundColor: "#fff",
          borderRadius: 10,
          paddingVertical: compact ? 4 : 5,
          paddingHorizontal: compact ? 8 : 10,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.18,
          shadowRadius: 4,
          elevation: 4,
        }}
      >
        <Text
          style={{
            color: "#1a1a1a",
            fontSize: compact ? 10 : 11,
            fontWeight: "600",
            textAlign: "center",
          }}
          numberOfLines={1}
        >
          {bubbleText}
        </Text>
      </View>
      <View
        style={{
          width: 0,
          height: 0,
          borderLeftWidth: 7,
          borderRightWidth: 7,
          borderTopWidth: 8,
          borderLeftColor: "transparent",
          borderRightColor: "transparent",
          borderTopColor: "#fff",
          marginTop: -1,
        }}
      />
    </View>
  );
}
