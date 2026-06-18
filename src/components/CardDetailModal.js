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
  recordCardModalDebug,
  recordCardModalError,
  shouldUseAndroidSafeCardModal,
} from "../utils/cardModalDebug";
import { getModalCardDimensions } from "../utils/responsive";
import AndroidSafeCardDetail from "./AndroidSafeCardDetail";
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

function CardModalBody({ normalized, displayType, maxCardArea, renderMode }) {
  recordCardModalDebug("modal_body_render_start", {
    name: normalized?.name,
    type: displayType,
    imageUri: normalized?.image?.uri ?? null,
    renderMode,
  });

  if (renderMode === "android-safe") {
    return (
      <AndroidSafeCardDetail normalized={normalized} displayType={displayType} />
    );
  }

  return (
    <>
      <View
        collapsable={false}
        style={{
          flexShrink: 0,
          maxHeight: maxCardArea,
          width: 320,
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
 * Unified card detail modal — gallery, monster, trap.
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
  const useAndroidSafe = shouldUseAndroidSafeCardModal();
  const renderMode = useAndroidSafe ? "android-safe" : "full-card";

  const normalized = useMemo(() => {
    if (!card) return null;
    try {
      const defaultType =
        typeof card.type === "string" ? card.type.toLowerCase() : undefined;
      return normalizeCardForDisplay(card, { defaultType });
    } catch (err) {
      recordCardModalError("modal_normalize", err, { source });
      return null;
    }
  }, [card, source]);

  useEffect(() => {
    if (!visible) {
      recordCardModalDebug("modal_closed", { modalOpen: false, source });
      return;
    }
    if (!card) return;

    const openLog = getCardOpenLog(card, source);
    recordCardModalDebug("modal_open_request", {
      modalOpen: true,
      source,
      name: openLog.name,
      type: openLog.type,
      imageUri: openLog.imageUri,
      renderMode,
    });
    console.log("[CARD MODAL OPEN]", openLog);

    if (!normalized) {
      Alert.alert(
        "Karte nicht verfügbar",
        "Diese Karte konnte nicht angezeigt werden."
      );
      onClose?.();
    }
  }, [visible, card, normalized, source, onClose, renderMode]);

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

  recordCardModalDebug("modal_render_commit", {
    modalOpen: true,
    name: normalized.name,
    type: displayType,
    imageUri: normalized.image?.uri ?? null,
    renderMode,
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType={Platform.OS === "android" ? "none" : "fade"}
      onRequestClose={onClose}
      statusBarTranslucent={false}
      onShow={() =>
        recordCardModalDebug("modal_native_on_show", {
          name: normalized.name,
          renderMode,
        })
      }
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
          <ErrorBoundary
            context={{ source, cardName: normalized.name, renderMode }}
          >
            <CardModalBody
              normalized={normalized}
              displayType={displayType}
              maxCardArea={maxCardArea}
              renderMode={renderMode}
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
