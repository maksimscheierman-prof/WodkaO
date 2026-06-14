import { Text, TouchableOpacity } from "react-native";

/**
 * Red exit control for game screen (not a navigation header).
 */
export default function GameExitButton({ onPress, size = 36, style }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Spiel verlassen"
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: "rgba(183, 28, 28, 0.92)",
          borderWidth: 2,
          borderColor: "rgba(255,120,120,0.55)",
          justifyContent: "center",
          alignItems: "center",
        },
        style,
      ]}
    >
      <Text
        style={{
          color: "#fff",
          fontSize: Math.round(size * 0.48),
          fontWeight: "700",
          lineHeight: Math.round(size * 0.52),
          includeFontPadding: false,
        }}
      >
        ✕
      </Text>
    </TouchableOpacity>
  );
}
