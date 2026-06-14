import { ScrollView, useWindowDimensions, View } from "react-native";
import {
  CARD_BASE_HEIGHT,
  CARD_BASE_WIDTH,
  getModalCardDimensions,
} from "../utils/responsive";
import Card from "./Card";

/**
 * Skaliert die 320×550-Kartenvorlage auf kleine Viewports.
 * Android-safe: kein transform: scale (verursacht unsichtbare Karten).
 */
export default function ResponsiveCard({ verticalPad = 160, ...cardProps }) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const { scale, height: maxHeight } = getModalCardDimensions(
    screenWidth,
    screenHeight,
    verticalPad
  );

  const cardNode = (
    <View collapsable={false} style={{ flexShrink: 0 }}>
      <Card {...cardProps} />
    </View>
  );

  if (scale >= 0.98) {
    return cardNode;
  }

  return (
    <View
      collapsable={false}
      style={{
        width: Math.min(CARD_BASE_WIDTH, screenWidth - 24),
        maxHeight,
        flexShrink: 0,
        alignSelf: "center",
      }}
    >
      <ScrollView
        nestedScrollEnabled
        showsVerticalScrollIndicator
        style={{ maxHeight }}
        contentContainerStyle={{ alignItems: "center" }}
      >
        <View style={{ width: CARD_BASE_WIDTH, height: CARD_BASE_HEIGHT }}>
          {cardNode}
        </View>
      </ScrollView>
    </View>
  );
}
