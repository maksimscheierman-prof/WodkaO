import { useEffect, useState } from "react";
import {
  Modal,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  getTrapChoiceCardBounds,
  getTrapChoiceSecondsLeft,
  TRAP_CHOICE_TIMEOUT_CHOICE,
  usesStackedTrapLayout,
} from "../utils/trapChoice";
import SafeText from "./SafeText";
import TemplateCardRenderer from "./TemplateCardRenderer";

const MODAL_BACKDROP = "rgba(0,0,0,0.9)";

const btnBase = {
  minHeight: 44,
  paddingVertical: 10,
  paddingHorizontal: 16,
  borderRadius: 8,
  justifyContent: "center",
  alignItems: "center",
  minWidth: 160,
  marginVertical: 4,
};

function TrapCardColumn({ label, card, maxWidth, maxHeight }) {
  return (
    <View style={{ alignItems: "center", marginVertical: 8, maxWidth }}>
      <SafeText
        component="TrapChoiceModal.cardLabel"
        style={{
          color: "#ddd",
          fontSize: 14,
          fontWeight: "bold",
          marginBottom: 8,
          textAlign: "center",
        }}
      >
        {label}
      </SafeText>
      <TemplateCardRenderer
        card={card}
        fallbackType="trap"
        maxWidth={maxWidth}
        maxHeight={maxHeight}
      />
    </View>
  );
}

/**
 * Active player chooses which trap to keep after drawing a second trap.
 * Other players see neutral status only (handled in game HUD).
 */
export default function TrapChoiceModal({
  pending,
  isChooser,
  onChoose,
  onTimeout,
  actionDisabled = false,
}) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const stacked = usesStackedTrapLayout(screenWidth);
  const bounds = getTrapChoiceCardBounds(screenWidth, screenHeight, stacked);
  const actionOpacity = actionDisabled ? 0.5 : 1;

  const [secondsLeft, setSecondsLeft] = useState(() =>
    getTrapChoiceSecondsLeft(pending)
  );

  useEffect(() => {
    if (!pending?.startedAt) return;
    const tick = () => setSecondsLeft(getTrapChoiceSecondsLeft(pending));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [pending?.startedAt]);

  useEffect(() => {
    if (!isChooser || secondsLeft > 0) return;
    onTimeout?.(TRAP_CHOICE_TIMEOUT_CHOICE);
  }, [isChooser, secondsLeft, onTimeout]);

  if (!pending || !isChooser) return null;

  const touchBtn = (extra = {}) => ({
    ...btnBase,
    opacity: actionOpacity,
    ...extra,
  });

  return (
    <Modal visible transparent animationType="fade">
      <View
        style={{
          flex: 1,
          backgroundColor: MODAL_BACKDROP,
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        }}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: 12,
            paddingVertical: 8,
          }}
          bounces={false}
          keyboardShouldPersistTaps="handled"
        >
          <SafeText
            component="TrapChoiceModal.hint"
            style={{
              color: "#fff",
              fontSize: 16,
              textAlign: "center",
              marginBottom: 12,
              paddingHorizontal: 8,
            }}
          >
            Du darfst nur eine Falle behalten. Die andere wird abgelegt.
          </SafeText>

          <View
            style={{
              flexDirection: stacked ? "column" : "row",
              flexWrap: "wrap",
              justifyContent: "center",
              alignItems: stacked ? "center" : "flex-start",
              width: "100%",
            }}
          >
            <TrapCardColumn
              label="A — Deine aktuelle Falle"
              card={pending.existingTrap}
              maxWidth={bounds.maxWidth}
              maxHeight={bounds.maxHeight}
            />
            <TrapCardColumn
              label="B — Neu gezogene Falle"
              card={pending.drawnTrap}
              maxWidth={bounds.maxWidth}
              maxHeight={bounds.maxHeight}
            />
          </View>

          <View style={{ width: "100%", alignItems: "center", marginTop: 12 }}>
            <TouchableOpacity
              onPress={() => onChoose("keep_existing")}
              disabled={actionDisabled}
              style={touchBtn({ backgroundColor: "#4a5568" })}
            >
              <SafeText
                component="TrapChoiceModal.keepOld"
                style={{ color: "#fff", fontSize: 15, textAlign: "center" }}
              >
                {actionDisabled ? "⏳ …" : "Alte Falle behalten"}
              </SafeText>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => onChoose("keep_drawn")}
              disabled={actionDisabled}
              style={touchBtn({ backgroundColor: "#A33" })}
            >
              <SafeText
                component="TrapChoiceModal.keepNew"
                style={{ color: "#fff", fontSize: 15, textAlign: "center" }}
              >
                {actionDisabled ? "⏳ …" : "Neue Falle behalten"}
              </SafeText>
            </TouchableOpacity>

            <SafeText
              component="TrapChoiceModal.timer"
              style={{
                color: "#bbb",
                fontSize: 12,
                marginTop: 8,
                textAlign: "center",
              }}
            >
              Automatisch alte Falle behalten in {secondsLeft}s
            </SafeText>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}
