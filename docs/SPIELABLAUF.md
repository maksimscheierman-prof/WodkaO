# Spielablauf — WodkaO / Sauf Viel-Oh

*Stand: 2026-06-09*

**MVP-Kontext:** Dieser Ablauf ist der **Ziel-Spielstand** für die testbare APK. Umsetzungsstatus: [MVP_ROADMAP.md](MVP_ROADMAP.md). Build: [BUILD_ANDROID.md](BUILD_ANDROID.md).

Diese Datei beschreibt den **aktuellen** Spielablauf nach dem Umbau der Startphase und des Saufstapels.

---

## Übersicht der Phasen

| Phase (`gamePhase`) | Beschreibung |
|---------------------|--------------|
| `waiting` | Lobby — Spieler sammeln sich, Ready, Host startet |
| `rollingForStartPlayer` | Alle würfeln einmal für den Startspieler |
| `resolvingTie` | Gleichstand — nur Beteiligte würfeln erneut |
| `drawingMonsters` | Jeder zieht genau ein Monster vom Monsterstapel |
| `playing` | Normale Runden — Ziehen aus dem Saufstapel |

Firestore-Feld: `lobby.gamePhase` (gesetzt ab Spielstart).

---

## Online-Synchronisation (Multiplayer)

Jeder Spieler = **eigenes Gerät** (Browser oder APK) mit **demselben Lobby-Code**.

| Schritt | Sync |
|---------|------|
| Lobby warten | Alle sehen `players[]` + Ready live |
| Host startet | `onSnapshot` → Redirect zu `/game` für alle |
| Würfeln / Monster / Zug | Jede Aktion = `updateDoc` → alle Clients aktualisieren |

Technik: [FIREBASE_SCHEMA.md](FIREBASE_SCHEMA.md)

**Ohne Login:** Spielername bei Start eingeben; muss pro Lobby eindeutig sein.

---

## 1. Spielstart

- Host startet, wenn alle **Ready** sind.
- **Keine Karten** werden initial verteilt.
- Alle Spieler: `monster: null`, `trap: null`.
- Es werden zwei Decks gemischt und in Firestore gespeichert:
  - **`monsterDeck`** — nur Monsterkarten
  - **`saufDeck`** — Magie + Fallen (gemischt)
- `status` → `"playing"`, `gamePhase` → `"rollingForStartPlayer"`.
- **Kein Beitritt** mehr, sobald `status === "playing"`.
- **Lobby-Ablauf:** Nach 2 Stunden ohne Aktivität (`lastActivityAt`) wird die Lobby `status: "expired"` — Details: [firebase_cleanup.md](firebase_cleanup.md).

---

## 2. Startspieler würfeln

- Jeder Spieler in `rollingEligible` würfelt **einmal** (W6).
- Ergebnisse in `diceRolls: { [spielerName]: zahl }`.
- Wenn alle gewürfelt haben:
  - **Höchste Zahl gewinnt** → `startPlayerName`, `turn` = Index des Gewinners, `gamePhase` → `drawingMonsters`.
  - **Gleichstand** → `gamePhase` → `resolvingTie`, `rollingEligible` = nur die Gleichstandsspieler, `diceRolls` geleert, `diceRound`++.
- Gleichstandsregel wiederholt sich, bis **genau ein** Gewinner feststeht.

UI: `GameSetupPanel` — zeigt wer gewürfelt hat, wer wartet, Gleichstand-Hinweis.

---

## 3. Monster ziehen

- Phase: `drawingMonsters`.
- Jeder Spieler zieht **selbst** genau **eine** Karte vom `monsterDeck`.
- Nach dem Zug: `players[].monster` gesetzt.
- Wenn **alle** ein Monster haben → `gamePhase` → `playing`, Runde 1 beginnt.
- **Keine Fallenkarten** in dieser Phase.

---

## 4. Saufstapel

- **Magie + Fallen** liegen gemischt in `saufDeck`.
- Mittlerer Stapel am Tisch: Label **„Saufstapel“**.
- Spieler starten **ohne** Fallenkarte.
- Fallen kommen nur durch Ziehen aus dem Saufstapel aufs Feld.

---

## 5. Runden / Zugreihenfolge

- Startspieler (`startPlayerName` / `turn`) beginnt.
- Aktiver Spieler zieht **eine** Karte aus dem Saufstapel.
- Nach der Kartenbehandlung geht der Zug weiter (modulo Spieleranzahl).
- `round` erhöht sich, wenn `turn` wieder bei 0 ist.

---

## 6. Magiekarten

- Verhalten wie bisher:
  1. Ziehen → verdeckt (`lastMagic`, `showMagic: false`)
  2. Aufdecken → Reaktionsphase
  3. Andere reagieren (Trinken, Monster/Falle aktivieren, Done)
  4. Zugspieler legt ab → Ablage, nächster Spieler
- Abstimmung bei aktivierten Effekten unverändert.

---

## 7. Fallenkarten

- Beim Ziehen aus dem Saufstapel:
  - Karte wird **verdeckt** als `players[].trap` platziert (neben Monster).
  - **Kein** automatisches Auslösen.
  - Zug endet sofort (Turn wechselt).
- Bereits vorhandene Falle → alte Falle auf die Ablage, neue Falle ersetzt sie.
- Aktivierung später über bestehende **Effekt aktivieren** + Abstimmung.
- Nach bestätigter Aktivierung: Falle verbraucht (`trap: null`).

---

## 8. Firestore-Felder (neu/ relevant)

| Feld | Typ | Bedeutung |
|------|-----|-----------|
| `gamePhase` | string | Aktuelle Makro-Phase |
| `diceRolls` | object | Würfelergebnisse aktuelle Runde |
| `diceRound` | number | Auswürfel-Runde (Gleichstand) |
| `rollingEligible` | string[] | Wer darf/wer muss würfeln |
| `startPlayerName` | string | Gewinner der Würfelphase |
| `monsterDeck` | Card[] | Verbleibender Monsterstapel |
| `saufDeck` | Card[] | Verbleibender Saufstapel |

---

## 9. Offene TODOs

| Thema | Status |
|-------|--------|
| Visuelles Feedback beim Fallen-Ziehen (Toast/Bubble) | Offen |
| 8 Spieler + enger Viewport — Slot-Kollision | Feintuning (`tableSlotLayout.js`) |
| Legacy-Lobbies ohne `gamePhase` | Fallback: `playing` wenn Monster vorhanden |
| Spezialeffekte einzelner Karten | Nicht geprüft / ggf. anpassen |
| Spielende | Weiterhin nicht implementiert (by design) |
| `effectsUsed`-Guard in UI | Weiterhin offen |

---

## Code-Referenzen

| Bereich | Datei |
|---------|-------|
| Phasen-Konstanten | `src/config/gamePhases.js` |
| Decks bauen | `src/utils/gameLogic.js` |
| Aktionen | `src/utils/gameActions.js` |
| Start in Lobby | `app/lobby.js` → `startGame` |
| Setup-UI | `src/components/GameSetupPanel.js` |
| Spieltisch | `src/components/GameBoard.js` |
| Stapelzählung | `src/utils/deckCounts.js` |
