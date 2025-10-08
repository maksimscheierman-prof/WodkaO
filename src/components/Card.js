import { Image, ImageBackground, Text, View } from "react-native";
import AutoFontSizeText from "../components/AutoFontSizeText";
import { cardStyles } from "../styles/CardStyles";

export default function Card({
  title = "Mystischer-Raum-Cocktail",
  description = "Wähle drei Getränke deiner Wahl und mixe sie zu einem Cocktail. Wähle zwei Mitspieler, die den Cocktail innerhalb von drei Runden auftrinken müssen.",
  atk = 1500,
  def = 1500,
  type = "magic", // "magic" | "trap" | "monster"
  stars = 4,
  monsterType = "[Effekt]",
  image = {
    uri: "https://jerrichoz.github.io/DrinkingGameOh/assets/images/cards/default_card.png",
  },
}) {
  // --- robustes Normalisieren: niemals crashen ---
  const normalizedType =
    typeof type === "string" && type.trim().length > 0
      ? type.trim().toLowerCase()
      : "monster";

  // --- Frames pro Typ (Achtung: Pfade relativ zu src/components/Card.js) ---
  const frameSources = {
    monster: require("../../assets/images/templates/monster_frame.png"),
    magic: require("../../assets/images/templates/magic_frame.png"),
    trap: require("../../assets/images/templates/trap_frame.png"),
  };
  const currentFrame = frameSources[normalizedType] || frameSources.monster;

  // --- Label pro Typ ---
  const typeLabels = {
    magic: "[ZAUBERKARTE]",
    trap: "[FALLENKARTE]",
    monster: monsterType,
  };
  const currentLabel =
    typeLabels[normalizedType] || `[${normalizedType.toUpperCase()}]`;

  return (
    <ImageBackground
      source={currentFrame}
      style={cardStyles.cardTemplate}
      resizeMode="stretch"
    >
      {/* Titel */}
      <View style={cardStyles.titleWrap}>
        <AutoFontSizeText
          style={cardStyles.cardTitle}
          minFontSize={14}
          maxFontSize={20}
        >
          {title}
        </AutoFontSizeText>
      </View>

      {/* Monster: Sterne */}
      {normalizedType === "monster" &&
        [...Array(stars)].map((_, i) => (
          <Image
            key={i}
            source={require("../../assets/images/star.png")}
            style={[cardStyles.starLevel, { right: 30 + i * 25 }]}
            resizeMode="contain"
          />
        ))}
      {/* Magic / Trap: TypeLabel oben statt Sterne */}
      {(normalizedType === "magic" || normalizedType === "trap") && (
        <Text style={cardStyles.topTypeLabel}>{currentLabel}</Text>
      )}
      {/* Bild in der Mitte */}
      <Image source={image} style={cardStyles.imageBox} resizeMode="cover" />

      {/* Monster: TypeLabel wie bisher unten über der Beschreibung */}
      {normalizedType === "monster" && (
        <Text style={cardStyles.typeLabel}>{currentLabel}</Text>
      )}

      {/* Beschreibung */}
      <Text style={cardStyles.monsterDescription}>{description}</Text>

      {/* ATK/DEF (nur bei Monsterkarten) */}
      {normalizedType === "monster" && (
        <>
          <Text style={cardStyles.monsterAtk}>ATK/{atk}</Text>
          <Text style={cardStyles.monsterDef}>DEF/{def}</Text>
        </>
      )}
    </ImageBackground>
  );
}
