# Firebase Schema — WodkaO / Sauf Viel-Oh

*Stand: 2026-06-09 — dokumentiert **Ist-Zustand** im Code*

---

## Firebase-Dienste (Ist)

| Dienst | Genutzt? | Verwendung |
|--------|----------|------------|
| **Firestore** | ✅ Ja | Lobby + kompletter Spielzustand |
| **Authentication** | ❌ Nein | Kein Login; Spielername reicht |
| **Realtime Database** | ❌ Nein | — |
| **Hosting** | ❌ Nein (App) | Kartendaten/Bilder via GitHub Pages + Google Sheets |
| **Cloud Functions** | ❌ Nein (Snippet + Doku) | Scheduled Cleanup — siehe [firebase_cleanup.md](firebase_cleanup.md) |

Config: `firebaseConfig.js` — `EXPO_PUBLIC_*` aus `.env` (auch in APK eingebettet).

---

## Architektur-Entscheidung (Ist)

Statt `games/{id}/players/{id}/state/main` (Subcollections) nutzt das Projekt **ein flaches Dokument pro Lobby**:

```text
lobbies/{lobbyCode}
```

- **`lobbyCode`** = 5-stelliger Code (A–Z, 0–9) = **Document-ID** und Join-Code
- Alle Spieler, Decks, Phase, Zug, Voting in **einem** Dokument
- Sync via `onSnapshot` → alle Clients sehen dieselben Updates in Echtzeit

**Vorteil MVP:** Einfach, schnell implementiert, wenig Reads.  
**Nachteil:** Große Dokumente bei vielen Karten; keine serverseitige Validierung ohne Rules/Functions.

---

## Dokument `lobbies/{lobbyCode}` — Felder

### Lobby / Meta

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `status` | `"waiting"` \| `"playing"` \| `"finished"` \| `"expired"` | Wartelobby / Spiel / optional beendet / abgelaufen |
| `gamePhase` | string \| null | Siehe [SPIELABLAUF.md](SPIELABLAUF.md) |
| `createdAt` | `Timestamp` \| number | Erstellung (`serverTimestamp` bei neuen Lobbys) |
| `lastActivityAt` | `Timestamp` | Letzte Spiel-/Lobby-Aktion (`serverTimestamp`) |
| `expiredAt` | `Timestamp` | Optional, beim Ablauf gesetzt |
| `timers` | object | Timer-Konfiguration pro Phase |

### Spieler (`players[]`)

Array von Objekten — **keine** Subcollection.

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `id` | string | Client-generiert (`Date.now()`) |
| `name` | string | Anzeigename (Join-Key) |
| `ready` | boolean | Ready in Wartelobby |
| `isHost` | boolean | Ersteller = Host |
| `monster` | Card \| null | Monsterkarte (Objekt aus Sheets) |
| `trap` | Card \| null | Verdeckte Falle |
| `shots` | number | Getrunkene Schlucke |
| `viewingCard` | object? | Presence: `{ type, startedAt }` |

### Würfelphase

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `diceRolls` | `{ [name]: number }` | W6 pro Spieler, aktuelle Runde |
| `diceRound` | number | Auswürfel-Runde (Gleichstand) |
| `rollingEligible` | string[] | Wer darf/muss würfeln |
| `startPlayerName` | string \| null | Gewinner der Würfelphase |

### Decks & Ablage

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `monsterDeck` | Card[] | Verbleibende Monster (nach Start) |
| `saufDeck` | Card[] | Magie + Fallen gemischt |
| `discardPile` | Card[] | Ablage |

### Zug / Runde (Spielphase)

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `turn` | number | Index in `players[]` |
| `round` | number | Rundennummer |
| `lastMagic` | Card \| null | Gezogene Magie (aktueller Zug) |
| `showMagic` | boolean | Aufgedeckt / Reaktionsphase |

### Reaktion / Voting

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `reactions` | `{ [name]: { done } }` | Reaktionsphase |
| `allReactionsDone` | boolean | Alle Nicht-Zugspieler fertig |
| `activeEffect` | `{ player, card }` \| null | Aktivierter Effekt |
| `votingOpen` | boolean | Abstimmung läuft |
| `votes` | `{ ja[], nein[] }` | Stimmen |
| `voteResult` | string \| null | Ergebnistext |
| `resolvedEffect` | object \| null | Aufgelöster Effekt |
| `resultAcks` | `{ [name]: boolean }` | OK-Bestätigungen |
| `effectsUsed` | object | Monster bereits aktiviert |
| `*StartedAt` | number \| null | Timer-Anker (reactions, voting, …) |

### Card-Objekt (typisch)

```json
{
  "name": "Kartenname",
  "effect": "Beschreibung",
  "type": "MONSTER" | "MAGIC" | "TRAP",
  "image": { "uri": "https://..." },
  "atk": 0,
  "def": 0,
  "stars": 4
}
```

---

## Mapping: Vorschlag → Ist

| Vorschlag (`games/…`) | Ist (`lobbies/…`) |
|----------------------|-------------------|
| `code` | Document-ID = Code |
| `hostPlayerId` | `players[].isHost` + `players[0]` meist Host |
| `status: lobby \| rolling \| …` | `status` + `gamePhase` |
| `currentPlayerId` | `turn` (Index) + `players[turn].name` |
| `startPlayerId` | `startPlayerName` |
| `players/{id}` Subcollection | `players[]` Array |
| `state/main.phase` | `gamePhase` |
| `state/main.monsterDeck` | `monsterDeck` |
| `state/main.saufDeck` | `saufDeck` |
| `tieBreakerPlayerIds` | `rollingEligible` bei `resolvingTie` |

**Migration zu Subcollections:** Nicht-MVP. Flaches Modell reicht für Freunde-Test.

---

## Sync-Mechanismus

```text
Client A: updateDoc(lobbies/{code}, { … })
    ↓
Firestore
    ↓
Client B,C,D: onSnapshot → useLobby / lobby.js → UI Re-Render
```

| Datei | Rolle |
|-------|--------|
| `firebaseConfig.js` | App-Init |
| `app/lobby.js` | Create/Join/Ready/Start + Snapshot Redirect |
| `src/hooks/useLobby.js` | Live-Spielzustand in `/game` |
| `src/utils/gameActions.js` | Alle Spiel-Mutationen |
| `app/game.js` | UI + `isMyTurn`-Gating |

---

## Sicherheit & Concurrency (Ist / Lücken)

| Thema | Ist | Risiko MVP |
|-------|-----|------------|
| Firebase Auth | ❌ | Jeder mit Rules-Zugriff kann schreiben |
| Turn-Validierung | Nur **UI** (`isMyTurn`) | Client könnte fremde Züge schreiben |
| Atomare Züge | ❌ kein `runTransaction` | Doppel-Klick / Race bei schlechtem Netz |
| Client-Lock | ✅ `useAsyncLock` pro Gerät | Schützt nur lokal |
| Host-Start | UI: `me?.isHost` | Nicht serverseitig erzwungen |
| Duplicate Names | Join blockiert gleichen Namen | OK |
| Deck-Ziehen | Pop aus Array in `updateDoc` | Zwei gleichzeitige Draws → möglicher Race |

**MVP-Empfehlung:** Firestore Rules so, dass nur `lobbies/{id}` lesbar/schreibbar für Test; optional später Transactions für `handleDraw` / `handleRollDice`.

Beispiel-Rule (nur Dev/Test — nicht production-sicher):

```javascript
match /lobbies/{lobbyId} {
  allow read, write: if true;
}
```

---

## Login-frei (MVP)

- Kein `signInAnonymously()` — **nicht nötig** für Test
- Identität: **Spielername** (Route-Param) + Eintrag in `players[]`
- `players[].id` = lokale Client-ID (Timestamp-String)

**Limitation:** Name muss eindeutig pro Lobby sein; kein Schutz gegen Namens-Fälschung.

---

## Weitere Collections

| Pfad | Zweck |
|------|--------|
| `tests/connectionCheck` | Home-Screen Firestore-Ping (`app/index.js`) |

---

## APK / Online

Damit mehrere APK-Instanzen dieselbe Lobby sehen:

1. Gleiche `EXPO_PUBLIC_FIREBASE_*` in allen Builds (EAS Secrets)
2. Internet auf allen Geräten
3. Firestore Rules erlauben Lese/Schreiben
4. Gleicher Lobby-Code (5 Zeichen)

Siehe [BUILD_ANDROID.md](BUILD_ANDROID.md).

---

## Relevante Code-Dateien

| Datei | Funktion |
|-------|----------|
| `firebaseConfig.js` | Firebase Init |
| `app/index.js` | Name + Firestore-Test |
| `app/lobby.js` | Lobby CRUD, Join-by-Code, Host-Start |
| `app/game.js` | Spiel-UI, Actions |
| `src/hooks/useLobby.js` | Realtime Listener |
| `src/utils/lobbyLifecycle.js` | Ablauf nach 2h, Activity-Timestamps |
| `src/utils/gameActions.js` | Würfeln, Ziehen, Voting, … |
| `src/components/LobbyCodeBadge.js` | Code-Anzeige im Spiel |
| `src/components/GameSetupPanel.js` | Online-Sync Setup-Phasen |

---

## Offene Verbesserungen (nach Online-MVP-Test)

1. Firestore `runTransaction` für Ziehen/Würfeln
2. Security Rules: Schreiben nur wenn `request.auth` oder Turn-Check (schwer ohne Auth)
3. Anonyme Firebase Auth + `uid` statt nur Name
4. Presence / `isConnected` bei Disconnect
5. Subcollection-Schema nur bei Skalierungsbedarf
