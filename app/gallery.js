import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import CardDetailModal from "../src/components/CardDetailModal";
import ScreenBackButton from "../src/components/ScreenBackButton";
import { fetchAllCards } from "../src/utils/cards";
import { hiddenHeaderScreenOptions } from "../src/utils/stackScreenOptions";

export const options = hiddenHeaderScreenOptions;

export default function Gallery() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selectedCard, setSelectedCard] = useState(null);
  const [allCards, setAllCards] = useState([]);

  async function refreshCards() {
    const cards = await fetchAllCards();
    setAllCards(cards);
  }

  useEffect(() => {
    refreshCards();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: "#111" }}>
      <ScreenBackButton onPress={() => router.back()} />

      <Text
        style={{
          color: "#fff",
          fontSize: 22,
          fontFamily: "DidactGothic",
          textAlign: "center",
          marginTop: insets.top + 44,
        }}
      >
        📖 Karten-Galerie
      </Text>

      <TouchableOpacity
        onPress={refreshCards}
        style={{
          backgroundColor: "#444",
          padding: 10,
          margin: 10,
          borderRadius: 8,
          alignSelf: "center",
        }}
      >
        <Text style={{ color: "#fff", fontSize: 16 }}>🔄 Karten aktualisieren</Text>
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={{
          flexDirection: "row",
          flexWrap: "wrap",
          justifyContent: "center",
          padding: 10,
          paddingBottom: insets.bottom + 16,
        }}
      >
        {allCards.map((card, index) => (
          <TouchableOpacity
            key={index}
            style={{ margin: 8 }}
            onPress={() => setSelectedCard(card)}
          >
            <Image
              source={card.image}
              style={{ width: 80, height: 120 }}
              resizeMode="cover"
              onError={(e) =>
                console.warn(
                  "❌ Bild konnte nicht geladen werden:",
                  card.image,
                  e.nativeEvent.error
                )
              }
            />
          </TouchableOpacity>
        ))}
      </ScrollView>

      <CardDetailModal
        visible={!!selectedCard}
        card={selectedCard}
        source="gallery"
        onClose={() => setSelectedCard(null)}
      />
    </View>
  );
}
