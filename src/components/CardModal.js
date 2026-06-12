import { Modal, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ResponsiveCard from "./ResponsiveCard";

export default function CardModal({ selectedCard, onClose }) {
  const insets = useSafeAreaInsets();

  if (!selectedCard) return null;

  const cardType =
    typeof selectedCard.type === "string"
      ? selectedCard.type.toLowerCase()
      : "";
  const isMonsterOrTrap = cardType === "monster" || cardType === "trap";
  if (!isMonsterOrTrap) return null;

  return (
    <Modal visible={!!selectedCard} transparent animationType="fade">
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.85)",
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        }}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 12,
            paddingVertical: 16,
          }}
          bounces={false}
        >
          <ResponsiveCard
            verticalPad={140}
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
            onPress={onClose}
            style={{
              marginTop: 16,
              minHeight: 44,
              minWidth: 120,
              paddingVertical: 12,
              paddingHorizontal: 24,
              backgroundColor: "#D9C9A3",
              borderRadius: 10,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Text style={{ fontWeight: "bold", fontSize: 15 }}>Schließen</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}
