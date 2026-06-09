# WodkaO — Kartentrinkspiel (React Native)

Digitales Kartentrinkspiel / Partyspiel mit Yu-Gi-Oh!-Optik. Multiplayer über Firebase Firestore.

**Git-Repo:** [maksimscheierman-prof/WodkaO](https://github.com/maksimscheierman-prof/WodkaO)  
**App-Ordner:** `jahw3-app/` (lokaler Ordnername unverändert)  
**npm package name:** `jahw3-app` (technisch, unverändert)  
**Display name (UI):** Vod-ka-Oh!  
**Version:** `1.0.0` (`app.json`, `package.json`)  
**Phase:** MVP — Core Game Loop vorhanden, Pokertisch-UX und Stabilisierung im Fokus

---

## Aktueller Stand

*Stand: 2026-06-09*

- **Firebase/Firestore** wieder funktionsfähig (Lobby + Spiel-Sync; Firestore Rules im Firebase Console für MVP geöffnet)
- **Multiplayer-Lobby** funktioniert (Erstellen, Beitreten, Ready, Host-Start)
- **Spielstart** funktioniert (Kartenverteilung, Redirect zu `/game`)
- **Pokertisch-Layout** implementiert (`GameBoard`, `tableLayout.js`)
- Spieler werden **dynamisch um den Tisch** angeordnet (Ellipse, max. 8)
- **Avatare außerhalb** des Tisches (Ellipsen-Normale am Tischrand)
- **Karten innerhalb** des Tisches (parametrischer Inset vom Rand)
- **Lobby-Code** im Spiel sichtbar (`LobbyCodeBadge`, oben rechts, kopierbar auf Web)
- **Join während laufendem Spiel** unterstützt — siehe unten
- **Mehrfachklick-Schutz** via `useAsyncLock` (Lobby + Game + Modals)
- **Karten-Viewing-Presence** — Denkblase bei Monster-/Fallenkarten (`viewingCard` in Firestore)
- **Lint:** 0 Errors, 9 Warnings (`react-hooks/exhaustive-deps`)

### Join während laufendem Spiel

| Aspekt | Stand |
|--------|-------|
| Blockiert in `joinLobby`? | Nein |
| Redirect zu `/game` | Ja, via `onSnapshot` bei `status: "playing"` |
| Mid-Game-Karten | `randomMonster()` + `randomTrap()` beim Beitritt |
| Max. Spieler | 8 |
| Einschränkung | Turn/Reaction-Logik für späte Joiner nicht vollständig getestet |

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

### Pokertisch

- Filz-Ellipse (`getTableEllipse`) als zentrale Layout-Quelle
- Drei Ebenen: Tisch → Karten (innen) → Avatar (außen)
- `TOP_HUD_HEIGHT = 80` + `TABLE_SHIFT_Y = 50` — Spielbereich nach unten, kein Avatar-Crop oben
- Zentrale Stapel: Fallen (links) · Magie (mitte) · Ablage (rechts)
- Rundenanzeige im Tisch über den Stapeln

### Avatar-System

- `PlayerSilhouette` — stilisierte Person (Kopf, Schultern, Oberkörper)
- Initiale auf der Brust; Name unterhalb des Avatars
- Position: äußere Ellipsen-Normale, tischzugewandte Kante berührt Rand
- Zug-Highlight: grüner Glow nur am Avatar
- **Backlog:** Selfie-Avatar (`players[].avatarUri`)

### Kartenstapel (`StackPile`)

- Dynamische Layer: 0 = leeres Feld, 1–4 = echte Anzahl, 5+ = max. 5 sichtbar
- Label zeigt echte Count in Klammern
- Magiestapel-Count = Pool-Größe aus Google Sheets (nicht verbleibendes Deck)
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

## Offene Bugs

| Bug | Status | Details |
|-----|--------|---------|
| `bubbleText is not defined` | ✅ Behoben | `bubbleText` in `PlayerSeat.js` definiert; ggf. Metro-Cache leeren (`expo start -c`) |
| Viewing-Bubble verschwindet nicht immer korrekt | ⚠️ Offen | Nach 15 s lokales Timeout oder Modal-Close; Edge-Cases bei Tab-Wechsel/Unmount prüfen |
| Avatar/Karten-Positionierung | ⚠️ Feintuning | Auf sehr kleinen Screens / Querformat ggf. noch Abstände justieren |
| `reactions`-Init nur für Host | ⚠️ Bekannt | Reaktionsphase evtl. falsch für Joiner |
| Doppelte Vote-UI | ⚠️ Bekannt | `VotePanel` + `MagicCardModal` parallel |
| `MagicCardModal` ohne `me`-Guard | ⚠️ Risiko | `me.name` wenn Spieler nicht in Lobby — potenzieller Crash |
| Timer-Settings unerreichbar | ⚠️ Bekannt | Screen existiert, nicht verlinkt |
| Expo-Paket-Versionen | ⚠️ Warnung | 16 Pakete hinter SDK-Empfehlung |
| Kein Spielende | ℹ️ By design | Endlosschleife, kein `status: "finished"` |

---

## Nächste Prioritäten

### Priorität 1 — Stabilisierung

- Multiplayer-End-to-End testen (2+ Browser/Geräte)
- Presence-System fertigstellen (Bubble-Lifecycle, Edge-Cases)
- Runtime-Audit nach jedem UX-Refactor
- Push nach `WodkaO` (Commit vorbereitet, Push manuell)

### Priorität 2 — Karten-/Stapel-UX

- Stapel-Animationen verfeinern (Ablegen, Ziehen)
- Responsiveness Querformat / kleine Screens
- Mid-Game-Join-Verhalten in Turn-Logik prüfen

### Priorität 3 — Avatar langfristig

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
| `app/game.js` | `handleCloseVoteResult` missing in `gameActions.js` |
| `app/settings/timers.js` | `formValues` undefined → use `values` |

See `docs/testing.md` for manual smoke-test steps.

---

## Release

- No `eas.json` yet — add when configuring EAS Build
- Version in `app.json` / `package.json`
- Set `PACKAGE_NAME` / `BUNDLE_ID` before store upload
- Alcohol/drinking theme: review store policies before public release

See `docs/release-workflow.md`.

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
| Lobby beitreten | Code + Spielername, Duplikat-Check | ✅ Vollständig |
| Ready-System | Toggle pro Spieler | ✅ Vollständig |
| Host startet | Nur wenn alle ready | ✅ Vollständig |
| Kartenverteilung | `randomMonster()` + `randomTrap()` pro Spieler aus Google Sheets | ✅ Funktional (braucht Netz) |
| Redirect zu Game | `onSnapshot` für alle Spieler bei `status: "playing"` | ✅ Vollständig |

**Firestore-Lobby-Felder:** `players[]`, `status`, `turn`, `round`, `timers`, Timer-Starttimestamps, `effectsUsed`, `discardPile`

### Kartenlogik

**Laden:**

```
Google Sheets (CSV, 3 Tabs) → PapaParse → { name, effect, image: { uri } }
Bild-URL via GitHub Pages: jerrichoz.github.io/DrinkingGameOh/assets/images/cards/{imageName}.png
```

- `fetchAllCards()` in `src/utils/cards.js` — lädt Monster, Traps, Magic
- `loadCards()` in `src/utils/gameLogic.js` — **In-Memory-Cache** (`cachedCards`), nur Session
- Ziehen: `randomMagic()` / `randomMonster()` / `randomTrap()` — zufällig aus gefiltertem Typ

**Im Spiel:**

| Kartenart | Wann | Wo gespeichert |
|-----------|------|----------------|
| Monster | Bei Spielstart | `players[].monster` (Firestore) |
| Falle | Bei Spielstart | `players[].trap` (Firestore) |
| Magie | Zugspieler zieht | `lobby.lastMagic` (Firestore) |
| Ablagestapel | Nach Discard | `lobby.discardPile[]` (Firestore) |

**Zugablauf (aktiver Spieler):**

1. `handleDraw` → Magiekarte ziehen → Modal lokal + `lastMagic` in Firestore
2. `handleShow` → Karte aufdecken → Reaktionsphase starten
3. Andere Spieler reagieren (Trinken, Monster/Falle aktivieren, Done)
4. `handleDiscard` → Karte auf Ablagestapel, `turn` weiter, `round`++ wenn Runde voll

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

- Timer-Settings-Screen (Code da, nicht erreichbar, Save kaputt)
- `effectsUsed.monster` wird gesetzt, aber UI blockiert nicht erneute Aktivierung
- Fallen der Gegner immer verdeckt (`card_back.png`) — kein Reveal-Mechanismus
- `handleCloseVoteResult` fehlt — OK-Button in Vote-Ergebnis-Overlay crasht potenziell
- `GameBoard` nutzt `lastMagic.title`, Karten haben aber `.name` → leerer Titel
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

*Stand: 2026-06-09*

| Element | Status |
|---------|--------|
| Spieler kreisförmig/elliptisch (`tableLayout.js`, max. 8) | ✅ |
| Kompakte Lobby-Code-HUD-Box (`LobbyCodeBadge`, oben rechts) | ✅ |
| Rundenanzeige in Tischmitte über Stapeln | ✅ |
| HUD blockiert Spielfeld nicht mehr | ✅ |
| Join während `status: playing` (Monster+Falle zuweisen) | ✅ |
| Sichtbare Kartenstapel auf dem Tisch | ✅ |
| Magiestapel / Fallenkarten / Ablage | ✅ (`StackPile.js`) |
| Dynamische Stapelgröße (0–4 echt, 5+ max. 5 sichtbar) | ✅ |
| Leeres Stapelfeld bei 0 Karten | ✅ gestrichelter Platzhalter |
| Anzahl in Klammern (echte Count) | ✅ (siehe Datenquellen unten) |
| PlayerSeat: Karten + Avatar getrennt | ✅ `cardsArea` auf Tisch, `avatarArea` außerhalb |
| Silhouette-Avatar (Platzhalter) | ✅ `PlayerSilhouette` — Kopf + Körper + Initiale |
| Namen außerhalb des Tisches | ✅ unter Silhouette im `avatarArea` |
| Selfie-Avatar | 📋 Backlog — siehe unten |

**Stapel auf dem Tisch (Tischmitte, links–mitte–rechts):**

`StackPile` rendert nach `count`:
- **0** — gestricheltes leeres Kartenfeld + Label `Name (0)`
- **1–4** — genau so viele versetzte Kartenrückseiten
- **5+** — maximal 5 sichtbare Layer; Label zeigt echte Anzahl z. B. `Magiestapel (32)`
- **Ablage** — oberste sichtbare Karte als Gesichtsbild (`topCardImage`), Rest Rückseite
- Leichte `LayoutAnimation` beim Count-Wechsel (z. B. nach Ablegen)

**Anzahl je Stapel — Datenquellen:**

| Stapel | Anzeige | Quelle | Einschränkung |
|--------|---------|--------|---------------|
| Magiestapel | `(X)` | `loadCards()` → Anzahl `type === "MAGIC"` | **Nicht** verbleibendes Deck. Firestore speichert kein Magic-Deck; `randomMagic()` zieht ohne Abzug aus dem Pool. X = Pool-Größe aus Google Sheets. |
| Fallenkarten | `(X)` | `players.filter(p => p.trap).length` | Verdeckte Fallen bei Spielern, kein zentraler Reservestapel im State. Sinkt z. B. nach erfolgreichem Trap-Vote. |
| Ablage | `(X)` | `lobby.discardPile.length` | Exakt. |

**Aktuelle Magic-Karte:** Verdeckt über Magiestapel nach Ziehen; aufgedeckt oberhalb des Ablagestapels (klickbar → Modal). Ablegen-Logik unverändert (`handleDiscard`).

**PlayerSeat — drei Ebenen:**

1. **Tisch** — `getTableEllipse()`: `radiusX = width×0.42`, `radiusY = height×0.4` (gleiche Quelle wie Filz-View)
2. **Karten** — `(radiusX − insetX) × cos θ`, `(radiusY − insetY) × sin θ`; `insetX/Y` dynamisch aus Kartengröße + `seatWidth` (nicht Edge-Point des Avatars)
3. **Avatar** — Randpunkt `(radius × cos θ, radius × sin θ)` + äußere Ellipsen-Normale × `(blockH/2 + 4px)` → berührt Tischrand von außen

Zug: grüner Glow nur am Avatar, Karten neutral.

**Avatar (Backlog):**

> **Selfie-Avatar:** Spieler macht vor Spielstart ein Selfie, Gesicht wird als Avatar am Tisch angezeigt.

Aktuell: `PlayerSilhouette` (keine Assets). Später: `players[].avatarUri` in Firestore — **nicht implementiert** (keine Kamera, kein Upload).

**Join nach Spielstart:** Nicht in `joinLobby` blockiert; Redirect via `onSnapshot` in `lobby.js`. Mid-Game-Joiner erhalten `randomMonster()` + `randomTrap()`, `ready: true`, max. 8 Spieler.

**HUD (kompakt):**

- **Lobby-Code** — schwebende Box oben rechts (`Lobby: XXXXX`, Kopieren, max. ~200 px), halbtransparent
- **Zugstatus** — kompakt oben links, max. 55 % Breite (kein Konflikt mit Lobby-Box)
- **Runde** — zentriert im Tisch über Fallen/Magie/Ablage (`GameBoard`), nicht mehr im Top-Banner
- **Spielbereich-Offset** — `TOP_HUD_HEIGHT = 80` + `TABLE_SHIFT_Y = 50`; Tisch/Ellipse/Seats/Stapel rutschen als Gruppe nach unten (`getTableEllipse`)

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
| Niedrig | Add `eas.json` for release builds |
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
