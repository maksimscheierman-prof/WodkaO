import { Text, TouchableOpacity, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function VotePanel({
  lobby,
  playerName,
  handleVote,
  actionDisabled = false,
}) {
  const { width: screenWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const compact = screenWidth < 400;

  if (!lobby) return null;

  if (!lobby.activeEffect && !lobby.voteResult) return null;

  return (
    <View
      style={
        compact
          ? {
              position: "absolute",
              left: 8,
              right: 8,
              bottom: Math.max(8, insets.bottom + 4),
              backgroundColor: "rgba(0,0,0,0.85)",
              padding: 12,
              borderRadius: 10,
              zIndex: 25,
            }
          : {
              position: "absolute",
              top: Math.max(72, insets.top + 56),
              left: 12,
              backgroundColor: "rgba(0,0,0,0.7)",
              padding: 12,
              borderRadius: 8,
              width: 220,
              zIndex: 25,
            }
      }
    >
      {lobby.votingOpen && lobby.activeEffect ? (
        <>
          <Text style={{ color: "#fff", fontSize: 14, marginBottom: 8 }}>
            Abstimmung: {lobby.activeEffect.card.name}
          </Text>
          <View
            style={{ flexDirection: "row", justifyContent: "space-between" }}
          >
            <TouchableOpacity
              onPress={() => handleVote("ja")}
              disabled={actionDisabled}
              style={{
                backgroundColor: "#1b5e20",
                paddingVertical: 10,
                paddingHorizontal: 8,
                borderRadius: 8,
                flex: 1,
                marginRight: 6,
                minHeight: 44,
                justifyContent: "center",
                opacity: actionDisabled ? 0.5 : 1,
              }}
            >
              <Text style={{ color: "#fff", textAlign: "center" }}>
                {actionDisabled ? "⏳" : "Ja ✅"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleVote("nein")}
              disabled={actionDisabled}
              style={{
                backgroundColor: "#b71c1c",
                paddingVertical: 10,
                paddingHorizontal: 8,
                borderRadius: 8,
                flex: 1,
                minHeight: 44,
                justifyContent: "center",
                opacity: actionDisabled ? 0.5 : 1,
              }}
            >
              <Text style={{ color: "#fff", textAlign: "center" }}>
                Nein ❌
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={{ color: "#aaa", fontSize: 12, marginTop: 6 }}>
            Deine Stimme zählt nur einmal
          </Text>
        </>
      ) : (
        lobby.voteResult && (
          <Text style={{ color: "#fff", fontSize: 14, textAlign: "center" }}>
            {lobby.voteResult}
          </Text>
        )
      )}
    </View>
  );
}
