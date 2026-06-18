import { useState } from "react";
import { Text, View } from "react-native";
import { logTextSize, safeFontSize } from "../utils/safeTextMetrics";

export default function AutoFontSizeText({
  children,
  style,
  minFontSize = 16,
  maxFontSize = 24,
  component = "AutoFontSizeText",
}) {
  const [containerWidth, setContainerWidth] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  const text = String(children);
  const safeMin = safeFontSize(minFontSize, 12);
  const safeMax = safeFontSize(maxFontSize, safeMin);
  let fontSize = safeMax;

  if (containerWidth > 0 && containerHeight > 0 && text.length > 0) {
    fontSize = Math.sqrt((containerWidth * containerHeight) / text.length);
    fontSize = Math.max(safeMin, Math.min(fontSize, safeMax));
  }

  fontSize = safeFontSize(fontSize, safeMin);
  logTextSize(component, { fontSize, lineHeight: null, letterSpacing: null });

  return (
    <View
      style={{ flexDirection: "row" }}
      onLayout={(e) => {
        setContainerWidth(e.nativeEvent.layout.width);
        setContainerHeight(e.nativeEvent.layout.height);
      }}
    >
      <Text style={[style, { fontSize }]} numberOfLines={1}>
        {children}
      </Text>
    </View>
  );
}
