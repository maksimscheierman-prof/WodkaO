import { Platform, Pressable, Text, useWindowDimensions, View } from "react-native";

const BAR_HEIGHT_DESKTOP = 72;
const BAR_HEIGHT_MOBILE = 64;

function actionButtonStyle({ pressed, hovered }, disabled) {
  const base = {
    minHeight: Platform.OS === "web" ? BAR_HEIGHT_DESKTOP : BAR_HEIGHT_MOBILE,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderWidth: 2,
    borderColor: disabled ? "rgba(217,201,163,0.25)" : "#c9b88a",
    backgroundColor: disabled ? "rgba(90,75,55,0.55)" : "#D9C9A3",
    opacity: disabled ? 0.55 : 1,
    ...(Platform.OS === "web"
      ? {
          cursor: disabled ? "not-allowed" : "pointer",
          transition: "background-color 0.15s ease, transform 0.1s ease",
        }
      : {}),
  };

  if (!disabled && pressed) {
    return {
      ...base,
      backgroundColor: "#c4b48f",
      transform: [{ scale: 0.98 }],
    };
  }
  if (!disabled && hovered && Platform.OS === "web") {
    return {
      ...base,
      backgroundColor: "#e8d9b8",
      borderColor: "#ffe08a",
    };
  }
  return base;
}

export default function GameActionBar({
  lobby,
  isMyTurn,
  onDraw,
  onShow,
  onDiscard,
  actionDisabled = false,
  bottomInset = 0,
}) {
  const { width: screenWidth } = useWindowDimensions();
  const compact = screenWidth < 400;
  const isDesktop = screenWidth >= 768;

  if (
    lobby?.votingOpen ||
    lobby?.activeEffect ||
    lobby?.voteResult
  ) {
    return null;
  }

  const canDraw = isMyTurn && !lobby?.lastMagic;
  const canShow = isMyTurn && lobby?.lastMagic && !lobby?.showMagic;
  const canDiscard = isMyTurn && lobby?.lastMagic && lobby?.showMagic;

  if (!isMyTurn || (!canDraw && !canShow && !canDiscard)) {
    return null;
  }

  const barWidth = isDesktop
    ? Math.min(screenWidth * 0.5, 420)
    : compact
      ? screenWidth * 0.9
      : screenWidth * 0.82;

  let label = "Karte ziehen";
  let onPress = onDraw;
  let accessibilityLabel = "Karte ziehen";

  if (canShow) {
    label = actionDisabled ? "⏳ …" : "👁️ Aufdecken";
    onPress = onShow;
    accessibilityLabel = "Magiekarte aufdecken";
  } else if (canDiscard) {
    label = actionDisabled ? "⏳ …" : "🗑️ Ablegen";
    onPress = onDiscard;
    accessibilityLabel = "Magiekarte ablegen";
  } else if (canDraw) {
    label = actionDisabled ? "⏳ …" : "🍺 Karte ziehen";
    accessibilityLabel = "Karte ziehen";
  }

  const disabled = actionDisabled;

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: Math.max(12, bottomInset + 8),
        alignItems: "center",
        zIndex: 25,
        paddingHorizontal: compact ? 8 : 16,
      }}
    >
      <Pressable
        onPress={onPress}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ disabled }}
        style={(state) => [
          actionButtonStyle(state, disabled),
          { width: barWidth, maxWidth: 480 },
        ]}
      >
        <Text
          style={{
            color: disabled ? "#8a7a62" : "#2E1F12",
            fontWeight: "800",
            fontSize: compact ? 16 : isDesktop ? 20 : 18,
            letterSpacing: 0.3,
            textAlign: "center",
          }}
        >
          {label}
        </Text>
      </Pressable>
    </View>
  );
}
