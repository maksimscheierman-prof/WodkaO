# State Transitions — WodkaO / Sauf Viel-Oh

*Stand: 2026-06-13 — Firestore = Source of Truth, AsyncStorage = Session Pointer*

---

## Prinzip

| Layer | Rolle |
|-------|--------|
| **Firestore** `lobbies/{code}` | Source of Truth — Status, Phase, Spieler, Karten |
| **AsyncStorage** `wodkao:lastSession` | Session Pointer — `playerName`, `lobbyId`, letzter `status`/`gamePhase` |
| **expo-router** | UI-Route — abgeleitet aus Firestore, nicht umgekehrt |

Lokaler State **überschreibt** Firestore nie. Nach App-Neustart: Session laden → Firestore prüfen → navigieren.

---

## Phasen & Routen

| Firestore `status` | `gamePhase` | App-Route | Beschreibung |
|--------------------|-------------|-----------|--------------|
| `waiting` | `null` | `/lobby` | Wartelobby, Ready, Host-Start |
| `playing` | `rollingForStartPlayer` | `/game` | Würfelphase |
| `playing` | `resolvingTie` | `/game` | Gleichstand |
| `playing` | `drawingMonsters` | `/game` | Monster ziehen |
| `playing` | `playing` | `/game` | Normale Runde |
| `expired` | * | `/` (Session löschen) | Lobby abgelaufen |
| `finished` | * | `/` (Session löschen) | Spiel beendet |

---

## Session Lifecycle

```text
Home (/)
  → Lobby erstellen/joinen → saveSession({ lobbyId, playerName, status: waiting })
  → Host startet → status: playing → saveSession + redirect /game
  → Spiel läuft → saveSession bei jedem Lobby-Snapshot (status, gamePhase)
  → App-Crash / Neustart → loadSession → "Letztes Spiel fortsetzen"
  → resolveResumeSession() → getDoc(lobby) → navigate /lobby oder /game
  → Lobby verlassen → clearSession()
  → expired/finished/not found → clearSession()
```

---

## Resume-Regeln (`resolveResumeSession`)

1. `loadSession()` aus AsyncStorage
2. Session älter als 7 Tage → löschen
3. `getDoc(lobbies/{lobbyId})`
4. Lobby fehlt / expired / finished → `clearSession()`, Fehlermeldung
5. `status: playing` → `/game` mit `lobbyId` + `playerName`
6. `status: waiting` → `/lobby`

---

## Implementierung

| Datei | Funktion |
|-------|----------|
| `src/utils/sessionStorage.js` | `saveSession`, `loadSession`, `clearSession` |
| `src/utils/sessionResumeCore.js` | `getResumeRoute` (pure) |
| `src/utils/sessionResume.js` | `resolveResumeSession` (Firestore) |
| `app/index.js` | „Letztes Spiel fortsetzen“ |
| `app/lobby.js` | save bei create/join/snapshot; clear bei leave/expire |
| `app/game.js` | save bei Snapshot; clear bei expire |

---

## Verwandt

- [SPIELABLAUF.md](SPIELABLAUF.md) — Spielphasen
- [FIREBASE_SCHEMA.md](FIREBASE_SCHEMA.md) — Firestore-Felder
- [MVP_RELEASE_CHECKLIST.md](MVP_RELEASE_CHECKLIST.md) — Reconnect-Tests
