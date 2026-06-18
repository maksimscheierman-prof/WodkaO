import { useState } from "react";
import { Image, ImageBackground, Text, View } from "react-native";
import { Image as ExpoImage } from "expo-image";
import AutoFontSizeText from "../components/AutoFontSizeText";
import { cardStyles } from "../styles/CardStyles";
import {
  DEFAULT_CARD_IMAGE,
  normalizeCardImage,
} from "../utils/cardDisplay";
import { recordCardModalDebug } from "../utils/cardModalDebug";

const CARD_BACK = require("../../assets/images/card_back.png");

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
  const [imageFailed, setImageFailed] = useState(false);

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
  const primarySource = normalizeCardImage(image ?? DEFAULT_CARD_IMAGE);
  const imageSource = imageFailed
    ? CARD_BACK
    : typeof primarySource === "number"
      ? primarySource
      : primarySource?.uri
        ? { uri: primarySource.uri }
        : DEFAULT_CARD_IMAGE;

  const starsRaw = parseInt(stars, 10);
  const safeStars = Number.isFinite(starsRaw)
    ? Math.min(Math.max(starsRaw, 0), 12)
    : 0;

  const handleImageError = (err) => {
    const message = err?.nativeEvent?.error ?? err?.error ?? String(err);
    recordCardModalDebug("card_image_error", {
      type: normalizedType,
      title: safeTitle,
      imageUri: imageSource?.uri ?? null,
      error: message,
    });
    console.warn("[CARD IMAGE ERROR]", {
      type: normalizedType,
      title: safeTitle,
      source: imageSource,
      error: message,
    });
    setImageFailed(true);
  };

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

      {typeof imageSource === "number" ? (
        <Image
          source={imageSource}
          style={cardStyles.imageBox}
          resizeMode="cover"
          onError={handleImageError}
        />
      ) : (
        <ExpoImage
          source={imageSource}
          style={cardStyles.imageBox}
          contentFit="cover"
          placeholder={CARD_BACK}
          placeholderContentFit="cover"
          transition={0}
          onError={handleImageError}
        />
      )}

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
