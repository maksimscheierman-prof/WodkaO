import { TouchableOpacity, View } from "react-native";
import { getVotingCardBounds } from "../utils/reactionLayout";
import SafeText from "./SafeText";
import TemplateCardRenderer from "./TemplateCardRenderer";

const btnBase = {
  minHeight: 44,
  paddingVertical: 10,
  paddingHorizontal: 16,
  borderRadius: 8,
  justifyContent: "center",
  alignItems: "center",
  minWidth: 120,
  marginHorizontal: 6,
  marginVertical: 4,
};

/**
 * Voting / result overlay — template card + fixed action buttons (no page scroll).
 */
export default function VotingPhasePanel({
  effectCard,
  effectPlayer,
  screenWidth,
  screenHeight,
  subtitle,
  children,
  actionDisabled = false,
}) {
  const actionOpacity = actionDisabled ? 0.5 : 1;
  const bounds = getVotingCardBounds(screenWidth, screenHeight);
  const fallbackType =
    typeof effectCard?.type === "string"
      ? effectCard.type.toLowerCase()
      : "monster";

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
        {effectCard ? (
          <TemplateCardRenderer
            card={effectCard}
            fallbackType={fallbackType}
            maxWidth={bounds.maxWidth}
            maxHeight={bounds.maxHeight}
          />
        ) : null}

        {subtitle ? (
          <SafeText
            component="VotingPhasePanel.subtitle"
            style={{
              color: "#fff",
              fontSize: 16,
              textAlign: "center",
              marginTop: 12,
              paddingHorizontal: 8,
            }}
          >
            {subtitle}
          </SafeText>
        ) : null}

        {effectPlayer && !subtitle?.includes("?") ? (
          <SafeText
            component="VotingPhasePanel.player"
            style={{ color: "#ccc", fontSize: 13, marginTop: 6 }}
          >
            {effectPlayer}
          </SafeText>
        ) : null}
      </View>

      <View
        style={{
          width: "100%",
          alignItems: "center",
          flexShrink: 0,
          paddingTop: 8,
          opacity: actionOpacity,
        }}
      >
        {children}
      </View>
    </View>
  );
}

export function VoteButton({ label, subLabel, onPress, disabled, backgroundColor, textColor = "#fff" }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={{ ...btnBase, backgroundColor }}
    >
      {subLabel ? (
        <SafeText
          component="VotingPhasePanel.voteSub"
          style={{ color: "#bbb", fontSize: 11, marginBottom: 4, textAlign: "center" }}
        >
          {subLabel}
        </SafeText>
      ) : null}
      <SafeText
        component="VotingPhasePanel.vote"
        style={{ color: textColor, fontSize: 15, textAlign: "center" }}
      >
        {label}
      </SafeText>
    </TouchableOpacity>
  );
}

export function VoteButtonRow({ children }) {
  return (
    <View
      style={{
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "center",
        width: "100%",
      }}
    >
      {children}
    </View>
  );
}
