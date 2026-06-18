import { useEffect, useMemo } from "react";
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  getCardOpenLog,
  normalizeCardForDisplay,
} from "../utils/cardDisplay";
import { shouldShowCardModal } from "../utils/cardModalCore";
import {
  CARD_BASE_WIDTH,
  getModalCardDimensions,
} from "../utils/responsive";
import Card from "./Card";
import ErrorBoundary from "./ErrorBoundary";

const closeBtnStyle = {
  marginTop: 16,
  minHeight: 48,
  minWidth: 140,
  paddingVertical: 12,
  paddingHorizontal: 24,
  backgroundColor: "#D9C9A3",
  borderRadius: 10,
  justifyContent: "center",
  alignItems: "center",
  zIndex: 20,
  elevation: 20,
};

function CardModalBody({ normalized, displayType, maxCardArea }) {
  return (
    <>
      <View
        collapsable={false}
        style={{
          flexShrink: 0,
          maxHeight: maxCardArea,
          width: CARD_BASE_WIDTH,
          zIndex: 10,
          elevation: 10,
        }}
      >
        <Card
          title={normalized.name}
          description={normalized.effect}
          image={normalized.image}
          type={displayType}
          atk={normalized.atk}
          def={normalized.def}
          stars={normalized.stars}
          monsterType={normalized.monsterType}
        />
      </View>

      <Text
        style={{
          color: "#d4c4e8",
          fontSize: 13,
          marginTop: 10,
          textAlign: "center",
        }}
      >
        {normalized.name} ·{" "}
        {displayType === "unbekannt"
          ? "Unbekannt"
          : displayType.toUpperCase()}
      </Text>
    </>
  );
}

/**
 * Unified card detail modal — gallery, monster, trap (Android-safe, no transform scale).
 */
export default function CardDetailModal({
  visible,
  card,
  source = "unknown",
  onClose,
}) {
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const { height: maxCardArea } = getModalCardDimensions(
    screenWidth,
    screenHeight,
    200
  );

  const normalized = useMemo(() => {
    if (!card) return null;
    try {
      const defaultType =
        typeof card.type === "string" ? card.type.toLowerCase() : undefined;
      return normalizeCardForDisplay(card, { defaultType });
    } catch (err) {
      console.error("[CARD MODAL NORMALIZE]", { source, err, card });
      return null;
    }
  }, [card, source]);

  useEffect(() => {
    if (!visible || !card) return;
    console.log("[CARD MODAL OPEN]", getCardOpenLog(card, source));
    if (!normalized) {
      Alert.alert(
        "Karte nicht verfügbar",
        "Diese Karte konnte nicht angezeigt werden."
      );
      onClose?.();
    }
  }, [visible, card, normalized, source, onClose]);

  if (!shouldShowCardModal(visible, card) || !normalized) return null;

  const cardType =
    typeof normalized.type === "string"
      ? normalized.type.toLowerCase()
      : "unbekannt";
  const displayType =
    cardType === "unbekannt"
      ? "unbekannt"
      : cardType === "magic"
        ? "magic"
        : cardType === "trap"
          ? "trap"
          : "monster";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent={Platform.OS === "android"}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.88)",
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        }}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 12,
            paddingVertical: 16,
          }}
          bounces={false}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled={false}
        >
          <ErrorBoundary context={{ source, cardName: normalized.name }}>
            <CardModalBody
              normalized={normalized}
              displayType={displayType}
              maxCardArea={maxCardArea}
            />
          </ErrorBoundary>

          <TouchableOpacity onPress={onClose} style={closeBtnStyle}>
            <Text style={{ fontWeight: "bold", fontSize: 15, color: "#2E1F12" }}>
              Schließen
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}
