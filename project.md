# WodkaO — Kartentrinkspiel (React Native)

Digitales Kartentrinkspiel / Partyspiel mit Yu-Gi-Oh!-Optik. Multiplayer über Firebase Firestore.

**Git-Repo:** [maksimscheierman-prof/WodkaO](https://github.com/maksimscheierman-prof/WodkaO)  
**App-Ordner:** `jahw3-app/` (lokaler Ordnername unverändert) — **dieser Ordner ist das Git-Root**  
**Workspace-Parent:** `Sauf Viel-Oh/` (Cursor kann einen Ordner höher geöffnet sein; Root-`package.json` delegiert npm)  
**npm package name:** `jahw3-app` (technisch, unverändert)  
**Display name (UI):** Vod-ka-Oh!  
**Version:** `1.0.0` (`app.json`, `package.json`)  
**Phase:** MVP — APK-Test mit Freunden (kein Store) — siehe [docs/MVP_ROADMAP.md](docs/MVP_ROADMAP.md)

---

## APK-MVP (2026-06-09)

| Dokument | Inhalt |
|----------|--------|
| [docs/FIREBASE_SCHEMA.md](docs/FIREBASE_SCHEMA.md) | Firestore, Online-Sync, Concurrency |
| [docs/firebase_cleanup.md](docs/firebase_cleanup.md) | Lobby-Ablauf (2h), Admin-Cleanup, Cloud Functions |
| [docs/MVP_ROADMAP.md](docs/MVP_ROADMAP.md) | Ziel, Soll/Ist, Checkliste, Phasen 1–5 |
| [docs/BUILD_ANDROID.md](docs/BUILD_ANDROID.md) | EAS/APK-Befehle, Voraussetzungen |
| [docs/SPIELABLAUF.md](docs/SPIELABLAUF.md) | Spielphasen & Regeln |
| [docs/layout_system.md](docs/layout_system.md) | Tisch-Slot-Layout (Deck, Monster, Avatare) |
| [docs/layout_debug.md](docs/layout_debug.md) | Viewport/Squash-Debug (Cursor Browser) |
| [docs/project_structure_cleanup.md](docs/project_structure_cleanup.md) | Workspace-Struktur, Parent vs. App-Root |

**Startordner für App-Befehle:** `jahw3-app/` (dieser Ordner) — oder Parent mit `npm run …` (delegiert)

### Workspace-Struktur

| Ordner öffnen in Cursor | npm | Git |
|-------------------------|-----|-----|
| `Sauf Viel-Oh` (Parent) | `npm run start` etc. vom Root | `cd jahw3-app && git …` |
| `jahw3-app` (empfohlen für EAS/Git) | `npm run start` direkt | `git …` direkt |

Siehe [docs/project_structure_cleanup.md](docs/project_structure_cleanup.md).

**Projektstack:** Expo ~54 · React Native 0.81 · expo-router · Firebase Firestore · react-native-web

**APK-Status:** ⚠️ **Config fertig** (`eas.json`, `android.package: com.wodkao.app`) — Cloud-Build + Gerätetest noch offen ([docs/BUILD_ANDROID.md](docs/BUILD_ANDROID.md))

**Online-Multiplayer:** ✅ **Implementiert** (Firestore + Lobby-Code) — siehe [docs/FIREBASE_SCHEMA.md](docs/FIREBASE_SCHEMA.md)

**Schnellster Test heute:** 2 Browser/`npm run web` mit gleichem Lobby-Code — **Freunde-Test:** APK + gleiche Firebase-Config

---

## Aktueller Stand

*Stand: 2026-06-09*

- **Firebase/Firestore** wieder funktionsfähig (Lobby + Spiel-Sync; Firestore Rules im Firebase Console für MVP geöffnet)
- **Multiplayer-Lobby** funktioniert (Erstellen, Beitreten, Ready, Host-Start)
- **Spielstart** mit Phasen (Würfeln → Monster → Spiel) — siehe [docs/SPIELABLAUF.md](docs/SPIELABLAUF.md)
- **Kein Mid-Game-Join** nach Start
- **Pokertisch-Layout** — Slot-System (`tableSlotLayout.js`, `tableLayout.js`, `GameBoard.js`) — alle Objekte relativ zu `tableRect`
- Spieler werden **nach Rolle** platziert (oben/unten/seitlich, max. 8); eigenes Monster zwischen Avatar und Tischmitte
- **Avatare außerhalb** des Tisches; **Karten in definierten Slots** innerhalb der Tischfläche
- **Lobby-Code** im Spiel sichtbar (`LobbyCodeBadge`, oben rechts, kopierbar auf Web)
- Join während laufendem Spiel: **entfernt** (Beitritt blockiert)
- **Mehrfachklick-Schutz** via `useAsyncLock` (Lobby + Game + Modals)
- **Karten-Viewing-Presence** — Denkblase bei Monster-/Fallenkarten (`viewingCard` in Firestore)
- **Lobby-Ablauf:** Lobbys ohne Aktivität >2h → `status: "expired"`, Join blockiert — siehe [docs/firebase_cleanup.md](docs/firebase_cleanup.md)
- **Lint:** 0 Errors, 9 Warnings (`react-hooks/exhaustive-deps`)
- **Mobile Web:** Responsive Modals, Safe Area, Höhen-Breakpoints (`responsive.js`, `ResponsiveCard.js`)

### Online-Multiplayer (Firebase) — MVP-Pflicht

| Aspekt | Stand |
|--------|-------|
| Dienst | **Firestore only** (kein Auth, kein RTDB) |
| Lobby-Code | 5 Zeichen = Document-ID `lobbies/{code}` |
| Join | `joinLobby` — Code + Spielername |
| Host | `players[].isHost` — nur Host-UI für Start |
| Live-Sync | `onSnapshot` in `useLobby` + `lobby.js` |
| Login | **Nicht nötig** — Spielername reicht |
| APK + mehrere Geräte | ✅ **Architektur vorhanden** — gleiche Firebase-Config in APK |
| Schema-Doku | [docs/FIREBASE_SCHEMA.md](docs/FIREBASE_SCHEMA.md) |

**Einschränkungen:** Turn-Validierung nur Client-UI; keine Firestore Transactions; Internet + Sheets nötig.

### Mobile Responsiveness (2026-06-09)

| Bereich | Stand |
|---------|-------|
| Pokertisch | `computeBoardLayout` + `tableSlotLayout` — eine onLayout-Quelle, Kollisionsprüfung |
| Modal-Karten | `ResponsiveCard` skaliert 320×550 auf Viewport |
| Reaktionsphase | Vertikal gestapelt unter 520px Breite |
| HUD | Safe-Area-Insets, kompakter Lobby-Badge ab 360px |
| VotePanel | Unten fixiert auf Mobile, Touch min. 44px |
| Hover | Keine Desktop-only Hover-Logik |

**Viewports geprüft:** 360×640, 390×844, 414×896, Landscape Mobile, Tablet (DevTools)

**Offene Mobile-Todos:** 8-Spieler-Kollisionen auf SE-Größe, Lobby-Screen polish, echtes Gerätetest

**Spielablauf (Detail):** [docs/SPIELABLAUF.md](docs/SPIELABLAUF.md)

### Join während laufendem Spiel

| Aspekt | Stand |
|--------|-------|
| Beitritt bei `status: "playing"` | **Blockiert** |
| Mid-Game-Karten | Entfernt — kein Join nach Start |

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
- Initiale auf der Brust; Name unterhalb des Avatars
- Position: äußere Ellipsen-Normale, tischzugewandte Kante berührt Rand
- Zug-Highlight: grüner Glow nur am Avatar
- **Backlog:** Selfie-Avatar (`players[].avatarUri`)

### Kartenstapel (`StackPile`)

- Dynamische Layer: 0 = leeres Feld, 1–4 = echte Anzahl, 5+ = max. 5 sichtbar
- Label zeigt echte Count in Klammern
- **Saufstapel** (links Mitte) = `saufDeck.length` (Magie + Fallen gemischt)
- **Ablage** (rechts Mitte) = `discardPile.length`
- **Ziehen-Button** — eigener Slot unter Saufstapel (nicht im Monster-Slot)
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
| 2026-06-09 | **Tisch-Slot-Layout:** `tableSlotLayout.js` — Deck/Ablage/Button/Monster/Avatar relativ zu `tableRect`, Kollisionsprüfung |
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
| Viewing-Bubble verschwindet nicht immer korrekt | ⚠️ Offen | Nach 15 s lokales Timeout oder Modal-Close; Edge-Cases bei Tab-Wechsel/Unmount prüfen |
| Avatar/Karten-Positionierung | ✅ Slot-System | Feintuning 8 Spieler / sehr kleine Screens — [docs/layout_system.md](docs/layout_system.md) |
| `reactions`-Init nur für Host | ⚠️ Bekannt | Reaktionsphase evtl. falsch für Joiner |
| Doppelte Vote-UI | ⚠️ Bekannt | `VotePanel` + `MagicCardModal` parallel |
| `MagicCardModal` ohne `me`-Guard | ⚠️ Risiko | `me.name` wenn Spieler nicht in Lobby — potenzieller Crash |
| Timer-Settings unerreichbar | ⚠️ Bekannt | Screen existiert, nicht verlinkt |
| Expo-Paket-Versionen | ⚠️ Warnung | 16 Pakete hinter SDK-Empfehlung |
| Kein Spielende | ℹ️ By design | Endlosschleife, kein `status: "finished"` |

---

## Nächste Prioritäten

### Priorität 1 — APK & Multiplayer

- EAS Login + `EXPO_PUBLIC_*` in Environment `preview` setzen
- `eas build --platform android --profile preview` ausführen
- APK auf 2+ Geräten: Lobby → voller Spielablauf
- Multiplayer-End-to-End im Browser verifizieren (2+ Clients)

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
| Routing | **expo-router** ~6 |
| Language | JavaScript (TypeScript config, code mostly `.js`) |
| Backend | **Firebase Firestore** (realtime multiplayer) |
| Card data | Google Sheets CSV + PapaParse |
| Card images | Local `assets/images/cards/` + remote GitHub Pages fallback |
| Package manager | **npm** (`package-lock.json`) |

**Not used:** Flutter, Supabase, bare React Native (no `android/`/`ios/` in repo — Expo prebuild when needed).

---

## Folder structure

```
jahw3-app/          # App-Code (Git-Repo-Root)
  app/              # expo-router screens (index, lobby, game, gallery, settings)
  src/
    components/     # Card, GameBoard, modals, VotePanel, …
    hooks/          # useLobby, useGameLogic, useGameFirebase
    utils/          # gameActions, gameLogic, cards
    config/         # timers
    styles/         # CardStyles, gameStyles
  assets/
    fonts/          # DidactGothic
    images/cards/   # ~70 card PNGs
  docs/             # AI, security, testing, release guides
  .cursor/rules/    # Cursor agent rules
  firebaseConfig.js
  app.json
  package.json
```

Workspace-Root (`Sauf Viel-Oh/`) enthält zusätzlich `project.md` (Übersicht), gespiegelte `.cursor/rules/` und `docs/`.

---

## Scripts (`package.json`)

| Script | Command |
|--------|---------|
| Start dev server | `npm start` |
| Android | `npm run android` |
| iOS | `npm run ios` |
| Web | `npm run web` |
| Lint | `npm run lint` |

Not configured: `typecheck`, `test`.

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
| `useGameFirebase.js` | 2× `react-hooks/exhaustive-deps` (Legacy-Hook) |

0 errors as of 2026-06-09. See `docs/testing.md`.

---

## Release

- **Test-APK:** [docs/BUILD_ANDROID.md](docs/BUILD_ANDROID.md) — EAS + `buildType: apk`, `eas.json` im Repo
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
- UI: `MagicCardModal` + `VotePanel` (doppelt vorhanden)
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
- Doppelte Voting-UI (`VotePanel` + `MagicCardModal`)
- `reactions`-Init bei Lobby-Create nur für Host, nicht alle Spieler

### Bekannte Bugs

| Priorität | Bug | Auswirkung |
|-----------|-----|------------|
| ~~Hoch~~ | ~~`handleCloseVoteResult` fehlt~~ | ✅ Behoben |
| ~~Hoch~~ | ~~`formValues` undefined in `timers.js`~~ | ✅ Behoben |
| ~~Mittel~~ | ~~`lastMagic.title` statt `.name`~~ | ✅ Behoben |
| Mittel | `reactions` nur für Host initialisiert | Reaktionsphase evtl. falsch für Joiner |
| Niedrig | Doppelte Vote/Ergebnis-UI in Modal + VotePanel | Verwirrende UX |
| Niedrig | `useGameFirebase` filtert `type === "monster"` (lowercase) | Würde bei Nutzung keine Karten finden |
| — | Kein Spielende | Endloses Spiel by design (noch kein Feature) |

### Laufzeit-Check (2026-06-09)

```bash
# node_modules vorhanden — npm install übersprungen
npm run lint    # ❌ 2 Errors, 11 Warnings (siehe oben)
npm start       # ✅ Expo Dev Server gestartet
```

**Expo Start — Meldungen:**

| Typ | Meldung |
|-----|---------|
| Warnung | `--non-interactive` nicht unterstützt (CLI-Hinweis) |
| Warnung | 16 Pakete nicht auf erwartete Expo-SDK-Versionen |
| Erfolg | Metro Bundler läuft auf `http://localhost:8081` |
| Fehler | Keine Bundle-/Compile-Fehler beim Start |

*Hinweis: Kein Geräte-Test durchgeführt — Runtime-Fehler im Spiel (z. B. `handleCloseVoteResult`) würden erst bei Interaktion auf dem Gerät sichtbar.*

---

## Stabilisierung Session

*Stand: 2026-06-09*

### Behobene Fehler

| Fehler | Fix |
|--------|-----|
| `handleCloseVoteResult` fehlte in `gameActions.js` | Export hinzugefügt — leert `voteResult`, `resolvedEffect`, `resultAcks`, `resultStartedAt` in Firestore |
| ESLint `import/namespace` in `game.js` | Named Import `handleCloseVoteResult` ergänzt |
| `formValues` undefined in `timers.js` | → `values` korrigiert |
| `lastMagic.title` in `GameBoard.js` | → `lastMagic.name` (Kartendaten nutzen `name`) |

### Verbleibende Warnings (9)

| Datei | Art |
|-------|-----|
| `src/components/MagicCardModal.js` | 7× `react-hooks/exhaustive-deps` |
| `src/hooks/useGameFirebase.js` | 2× `react-hooks/exhaustive-deps` |

`npm run lint` → **0 Errors, 9 Warnings** ✅

### Manueller Test

**Noch nicht durchgeführt** — Dev Server war/läuft auf `http://localhost:8081`. Empfohlen: 2 Geräte/Emulatoren, Firebase + Netz aktiv.

### Verbleibende Runtime-Risiken

| Risiko | Details |
|--------|---------|
| Online-only | Firestore + Google Sheets + GitHub Pages nötig |
| `reactions`-Init | Bei Lobby-Create nur Host in `reactions` |
| Doppelte Vote-UI | `VotePanel` + `MagicCardModal` parallel |
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
| Kompakte Lobby-Code-HUD-Box (`LobbyCodeBadge`, oben rechts) | ✅ |
| Rundenanzeige im Tisch | ✅ |
| HUD blockiert Spielfeld nicht mehr | ✅ |
| Join während `status: playing` | ❌ **Blockiert** in `joinLobby` |
| Sichtbare Kartenstapel auf dem Tisch | ✅ |
| Saufstapel / Ablage (getrennte Slots) | ✅ (`StackPile.js`) |
| Ziehen-Button eigener Slot (nicht Monster-Slot) | ✅ |
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

**Join nach Spielstart:** **Blockiert** in `joinLobby` wenn `status === "playing"`.

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
- Multiplayer lobby (create/join, ready, host start)
- Turn-based game: monster/trap/magic cards
- Magic draw, voting, reactions, timers
- Card gallery from Google Sheets

---

## Open TODOs

| Priority | Item |
|----------|------|
| ~~Hoch~~ | ~~Fix lint errors~~ — ✅ erledigt (Stabilisierung Session) |
| Hoch | Ersten Push nach `WodkaO` vorbereiten (nach Lint-Fix + Commit) |
| Mittel | Local card data fallback (reduce Sheets dependency) |
| Mittel | Add `typecheck` / `test` scripts when tests exist |
| ~~Niedrig~~ | ~~Add `eas.json` for release builds~~ — ✅ erledigt |
| Niedrig | EAS Login + erster APK-Build (`eas build --profile preview`) |
| Niedrig | App slug/display name konsistent benennen |

---

## Git-Status

*Stand: 2026-06-09 (nach UX/Presence-Session)*

| Eigenschaft | Wert |
|-------------|-------|
| **Ziel-Repo** | https://github.com/maksimscheierman-prof/WodkaO |
| **Repo-Pfad** | `jahw3-app/.git` |
| **Branch** | `main` |
| **Remote (origin)** | `https://github.com/maksimscheierman-prof/WodkaO` |
| **Letzter Commit (remote)** | `5993162` — „Timer Anzeig erstellt…" (2025-10-08) |
| **Lokale Änderungen** | Viele unstaged/untracked — Pokertisch, HUD, Presence, Locks |

### Offene Änderungen (Auszug)

| Status | Bereich |
|--------|---------|
| Modified | `app/game.js`, `app/lobby.js`, `GameBoard.js`, `gameActions.js`, `CardModal.js`, … |
| Untracked (neu) | `PlayerSeat.js`, `StackPile.js`, `ViewingCardBubble.js`, `tableLayout.js`, `useAsyncLock.js`, `LobbyCodeBadge.js`, `project.md`, `docs/` |

### Erster Push vorbereitet?

⚠️ **Noch nicht** — vor dem ersten Push zu `WodkaO`:

1. ~~Lint-Fehler beheben~~ — ✅ erledigt
2. Manueller MVP-Test, dann Commit (AI-Framework + Fixes)
3. `git push -u origin main` (manuell nach Bestätigung)

Push wurde in dieser Session **nicht** ausgeführt.

---

## Quality gate

```bash
npm run lint
npx expo-doctor
```

Optional: `npx tsc --noEmit`
