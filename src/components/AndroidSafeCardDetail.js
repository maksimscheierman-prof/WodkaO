import { Text, View } from "react-native";
import { Image as ExpoImage } from "expo-image";
import { DEFAULT_CARD_IMAGE } from "../utils/cardDisplay";
import { recordCardModalDebug } from "../utils/cardModalDebug";

const CARD_BACK = require("../../assets/images/card_back.png");

/**
 * Android modal card renderer — no ImageBackground / AutoFontSizeText / star layers.
 * Used to avoid native crashes from nested image views in release APKs.
 */
export default function AndroidSafeCardDetail({ normalized, displayType }) {
  const imageSource =
    normalized?.image?.uri != null
      ? { uri: String(normalized.image.uri) }
      : DEFAULT_CARD_IMAGE;

  recordCardModalDebug("android_safe_render", {
    name: normalized?.name,
    type: displayType,
    imageUri: imageSource.uri ?? null,
    renderMode: "android-safe",
  });

  return (
    <View
      collapsable={false}
      style={{
        width: 300,
        maxWidth: "92%",
        padding: 14,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: "#D9C9A3",
        backgroundColor: "#120020",
      }}
    >
      <ExpoImage
        source={imageSource}
        style={{
          width: "100%",
          height: 280,
          borderRadius: 8,
          backgroundColor: "#000",
        }}
        contentFit="contain"
        placeholder={CARD_BACK}
        placeholderContentFit="cover"
        transition={0}
        onError={(err) =>
          recordCardModalDebug("android_safe_image_error", {
            name: normalized?.name,
            imageUri: imageSource.uri ?? null,
            error: err?.error ?? String(err),
          })
        }
        onLoad={() =>
          recordCardModalDebug("android_safe_image_loaded", {
            name: normalized?.name,
            imageUri: imageSource.uri ?? null,
          })
        }
      />

      <Text
        style={{
          color: "#ffe08a",
          fontSize: 18,
          fontWeight: "bold",
          marginTop: 12,
          textAlign: "center",
        }}
        numberOfLines={2}
      >
        {normalized?.name || "Unbekannte Karte"}
      </Text>

      <Text style={{ color: "#ccc", fontSize: 12, marginTop: 4, textAlign: "center" }}>
        {displayType === "unbekannt" ? "UNBEKANNT" : displayType.toUpperCase()}
      </Text>

      <Text
        style={{
          color: "#e8dff0",
          fontSize: 14,
          lineHeight: 20,
          marginTop: 10,
        }}
      >
        {normalized?.effect || "Kein Effekttext verfügbar."}
      </Text>

      {displayType === "monster" ? (
        <Text style={{ color: "#b8d4ff", marginTop: 10, fontSize: 13 }}>
          ATK/{Number(normalized?.atk) || 0} · DEF/{Number(normalized?.def) || 0}
        </Text>
      ) : null}
    </View>
  );
}
