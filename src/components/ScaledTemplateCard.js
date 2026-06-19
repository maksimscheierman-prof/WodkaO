import { useMemo } from "react";
import { View } from "react-native";
import { computeLayoutScale } from "../utils/scaledCardLayout";
import Card from "./Card";

/** Template card scaled via layout props — no transform: scale. */
export default function ScaledTemplateCard({
  maxWidth,
  maxHeight,
  title,
  description,
  image,
  type = "magic",
  atk,
  def,
  stars,
  monsterType,
}) {
  const { scale, width, height } = useMemo(
    () => computeLayoutScale(maxWidth, maxHeight),
    [maxWidth, maxHeight]
  );

  return (
    <View
      collapsable={false}
      style={{
        width,
        height,
        alignSelf: "center",
        overflow: "hidden",
        flexShrink: 1,
      }}
    >
      <Card
        title={title}
        description={description}
        image={image}
        type={type}
        atk={atk}
        def={def}
        stars={stars}
        monsterType={monsterType}
        layoutScale={scale}
      />
    </View>
  );
}
