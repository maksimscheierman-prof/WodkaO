import { Text, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * In-screen back control (replaces native stack header).
 */
export default function ScreenBackButton({ onPress, label = "← Zurück" }) {
  const insets = useSafeAreaInsets();

  return (
    <TouchableOpacity
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Zurück"
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      style={{
        position: "absolute",
        top: insets.top + 8,
        left: 16,
        zIndex: 10,
        paddingVertical: 6,
        paddingHorizontal: 4,
      }}
    >
      <Text
        style={{
          color: "#D9C9A3",
          fontSize: 17,
          fontFamily: "DidactGothic",
          fontWeight: "600",
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}
