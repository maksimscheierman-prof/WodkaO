import { useEffect, useMemo, useState } from "react";
import { Image, ImageBackground, StyleSheet, View } from "react-native";
import { Image as ExpoImage } from "expo-image";
import AutoFontSizeText from "../components/AutoFontSizeText";
import SafeText from "../components/SafeText";
import {
  DEFAULT_CARD_IMAGE,
  normalizeCardImage,
} from "../utils/cardDisplay";
import {
  getTypeLabel,
  resolveCardFrameType,
} from "../utils/cardFrame";
import { recordCardModalDebug } from "../utils/cardModalDebug";
import { buildScaledCardStyles } from "../utils/scaledCardLayout";

const CARD_BACK = require("../../assets/images/card_back.png");

const FRAME_SOURCES = {
  monster: require("../../assets/images/templates/monster_frame.png"),
  magic: require("../../assets/images/templates/magic_frame.png"),
  trap: require("../../assets/images/templates/trap_frame.png"),
};

function CardArtwork({ imageSource, fillStyle, onError, onLoad, modalArtwork }) {
  if (typeof imageSource === "number") {
    return (
      <Image
        source={imageSource}
        style={fillStyle}
        resizeMode="cover"
        onError={onError}
        onLoad={onLoad}
      />
    );
  }

  return (
    <ExpoImage
      source={imageSource}
      style={fillStyle}
      contentFit="cover"
      placeholder={modalArtwork ? undefined : CARD_BACK}
      placeholderContentFit={modalArtwork ? undefined : "cover"}
      transition={0}
      onError={onError}
      onLoad={onLoad}
    />
  );
}

export default function Card({
  title = "Mystischer-Raum-Cocktail",
  description = "Wähle drei Getränke deiner Wahl und mixe sie zu einem Cocktail. Wähle zwei Mitspieler, die den Cocktail innerhalb von drei Runden auftrinken müssen.",
  atk = 1500,
  def = 1500,
  type = "magic",
  stars = 4,
  monsterType = "[Effekt]",
  image,
  layoutScale = 1,
  modalArtwork = false,
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const styles = useMemo(
    () => buildScaledCardStyles(layoutScale),
    [layoutScale]
  );
  const starRightBase = Math.round(30 * layoutScale);
  const starStep = Math.round(25 * layoutScale);

  const frameType = resolveCardFrameType(type, "monster");
  const currentFrame = FRAME_SOURCES[frameType] || FRAME_SOURCES.monster;
  const currentLabel = getTypeLabel(frameType, monsterType);

  const safeTitle = title || "Unbekannte Karte";
  const safeDescription = description || "Kein Effekttext verfügbar.";
  const primarySource = normalizeCardImage(image ?? DEFAULT_CARD_IMAGE);
  const imageUriKey =
    typeof primarySource === "number"
      ? `asset:${primarySource}`
      : primarySource?.uri ?? "default";

  useEffect(() => {
    setImageFailed(false);
    setImageLoaded(typeof primarySource === "number");
  }, [imageUriKey, primarySource]);

  const imageSource = imageFailed
    ? modalArtwork
      ? DEFAULT_CARD_IMAGE
      : CARD_BACK
    : typeof primarySource === "number"
      ? primarySource
      : primarySource?.uri
        ? { uri: primarySource.uri }
        : DEFAULT_CARD_IMAGE;

  const showArtworkPlaceholder =
    modalArtwork &&
    !imageLoaded &&
    !imageFailed &&
    typeof imageSource === "object" &&
    !!imageSource?.uri;

  const starsRaw = parseInt(stars, 10);
  const safeStars = Number.isFinite(starsRaw)
    ? Math.min(Math.max(starsRaw, 0), 12)
    : 0;

  const handleImageError = (err) => {
    const message = err?.nativeEvent?.error ?? err?.error ?? String(err);
    recordCardModalDebug("card_image_error", {
      type: frameType,
      title: safeTitle,
      imageUri: imageSource?.uri ?? null,
      error: message,
    });
    console.warn("[CARD IMAGE ERROR]", {
      type: frameType,
      title: safeTitle,
      source: imageSource,
      error: message,
    });
    setImageFailed(true);
  };

  return (
    <ImageBackground
      source={currentFrame}
      style={styles.cardTemplate}
      resizeMode="stretch"
      collapsable={false}
    >
      <View style={styles.titleWrap}>
        <AutoFontSizeText
          component="Card.title"
          style={styles.cardTitle}
          minFontSize={14}
          maxFontSize={20}
        >
          {safeTitle}
        </AutoFontSizeText>
      </View>

      {frameType === "monster" &&
        [...Array(safeStars)].map((_, i) => (
          <Image
            key={i}
            source={require("../../assets/images/star.png")}
            style={[styles.starLevel, { right: starRightBase + i * starStep }]}
            resizeMode="contain"
          />
        ))}

      <SafeText component="Card.topTypeLabel" style={styles.topTypeLabel}>
        {currentLabel}
      </SafeText>

      <View style={styles.imageBox} collapsable={false}>
        {showArtworkPlaceholder ? (
          <View
            style={[
              StyleSheet.absoluteFillObject,
              { backgroundColor: "#1a1028" },
            ]}
          />
        ) : null}
        <CardArtwork
          imageSource={imageSource}
          fillStyle={StyleSheet.absoluteFill}
          modalArtwork={modalArtwork}
          onError={handleImageError}
          onLoad={() => setImageLoaded(true)}
        />
      </View>

      <SafeText component="Card.description" style={styles.monsterDescription}>
        {safeDescription}
      </SafeText>

      {frameType === "monster" && (
        <>
          <SafeText component="Card.atk" style={styles.monsterAtk}>
            ATK/{Number(atk) || 0}
          </SafeText>
          <SafeText component="Card.def" style={styles.monsterDef}>
            DEF/{Number(def) || 0}
          </SafeText>
        </>
      )}
    </ImageBackground>
  );
}
