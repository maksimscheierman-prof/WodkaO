# MVP Release Checklist — Freunde-Test (Android APK + iPhone Web)

*Stand: 2026-06-13 — Android APK + iPhone Safari über öffentliche Web-URL*

**Late Join** ist offizieller MVP-Bestandteil (Code + Unit-Tests ✅). Vor APK-Freigabe: Multi-Device-Manual-Tests unten durchführen.

---

## Must fix before APK (Code)

| # | Item | Status |
|---|------|--------|
| 1 | `eas.json` + `android.package` | ✅ |
| 2 | Spielablauf (Phasen, Saufstapel, Online-Sync) | ✅ Code |
| 3 | Draw-Button Touch-Ziel (`GameActionBar`, 64–72 px) | ✅ 2026-06-13 |
| 4 | Lobby-Code komplett klickbar + Copy-Feedback | ✅ 2026-06-13 |
| 5 | `MagicCardModal` `me`-Guard (kein Crash ohne Spieler) | ✅ 2026-06-13 |
| 6 | Doppelte Vote-UI entfernt (`VotePanel` → nur `MagicCardModal`) | ✅ 2026-06-13 |
| 7 | Action-Bar versteckt während Voting | ✅ 2026-06-13 |
| 8 | `reactions` bei Spielstart für alle Spieler initialisiert | ✅ 2026-06-13 |
| 9 | **Late Join** — Beitritt während laufendem Spiel | ✅ 2026-06-09 |
| 10 | **Late Join** — Firestore Transaction (`joinLobbyTransaction`) | ✅ 2026-06-09 |
| 11 | **Late Join** — Seat + Monster + Turn-Order hinten | ✅ 2026-06-09 |
| 12 | **Late Join** — Join-Toast + `lastJoinAnnouncement` | ✅ 2026-06-09 |
| 13 | `npm run lint` — 0 Errors | ✅ |
| 14 | `test:lobby-lifecycle` + `test:table-layout` + `test:late-join` | ✅ |
| 15 | **CardDetailModal** — Galerie + Monster/Trap, Android-sicher (kein transform-scale) | ✅ 2026-06-13 |
| 16 | **Session Resume** — AsyncStorage + „Letztes Spiel fortsetzen“ | ✅ 2026-06-13 |
| 17 | `test:card-display` + `test:session-resume` + `test:card-modal` | ✅ |
| 18 | **Web Test-Gate** — Zugangscode + AsyncStorage | ✅ 2026-06-13 |
| 19 | `test:test-access` | ✅ |
| 20 | **Kein weißer Nav-Header** (Android/Web) | ✅ 2026-06-13 |
| 21 | **Game Exit** — ✕ + Confirm + BackHandler | ✅ Code |

---

## Must fix before APK (Build / Ops)

| # | Item | Status |
|---|------|--------|
| 1 | Expo-Account + `eas login` | ❌ manuell |
| 2 | EAS Environment `preview` — alle `EXPO_PUBLIC_*` | ❌ manuell |
| 3 | Erster `eas build --platform android --profile preview` | ❌ |
| 4 | Firebase Rules für Test-Projekt offen genug | ⚠️ prüfen |
| 5 | Google Sheets öffentlich / erreichbar für Kartendaten | ⚠️ prüfen |

Details: [BUILD_ANDROID.md](BUILD_ANDROID.md)

---

## Can wait after APK

| Item | Grund |
|------|--------|
| Viewing-Bubble Edge-Cases (Tab-Wechsel) | Kosmetisch / selten |
| Firestore Transactions (außer Late Join) | Race nur bei schlechtem Netz |
| Turn-Validierung serverseitig | Freunde-Test, kein Cheating-Fokus |
| `expo-doctor` Paket-Patch-Mismatches | Build läuft mit aktuellen Versionen |
| Doppelte Timer-Settings-Screen | Nicht verlinkt |
| Selfie-Avatar, Spielende, Store-Release | Explizit Nicht-MVP |
| Pass-and-Play (1 Gerät) | Nicht-MVP |
| Legacy `VotePanel.js` Datei | Ungenutzt, Aufräumen später |
| Late Join bei leerem Monsterdeck — Balancing | Join erlaubt, Spieler ohne Monster |

---

## Pre-build commands (lokal)

```bash
cd "Sauf Viel-Oh"
npm install
npm run lint
npm run test:lobby-lifecycle
npm run test:late-join
npm run test:session-resume
npm run test:test-access
npm run test:table-layout
npx expo-doctor
```

`expo-doctor`: Paket-Versions-Warnungen dokumentiert — kein Blocker für Preview-APK.  
**Upload:** `.easignore` reduziert Archiv von ~288 MB auf ~10–20 MB — siehe [BUILD_ANDROID.md](BUILD_ANDROID.md).

---

## EAS Preview APK — Build-Befehle

```bash
cd "Sauf Viel-Oh"
eas login
eas env:list --environment preview
# Falls leer: eas env:push --environment preview --path .env
eas build --platform android --profile preview
```

APK nach Build von [expo.dev](https://expo.dev) herunterladen und sideloaden.

---

# Multiplayer / Late Join

Vor APK-Test und MVP-Freigabe müssen folgende Punkte **erfolgreich geprüft** sein.

*Code + Unit-Tests erledigt; Multi-Device-Spalte = manueller Freunde-Test.*

## Lobby

| Check | Code | Multi-Device |
|-------|------|--------------|
| Lobby erstellen | ✅ | ☐ |
| Lobby-Code teilen | ✅ | ☐ |
| Lobby beitreten (`waiting`) | ✅ | ☐ |
| Mehrere Geräte gleichzeitig verbunden | ✅ Architektur | ☐ |
| Host startet Spiel | ✅ | ☐ |

## Late Join

| Check | Code | Multi-Device |
|-------|------|--------------|
| Join während `waiting` | ✅ | ☐ |
| Join während Würfelphase (`rollingForStartPlayer` / `resolvingTie`) | ✅ | ☐ |
| Join während Monsterziehphase (`drawingMonsters`) | ✅ | ☐ |
| Join während aktivem Spiel (`playing`) | ✅ | ☐ |
| Join während laufendem Zug eines anderen Spielers | ✅ (turn unverändert) | ☐ |

## Late Join State

| Check | Code | Multi-Device |
|-------|------|--------------|
| Neuer Spieler erscheint auf allen Geräten | ✅ `onSnapshot` | ☐ |
| Neuer Spieler erhält freien Seat (`seatIndex`) | ✅ | ☐ |
| Neuer Spieler erhält Monster (aus `monsterDeck`) | ✅ Transaction | ☐ |
| Keine Start-Falle | ✅ `trap: null` | ☐ |
| Keine Start-Magie | ✅ | ☐ |
| Turn-Reihenfolge bleibt stabil (ans Ende von `players[]`) | ✅ | ☐ |
| Aktiver Spieler ändert sich nicht (`turn` unverändert) | ✅ | ☐ |
| Keine doppelte Monsterkarte | ✅ Transaction pop | ☐ |

## Synchronisation

| Check | Code | Multi-Device |
|-------|------|--------------|
| Neuer Spieler wird live angezeigt | ✅ | ☐ |
| Monster wird live angezeigt | ✅ | ☐ |
| Join-Toast erscheint (`{Name} ist dem Spiel beigetreten.`) | ✅ | ☐ |
| Alle Clients sehen identischen State | ✅ Architektur | ☐ |

## Fehlerfälle

| Check | Code | Multi-Device |
|-------|------|--------------|
| Lobby voll (max. 8) | ✅ | ☐ |
| Name bereits vergeben | ✅ | ☐ |
| Spiel beendet (`status: finished`) | ✅ | ☐ |
| Lobby abgelaufen (`status: expired`) | ✅ | ☐ |
| Leeres Monsterdeck — Join trotzdem, Hinweis sichtbar | ✅ | ☐ |
| Abbruch während Join | ⚠️ Client-Lock | ☐ |
| Netzwerkunterbrechung während Join | ⚠️ Transaction retry | ☐ |

---

## Manual test — Basis (2 Geräte)

**Gerät A (Host)** und **Gerät B (Gast)** — gleiche APK oder `npm run web`, Internet, Firebase-Config.

### Setup (beide)

1. APK installieren bzw. Web-Client öffnen
2. App starten → Spielername eingeben
3. Firestore-Indikator auf Startscreen grün / verbunden

### Lobby

4. **A:** Lobby erstellen → Code notieren
5. **B:** Code eingeben → beitreten
6. Beide: **Ready** → **A** startet Spiel

### Spielablauf

7. Beide: Würfeln (Gleichstand optional erneut würfeln)
8. Beide: je 1 Monster ziehen
9. **Startspieler:** „Karte ziehen“ (Action-Bar unten)
10. Magie: Aufdecken → andere reagieren → Ablegen
11. Optional: Falle ziehen → später aktivieren → Abstimmung im Modal
12. **Lobby-Code-Block** antippen → „Kopiert!“ (mindestens auf einem Gerät)

### Pass / Fail (Basis)

| Check | Pass wenn |
|-------|-----------|
| Sync | Beide sehen gleiche Phase / Zug / Karten |
| Draw | Nur Zugspieler sieht „Karte ziehen“ |
| Vote | Nur ein Abstimmungs-UI (Vollbild-Modal) |
| Copy | Lobby-Code kopierbar, Feedback sichtbar |
| Layout | Kein abgeschnittener Avatar, Button nicht unter Modal |
| Navigation | Kein weißer Standard-Header; Game-Exit mit Confirm | ✅ Code | ☐ APK |
| Spielernamen | Pro Slot nur ein Name, lesbar, nicht überlagert (Mobile) | ✅ Code | ☐ APK |
| Crash | Kein Absturz bei Zugwechsel / Voting / Verlassen |

---

## Manual test — Late Join (3+ Geräte empfohlen)

**Geräte A (Host), B, C, D, E** — gleicher Lobby-Code.

| Schritt | Aktion | Erwartung |
|---------|--------|-----------|
| 1 | A erstellt Lobby, B joined in `waiting` | Beide in Lobby |
| 2 | A + B Ready, A startet | Alle → `/game` |
| 3 | **C** joined während Würfelphase | C sichtbar, Monster, kein Zug-Sprung |
| 4 | **D** joined während `drawingMonsters` | D sichtbar, Monster, Toast auf A/B |
| 5 | Spiel läuft (`playing`), **E** joined während B am Zug | E hinten in Turn-Order, B bleibt aktiv |
| 6 | E wartet bis eigener Zug | E kann aus Saufstapel ziehen |
| 7 | Optional: 9. Spieler / doppelter Name / volle Lobby | Fehlermeldung korrekt |

Bei Showstopper: nur Blocker fixen, erneut `eas build --profile preview`.

---

# iPhone / Cross-Platform MVP

Vor MVP-Freigabe — iPhone über **öffentliche Web-URL** (Firebase Hosting). Details: [BUILD_WEB.md](BUILD_WEB.md).

| Check | Code | Getestet |
|-------|------|----------|
| `expo export --platform web` | ✅ | ✅ 2026-06-13 |
| `firebase.json` Hosting vorbereitet | ✅ | — |
| Öffentlicher Web-Link deployed | ⚠️ | ☐ `firebase deploy` |
| Web-Fallback iPhone Safari (LAN oder Hosting) | ✅ | ☐ |
| Lobby-Code Join (iPhone Safari) | ✅ | ☐ |
| Firebase Sync Android APK + iPhone Web | ✅ Architektur | ☐ |
| Late Join cross-platform | ✅ | ☐ |
| iOS-App / TestFlight | — | ☐ **nicht** erster MVP |

**MVP-Regel:** iPhone = **Safari + Web-Link**. Kein Apple-Account nötig.

---

## iPhone Safari — Web-MVP (detailliert)

| # | Check | Getestet |
|---|-------|----------|
| 0a | Ohne Code: Gate „Privater Testbuild“ sichtbar | ☐ |
| 0b | Falscher Code blockiert | ☐ |
| 0c | Richtiger Code → App; Reload bleibt eingeloggt | ☐ |
| 1 | Web-Link auf iPhone Safari öffnen (Hosting-URL oder LAN) | ☐ |
| 2 | Spielername eingeben | ☐ |
| 3 | Lobby per Code beitreten | ☐ |
| 4 | Android APK + iPhone Web in **gleicher** Lobby | ☐ |
| 5 | Late Join über Safari | ☐ |
| 6 | Würfeln über Safari | ☐ |
| 7 | Monster ziehen über Safari | ☐ |
| 8 | Saufstapel ziehen über Safari | ☐ |
| 9 | Falle verdeckt angezeigt | ☐ |
| 10 | Magiekarte anzeigen / Reaktion / Voting | ☐ |
| 11 | Turn-Wechsel synchron (alle Clients) | ☐ |
| 12 | Kein horizontales kaputtes Scrollen | ☐ |
| 13 | Buttons groß genug (Touch ≥ 44 px) | ☐ |
| 14 | Spielernamen lesbar, nicht doppelt/überlagert | ✅ Code | ☐ |
| 15 | Modal vollständig sichtbar (Safe Area) | ☐ |

### Cross-Platform Smoke (empfohlen)

1. **Android:** APK — Host erstellt Lobby
2. **iPhone Safari:** `https://<PROJECT>.web.app` (oder LAN) — Gast joined per Code
3. Host startet → Würfeln → Monster → 1 Zug → optional Late Join
4. Link + **Zugangscode** an iPhone-Tester teilen (Code separat, nicht in URL) — [PRIVATE_WEB_TESTING.md](PRIVATE_WEB_TESTING.md)

---

## APK Stability — Monster-Modal & Reconnect

| # | Check | Code | APK-Test |
|---|-------|------|----------|
| 1 | Zwei Geräte in gleicher Lobby | ✅ | ☐ |
| 1 | Galerie: Karte antippen → Bild, Name, Typ, Effekt lesbar | ☐ | Code ✅ |
| 2 | Monster antippen öffnet CardDetailModal (Effekt sichtbar) | ✅ Code | ☐ APK |
| 3 | Kein Crash bei Monster ohne `image`/`effect` (Fallback) | ✅ | ☐ |
| 4 | Late-Join-Monster öffnen | ✅ | ☐ |
| 5 | App schließen / Crash simulieren → neu öffnen | ✅ | ☐ |
| 6 | „Letztes Spiel fortsetzen“ auf Home sichtbar | ✅ | ☐ |
| 7 | Reconnect führt zurück zu `/lobby` oder `/game` | ✅ | ☐ |
| 8 | Firebase-State nach Reconnect unverändert | ✅ Architektur | ☐ |
| 9 | Expired/finished Lobby → Session gelöscht | ✅ | ☐ |

Details: [STATE_TRANSITIONS.md](STATE_TRANSITIONS.md)

---

| Risiko | Schwere | Stand |
|--------|---------|-------|
| Firestore Security Rules noch nicht vollständig geprüft | 🔴 Hoch | Client schreibt direkt — Rules in Console verifizieren vor Freunde-Test |
| Multi-Device-Test auf echten Geräten ausstehend | 🔴 Hoch | Code + Unit-Tests ok; APK-Smoke noch offen |
| Verhalten bei Spieler-Disconnect offen | 🟡 Mittel | Kein Reconnect-Flow; Spieler bleibt in `players[]` |
| Verhalten bei Reconnect offen | 🟡 Mittel | Gleicher Name → „bereits in Lobby“; kein Session-Token |
| Verhalten bei Monsterdeck = leer offen | 🟡 Mittel | Join erlaubt, Spieler ohne Monster — Balancing TODO |
| Netzwerkabbruch während Late-Join-Transaction | 🟡 Mittel | Firestore retry; ggf. doppelter Join-Versuch nötig |
| Turn-Validierung nur Client-UI | 🟢 Niedrig | Akzeptiert für Freunde-MVP |

---

## Verwandt

- [MVP_ROADMAP.md](MVP_ROADMAP.md) — Fortschritt & Phasen
- [BUILD_ANDROID.md](BUILD_ANDROID.md)
- [BUILD_WEB.md](BUILD_WEB.md) — **iPhone Web-MVP** (Firebase Hosting)
- [BUILD_IOS.md](BUILD_IOS.md) — TestFlight (optional)
- [SPIELABLAUF.md](SPIELABLAUF.md) — Late-Join-Regeln
- [FIREBASE_SCHEMA.md](FIREBASE_SCHEMA.md) — `lastJoinAnnouncement`, Transaction
- [testing.md](testing.md)
