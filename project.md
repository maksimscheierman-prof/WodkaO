# WodkaO — Kartentrinkspiel (React Native)

Digitales Kartentrinkspiel / Partyspiel mit Yu-Gi-Oh!-Optik. Multiplayer über Firebase Firestore.

**Git-Repo:** [maksimscheierman-prof/WodkaO](https://github.com/maksimscheierman-prof/WodkaO)  
**Projektroot:** `Sauf Viel-Oh/` — Git, App-Code und npm-Befehle liegen hier  
**npm package name:** `jahw3-app` (technisch, Expo-Projektname unverändert)  
**Display name (UI):** Vod-ka-Oh!  
**Version:** `1.0.0` (`app.json`, `package.json`)  
**Phase:** MVP — **Android = APK**, **iPhone = Web/Safari** — siehe [docs/MVP_ROADMAP.md](docs/MVP_ROADMAP.md)

---

## APK-MVP (2026-06-09)

| Dokument | Inhalt |
|----------|--------|
| [docs/FIREBASE_SCHEMA.md](docs/FIREBASE_SCHEMA.md) | Firestore, Online-Sync, Concurrency |
| [docs/firebase_cleanup.md](docs/firebase_cleanup.md) | Lobby-Ablauf (2h), Admin-Cleanup, Cloud Functions |
| [docs/MVP_ROADMAP.md](docs/MVP_ROADMAP.md) | Ziel, Soll/Ist, Checkliste, Phasen 1–5 |
| [docs/MVP_RELEASE_CHECKLIST.md](docs/MVP_RELEASE_CHECKLIST.md) | **Freunde-APK** — Must-fix, Build-Ops, 2-Geräte-Test |
| [docs/BUILD_ANDROID.md](docs/BUILD_ANDROID.md) | EAS/APK-Befehle, `.easignore`, Upload-Größe |
| [docs/BUILD_WEB.md](docs/BUILD_WEB.md) | **iPhone-MVP** — öffentliches Web-Hosting (Firebase) |
| [docs/BUILD_IOS.md](docs/BUILD_IOS.md) | TestFlight (optional, nicht erster MVP) |
| [docs/SPIELABLAUF.md](docs/SPIELABLAUF.md) | Spielphasen & Regeln |
| [docs/layout_system.md](docs/layout_system.md) | Tisch-Slot-Layout (Deck, Monster, Avatare) |
| [docs/layout_debug.md](docs/layout_debug.md) | Viewport/Squash-Debug (Cursor Browser) |
| [docs/STATE_TRANSITIONS.md](docs/STATE_TRANSITIONS.md) | Session, Reconnect, Phasen → Routen |
| [docs/PRIVATE_WEB_TESTING.md](docs/PRIVATE_WEB_TESTING.md) | Privater Web-Zugang (Access Gate, noindex) |
| [docs/DEBUG_ANDROID_CARD_MODAL.md](docs/DEBUG_ANDROID_CARD_MODAL.md) | **Android** — Monster-Modal Crash, logcat, Debug-Overlay |

**Alle Befehle vom Projektroot `Sauf Viel-Oh/`:**

```bash
npm install
npm start          # bzw. npm run web / android / ios
npm run lint
```

**Projektstack:** Expo ~54 · React Native 0.81 · expo-router · Firebase Firestore · react-native-web

**APK-Status:** ✅ **EAS Build erfolgreich** — letzter Build `1907b4bf` (2026-06-18, Commit `0407a89`, Profil `preview`, **fontSize-0-Fix**) — [APK](https://expo.dev/artifacts/eas/_ZsCR8jrV3fu8w7SS8yiqi_NcuCS7T4D0DClqxpMIJU.apk) · [Build-Log](https://expo.dev/accounts/maxbytes-team/projects/jahw3-app/builds/1907b4bf-c7b5-491e-b40f-5562fe8b1111)

**Online-Multiplayer:** ✅ **Implementiert** (Firestore + Lobby-Code) — siehe [docs/FIREBASE_SCHEMA.md](docs/FIREBASE_SCHEMA.md)

**Schnellster Test heute:** **Android:** APK ([BUILD_ANDROID.md](docs/BUILD_ANDROID.md)) — **iPhone:** öffentlicher Web-Link ([BUILD_WEB.md](docs/BUILD_WEB.md))

### Plattform-MVP (Freunde-Test)

| Plattform | Client | Verbindung |
|-----------|--------|------------|
| **Android** | Installierbare **APK** (EAS `preview`) | Firestore `lobbies/{code}` |
| **iPhone** | **Safari** → öffentliche **Web-URL** (Firebase Hosting) | **Dieselbe** Firebase-Lobby |
| **Kein erster MVP** | iOS-App / TestFlight | Optional später — [BUILD_IOS.md](docs/BUILD_IOS.md) |

Beide Seiten nutzen `EXPO_PUBLIC_FIREBASE_*` — APK via EAS Env, Web via `.env` beim `expo export`.

---

## Aktueller Stand

*Stand: 2026-06-18 (Monster-Modal Android, Web-Header)*

### MVP-Fortschritt (geschätzt)

| Bereich | % | Stand |
|---------|---|-------|
| Infrastruktur | **90 %** | Expo, Lint, 8 Test-Scripts, EAS-Config, `.easignore` gefixt |
| Lobby | **90 %** | Erstellen, Join, Ready, Start |
| Multiplayer | **80 %** | Sync + Late Join (Code ✅, Geräte-Test offen) |
| Gameplay | **85 %** | Phasen, Saufstapel, Voting |
| Android Build | **75 %** | EAS `preview` APK ✅ (`a762578b`); Geräte-Smoke offen |
| iOS / iPhone (Web) | **40 %** | Export ✅, `firebase.json` ✅, `TestAccessGate` ✅; Deploy + Safari-Test offen |
| Firebase | **75 %** | Schema, Transaction-Join, Rules offen |
| APK / Cross-Platform Testing | **25 %** | APK gebaut; manueller Multi-Device-Test ausstehend |

**Gesamt-MVP: ~78 %** — Details: [docs/MVP_ROADMAP.md](docs/MVP_ROADMAP.md), Checkliste: [docs/MVP_RELEASE_CHECKLIST.md](docs/MVP_RELEASE_CHECKLIST.md)

### Neu umgesetzt (APK-Stabilität — 2026-06-13)

- **Monster-Modal Crash-Fix** — `normalizeCardForDisplay`, sichere `Image`-Sources, Fallbacks
- **ErrorBoundary** — app-weit in `app/_layout.js` (`src/components/ErrorBoundary.js` — muss in Git getrackt sein für EAS/Linux)
- **Session Persistence** — `@react-native-async-storage/async-storage@2.2.0` (Expo SDK 54), „Letztes Spiel fortsetzen“ auf Home
- **Reconnect-Flow** — Firestore-validiert, Route aus `status`/`gamePhase`
- **Metro/AsyncStorage-Fix** — unvollständiges `node_modules` (fehlende `hooks.js`/`hooks.ts`); Fix: `node_modules` + `package-lock.json` löschen, `npm install`, `npx expo start -c`
- **EAS Build-Fix (ErrorBoundary)** — `.easignore` hatte `components/` (ohne `/`) → schloss **`src/components/`** mit aus; Fix: `/components/`, `/hooks/`, `/constants/` (nur Expo-Template im Root). Datei `src/components/ErrorBoundary.js` + Import unverändert korrekt.
- Doku: [docs/STATE_TRANSITIONS.md](docs/STATE_TRANSITIONS.md)

### Neu umgesetzt (Web-Header / Vollbild — 2026-06-18)

- **Kein weißer Browser-Balken** mit Routentitel („game“) auf Web
- **Fix:** Explizite `Stack.Screen`-Einträge + `export const options` pro Route; `stackScreenOptions.js` (Web: `header: () => null`)
- **`app/+html.tsx`:** `html/body/#root` margin 0, Hintergrund `#1a0033`, `theme-color`
- **`app.json`:** `web.backgroundColor: "#1a0033"`

### Neu umgesetzt (Monster-Modal Android-Crash — 2026-06-18)

- **Ursache (logcat bestätigt):** `java.lang.IllegalArgumentException: FontSize should be a positive value. Current value: 0` — **nicht** Bild/Card-Daten. Crash nach `[CARD MODAL OPEN]`.
- **Schuldige Komponente:** `Card.js` → `<Text style={cardStyles.typeLabel}>` für Monster-Typ; `CardStyles.js` hatte `typeLabel.fontSize: 0` (visuell ausgeblendet). Android **Fabric** wirft bei `fontSize: 0` nativ — besonders kritisch mit `fontWeight`/`letterSpacing`.
- **Fix:** `typeLabel` auf `fontSize: 12` + `opacity: 0`; Hilfsfunktionen `safeFontSize` / `SafeText` für alle dynamischen Text-Metriken im Modal-Pfad; `[TEXT SIZE]`-Logs in Dev/Debug-Builds.
- **Debug-Pfad:** [docs/DEBUG_ANDROID_CARD_MODAL.md](docs/DEBUG_ANDROID_CARD_MODAL.md) — logcat, Overlay, `AndroidSafeCardDetail` als optionaler Fallback (`EXPO_PUBLIC_CARD_MODAL_SAFE_ANDROID`)
- **Sentry:** nicht konfiguriert

### Neu umgesetzt (Navigation / Header — 2026-06-13)

- **Kein nativer Stack-Header** — `headerShown: false` global in `app/_layout.js`
- **StatusBar** — `expo-status-bar` light + Android `statusBar.translucent` in `app.json`
- **Gallery** — eigener `ScreenBackButton`, kein „gallery“-Titel in der Nav-Leiste
- **Game Exit** — rotes ✕ + Confirm-Dialog; Android `BackHandler` → gleicher Dialog
- Verlassen: `handleLeaveLobby` + `clearSession` → Home (`/`)

### Neu umgesetzt (Card-Modal Android-Fix — 2026-06-13)

- **CardDetailModal** — einheitliches Modal für Galerie, Monster, Trap (`src/components/CardDetailModal.js`)
- **Ursache:** `ResponsiveCard` nutzte `transform: scale` → auf Android unsichtbare Karte (nur Overlay + Schließen)
- **Fix:** Volle Kartengröße in ScrollView, keine Transform-Skalierung; `imageName`-Fallback; Logging `[CARD MODAL OPEN]`
- Tests: `npm run test:card-modal` (15), `npm run test:card-display` (11)
- APK nach Fix neu gebaut: EAS `a762578b` (2026-06-14)

### Neu umgesetzt (Spielername-UI — 2026-06-13)

- **PlayerNameLabel** — eigene Komponente für Namen unter dem Avatar (`src/components/PlayerNameLabel.js`)
- **Ursache:** Initiale auf Silhouette-Torso + voller Name darunter → Überlappung (z. B. „Sanfro“)
- **Fix:** `showInitial={false}` in `PlayerSeat`; Name nur via `PlayerNameLabel`; Avatar-Block-Höhe angepasst (`playerSeatCore.js`)
- Test: `npm run test:player-seat`

### Neu umgesetzt (Privater Web-Testzugang — 2026-06-13)

- **Access Gate** — `TestAccessGate` vor App-Start (Web standardmäßig, APK offen)
- **ENV** — `EXPO_PUBLIC_TEST_ACCESS_CODE`, optional `EXPO_PUBLIC_TEST_ACCESS_PLATFORMS`
- **Speicher** — `wodkao:hasTestAccess` in AsyncStorage; Reload bleibt eingeloggt
- **Noindex** — `public/robots.txt` + `app.json` `web.meta.robots`
- Doku: [docs/PRIVATE_WEB_TESTING.md](docs/PRIVATE_WEB_TESTING.md)

### Neu umgesetzt (Late Join — MVP-Pflicht)

- Late Join für laufende Spiele (`status: "playing"`, alle `gamePhase`-Werte)
- Firestore Transaction-basierter Join (`joinLobbyTransaction` in `lateJoin.js`)
- Seat-Zuweisung (`seatIndex` — niedrigster freier Slot)
- Automatische Monster-Zuweisung aus `monsterDeck` (keine Falle, keine Magie)
- Turn-Order: Spieler ans Ende von `players[]`; `turn` unverändert
- Join-Log / Join-Toast (`lastJoinAnnouncement`, `joinLog`, HUD-Toast in `game.js`)
- Dokumentation und Unit-Tests (`test:late-join`, 21 Tests)

---

- **Firebase/Firestore** wieder funktionsfähig (Lobby + Spiel-Sync; Firestore Rules im Firebase Console für MVP geöffnet)
- **Multiplayer-Lobby** funktioniert (Erstellen, Beitreten, Ready, Host-Start)
- **Spielstart** mit Phasen (Würfeln → Monster → Spiel) — siehe [docs/SPIELABLAUF.md](docs/SPIELABLAUF.md)
- **Late Join** — Beitritt jederzeit per Lobby-Code, auch während laufendem Spiel
- **Pokertisch-Layout** — Slot-System (`tableSlotLayout.js`, `tableLayout.js`, `GameBoard.js`) — alle Objekte relativ zu `tableRect`
- Spieler werden **nach Rolle** platziert (oben/unten/seitlich, max. 8); eigenes Monster zwischen Avatar und Tischmitte
- **Avatare außerhalb** des Tisches; **Karten in definierten Slots** innerhalb der Tischfläche
- **Lobby-Code** im Spiel sichtbar (`LobbyCodeBadge`, oben rechts, kopierbar auf Web)
- Join während laufendem Spiel: **erlaubt** (Late Join — MVP-Pflicht)
- **Mehrfachklick-Schutz** via `useAsyncLock` (Lobby + Game + Modals)
- **Karten-Viewing-Presence** — Denkblase bei Monster-/Fallenkarten (`viewingCard` in Firestore)
- **Lobby-Ablauf:** Lobbys ohne Aktivität >2h → `status: "expired"`, Join blockiert — siehe [docs/firebase_cleanup.md](docs/firebase_cleanup.md)
- **Lint:** 0 Errors, 11 Warnings (`react-hooks/exhaustive-deps`)
- **Mobile Web:** Responsive Modals, Safe Area, Höhen-Breakpoints (`responsive.js`, `ResponsiveCard.js`)

### Online-Multiplayer (Firebase) — MVP-Pflicht

| Aspekt | Stand |
|--------|-------|
| Dienst | **Firestore only** (kein Auth, kein RTDB) |
| Lobby-Code | 5 Zeichen = Document-ID `lobbies/{code}` |
| Join | `joinLobby` / `joinLobbyTransaction` — Code + Spielername; Late Join erlaubt |
| Host | `players[].isHost` — nur Host-UI für Start |
| Live-Sync | `onSnapshot` in `useLobby` + `lobby.js` |
| Login | **Nicht nötig** — Spielername reicht |
| APK + mehrere Geräte | ✅ **Architektur vorhanden** — gleiche Firebase-Config in APK |
| Schema-Doku | [docs/FIREBASE_SCHEMA.md](docs/FIREBASE_SCHEMA.md) |

**Einschränkungen:** Turn-Validierung nur Client-UI; Late Join nutzt Firestore Transaction; sonst keine Transactions; Internet + Sheets nötig.

### Mobile Responsiveness (2026-06-09)

| Bereich | Stand |
|---------|-------|
| Pokertisch | `computeBoardLayout` + `tableSlotLayout` — eine onLayout-Quelle, Kollisionsprüfung |
| Modal-Karten | `ResponsiveCard` skaliert 320×550 auf Viewport |
| Reaktionsphase | Vertikal gestapelt unter 520px Breite |
| HUD | Safe-Area-Insets, kompakter Lobby-Badge ab 360px |
| VotePanel | ~~Entfernt aus UI~~ — Voting nur noch in `MagicCardModal` (Legacy-Datei noch im Repo) |
| Hover | Keine Desktop-only Hover-Logik |

**Viewports geprüft:** 360×640, 390×844, 414×896, Landscape Mobile, Tablet (DevTools)

**Offene Mobile-Todos:** 8-Spieler-Kollisionen auf SE-Größe, Lobby-Screen polish, echtes Gerätetest

**Spielablauf (Detail):** [docs/SPIELABLAUF.md](docs/SPIELABLAUF.md)

### Join während laufendem Spiel (Late Join — MVP-Pflicht)

| Aspekt | Stand |
|--------|-------|
| Beitritt bei `status: "playing"` | **Erlaubt** — `joinLobbyTransaction` |
| Beitritt bei `status: "finished"` / `"expired"` | **Blockiert** |
| Late-Join-Monster | Zufällig aus `monsterDeck` (Firestore Transaction) |
| Start-Falle / Magie | **Keine** für Late Joiner |
| Turn-Order | Spieler ans Ende von `players[]`; `turn` unverändert |
| Aktueller Zug | Bleibt stabil — kein Sprung des activePlayer |
| UI nach Join | Info: „Du bist dem laufenden Spiel beigetreten …“ |
| Leeres Monsterdeck | Join trotzdem; Hinweis „Kein Monster mehr verfügbar“ (TODO: Balancing) |

### Spielphasen (`gamePhase`)

| Phase | Beschreibung |
|-------|--------------|
| `rollingForStartPlayer` | Alle würfeln für Startspieler |
| `resolvingTie` | Gleichstand — erneutes Würfeln |
| `drawingMonsters` | Jeder zieht 1 Monster |
| `playing` | Normaler Zugablauf (Saufstapel) |

### Decks (Firestore)

| Stapel | Inhalt |
|--------|--------|
| `monsterDeck` | Nur Monster — Startphase |
| `saufDeck` | Magie + Fallen gemischt |
| `discardPile` | Abgelegte Karten |

### Mehrfachklick-Schutz

| Bereich | Implementierung |
|---------|-------------------|
| `app/lobby.js` | Locks für Create/Join/Ready/Start; Guard bei `status: "playing"` |
| `app/game.js` | Ein `actionLock` für alle Firestore-Aktionen |
| Modals / Panels | `actionDisabled` prop an Buttons |

### Karten-Viewing-Presence

- Öffnen eigener Monster-/Falle-Karte → `players[].viewingCard = { type, startedAt }`
- Schließen Modal / Verlassen Screen → `clearViewingCard()` einmalig
- Andere Clients: weiße Sprechblase `👀 Monsterkarte` / `👀 Fallenkarte` am Avatar
- 15 s lokales Timeout (kein Firestore-Polling)

---

## UX Verbesserungen

*Stand: 2026-06-09 — Game-Screen*

### Pokertisch (Slot-System)

- `tableRect` = einziges Koordinatensystem für alle Spielobjekte ([docs/layout_system.md](docs/layout_system.md))
- Slots: `topMonsterSlot`, `bottomMonsterSlot`, `centerDeckSlot`, `centerDiscardSlot`, `drawButtonSlot`, Avatar-Bereiche
- Kollisionsprüfung + proportionale Verkleinerung (`contentScale`) bei knapper Höhe
- Debug: `EXPO_PUBLIC_LAYOUT_DEBUG=1` → farbige Slot-Rechtecke

### Avatar-System

- `PlayerSilhouette` — stilisierte Person (Kopf, Schultern, Oberkörper)
- Initiale optional (`showInitial`); Name via `PlayerNameLabel` unterhalb des Avatars
- Position: äußere Ellipsen-Normale, tischzugewandte Kante berührt Rand
- Zug-Highlight: grüner Glow nur am Avatar
- **Backlog:** Selfie-Avatar (`players[].avatarUri`)

### Kartenstapel (`StackPile`)

- Dynamische Layer: 0 = leeres Feld, 1–4 = echte Anzahl, 5+ = max. 5 sichtbar
- Label zeigt echte Count in Klammern
- **Saufstapel** (links Mitte) = `saufDeck.length` (Magie + Fallen gemischt)
- **Ablage** (rechts Mitte) = `discardPile.length`
**Ziehen-Button:** `GameActionBar` — fixierte Action-Bar unten (50 % Breite Desktop, ~82–90 % Mobile), min. 64 px Höhe. Ziehen/Aufdecken/Ablegen nur am eigenen Zug.

**Lobby-Code:** Gesamter `LobbyCodeBadge` klickbar → kopiert Code (Web + Native via `expo-clipboard`), Feedback „Kopiert!“.
- Fallen-Count = `players.filter(p => p.trap).length`
- `LayoutAnimation` bei Count-Wechsel

### Ablagestapel

- `lobby.discardPile.length` — exakte Anzahl
- Oberste Karte als Gesichtsbild auf dem Stapel
- Aktive Magic-Karte oberhalb des Ablagestapels wenn aufgedeckt

### Viewing-Bubbles (`ViewingCardBubble`)

- Kurzer Text: `👀 Monsterkarte` / `👀 Fallenkarte`
- Weiße Sprechblase mit Schatten und Spitze Richtung Avatar
- Nur für andere Spieler sichtbar (nicht für sich selbst)

### HUD-Anpassungen

- Lobby-Code: kompakte Box oben rechts (~168–200 px)
- Zugstatus: kompakt oben links
- Kein breiter Banner mehr — mehr Platz für Tisch

---

## Bugfixes / Tech Debt

| Datum | Fix |
|-------|-----|
| 2026-06-09 | **Late Join (MVP):** Transaction-Join, Seat/Monster, Join-Toast, Unit-Tests, Release-Checkliste — [docs/MVP_RELEASE_CHECKLIST.md](docs/MVP_RELEASE_CHECKLIST.md) |
| 2026-06-13 | **MVP-Release-Audit:** `MagicCardModal` me-Guard, `VotePanel` entfernt (nur Modal), `reactions` bei Start für alle Spieler, Action-Bar während Voting aus — [docs/MVP_RELEASE_CHECKLIST.md](docs/MVP_RELEASE_CHECKLIST.md) |
| 2026-06-13 | **Game-Screen Touch-UX:** Improved draw button touch target and made full lobby-code panel clickable with copy feedback (`GameActionBar`, `LobbyCodeBadge`, `expo-clipboard`). |
| 2026-06-13 | **Monster-Slots am Tischrand:** Top/Bottom-Monster nahe Tischrand (15–25 px), Mitte frei für Stapel — [docs/layout_system.md](docs/layout_system.md) |
| 2026-06-09 | **Layout Squash-Fix:** Cursor-Browser-Viewport — `isSquashedViewport`, Mindest-Tischhöhe ([docs/layout_debug.md](docs/layout_debug.md)) |
| 2026-06-09 | **Admin cleanup script:** `scripts/cleanup_old_lobbies.js` — Standard dry-run; `--delete` / `--expire` nur per Flag |
| 2026-06-09 | **Stale lobby cleanup:** `lastActivityAt` + `serverTimestamp` bei Lobby-/Spielaktionen; Join blockiert nach 2h Inaktivität; `status: expired`; CF-Snippet in [docs/firebase_cleanup.md](docs/firebase_cleanup.md) |
| 2026-06-09 | Fixed responsive game table layout so player avatars are never clipped; table scales down based on available viewport. |
| 2026-06-09 | Fixed bottom monster/card slot positioning so cards stay fully inside the table bounds with responsive inner padding. |

**Lobby-Ablauf (Neu):** Nach 2 Stunden ohne relevante Aktion gilt eine Lobby als abgelaufen. Meldung: *„Diese Lobby ist abgelaufen. Bitte erstelle eine neue Lobby.“* Serverseitige Scheduled Function noch manuell deployen (Snippet im Repo).

**Admin-Cleanup:** `npm run cleanup:lobbies -- --hours=2` (dry-run). Writes nur mit `--expire` oder `--delete`. Siehe [docs/firebase_cleanup.md](docs/firebase_cleanup.md).

**Offene Setup-Schritte:** Firebase Functions deployen; einmalig Admin-Cleanup für Legacy-Daten — siehe [docs/firebase_cleanup.md](docs/firebase_cleanup.md).

---

## Offene Bugs

| Bug | Status | Details |
|-----|--------|---------|
| `bubbleText is not defined` | ✅ Behoben | `bubbleText` in `PlayerSeat.js` definiert; ggf. Metro-Cache leeren (`expo start -c`) |
| Avatar oben abgeschnitten (kurzer/quer Viewport) | ✅ Behoben | Avatar-aware `getTableEllipse`, `boardTopInset`, kleinere Avatare bei height unter 520px |
| Viewing-Bubble verschwindet nicht immer korrekt | ⚠️ Offen | Nach 15 s lokales Timeout; Edge-Cases Tab-Wechsel — nach APK |
| Avatar/Karten-Positionierung | ✅ Slot-System | Feintuning 8 Spieler — [docs/layout_system.md](docs/layout_system.md) |
| `MagicCardModal` ohne `me`-Guard | ✅ Behoben | Guard + `game.js` rendert Modal nur mit `me` |
| Doppelte Vote-UI | ✅ Behoben | `VotePanel` entfernt — nur `MagicCardModal` |
| `reactions`-Init nur Host | ✅ Behoben | `startGame` + `handleShow` für alle Spieler |
| Timer-Settings unerreichbar | ⚠️ Bekannt | Screen existiert, nicht verlinkt |
| Expo-Paket-Versionen | ⚠️ Warnung | 16 Pakete hinter SDK-Empfehlung |
| Kein Spielende | ℹ️ By design | Endlosschleife, kein `status: "finished"` |

---

## Nächste Prioritäten

### Priorität 1 — APK & Multiplayer

- ~~EAS Login + erster APK-Build~~ — ✅ Build `a762578b` (2026-06-14)
- APK auf 2+ Geräten installieren: Smoke-Test ([docs/MVP_RELEASE_CHECKLIST.md](docs/MVP_RELEASE_CHECKLIST.md))
- Multiplayer-End-to-End: Android APK + iPhone Safari (nach Firebase Hosting Deploy)
- Late Join mit 3+ Clients manuell verifizieren

### Priorität 2 — Stabilisierung

- Presence-System fertigstellen (Bubble-Lifecycle, Edge-Cases)
- Bekannte Bugs triagieren (nur Blocker)

### Priorität 3 — Karten-/Stapel-UX

- Selfie-Avatar-Backlog (`players[].avatarUri`)
- Optional: Avatar-Rotation Richtung Tischmitte

---

## Stack

| Area | Technology |
|------|------------|
| Framework | **React Native** 0.81 + **Expo** ~54 (managed workflow) |
| Routing | **expo-router** ~6 — **ohne** nativen Header (`headerShown: false`) |
| Language | JavaScript (TypeScript config, code mostly `.js`) |
| Backend | **Firebase Firestore** (realtime multiplayer) |
| Local persistence | **AsyncStorage** (`@react-native-async-storage/async-storage@2.2.0`) — Session Pointer `wodkao:lastSession` in `src/utils/sessionStorage.js` |
| Web test gate | **TestAccessGate** — `EXPO_PUBLIC_TEST_ACCESS_CODE` (MVP UI-Schutz, kein Auth) |
| Card data | Google Sheets CSV + PapaParse |
| Card images | Local `assets/images/cards/` + remote GitHub Pages fallback |
| Package manager | **npm** (`package-lock.json`) |

**Not used:** Flutter, Supabase, bare React Native (no `android/`/`ios/` in repo — Expo prebuild when needed).

---

## Folder structure

```
Sauf Viel-Oh/         # Projektroot (Git + Expo App)
  app/                # expo-router screens (index, lobby, game, gallery, settings)
  src/
    components/       # Card, GameBoard, CardDetailModal, GameExitButton, TestAccessGate, …
    hooks/            # useLobby, useGameExit, useTestAccess, useAsyncLock, …
    utils/            # gameActions, lateJoin, sessionResume, cardDisplay, testAccess, …
    config/           # timers, gamePhases
    styles/           # CardStyles, gameStyles
  assets/
    fonts/            # DidactGothic
    images/cards/     # ~70 card PNGs
  docs/               # MVP, Firebase, Build, Spielablauf
  scripts/            # Tests, Lobby-Cleanup
  public/             # robots.txt (Web noindex)
  firebase.json       # Firebase Hosting (Web-MVP)
  .cursor/rules/      # Cursor agent rules
  firebaseConfig.js
  app.json
  eas.json
  package.json
```

---

## Scripts (`package.json`)

| Script | Command |
|--------|---------|
| Start dev server | `npm start` |
| Android | `npm run android` |
| iOS | `npm run ios` |
| Web | `npm run web` |
| Web export | `npm run export:web` |
| Firebase Hosting deploy | `npm run deploy:hosting` |
| Lint | `npm run lint` |
| Tests (Node) | `npm run test:lobby-lifecycle`, `test:late-join`, `test:card-display`, `test:card-modal`, `test:player-seat`, `test:session-resume`, `test:test-access`, `test:table-layout` |
| Lobby cleanup | `npm run cleanup:lobbies` |

Not configured: `typecheck`, aggregiertes `test` (einzelne `test:*`-Scripts vorhanden).

---

## Cursor / AI rules

| Rule | Scope |
|------|-------|
| `project-rules.mdc` | Workflow, git, pre-commit checks, versioning |
| `ai-workflow.mdc` | Agent behavior for React Native |
| `security-secrets.mdc` | Secrets, `.env`, keystores |
| `testing-qa.mdc` | Lint, expo-doctor, manual QA |
| `release-workflow.mdc` | EAS/store release order |

Human-readable docs: `docs/ai-workflow.md`, `docs/security.md`, `docs/testing.md`, `docs/release-workflow.md`.

---

## Security / secrets

| Item | Policy |
|------|--------|
| `.env` | Gitignored; never commit |
| `.env.example` | Committed template |
| `EXPO_PUBLIC_*` | Client-visible — only public-safe values |
| Firebase keys | In `.env`; rotate if exposed |
| Keystores | Gitignored |

See `docs/security.md` and `.cursor/rules/security-secrets.mdc`.

---

## Testing / QA

### Pre-commit rule

**Before every git commit**, run available checks:

```bash
npm run lint
npx expo-doctor
```

Do **not** commit if lint reports errors.

### Known issues (lint)

| File | Issue |
|------|-------|
| `MagicCardModal.js` | 7× `react-hooks/exhaustive-deps` |
| `useGameFirebase.js` | 2× `react-hooks/exhaustive-deps` |
| `app/game.js` | 1× `react-hooks/exhaustive-deps` |
| `app/lobby.js` | 1× `react-hooks/exhaustive-deps` |
| `ResponsiveCard.js` | 1× `no-unused-vars` (`CARD_BASE_HEIGHT`) |

0 errors as of 2026-06-14 (12 warnings). See `docs/testing.md`.

---

## Release

- **Test-APK:** [docs/BUILD_ANDROID.md](docs/BUILD_ANDROID.md) — EAS + `buildType: apk`, `eas.json` im Repo
- **Letzter erfolgreicher Build:** `a762578b` (2026-06-14) — [APK-Download](https://expo.dev/artifacts/eas/m92ZAHz4LWCY1pSOuRn-CeOOn-pNxruUKORXEeP0RoA.apk)
- `android.package`: `com.wodkao.app` — konfiguriert
- Version in `app.json` / `package.json`
- Set `PACKAGE_NAME` / `BUNDLE_ID` before **store** upload (nicht nötig für sideload-APK)
- Alcohol/drinking theme: review store policies before public release

See [docs/release-workflow.md](docs/release-workflow.md) (Store) and [docs/BUILD_ANDROID.md](docs/BUILD_ANDROID.md) (APK).

---

## Core Game Loop Analyse

*Stand: 2026-06-09 — reine Code-Analyse, kein Refactoring*

### Spielstart

1. **Home** (`app/index.js`): Spielername eingeben, Firestore-Verbindungstest
2. Navigation zu **Lobby** (`/lobby`) oder **Galerie** (`/gallery`)
3. Kein Solo-Modus — Multiplayer ist der einzige aktive Spielpfad

### Lobby

| Schritt | Implementierung | Status |
|---------|-----------------|--------|
| Lobby erstellen | 5-stelliger Code → Firestore `lobbies/{code}` | ✅ Vollständig |
| Lobby beitreten | Code + Spielername, Duplikat-Check, Ablauf-Check (2h) | ✅ Vollständig |
| Lobby verlassen | Button „Lobby verlassen“, Host-Übergabe | ✅ Neu |
| Ready-System | Toggle pro Spieler | ✅ Vollständig |
| Host startet | Nur wenn alle ready | ✅ Vollständig |
| Kartenverteilung | Keine — Start mit leeren Händen; Decks `monsterDeck` + `saufDeck` | ✅ Neu |
| Redirect zu Game | `onSnapshot` bei `status: "playing"` (inkl. Setup-Phasen) | ✅ |

**Firestore-Lobby-Felder:** `players[]`, `status` (`waiting`|`playing`|`finished`|`expired`), `createdAt`, `lastActivityAt`, `turn`, `round`, `timers`, Timer-Starttimestamps, `effectsUsed`, `discardPile`

### Kartenlogik

**Laden:**

```
Google Sheets (CSV, 3 Tabs) → PapaParse → { name, effect, image: { uri } }
Bild-URL via GitHub Pages: jerrichoz.github.io/DrinkingGameOh/assets/images/cards/{imageName}.png
```

- `fetchAllCards()` in `src/utils/cards.js` — lädt Monster, Traps, Magic
- `loadCards()` in `src/utils/gameLogic.js` — **In-Memory-Cache** (`cachedCards`), nur Session
- Ziehen: aus `saufDeck` (Magie/Falle) oder `monsterDeck` (Startphase)
- Legacy-Hilfsfunktionen `randomMagic()` etc. noch vorhanden

**Im Spiel:**

| Kartenart | Wann | Wo gespeichert |
|-----------|------|----------------|
| Monster | Phase `drawingMonsters` | `players[].monster` |
| Falle | Zug aus Saufstapel (Typ TRAP) | `players[].trap` (verdeckt) |
| Magie | Zug aus Saufstapel (Typ MAGIC) | `lobby.lastMagic` |
| Ablagestapel | Nach Discard / ersetzte Falle | `lobby.discardPile[]` |

**Zugablauf (aktiver Spieler, Phase `playing`):**

1. `handleDraw` → Karte vom **Saufstapel**
2. **MAGIC:** wie bisher — Aufdecken, Reaktion, Ablegen
3. **TRAP:** verdeckt neben Monster legen, Zug endet
4. `handleDiscard` (nur Magie) → Ablage, nächster Spieler

**Lokale Assets:** ~70 PNGs in `assets/images/cards/` — werden vom Code **nicht** genutzt; Bilder kommen remote von GitHub Pages.

### Voting

- Auslöser: `handleActivateEffect` (Monster/Falle in Reaktionsphase)
- Firestore: `activeEffect`, `votingOpen`, `votes: { ja[], nein[] }`
- Alle Spieler stimmen ab → Mehrheit entscheidet
- **Ja:** Trap wird entfernt; Monster als `effectsUsed` markiert
- **Nein:** Aktivierender Spieler bekommt `shots + 1`
- Ergebnis: `voteResult`, `resolvedEffect`, ACK-Phase (`resultAcks`)
- UI: `MagicCardModal` (einzige Vote-/Ergebnis-UI; `VotePanel.js` Legacy, ungenutzt)
- Auto-Fallback: Timer abgelaufen → automatisch „Ja" / „OK"

### Timer

| Phase | Feld | Default | Auto-Aktion bei 0 |
|-------|------|---------|-------------------|
| Reaktion | `reactionsStartedAt` | 60s | Nicht-Zugspieler → Done |
| Voting | `votingStartedAt` | 30s | Auto-Ja |
| Ergebnis-ACK | `resultStartedAt` | 10s | Auto-OK |
| Ablage | `discardStartedAt` | 10s | Auto-Discard |

- Config: `src/config/timers.js`, pro Lobby in Firestore `timers`
- Settings-Screen `app/settings/timers.js` existiert, ist **nicht verlinkt** und **kaputt** (`formValues` undefined)

### Spielende

**Nicht implementiert.** Kein Win/Lose, kein Rundenlimit, kein `status: "finished"`. Das Spiel läuft endlos; `round` zählt hoch wenn `turn` auf 0 zurückspringt.

### Datenquelle

| Quelle | Rolle | Pflicht online? |
|--------|-------|-----------------|
| **Google Sheets** | Kartentexte (`name`, `effect`, `imageName`) via CSV-Export | Ja (beim Laden) |
| **GitHub Pages** | Kartenbilder (`jerrichoz.github.io/DrinkingGameOh/...`) | Ja (Bildanzeige) |
| **Firebase Firestore** | Lobby-State, Spieler, Zug, Karten auf dem Board | Ja (Multiplayer) |
| **Lokale Assets** | Rahmen, `card_back.png`, App-Icons | Nein |
| **In-Memory-Cache** | `gameLogic.cachedCards` | Nur nach erstem Fetch |

Env-Variablen: `EXPO_PUBLIC_GOOGLE_SHEET_ID`, `EXPO_PUBLIC_GOOGLE_GID_*`, Firebase-Keys in `.env`.

### Offlinefähigkeit

| Bereich | Offline möglich? |
|---------|------------------|
| Multiplayer-Spiel | ❌ Nein — Firestore Realtime nötig |
| Karten laden (erstes Mal) | ❌ Nein — Google Sheets + GitHub Pages |
| Galerie | ❌ Nein — braucht Netz beim Öffnen |
| UI-Rahmen / Kartenrückseite | ✅ Ja — lokale `require()` Assets |
| Nach App-Neustart ohne Netz | ❌ Cache weg, nichts ladbar |

**Fazit:** Die App ist **online-only** für den Core Game Loop.

### Vorhandene Screens

| Screen | Route | Zweck | Angebunden |
|--------|-------|-------|------------|
| Home | `/` (`index.js`) | Name, Firestore-Test, Navigation | ✅ |
| Lobby | `/lobby` | Erstellen/Beitreten/Ready/Start | ✅ |
| Spiel | `/game` | Hauptspiel-Loop | ✅ |
| Galerie | `/gallery` | Alle Karten anzeigen | ✅ |
| Timer-Settings | `/settings/timers` | Lobby-Timer konfigurieren | ❌ Nicht verlinkt |

### Spielmodi

| Modus | Status |
|-------|--------|
| **Multiplayer (Firebase Lobby)** | ✅ Einziger aktiver Modus |
| **Galerie (Karten browse)** | ✅ Kein Spiel, nur Anzeige |
| **Solo / Lokal** | ❌ Nicht vorhanden |
| **Demo (`useGameLogic`)** | ⚠️ Code existiert, kein Screen nutzt ihn |

### Features: vollständig vs. teilweise

**Vollständig spielbar (mit Netz + Firebase):**

- Lobby erstellen/beitreten/ready/starten
- Turn-Anzeige (wer ist dran)
- Magiekarte ziehen, zeigen, Reaktionsphase
- Trinken (+1 `shots`)
- Monster-/Fallen-Effekt aktivieren + Voting
- Ergebnis-ACK-Phase
- Karte ablegen, Zugwechsel, Runden-Zähler
- Echtzeit-Sync aller Clients via Firestore
- Karten-Galerie

**Teilweise implementiert:**

- Timer-Settings-Screen (Code da, nicht erreichbar — Save funktional)
- `effectsUsed.monster` wird gesetzt, aber UI blockiert nicht erneute Aktivierung
- Fallen der Gegner immer verdeckt (`card_back.png`) — kein Reveal-Mechanismus
- Ungenutzter Legacy-Code: `useGameLogic`, `useGameFirebase`, `EffectButtons`, `MagicStack`, `PlayerBoard`
- ~~Doppelte Voting-UI~~ — ✅ behoben (nur `MagicCardModal`)
- ~~`reactions`-Init nur Host~~ — ✅ behoben (`startGame` + `handleShow` für alle)

### Bekannte Bugs

| Priorität | Bug | Auswirkung |
|-----------|-----|------------|
| ~~Hoch~~ | ~~`handleCloseVoteResult` fehlt~~ | ✅ Behoben |
| ~~Hoch~~ | ~~`formValues` undefined in `timers.js`~~ | ✅ Behoben |
| ~~Mittel~~ | ~~`lastMagic.title` statt `.name`~~ | ✅ Behoben |
| ~~Mittel~~ | ~~`reactions` nur für Host initialisiert~~ | ✅ Behoben 2026-06-13 |
| ~~Niedrig~~ | ~~Doppelte Vote/Ergebnis-UI~~ | ✅ Behoben — nur `MagicCardModal` |
| Niedrig | `useGameFirebase` filtert `type === "monster"` (lowercase) | Würde bei Nutzung keine Karten finden |
| — | Kein Spielende | Endloses Spiel by design (noch kein Feature) |

### Laufzeit-Check (2026-06-14)

```bash
npm run lint           # ✅ 0 Errors, 12 Warnings
npm run test:*         # ✅ 8 Node-Test-Scripts (siehe package.json)
npx expo export --platform web     # ✅
npx expo export --platform android # ✅
```

**Offen:** Manueller Geräte-Smoke-Test mit APK `a762578b`; Firebase Hosting Deploy für iPhone-Web.

---

## Stabilisierung Session

*Stand: 2026-06-13 (MVP-Release-Audit)*

### Behobene Fehler

| Fehler | Fix |
|--------|-----|
| `handleCloseVoteResult` fehlte in `gameActions.js` | Export hinzugefügt — leert `voteResult`, `resolvedEffect`, `resultAcks`, `resultStartedAt` in Firestore |
| ESLint `import/namespace` in `game.js` | Named Import `handleCloseVoteResult` ergänzt |
| `formValues` undefined in `timers.js` | → `values` korrigiert |
| `lastMagic.title` in `GameBoard.js` | → `lastMagic.name` (Kartendaten nutzen `name`) |

### Verbleibende Warnings (12)

| Datei | Art |
|-------|-----|
| `src/components/MagicCardModal.js` | 7× `react-hooks/exhaustive-deps` |
| `src/hooks/useGameFirebase.js` | 2× `react-hooks/exhaustive-deps` |
| `app/game.js` | 1× `react-hooks/exhaustive-deps` |
| `app/lobby.js` | 1× `react-hooks/exhaustive-deps` |
| `src/components/ResponsiveCard.js` | 1× `no-unused-vars` |

`npm run lint` → **0 Errors, 12 Warnings** ✅

### Manueller Test

**Noch nicht durchgeführt** — Dev Server war/läuft auf `http://localhost:8081`. Empfohlen: 2 Geräte/Emulatoren, Firebase + Netz aktiv.

### Verbleibende Runtime-Risiken

| Risiko | Details |
|--------|---------|
| Online-only | Firestore + Google Sheets + GitHub Pages nötig |
| ~~`reactions`-Init~~ | ✅ Behoben — alle Spieler bei Start |
| ~~Doppelte Vote-UI~~ | ✅ Behoben — nur `MagicCardModal` |
| Kein Spielende | Endlosschleife by design |
| Timer-Settings | Screen nicht verlinkt (Save jetzt funktional, aber unerreichbar) |
| Expo-Paket-Versionen | 16 Pakete hinter SDK-Empfehlung |

### Nächste empfohlene Tasks

1. **Manueller MVP-Test** — Lobby mit 2 Spielern, voller Zug (Ziehen → Zeigen → Reaktion → Voting → ACK → Ablegen)
2. **Commit + Push** nach WodkaO (nach Test-Bestätigung)
3. **Lokale Kartendaten** — Abhängigkeit von Sheets/GitHub Pages reduzieren

### UX / Game-Screen (Pokertisch)

*Stand: 2026-06-09 — Slot-Layout*

| Element | Status |
|---------|--------|
| Slot-Layout (`tableSlotLayout.js`, `GameBoard.js`, max. 8) | ✅ |
| Kompakte Lobby-Code-HUD-Box (`LobbyCodeBadge`, oben rechts) | ✅ ~2× größer, ganzer Block kopiert Code |
| Rundenanzeige im Tisch | ✅ |
| HUD blockiert Spielfeld nicht mehr | ✅ |
| Join während `status: playing` | ✅ **Late Join** via `joinLobbyTransaction` |
| Sichtbare Kartenstapel auf dem Tisch | ✅ |
| Saufstapel / Ablage (getrennte Slots) | ✅ (`StackPile.js`) |
| Ziehen-Button (`GameActionBar`, unten) | ✅ 64–72 px Touch-Ziel, „Karte ziehen“, nur am Zug |
| Dynamische Stapelgröße (0–4 echt, 5+ max. 5 sichtbar) | ✅ |
| Leeres Stapelfeld bei 0 Karten | ✅ gestrichelter Platzhalter |
| Anzahl in Klammern (echte Count) | ✅ |
| PlayerSeat: Karten + Avatar getrennt | ✅ Slots relativ zu `tableRect` |
| Silhouette-Avatar (Platzhalter) | ✅ `PlayerSilhouette` |
| Selfie-Avatar | 📋 Backlog |

Details: [docs/layout_system.md](docs/layout_system.md), Debug: `EXPO_PUBLIC_LAYOUT_DEBUG=1`

**Stapel auf dem Tisch (Slot-Positionen):**

- **Saufstapel** — `centerDeckSlot` (links Mitte)
- **Ablage** — `centerDiscardSlot` (rechts Mitte)
- **Ziehen-Button** — `drawButtonSlot` (unter Saufstapel)
- **Monster** — `topMonsterSlot` / `bottomMonsterSlot` (eigenes Monster zwischen Avatar und Mitte)

`StackPile` rendert nach `count` wie bisher (0 = Platzhalter, 1–4 echt, 5+ max. 5 Layer).

**Anzahl je Stapel — Datenquellen:**

| Stapel | Anzeige | Quelle |
|--------|---------|--------|
| Saufstapel | `(X)` | `lobby.saufDeck.length` |
| Ablage | `(X)` | `lobby.discardPile.length` |
| Fallen (Spieler) | `(X)` | `players.filter(p => p.trap).length` |

**Join nach Spielstart:** **Erlaubt** (Late Join) — `joinLobbyTransaction` in `lateJoin.js`; nur `finished`/`expired` blockiert.

**Karten-Presence (Denkblase):**

- Eigene Monster-/Fallenkarte öffnen → `players[].viewingCard = { type, startedAt }` in Firestore
- Modal schließen / Screen verlassen → `viewingCard` einmalig in Firestore gelöscht (kein Render-Loop)
- Andere Spieler: kurze **weiße Sprechblase** am Avatar — nur `👀 Monsterkarte` / `👀 Fallenkarte` (kein langer Satz, kein Doppeltext)
- Timeout 15 s: Bubble wird **lokal** ausgeblendet, ohne Firestore-Polling
- Flackern behoben: kein `clearViewingCard` bei jedem Lobby-Snapshot mehr
- Kein Leak von Fallenkarten-Details — nur Typ-Label, keine Karteneffekte

---

## Features (current)

- Startscreen with player name + Firestore test
- Multiplayer lobby (create/join, ready, host start, **late join**)
- Turn-based game: monster/trap/magic cards
- Magic draw, voting, reactions, timers
- Card gallery from Google Sheets

---

## Open TODOs

| Priority | Item |
|----------|------|
| ~~Hoch~~ | ~~Fix lint errors~~ — ✅ erledigt (Stabilisierung Session) |
| Hoch | **Multi-Device-Smoke-Test** (APK `a762578b` + Web) inkl. Late Join — [docs/MVP_RELEASE_CHECKLIST.md](docs/MVP_RELEASE_CHECKLIST.md) |
| Hoch | Firestore Security Rules vor Freunde-Test verifizieren |
| Hoch | Firebase Hosting Deploy für iPhone-Web-MVP — [docs/BUILD_WEB.md](docs/BUILD_WEB.md) |
| Mittel | Local card data fallback (reduce Sheets dependency) |
| Mittel | Aggregiertes `npm test` + optional `typecheck` |
| ~~Niedrig~~ | ~~Add `eas.json` for release builds~~ — ✅ erledigt |
| ~~Niedrig~~ | ~~EAS Login + erster APK-Build~~ — ✅ `a762578b` (2026-06-14) |
| Niedrig | App slug/display name konsistent benennen (`jahw3-app` vs. WodkaO) |
| Niedrig | Legacy `VotePanel.js` aus Repo entfernen |

---

## Git-Status

*Stand: 2026-06-14*

| Eigenschaft | Wert |
|-------------|-------|
| **Ziel-Repo** | https://github.com/maksimscheierman-prof/WodkaO |
| **Repo-Pfad** | `Sauf Viel-Oh/.git` |
| **Branch** | `feature/mvp-online-apk` |
| **Letzter Commit** | `c2cc056` — `fix: prevent Android monster modal crash and improve web layout` |
| **Working tree** | Sauber (nur lokale IDE-Settings `.vscode/settings.json` uncommitted) |

Push-Status: Branch lokal; Push nur auf explizite Anweisung.

---

## Quality gate

```bash
npm run lint
npx expo-doctor
```

Optional: `npx tsc --noEmit`
