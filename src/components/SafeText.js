import { Text } from "react-native";
import {
  logTextSize,
  sanitizeTextStyle,
} from "../utils/safeTextMetrics";

/**
 * Text with Android/Fabric-safe fontSize (never 0 or NaN).
 * Logs metrics in dev or when EXPO_PUBLIC_CARD_MODAL_DEBUG is enabled.
 */
export default function SafeText({
  component = "SafeText",
  style,
  fallbackFontSize = 12,
  children,
  ...rest
}) {
  const safeStyle = sanitizeTextStyle(style, fallbackFontSize);
  logTextSize(component, {
    fontSize: safeStyle.fontSize,
    lineHeight: safeStyle.lineHeight,
    letterSpacing: safeStyle.letterSpacing,
  });

  return (
    <Text style={safeStyle} {...rest}>
      {children}
    </Text>
  );
}
