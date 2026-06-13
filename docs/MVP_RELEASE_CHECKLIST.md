# MVP Release Checklist — Freunde-APK

*Stand: 2026-06-13 — Ziel: sideload-Test, kein Store*

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
| 9 | `npm run lint` — 0 Errors | ✅ |
| 10 | `npm run test:lobby-lifecycle` + `test:table-layout` | ✅ |

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
| Firestore Transactions | Race nur bei schlechtem Netz |
| Turn-Validierung serverseitig | Freunde-Test, kein Cheating-Fokus |
| `expo-doctor` Paket-Patch-Mismatches | Build läuft mit aktuellen Versionen |
| Doppelte Timer-Settings-Screen | Nicht verlinkt |
| Selfie-Avatar, Spielende, Store-Release | Explizit Nicht-MVP |
| Pass-and-Play (1 Gerät) | Nicht-MVP |
| Legacy `VotePanel.js` Datei | Ungenutzt, Aufräumen später |

---

## Pre-build commands (lokal)

```bash
cd "Sauf Viel-Oh"
npm install
npm run lint
npm run test:lobby-lifecycle
npm run test:table-layout
npx expo-doctor
```

`expo-doctor`: Paket-Versions-Warnungen dokumentiert — kein Blocker für Preview-APK.

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

## Manual test — 2 Geräte (Script)

**Gerät A (Host)** und **Gerät B (Gast)** — gleiche APK, Internet, Firebase-Config in APK.

### Setup (beide)

1. APK installieren (Unbekannte Quellen erlauben)
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

### Pass / Fail

| Check | Pass wenn |
|-------|-----------|
| Sync | Beide sehen gleiche Phase / Zug / Karten |
| Draw | Nur Zugspieler sieht „Karte ziehen“ |
| Vote | Nur ein Abstimmungs-UI (Vollbild-Modal) |
| Copy | Lobby-Code kopierbar, Feedback sichtbar |
| Layout | Kein abgeschnittener Avatar, Button nicht unter Modal |
| Crash | Kein Absturz bei Zugwechsel / Voting / Verlassen |

Bei Showstopper: nur Blocker fixen, erneut `eas build --profile preview`.

---

## Verwandt

- [MVP_ROADMAP.md](MVP_ROADMAP.md)
- [BUILD_ANDROID.md](BUILD_ANDROID.md)
- [SPIELABLAUF.md](SPIELABLAUF.md)
- [testing.md](testing.md)
