import { Image, ImageBackground, Text, View } from "react-native";
import AutoFontSizeText from "../components/AutoFontSizeText";
import { cardStyles } from "../styles/CardStyles";
import {
  DEFAULT_CARD_IMAGE,
  normalizeCardImage,
} from "../utils/cardDisplay";

export default function Card({
  title = "Mystischer-Raum-Cocktail",
  description = "Wähle drei Getränke deiner Wahl und mixe sie zu einem Cocktail. Wähle zwei Mitspieler, die den Cocktail innerhalb von drei Runden auftrinken müssen.",
  atk = 1500,
  def = 1500,
  type = "magic",
  stars = 4,
  monsterType = "[Effekt]",
  image,
}) {
  const normalizedType =
    typeof type === "string" && type.trim().length > 0
      ? type.trim().toLowerCase()
      : "monster";

  const frameSources = {
    monster: require("../../assets/images/templates/monster_frame.png"),
    magic: require("../../assets/images/templates/magic_frame.png"),
    trap: require("../../assets/images/templates/trap_frame.png"),
  };
  const currentFrame = frameSources[normalizedType] || frameSources.monster;

  const typeLabels = {
    magic: "[ZAUBERKARTE]",
    trap: "[FALLENKARTE]",
    monster: monsterType || "[Effekt]",
  };
  const currentLabel =
    typeLabels[normalizedType] || `[${normalizedType.toUpperCase()}]`;

  const safeTitle = title || "Unbekannte Karte";
  const safeDescription = description || "Kein Effekttext verfügbar.";
  const imageSource = normalizeCardImage(image ?? DEFAULT_CARD_IMAGE);

  const starsRaw = parseInt(stars, 10);
  const safeStars = Number.isFinite(starsRaw)
    ? Math.min(Math.max(starsRaw, 0), 12)
    : 0;

  return (
    <ImageBackground
      source={currentFrame}
      style={cardStyles.cardTemplate}
      resizeMode="stretch"
      collapsable={false}
    >
      <View style={cardStyles.titleWrap}>
        <AutoFontSizeText
          style={cardStyles.cardTitle}
          minFontSize={14}
          maxFontSize={20}
        >
          {safeTitle}
        </AutoFontSizeText>
      </View>

      {normalizedType === "monster" &&
        [...Array(safeStars)].map((_, i) => (
          <Image
            key={i}
            source={require("../../assets/images/star.png")}
            style={[cardStyles.starLevel, { right: 30 + i * 25 }]}
            resizeMode="contain"
          />
        ))}
      {(normalizedType === "magic" || normalizedType === "trap") && (
        <Text style={cardStyles.topTypeLabel}>{currentLabel}</Text>
      )}
      <Image source={imageSource} style={cardStyles.imageBox} resizeMode="cover" />

      {normalizedType === "monster" && (
        <Text style={cardStyles.typeLabel}>{currentLabel}</Text>
      )}

      <Text style={cardStyles.monsterDescription}>{safeDescription}</Text>

      {normalizedType === "monster" && (
        <>
          <Text style={cardStyles.monsterAtk}>ATK/{Number(atk) || 0}</Text>
          <Text style={cardStyles.monsterDef}>DEF/{Number(def) || 0}</Text>
        </>
      )}
    </ImageBackground>
  );
}
