# MVP-Roadmap — WodkaO / Sauf Viel-Oh

*Stand: 2026-06-09 — Fokus: testbare Android-APK + iPhone über Web/TestFlight*

---

## MVP-Ziel

| Ziel | Beschreibung |
|------|--------------|
| **Was** | Lokales Party-Kartenspiel — **Android APK** + **iPhone** (Web oder TestFlight) |
| **Wofür** | Mit Freunden testen — kein Store, kein Perfektionismus |
| **Nicht** | Öffentlicher App-Store-Release, finales Balancing, finale Assets |

### MVP-Definition (Produkt)

- App startet stabil auf Android (APK sideload)
- **Online-Multiplayer ist MVP-Pflicht** — kein reines Pass-and-Play auf einem Gerät
- Jeder **Android**-Spieler: installierbare **APK** (EAS `preview`)
- Jeder **iPhone**-Spieler: **öffentliche Web-URL** in Safari (Firebase Hosting) — [BUILD_WEB.md](BUILD_WEB.md)
- Ein Spieler **erstellt Lobby**, andere **joinen per 5-stelligem Code**
- Alle sehen **dieselben Firestore-Updates** in Echtzeit (`onSnapshot`)
- Host startet erst wenn alle **Ready**; danach synchron: Würfeln → Monster → Saufstapel → Züge
- **Late Join (MVP-Pflicht):** Spieler können jederzeit per Code beitreten — auch während laufendem Spiel
- Session stabil genug für manuelle Freunde-Tests (Internet nötig)
- **Session Persistence:** `@react-native-async-storage/async-storage` (Expo SDK 54: `2.2.0`) speichert `playerName` + `lobbyId` lokal; Reconnect über „Letztes Spiel fortsetzen“ — siehe [STATE_TRANSITIONS.md](STATE_TRANSITIONS.md)

---

## MVP-Fortschritt (geschätzt)

*Stand: 2026-06-09 — Code-seitig weit; APK + Multi-Device noch offen*

| Bereich | Fortschritt | Anmerkung |
|---------|-------------|-----------|
| **Infrastruktur** | **85 %** | Expo, Router, Lint, Tests, EAS-Config — Build-Ops offen |
| **Lobby** | **90 %** | Erstellen, Join, Ready, Host-Start — Multi-Device unverifiziert |
| **Multiplayer** | **80 %** | Firestore-Sync, Late Join (Code + Unit-Tests) — 3+ Geräte-Test ausstehend |
| **Gameplay** | **85 %** | Phasen, Saufstapel, Voting — Balancing / Edge-Cases offen |
| **Android Build** | **40 %** | `eas.json` + Package da; kein erfolgreicher EAS-Build |
| **iOS / iPhone (Web)** | **35 %** | Export + `firebase.json` ✅; Deploy + Safari-Test offen |
| **Firebase** | **75 %** | Schema, Sync, Late-Join-Transaction — Rules nicht vollständig geprüft |
| **APK Testing** | **10 %** | Kein Build, kein Geräte-Smoke |

**Gesamt-MVP (realistisch): ~72 %** — Blocker: erster APK-Build + Multi-Device-Freunde-Test inkl. Late Join.

Details: [MVP_RELEASE_CHECKLIST.md](MVP_RELEASE_CHECKLIST.md)

### Online vs. lokal

| Begriff | MVP |
|---------|-----|
| **Online-Lobby (Firebase)** | ✅ **Pflicht** — bereits implementiert |
| **Pass-and-Play (1 Gerät)** | ❌ Nicht MVP — später optional |
| **iPhone (Safari Web)** | ✅ **MVP-Pflicht** — öffentlicher Link — [BUILD_WEB.md](BUILD_WEB.md) |
| **iPhone (TestFlight)** | ❌ Nicht erster MVP — optional — [BUILD_IOS.md](BUILD_IOS.md) |
| **Accounts / Login** | ❌ Nicht MVP — Spielername reicht |
| **Store / Matchmaking** | ❌ Nicht MVP |

Details: [FIREBASE_SCHEMA.md](FIREBASE_SCHEMA.md)

---

## Online-Multiplayer — Soll vs. Ist

| Funktion | Status | Implementierung |
|----------|--------|-----------------|
| Firebase Firestore | ✅ | `firebaseConfig.js` |
| Spielername eingeben | ✅ | `app/index.js` |
| Lobby erstellen | ✅ | `lobby.js` → `createLobby` |
| Lobby-Code anzeigen | ✅ | Lobby-Screen + `LobbyCodeBadge` im Spiel |
| Join per Code | ✅ | `joinLobby` → `joinLobbyTransaction` |
| Late Join während Spiel | ✅ | `lateJoin.js` — Transaction, Monster, Turn-Order hinten |
| Spielerliste live | ✅ | `onSnapshot` in `lobby.js` |
| Host startet Spiel | ✅ | `startGame`, UI `me?.isHost && allReady` |
| Clients live Updates | ✅ | `useLobby` + `onSnapshot` |
| Nur aktiver Spieler zieht (UI) | ✅ | `isMyTurn` in `GameBoard` |
| Würfeln synchron | ✅ | `handleRollDice` → Firestore |
| Gleichstand synchron | ✅ | `resolvingTie` + `rollingEligible` |
| Monster ziehen synchron | ✅ | `handleDrawMonster` |
| Saufstapel ziehen synchron | ✅ | `handleDraw` pop `saufDeck` |
| Fallen verdeckt | ✅ | `players[].trap` |
| Magie/Reaktion/Voting sync | ✅ | `gameActions.js` |
| Zugwechsel sync | ✅ | `handleDiscard` / TRAP-Zug |
| Firebase Auth | ❌ | Nicht nötig für MVP |
| Serverseitige Turn-Prüfung | ❌ | Nur Client-UI |
| Atomare Transactions | ⚠️ Teilweise | Late Join via `runTransaction`; sonst `useAsyncLock` |

Schema: [FIREBASE_SCHEMA.md](FIREBASE_SCHEMA.md)

---

## MVP-Spielumfang — Soll vs. Ist

| Anforderung | Status | Anmerkung |
|-------------|--------|-----------|
| App startet auf Android | ⚠️ Ungetestet | Web/Dev ok; APK noch nicht gebaut |
| Neues Spiel starten | ✅ | Lobby erstellen + Host-Start |
| Spieleranzahl / lokale Spieler | ⚠️ Teilweise | 2–8 Spieler, **je Gerät ein Spieler** + Name; kein fester „Bot“-Modus |
| Start ohne verteilte Karten | ✅ | `gamePhase: rollingForStartPlayer` |
| Würfelphase Startspieler | ✅ | `handleRollDice`, `GameSetupPanel` |
| Gleichstand erneut würfeln | ✅ | `resolvingTie` |
| Jeder zieht ein Monster | ✅ | `drawingMonsters` |
| Startspieler beginnt | ✅ | `startPlayerName`, `turn` |
| Ziehen aus Saufstapel | ✅ | `saufDeck` (Magie + Fallen) |
| Magiekarten regelgemäß | ✅ | Draw → Show → Reaktion → Discard |
| Fallen verdeckt neben Monster | ✅ | Bei TRAP-Zug, kein Auto-Trigger |
| Fallen später aktivieren | ✅ | `handleActivateEffect` + Vote |
| Zug beenden / nächster Spieler | ✅ | Nach Magie-Discard oder TRAP-Zug |
| Session stabil | ⚠️ | Reconnect via AsyncStorage — APK manuell testen |
| **Monster-Modal / Galerie-Modal** | ✅ Fix 2026-06-13 | `CardDetailModal` — Android: kein `transform: scale`; ScrollView + Fallbacks |
| **App-Reconnect** | ✅ Code | `@react-native-async-storage/async-storage@2.2.0` → `sessionStorage.js` + Resume-Button; Metro-Bundle ✅ |
| **EAS Build (ErrorBoundary)** | ✅ Fix | `.easignore`: `/components/` statt `components/` — `src/components/` war fälschlich ausgeschlossen |
| **Late Join** (MVP-Pflicht) | ✅ Code | Beitritt während `playing`; Monster + Turn-Order hinten — ⚠️ Multi-Device |
| Late Join — Unit-Tests | ✅ | `npm run test:late-join` (21 Tests) |
| **Navigation / Header** | ✅ 2026-06-14 | Kein nativer Header; Game-Exit ✕ + Confirm; Android BackHandler |
| iPhone Web (Safari + Hosting) | ⚠️ | Export ✅ — Deploy + Cross-Platform-Test ausstehend |
| iOS EAS Build / TestFlight | ❌ | Nicht erster MVP |

Details: [SPIELABLAUF.md](SPIELABLAUF.md), iOS: [BUILD_IOS.md](BUILD_IOS.md)

---

## Nicht-MVP (explizit später)

- Store-Veröffentlichung (Play Store / App Store)
- **Pflicht-Accounts / Login** (anonyme Auth optional später)
- Persistenter Spielstand nach Tagen/Wochen
- In-App-Käufe
- Finales Artwork & Animation Polish
- Vollständiges Balancing aller Karteneffekte
- Umfangreiche Kartenbibliothek / CMS
- Lizenzierte Themes (Yu-Gi-Oh, Star Wars, …)
- **Pass-and-Play** (ein Gerät, mehrere Spieler reihum)
- Cloud Functions / serverseitige Spielvalidierung
- **Öffentlicher App-Store-Release** (Play Store / App Store) — TestFlight/APK-Test ist MVP, Store nicht

---

## Technische MVP-Checkliste

| # | Check | Status |
|---|-------|--------|
| 1 | Projekt läuft lokal im Browser | ✅ `npm run web` |
| 2 | Projekt läuft auf Android/Emulator | ⚠️ `npm run android` — manuell prüfen |
| 3 | Responsive / Mobile Layout | ✅ DevTools + Anpassungen 2026-06-09 |
| 4 | Touch-Bedienung | ⚠️ Kein Hover-only; echtes Gerät offen |
| 5 | Spielstart-State korrekt | ✅ Keine Initialkarten |
| 6 | Game-Flow umgesetzt | ✅ Phasen + Saufstapel |
| 7 | Kartenlogik stabil | ⚠️ Netz + Google Sheets nötig |
| 7b | **Online Multiplayer (2+ Geräte)** | ✅ Code; ⚠️ manuell verifizieren |
| 7c | **Late Join (MVP-Pflicht)** | ✅ Code + Unit-Tests; ⚠️ 3+ Geräte manuell |
| 8 | Fehlerzustände abgefangen | ⚠️ Client-Locks; Late Join Transaction |
| 9 | APK-Build vorbereitet | ✅ `eas.json` + `android.package: com.wodkao.app` |
| 10 | APK erfolgreich erzeugt | ❌ EAS Login + Env nötig |
| 11 | APK auf echtem Gerät getestet | ❌ |
| 12 | iPhone Safari Web-Fallback getestet | ❌ |
| 13 | Cross-Platform Sync (Android + iPhone Web) | ❌ |
| 14 | iOS EAS Build (`eas build --platform ios`) | ❌ |
| 15 | TestFlight (optional) | ❌ |

---

## Arbeitspakete (priorisiert)

### Phase 1 — Projekt startfähig machen

- [ ] `.env` aus `.env.example` (Firebase + Google Sheets)
- [ ] `npm install` im Projektroot
- [ ] `npm run lint` + `npx expo-doctor`
- [ ] Browser-Smoke-Test: Lobby → Start → Würfeln → Monster → 1 Runde
- [ ] `project.md` / diese Roadmap bei Abweichungen aktualisieren

### Phase 2 — Android / Mobile lauffähig

- [ ] Android Studio Emulator oder USB-Gerät
- [ ] `npm run android` (Expo Go oder Dev Client)
- [ ] Touch-Test: Buttons, Modals, Setup-Panel
- [ ] Netzwerk: Firebase + Sheets auf Mobile (kein localhost-Blocker)
- [ ] Safe Area / Notch auf echtem Gerät prüfen

### Phase 3 — MVP-Spielablauf stabilisieren

- [ ] 2–4 echte Geräte: gleiche Lobby, voller Flow
- [ ] Gleichstand-Würfeln testen
- [ ] Magie- und Fallen-Zug aus Saufstapel
- [ ] Abstimmung / Reaktionsphase ohne Hänger
- [ ] **Late Join:** 3+ Geräte — Join in Würfel-, Monster- und Spielphase ([MVP_RELEASE_CHECKLIST.md](MVP_RELEASE_CHECKLIST.md))
- [ ] Bekannte Bugs aus `project.md` triagieren (nur Blocker fixen)

### Phase 4 — APK-Build vorbereiten

- [x] `android.package` in `app.json` setzen (`com.wodkao.app`)
- [x] `eas.json` anlegen (APK-Profil) — siehe [BUILD_ANDROID.md](BUILD_ANDROID.md)
- [ ] Expo-Account + `eas login`
- [ ] EAS Env für Build (`EXPO_PUBLIC_*`, Environment `preview`) — Anleitung in BUILD_ANDROID.md
- [x] App-Name/Icon für Test ok (MVP reicht Standard-Icon)

### Phase 5 — APK erzeugen & Smoke Test

- [ ] `eas build --platform android --profile preview` (APK)
- [ ] APK sideload auf 2+ Geräten
- [ ] APK sideload auf 2+ Geräten — Install → Name → Lobby → komplette Partie
- [ ] **iPhone:** öffentliche Web-URL in Safari — mit Android/APK — [BUILD_WEB.md](BUILD_WEB.md)
- [ ] **Late Join** auf 3+ Geräten (Würfel / Monster / playing)
- [ ] Feedback sammeln; nur Showstopper fixen

---

## Wichtigste MVP-Blocker

| Priorität | Blocker | Aufwand |
|-----------|---------|---------|
| 🔴 Hoch | **Kein APK-Setup** (`eas.json`, `android.package`) | ✅ Erledigt (2026-06-09) |
| 🔴 Hoch | **APK noch nie gebaut/getestet** | Mittel (EAS + Gerät) |
| 🔴 Hoch | **APK noch nie mit 2+ Geräten getestet** | Mittel |
| 🔴 Hoch | **Late Join Multi-Device noch nicht verifiziert** | Mittel (Code ✅) |
| 🟡 Mittel | Firestore Security Rules nicht vollständig geprüft | Vor Freunde-Test |
| 🟡 Mittel | Disconnect / Reconnect offen | Nach MVP |
| 🟡 Mittel | Monsterdeck leer — Late Join ohne Monster | Balancing TODO |
| 🟡 Mittel | Keine Firestore Transactions (außer Late Join) | Race bei schlechtem Netz |
| 🟡 Mittel | Turn-Check nur UI, nicht Rules | Cheating möglich in Test |
| 🟢 Niedrig | Kein Auth / isConnected | Nach MVP |

---

## Empfohlener nächster Cursor-Prompt

```
Phase 5: eas login, EXPO_PUBLIC_* in EAS Environment "preview" setzen,
dann eas build --platform android --profile preview. APK auf 3+ Geräten
testen (Lobby → Würfeln → Monster → Saufstapel-Zug → Late Join in jeder
Phase). Checkliste: docs/MVP_RELEASE_CHECKLIST.md. Ergebnis in project.md
dokumentieren. Keine riskanten Gameplay-Fixes.
```

---

## Verwandte Dokumente

| Datei | Inhalt |
|-------|--------|
| [BUILD_ANDROID.md](BUILD_ANDROID.md) | APK-Build-Anleitung |
| [BUILD_WEB.md](BUILD_WEB.md) | **iPhone Web-MVP** — Export, Firebase Hosting |
| [BUILD_IOS.md](BUILD_IOS.md) | TestFlight (optional) |
| [FIREBASE_SCHEMA.md](FIREBASE_SCHEMA.md) | Firestore-Struktur & Online-Sync |
| [SPIELABLAUF.md](SPIELABLAUF.md) | Spielregeln & Phasen |
| [layout_system.md](layout_system.md) | Tisch-Slot-Layout |
| [firebase_cleanup.md](firebase_cleanup.md) | Lobby-Ablauf & Cleanup |
| [testing.md](testing.md) | QA-Checks |
| [MVP_RELEASE_CHECKLIST.md](MVP_RELEASE_CHECKLIST.md) | Freunde-APK Release-Check |
| [../project.md](../project.md) | Gesamtprojekt |
