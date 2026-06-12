import { useWindowDimensions, View } from "react-native";
import { getModalCardDimensions } from "../utils/responsive";
import Card from "./Card";

/**
 * Skaliert die 320×550-Kartenvorlage auf kleine / kurze Viewports.
 */
export default function ResponsiveCard({ verticalPad = 160, ...cardProps }) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const { scale, baseWidth, baseHeight, width, height } =
    getModalCardDimensions(screenWidth, screenHeight, verticalPad);

  return (
    <View
      style={{
        width,
        height,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <View
        style={{
          width: baseWidth,
          height: baseHeight,
          transform: [{ scale }],
        }}
      >
        <Card {...cardProps} />
      </View>
    </View>
  );
}
