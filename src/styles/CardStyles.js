import { StyleSheet } from "react-native";

export const cardStyles = StyleSheet.create({
  cardTemplate: {
    width: 320,
    height: 550,
    margin: 10,
    zIndex: 1,
  },

  // Titel im oberen Balken
  titleWrap: {
    position: "absolute",
    top: 27,
    left: 20,
    right: 20,
    height: 24,
    justifyContent: "center",
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "bold",
    fontFamily: "DidactGothic",
    color: "#000",
  },

  // Sterne rechts vom Titel
  starLevel: {
    position: "absolute",
    top: 65,
    right: 30,
    width: 25,
    height: 25,
    zIndex: 3,
  },

  // Bild exakt im schwarzen Fenster
  imageBox: {
    position: "absolute",
    top: 95,
    left: 34,
    right: 34,
    width: 250,
    height: 295,
    zIndex: 99,
  },

  // Typ-Leiste (unter Bild, vor Effekt) — visuell ausgeblendet (opacity), nie fontSize: 0 (Android Fabric crash)
  typeLabel: {
    position: "absolute",
    top: 410,
    left: 25,
    right: 20,
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "left",
    opacity: 0,
    pointerEvents: "none",
  },

  // neues Label für Magic/Trap oben
  topTypeLabel: {
    position: "absolute",
    top: 70, // gleiche Höhe wie Titel
    right: 32,
    fontSize: 14,
    fontWeight: "bold",
    color: "#000",
    textAlign: "right",
  },
  // Beschreibung unten im Textfeld
  monsterDescription: {
    position: "absolute",
    top: 415,
    left: 28,
    right: 20,
    bottom: 40, // Platz für ATK/DEF lassen
    fontSize: 12,
    lineHeight: 16,
    color: "#000",
    textAlign: "left",
    backgroundColor: "transparent",
    zIndex: 3,
  },

  // ATK/DEF ganz unten rechts
  monsterAtk: {
    position: "absolute",
    bottom: 13,
    right: 80,
    fontSize: 12,
    fontWeight: "bold",
    color: "#000",
  },
  monsterDef: {
    position: "absolute",
    bottom: 13,
    right: 20,
    fontSize: 12,
    fontWeight: "bold",
    color: "#000",
  },
});
