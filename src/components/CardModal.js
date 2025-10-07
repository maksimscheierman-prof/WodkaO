import { Modal, Text, TouchableOpacity, View } from "react-native";
import Card from "./Card";

export default function CardModal({ selectedCard, setSelectedCard }) {
  if (!selectedCard) return null;

  return (
    <Modal visible={!!selectedCard} transparent animationType="fade">
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.85)",
          justifyContent: "center",
          alignItems: "center",
          paddingHorizontal: 20,
        }}
      >
        <Card
          title={selectedCard.name || selectedCard.title}
          description={selectedCard.effect}
          atk={selectedCard.atk}
          def={selectedCard.def}
          type={selectedCard.type}
          stars={selectedCard.stars}
          monsterType={selectedCard.monsterType}
          image={selectedCard.image}
        />

        <TouchableOpacity
          onPress={() => setSelectedCard(null)}
          style={{
            marginTop: 20,
            paddingVertical: 10,
            paddingHorizontal: 20,
            backgroundColor: "#D9C9A3",
            borderRadius: 10,
          }}
        >
          <Text style={{ fontWeight: "bold" }}>Schließen</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}
