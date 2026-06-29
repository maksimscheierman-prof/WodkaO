import { useEffect, useMemo } from "react";
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  getCardOpenLog,
  normalizeCardForDisplay,
} from "../utils/cardDisplay";
import { resolveCardFrameType } from "../utils/cardFrame";
import { shouldShowCardModal } from "../utils/cardModalCore";
import {
  recordCardModalDebug,
  recordCardModalError,
  shouldUseAndroidSafeCardModal,
} from "../utils/cardModalDebug";
import { getReactionDetailCardBounds } from "../utils/reactionLayout";
import AndroidSafeCardDetail from "./AndroidSafeCardDetail";
import ErrorBoundary from "./ErrorBoundary";
import SafeText from "./SafeText";
import TemplateCardRenderer from "./TemplateCardRenderer";

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

function CardModalBody({ card, displayType, useLegacySafe, maxWidth, maxHeight }) {
  const frameType = resolveCardFrameType(displayType, "monster");
  const cardKey = `${card?.name ?? ""}|${card?.image?.uri ?? ""}`;
  recordCardModalDebug("modal_body_render_start", {
    name: card?.name,
    type: displayType,
    frameType,
    imageUri: card?.image?.uri ?? null,
    renderMode: useLegacySafe ? "android-safe-legacy" : "template-card",
  });

  if (useLegacySafe) {
    return (
      <AndroidSafeCardDetail
        key={cardKey}
        normalized={card}
        displayType={displayType}
      />
    );
  }

  return (
    <TemplateCardRenderer
      key={cardKey}
      card={card}
      fallbackType={displayType}
      maxWidth={maxWidth}
      maxHeight={maxHeight}
      modalArtwork
    />
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
  const detailBounds = getReactionDetailCardBounds(screenWidth, screenHeight);
  const useLegacySafe = shouldUseAndroidSafeCardModal();
  const renderMode = useLegacySafe ? "android-safe-legacy" : "template-card";

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
    frameType: resolveCardFrameType(displayType, "monster"),
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
          nestedScrollEnabled={Platform.OS === "android"}
        >
          <ErrorBoundary
            context={{ source, cardName: normalized.name, renderMode }}
          >
            <CardModalBody
              card={normalized}
              displayType={displayType}
              useLegacySafe={useLegacySafe}
              maxWidth={detailBounds.maxWidth}
              maxHeight={detailBounds.maxHeight}
            />
          </ErrorBoundary>

          <TouchableOpacity onPress={onClose} style={closeBtnStyle}>
            <SafeText
              component="CardDetailModal.close"
              style={{ fontWeight: "bold", fontSize: 15, color: "#2E1F12" }}
            >
              Schließen
            </SafeText>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}
