import { ScrollView, Text, TouchableOpacity, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function CommentatorSessionSummary({
  intro,
  awards = [],
  onDone,
  doneLabel = "Zur Startseite",
}) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const compact = width < 400;
  const contentWidth = Math.min(width - 32, compact ? width - 24 : 520);

  return (
    <ScrollView
      contentContainerStyle={{
        flexGrow: 1,
        alignItems: "center",
        paddingTop: insets.top + 16,
        paddingBottom: insets.bottom + 24,
        paddingHorizontal: compact ? 12 : 16,
      }}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ width: contentWidth, maxWidth: 520 }}>
        <Text
          style={{
            color: "#fff",
            fontSize: compact ? 24 : 28,
            fontWeight: "bold",
            marginBottom: 8,
            textAlign: "center",
          }}
        >
          🏆 Abschlussbericht
        </Text>

        {intro ? (
          <Text
            style={{
              color: "#d4c4ff",
              fontSize: compact ? 14 : 15,
              lineHeight: compact ? 20 : 22,
              textAlign: "center",
              marginBottom: 24,
            }}
          >
            {intro}
          </Text>
        ) : null}

        {awards.length === 0 ? (
          <View
            style={{
              backgroundColor: "rgba(255,255,255,0.08)",
              borderRadius: 12,
              padding: 16,
              marginBottom: 24,
            }}
          >
            <Text style={{ color: "#ccc", textAlign: "center", fontSize: 14 }}>
              Keine Awards in dieser Session — vielleicht war es zu kurz?
            </Text>
          </View>
        ) : (
          awards.map((award) => (
            <View
              key={award.id}
              style={{
                backgroundColor: "rgba(255,255,255,0.08)",
                borderRadius: 12,
                padding: compact ? 14 : 16,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: "rgba(180, 140, 255, 0.25)",
              }}
            >
              <Text
                style={{
                  color: "#fff",
                  fontSize: compact ? 16 : 17,
                  fontWeight: "700",
                }}
              >
                {award.emoji} {award.title}
              </Text>
              <Text
                style={{
                  color: "#e8dcff",
                  fontSize: compact ? 15 : 16,
                  fontWeight: "600",
                  marginTop: 6,
                }}
              >
                {award.playerName}
              </Text>
              {award.comment ? (
                <Text
                  style={{
                    color: "#bbb",
                    fontSize: compact ? 12 : 13,
                    marginTop: 6,
                    lineHeight: compact ? 17 : 18,
                  }}
                >
                  {award.comment}
                </Text>
              ) : null}
            </View>
          ))
        )}

        <TouchableOpacity
          onPress={onDone}
          style={{
            marginTop: 12,
            backgroundColor: "#D9C9A3",
            borderRadius: 12,
            paddingVertical: 14,
            paddingHorizontal: 20,
            borderWidth: 2,
            borderColor: "#5C4033",
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#2E1F12", fontSize: 16, fontWeight: "800" }}>
            {doneLabel}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
