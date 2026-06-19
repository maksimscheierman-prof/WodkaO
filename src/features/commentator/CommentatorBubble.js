import { Text, View } from "react-native";

/**
 * Kompakte Moderator-Sprechblase — blockiert keine Touch-Events.
 */
export default function CommentatorBubble({
  text,
  compact = false,
  overlayActive = false,
  bottomOffset = 16,
  topOffset = 72,
}) {
  if (!text) return null;

  const positionStyle = overlayActive
    ? {
        top: topOffset,
        left: compact ? 8 : 12,
        right: compact ? 8 : 12,
      }
    : {
        bottom: bottomOffset,
        left: compact ? 8 : 12,
        right: compact ? 8 : 12,
      };

  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        ...positionStyle,
        zIndex: overlayActive ? 30 : 15,
        alignItems: "center",
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-start",
          maxWidth: compact ? 320 : 420,
          backgroundColor: "rgba(20, 10, 40, 0.92)",
          borderRadius: 12,
          borderWidth: 1,
          borderColor: "rgba(180, 140, 255, 0.35)",
          paddingVertical: compact ? 6 : 8,
          paddingHorizontal: compact ? 10 : 12,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 4,
          elevation: 3,
        }}
      >
        <Text style={{ fontSize: compact ? 14 : 16, marginRight: 6 }}>🎙️</Text>
        <Text
          style={{
            flex: 1,
            color: "#e8dcff",
            fontSize: compact ? 11 : 12,
            lineHeight: compact ? 15 : 17,
            fontWeight: "500",
          }}
          numberOfLines={overlayActive ? 2 : 3}
        >
          {text}
        </Text>
      </View>
    </View>
  );
}
