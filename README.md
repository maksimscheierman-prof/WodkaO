# WodkaO / Sauf Viel-Oh

Expo ~54 + React Native — Multiplayer-Kartentrinkspiel mit Firebase Firestore.

**Projektroot:** dieser Ordner (`Sauf Viel-Oh/`) — Git, App-Code und npm liegen hier.

## Schnellstart

```bash
npm install
cp .env.example .env   # Firebase + Google Sheets Keys eintragen
npm start              # Expo Dev Server
npm run web            # Browser
npm run lint
```

Vollständige Doku: [project.md](project.md) · [docs/MVP_ROADMAP.md](docs/MVP_ROADMAP.md)

---

# 🍻 Yu-Gi-Oh! Trinkspiel (React Native + Expo + Firebase)

Ein Multiplayer-Trinkspiel, das die Klassiker **Yu-Gi-Oh!** und **Circle of Death / Klatschen** kombiniert.  
Mit Yu-Gi-Oh!-Kartenoptik, Multiplayer-Lobby und Magie-/Fallen-/Monsterkarten.

---

## ⚡ Features (bisher)

- ✅ Spieler können einer **Lobby** beitreten oder selbst eine erstellen (Lobby-Code wird generiert und geteilt).
- ✅ Spieler müssen sich mit einem Namen anmelden.
- ✅ **Ready-System**: alle Spieler müssen bereit sein, bevor der Host starten kann.
- ✅ **Game-Board**: Monsterkarten werden offen angezeigt, Fallen verdeckt (eigene Fallenkarte anklickbar).
- ✅ **Magic Stack**: Magiekarten können gezogen werden (nur vom Spieler, der am Zug ist).
- ✅ Karten-Galerie: Alle Karten durchsuchen und Effekte ansehen.
- ✅ Firebase **Realtime Updates** über Firestore.

---

## 📦 Installation

### Voraussetzungen

- [Node.js](https://nodejs.org/) (empfohlen: LTS Version)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- [Firebase-Projekt](https://console.firebase.google.com/)

### Projekt klonen

```bash
git clone https://github.com/maksimscheierman-prof/WodkaO.git
cd "Sauf Viel-Oh"
npm install
```

### Links

https://codepen.io/camelCaseJoe/pen/eYZPvvM
