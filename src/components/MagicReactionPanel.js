import { TouchableOpacity, View } from "react-native";
import {
  getReactionDetailCardBounds,
  getReactionMagicCardBounds,
  getReactionViewUi,
} from "../utils/reactionLayout";
import SafeText from "./SafeText";
import TemplateCardRenderer from "./TemplateCardRenderer";

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

/**
 * Mobile reaction phase: compact magic + action bar, optional monster/trap detail overlay.
 */
export default function MagicReactionPanel({
  magicCard,
  me,
  screenWidth,
  screenHeight,
  selectedReactionCard,
  onSelectReactionCard,
  onDrink,
  onActivateMonster,
  onActivateTrap,
  onDone,
  actionDisabled = false,
  canActivateMonster = true,
  reactLeft,
  fmt,
}) {
  const actionOpacity = actionDisabled ? 0.5 : 1;
  const ui = getReactionViewUi(selectedReactionCard, me, { canActivateMonster });
  const magicBounds = getReactionMagicCardBounds(screenWidth, screenHeight);
  const detailBounds = getReactionDetailCardBounds(screenWidth, screenHeight);

  const touchBtn = (extra = {}) => ({
    ...btnBase,
    opacity: actionOpacity,
    ...extra,
  });

  return (
    <View
      style={{
        flex: 1,
        width: "100%",
        paddingHorizontal: 12,
        paddingVertical: 8,
      }}
    >
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          minHeight: 0,
        }}
      >
        {ui.showMagicCard && magicCard ? (
          <TemplateCardRenderer
            card={magicCard}
            fallbackType="magic"
            maxWidth={magicBounds.maxWidth}
            maxHeight={magicBounds.maxHeight}
          />
        ) : null}

        {ui.showMonsterCard && me?.monster ? (
          <TemplateCardRenderer
            card={me.monster}
            fallbackType="monster"
            maxWidth={detailBounds.maxWidth}
            maxHeight={detailBounds.maxHeight}
          />
        ) : null}

        {ui.showTrapCard && me?.trap ? (
          <TemplateCardRenderer
            card={me.trap}
            fallbackType="trap"
            maxWidth={detailBounds.maxWidth}
            maxHeight={detailBounds.maxHeight}
          />
        ) : null}
      </View>

      <View style={{ width: "100%", alignItems: "center", flexShrink: 0, paddingTop: 8 }}>
        {ui.isDefault ? (
          <>
            <TouchableBtn
              label={actionDisabled ? "⏳ ..." : "🍺 Trinken (+1)"}
              onPress={onDrink}
              disabled={actionDisabled}
              style={touchBtn({ backgroundColor: "#D9C9A3" })}
            />

            {ui.showMonsterOption ? (
              <TouchableBtn
                label="👁 Monster ansehen"
                onPress={() => onSelectReactionCard("monster")}
                disabled={actionDisabled}
                style={touchBtn({ backgroundColor: "#4a5568" })}
                textColor="#fff"
              />
            ) : null}

            {ui.showTrapOption ? (
              <TouchableBtn
                label="👁 Falle ansehen"
                onPress={() => onSelectReactionCard("trap")}
                disabled={actionDisabled}
                style={touchBtn({ backgroundColor: "#4a5568" })}
                textColor="#fff"
              />
            ) : null}
          </>
        ) : null}

        {ui.showMonsterActivate ? (
          <TouchableBtn
            label={actionDisabled ? "⏳" : "⚡ Monster aktivieren"}
            onPress={onActivateMonster}
            disabled={actionDisabled}
            style={touchBtn({ backgroundColor: "#337" })}
            textColor="#fff"
          />
        ) : null}

        {ui.showMonsterUsedHint ? (
          <SafeText
            component="MagicReactionPanel.monsterUsed"
            style={{
              color: "#ffb4b4",
              fontSize: 14,
              textAlign: "center",
              marginVertical: 6,
              paddingHorizontal: 12,
            }}
          >
            Effekt diese Runde bereits genutzt
          </SafeText>
        ) : null}

        {ui.showTrapActivate ? (
          <TouchableBtn
            label={actionDisabled ? "⏳" : "⚡ Falle aktivieren"}
            onPress={onActivateTrap}
            disabled={actionDisabled}
            style={touchBtn({ backgroundColor: "#A33" })}
            textColor="#fff"
          />
        ) : null}

        {ui.showBackToMagic ? (
          <TouchableBtn
            label="← Zurück zur Magiekarte"
            onPress={() => onSelectReactionCard(null)}
            disabled={actionDisabled}
            style={touchBtn({ backgroundColor: "#D9C9A3" })}
          />
        ) : null}

        {ui.showDone ? (
          <TouchableBtn
            label={actionDisabled ? "⏳ ..." : "✅ Done"}
            onPress={onDone}
            disabled={actionDisabled}
            style={touchBtn({ backgroundColor: "#D9C9A3", marginTop: 8 })}
          />
        ) : null}

        <SafeText
          component="MagicReactionPanel.timer"
          style={{ color: "#bbb", fontSize: 12, marginTop: 6, textAlign: "center" }}
        >
          Automatisch Done in {fmt(reactLeft)}
        </SafeText>
      </View>
    </View>
  );
}

function TouchableBtn({ label, onPress, disabled, style, textColor = "#2E1F12" }) {
  return (
    <TouchableOpacity onPress={onPress} disabled={disabled} style={style}>
      <SafeText
        component="MagicReactionPanel.button"
        style={{ color: textColor, fontSize: 15, textAlign: "center" }}
      >
        {label}
      </SafeText>
    </TouchableOpacity>
  );
}
