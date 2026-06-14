# WodkaO – ChatGPT Übergabe

*Stand: 2026-06-14 (Navigation, Card-Modal, EAS APK)*

## MVP-Fortschritt (~75 % gesamt)

| Bereich | % |
|---------|---|
| Infrastruktur | 85 % |
| Lobby | 90 % |
| Multiplayer | 80 % |
| Gameplay | 85 % |
| Android Build | 55 % |
| Firebase | 75 % |
| APK Testing | 25 % |

**Neu (2026-06-14):** Nativer Nav-Header aus; eigene Gallery-Back-UI; Game-Exit (✕ + Confirm + BackHandler). EAS Preview-APK erfolgreich gebaut.

Release-Checks: [MVP_RELEASE_CHECKLIST.md](MVP_RELEASE_CHECKLIST.md)

## Projekt-Kurzüberblick

- **App:** WodkaO / Sauf Viel-Oh — Expo ~54 + React Native, Git-Root = Projektordner
- **Remote:** https://github.com/maksimscheierman-prof/WodkaO
- **MVP:** Firebase-Online-Lobby + installierbare Android-APK für Freunde-Tests (kein Store)

---

## Aktueller Spielablauf

Phasen: `waiting` → `rollingForStartPlayer` → `resolvingTie` → `drawingMonsters` → `playing`

| Regel | Umsetzung |
|-------|-----------|
| Start ohne Karten | ✅ Keine Initialverteilung |
| Würfelphase Startspieler | ✅ `handleRollDice`, `GameSetupPanel` |
| Gleichstand | ✅ `resolvingTie` + `rollingEligible` |
| Monster ziehen | ✅ Jeder 1× aus `monsterDeck` |
| Gemeinsamer Saufstapel | ✅ `saufDeck` (Magie + Fallen gemischt) |
| Magie | ✅ Draw → Reaktion → Discard |
| Fallen | ✅ Verdeckt bei Zug, Aktivierung + Vote später |
| Join während Spiel | ✅ Late Join (`joinLobbyTransaction`) — MVP-Pflicht |

**Late Join:** Seat + Monster (Transaction), Turn hinten, Join-Toast. Unit-Tests: `npm run test:late-join`. Multi-Device-Test: [MVP_RELEASE_CHECKLIST.md](MVP_RELEASE_CHECKLIST.md).

Details: [SPIELABLAUF.md](SPIELABLAUF.md), Schema: [FIREBASE_SCHEMA.md](FIREBASE_SCHEMA.md)

---

## Infrastruktur & Multiplayer

- Firestore `onSnapshot` für Lobby + Spiel
- Lobby erstellen/joinen per 5-stelligem Code
- Host startet wenn alle Ready
- **Lobby-Ablauf:** 2h Inaktivität → `status: expired` (`lobbyLifecycle.js`)
- Cleanup-Script: `npm run cleanup:lobbies` (Standard: dry-run)

---

## Layout (neu)

- **Slot-System:** `tableSlotLayout.js` — alle Objekte relativ zu `tableRect`
- Slots: Monster oben/unten, Saufstapel, Ablage, Ziehen-Button, Avatare außerhalb
- Kollisionsprüfung + `contentScale` bei knapper Höhe
- Squash-Fix für Cursor-Browser: `isSquashedViewport` in `tableLayout.js`
- Debug: `EXPO_PUBLIC_LAYOUT_DEBUG=1`

Docs: [layout_system.md](layout_system.md), [layout_debug.md](layout_debug.md)

---

## Android / APK

| Item | Status |
|------|--------|
| `android.package` | ✅ `com.wodkao.app` |
| `eas.json` (preview APK) | ✅ im Repo |
| EAS Login + Env (`EXPO_PUBLIC_*`) | ❌ offen |
| APK gebaut & getestet | ❌ offen |

Anleitung: [BUILD_ANDROID.md](BUILD_ANDROID.md)

---

## Qualität (2026-06-09)

| Check | Ergebnis |
|-------|----------|
| `npm run lint` | 0 Errors, 9 Warnings |
| `npx tsc --noEmit` | ✅ |
| `npm run test:lobby-lifecycle` | 7/7 |
| `npm run test:table-layout` | 6/6 |
| `npm test` | nicht konfiguriert |

Lint-Warnings: `MagicCardModal.js` (7×), `useGameFirebase.js` (2×) — `react-hooks/exhaustive-deps`

---

## Bekannte Blocker / Offenes

| Priorität | Thema |
|-----------|-------|
| 🔴 | Erster EAS-Build + APK auf 2+ Geräten |
| 🔴 | Multiplayer End-to-End manuell verifizieren |
| 🟡 | Keine Firestore Transactions (Race bei schlechtem Netz) |
| 🟡 | Turn-Check nur Client-UI |
| 🟢 | Selfie-Avatar, Spielende, Timer-Settings-Screen |

---

## Nächste Schritte

1. `eas login` + EAS Environment `preview` mit `EXPO_PUBLIC_*`
2. `eas build --platform android --profile preview`
3. APK sideload → Lobby → voller Spielablauf auf 2+ Geräten
4. Commit + Push nach manuellem Smoke-Test

---

## Wichtige Regel

Keine großen Features vor MVP-Stabilisierung. Fokus: APK, Multiplayer-Verifikation, nur Showstopper fixen.
