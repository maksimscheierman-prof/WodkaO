import { useEffect, useRef } from "react";
import { Image, LayoutAnimation, Text, View } from "react-native";

const CARD_BACK = require("../../assets/images/card_back.png");
const MAX_VISIBLE = 5;
const LAYER_OFFSET = 3;

/**
 * Stapel-Visualisierung nach Kartenanzahl:
 * 0 → leeres Feld, 1–4 → echte Layer, 5+ → max. 5 Layer, Label zeigt echte Anzahl.
 */
export default function StackPile({
  label,
  count = 0,
  width,
  height,
  cardSource = CARD_BACK,
  topCardImage = null,
  style,
}) {
  const prevCount = useRef(count);
  const safeCount = Math.max(0, count ?? 0);
  const visibleLayers =
    safeCount === 0 ? 0 : Math.min(safeCount, MAX_VISIBLE);

  useEffect(() => {
    if (prevCount.current !== safeCount) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      prevCount.current = safeCount;
    }
  }, [safeCount]);

  const boxW = width + Math.max(0, visibleLayers - 1) * LAYER_OFFSET + 4;
  const boxH = height + Math.max(0, visibleLayers - 1) * LAYER_OFFSET + 4;

  return (
    <View style={[{ alignItems: "center" }, style]}>
      <View
        style={{
          width: Math.max(boxW, width + 4),
          height: Math.max(boxH, height + 4),
          marginBottom: 2,
        }}
      >
        {safeCount === 0 ? (
          <View
            style={{
              position: "absolute",
              left: 0,
              bottom: 0,
              width,
              height,
              borderRadius: 6,
              borderWidth: 2,
              borderStyle: "dashed",
              borderColor: "rgba(217,201,163,0.45)",
              backgroundColor: "rgba(0,0,0,0.12)",
            }}
          />
        ) : (
          Array.from({ length: visibleLayers }, (_, i) => {
            const isTop = i === visibleLayers - 1;
            const showFace = isTop && topCardImage;

            return (
              <Image
                key={i}
                source={showFace ? topCardImage : cardSource}
                style={{
                  position: "absolute",
                  left: i * LAYER_OFFSET,
                  bottom: (visibleLayers - 1 - i) * LAYER_OFFSET,
                  width,
                  height,
                  borderRadius: 6,
                  borderWidth: showFace ? 1 : 0,
                  borderColor: "rgba(217,201,163,0.5)",
                  opacity: 1 - (visibleLayers - 1 - i) * 0.06,
                }}
                resizeMode="cover"
              />
            );
          })
        )}
      </View>
      <Text
        style={{
          color: "#ccc",
          fontSize: 10,
          textAlign: "center",
          maxWidth: width + 24,
        }}
        numberOfLines={2}
      >
        {label} ({safeCount})
      </Text>
    </View>
  );
}
