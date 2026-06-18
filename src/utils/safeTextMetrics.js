import { StyleSheet } from "react-native";
import { isCardModalDebugEnabled } from "./cardModalDebugCore";
import {
  safeFontSize,
  safeLineHeight,
  safeLetterSpacing,
  sanitizePlainTextStyle,
} from "./safeTextMetricsCore";

export {
  safeFontSize,
  safeLineHeight,
  safeLetterSpacing,
} from "./safeTextMetricsCore";

/** Flatten style and clamp fontSize / lineHeight / letterSpacing to Android-safe values. */
export function sanitizeTextStyle(style, fallbackFontSize = 12) {
  const flat = StyleSheet.flatten(style) || {};
  return sanitizePlainTextStyle(flat, fallbackFontSize);
}

export function logTextSize(component, metrics) {
  if (!__DEV__ && !isCardModalDebugEnabled()) return;
  console.log("[TEXT SIZE]", {
    component,
    fontSize: metrics.fontSize,
    lineHeight: metrics.lineHeight ?? null,
    letterSpacing: metrics.letterSpacing ?? null,
  });
}
