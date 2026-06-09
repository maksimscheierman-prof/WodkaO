import { StyleSheet } from "react-native";

export const gameStyles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 8,
    paddingTop: 6,
    paddingBottom: 6,
  },
  playerName: {
    color: "#fff",
    marginTop: 4,
  },
  cardImageSmall: {
    width: 60,
    height: 90,
  },
  cardImageMedium: {
    width: 80,
    height: 120,
  },
  cardImageLarge: {
    width: 100,
    height: 150,
  },
  trapImage: {
    width: 50,
    height: 80,
    marginTop: 5,
  },
  magicStack: {
    alignItems: "center",
    marginBottom: 100,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
});
