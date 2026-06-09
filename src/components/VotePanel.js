import { Text, TouchableOpacity, View } from "react-native";

export default function VotePanel({
  lobby,
  playerName,
  handleVote,
  actionDisabled = false,
}) {
  if (!lobby) return null;

  // Wenn keine Abstimmung aktiv ist → nichts anzeigen
  if (!lobby.activeEffect && !lobby.voteResult) return null;

  return (
    <View
      style={{
        position: "absolute",
        top: 20,
        left: 20,
        backgroundColor: "rgba(0,0,0,0.7)",
        padding: 10,
        borderRadius: 8,
        width: 200,
      }}
    >
      {lobby.votingOpen && lobby.activeEffect ? (
        <>
          <Text style={{ color: "#fff", fontSize: 14, marginBottom: 5 }}>
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
                padding: 5,
                borderRadius: 6,
                flex: 1,
                marginRight: 5,
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
                padding: 5,
                borderRadius: 6,
                flex: 1,
                opacity: actionDisabled ? 0.5 : 1,
              }}
            >
              <Text style={{ color: "#fff", textAlign: "center" }}>
                Nein ❌
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={{ color: "#aaa", fontSize: 12, marginTop: 5 }}>
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
