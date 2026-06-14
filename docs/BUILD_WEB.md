# Web-MVP — iPhone Safari & öffentliches Hosting

*Stand: 2026-06-13 — iPhone ohne App; Android mit APK*

---

## MVP-Plattform-Strategie

| Plattform | Weg | Dokument |
|-----------|-----|----------|
| **Android** | Installierbare **APK** (EAS) | [BUILD_ANDROID.md](BUILD_ANDROID.md) |
| **iPhone** | **Öffentliche Web-URL** in Safari | **Diese Datei** |
| **Beide** | Gleiche **Firebase-Lobby** (`lobbies/{code}`) | [FIREBASE_SCHEMA.md](FIREBASE_SCHEMA.md) |

**Grundsatz:**

- iPhone-Nutzer brauchen **keine iOS-App** und **kein TestFlight** im ersten MVP.
- Sie öffnen einen **öffentlichen Link** (z. B. Firebase Hosting) in **Safari**.
- Der Link ist erreichbar, aber durch **Test-Zugangscode** geschützt — siehe [PRIVATE_WEB_TESTING.md](PRIVATE_WEB_TESTING.md).
- Android-Spieler nutzen die **APK** — beide Clients sprechen mit **demselben Firestore-Projekt**.

---

## Web-Fähigkeit — Ist-Stand

| Check | Status | Anmerkung |
|-------|--------|-----------|
| `react-native-web` | ✅ | In `package.json` |
| `app.json` → `web.output: "static"` | ✅ | Statischer Export nach `dist/` |
| `npx expo export --platform web` | ✅ | Erfolgreich (7 Routen, ~8 MB `dist/`) |
| Viewport Meta | ✅ | `width=device-width, initial-scale=1` in `index.html` |
| `body { overflow: hidden }` | ✅ | Expo-Reset — kein Seiten-Scroll, App-intern |
| Safe Area | ✅ | `SafeAreaProvider` in `app/_layout.js` |
| Touch / Buttons | ✅ | `GameActionBar` min. 64 px; Mobile-Breakpoints in `responsive.js` |
| Firebase im Browser | ✅ | `firebaseConfig.js` — JS SDK + `EXPO_PUBLIC_*` |
| Kartendaten | ✅ | Google Sheets via `EXPO_PUBLIC_GOOGLE_*` |
| **Privater Testzugang** | ✅ | Gate + `EXPO_PUBLIC_TEST_ACCESS_CODE` — [PRIVATE_WEB_TESTING.md](PRIVATE_WEB_TESTING.md) |
| **Noindex** | ✅ | `public/robots.txt` + `app.json` `web.meta.robots` |

### Lokaler Dev-Start

```bash
cd "Sauf Viel-Oh"
npm install
npx expo start --web -c
```

Browser: `http://localhost:8081`  
iPhone im **gleichen WLAN**: `http://<PC-IP>:8081` (Firewall/Port freigeben).

> Port 8081 belegt? Anderen Port wählen: `npx expo start --web --port 8083`

### Bekannte Web-/Safari-Themen (kein Blocker)

| Thema | Stand |
|-------|-------|
| Clipboard (Lobby-Code) | iOS Safari eingeschränkt — Code manuell abtippen oder Badge antippen |
| Nicht native App | Performance/UI leicht anders als APK |
| `100vh` / Safari-Adressleiste | `expo-reset` nutzt `height: 100%` — in Tests prüfen |
| TestFlight / iOS-App | **Nicht** erster MVP — optional später ([BUILD_IOS.md](BUILD_IOS.md)) |

---

## Web-Export

```bash
cd "Sauf Viel-Oh"
npm run export:web
# oder: npx expo export --platform web
```

**Output:** Ordner **`dist/`** (gitignored)

| Route (static) | Datei |
|----------------|-------|
| `/` | `index.html` |
| `/lobby` | `lobby.html` |
| `/game` | `game.html` |
| `/gallery` | `gallery.html` |
| `/settings/timers` | `settings/timers.html` |

Lokal testen (nach Export):

```bash
npx serve dist
# oder: firebase emulators:start --only hosting
```

---

## Firebase ENV (Web-Build)

Beim Export werden **`EXPO_PUBLIC_*`** aus `.env` in den JS-Bundle eingebettet.

### Pflicht-Variablen

| Variable | Zweck |
|----------|--------|
| `EXPO_PUBLIC_FIREBASE_API_KEY` | Firebase |
| `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase |
| `EXPO_PUBLIC_FIREBASE_PROJECT_ID` | Firebase |
| `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase |
| `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase |
| `EXPO_PUBLIC_FIREBASE_APP_ID` | Firebase |
| `EXPO_PUBLIC_MEASUREMENT_ID` | Analytics (optional) |
| `EXPO_PUBLIC_GOOGLE_SHEET_ID` | Kartendaten |
| `EXPO_PUBLIC_GOOGLE_GID_MONSTER` | Monster-Tab |
| `EXPO_PUBLIC_GOOGLE_GID_TRAPS` | Fallen-Tab |
| `EXPO_PUBLIC_GOOGLE_GID_MAGIC` | Magie-Tab |
| `EXPO_PUBLIC_TEST_ACCESS_CODE` | **Web:** Zugangscode für privaten Testbuild |
| `EXPO_PUBLIC_TEST_ACCESS_PLATFORMS` | Optional: `web` (default), `all`, `none` |

Vorlage: `.env.example` — Details Gate: [PRIVATE_WEB_TESTING.md](PRIVATE_WEB_TESTING.md)

### Sicherheit

- ✅ App-Code nutzt **nur** `EXPO_PUBLIC_*` (sichtbar im Client — akzeptiert für MVP).
- ⚠️ **Test-Zugangscode** ist ebenfalls im Web-Bundle sichtbar — **kein echter Auth-Ersatz**, nur MVP-UI-Schutz ([PRIVATE_WEB_TESTING.md](PRIVATE_WEB_TESTING.md)).
- ❌ Keine Service-Account-Keys, `.env` Secrets oder `firebase-admin` im Frontend.
- `scripts/cleanup_old_lobbies.js` nutzt `LOBBY_INACTIVITY_HOURS` — **nur Server/CLI**, nicht im Web-Bundle.

**Wichtig für Hosting:** `.env` muss beim **`expo export`** vorhanden und korrekt sein — inkl. `EXPO_PUBLIC_TEST_ACCESS_CODE` für den Web-Gate.

---

## Hosting-Optionen

### A) Firebase Hosting — **bevorzugt (MVP)**

| Vorteil | Grund |
|---------|--------|
| Gleicher Anbieter wie Firestore | Ein Firebase-Projekt für DB + Web |
| HTTPS + CDN | Freunde-Link ohne Zertifikat-Setup |
| SPA-Rewrites | `firebase.json` im Repo vorbereitet |
| `predeploy` | Export automatisch vor Deploy |

**Im Repo vorbereitet:**

- `firebase.json` — `public: "dist"`, `cleanUrls`, Rewrite `**` → `/index.html`
- `.firebaserc.example` — Projekt-ID-Vorlage

### B) Alternativen

| Anbieter | Public-Ordner | Hinweis |
|----------|---------------|---------|
| **Vercel** | `dist` | `vercel.json` mit SPA-Rewrites nötig |
| **Netlify** | `dist` | `_redirects` oder `netlify.toml` |
| **GitHub Pages** | `dist` | Subpath-Config für expo-router ggf. knifflig |

Für MVP: **Firebase Hosting** — wenigste Moving Parts.

---

## Firebase Hosting — Setup & Deploy

### Einmalig

```bash
cd "Sauf Viel-Oh"
npm install -g firebase-tools
firebase login
```

**Projekt verknüpfen** (eine Option):

```bash
# Option 1: Beispiel kopieren und Projekt-ID eintragen (gleich wie EXPO_PUBLIC_FIREBASE_PROJECT_ID)
copy .firebaserc.example .firebaserc
# .firebaserc bearbeiten: YOUR_FIREBASE_PROJECT_ID ersetzen

# Option 2: Interaktiv (firebase.json bereits vorhanden — nur Hosting wählen)
firebase init hosting
# Public directory: dist
# Single-page app: Yes
# GitHub deploys: optional Nein
```

> Wenn `firebase init hosting` fragt: **Public directory = `dist`**, **SPA = Ja**. Bestehende `firebase.json` kann überschrieben werden — Backup aus Git wiederherstellen falls nötig.

### Deploy (öffentlicher Link)

```bash
cd "Sauf Viel-Oh"
# .env mit allen EXPO_PUBLIC_* muss existieren
npm run deploy:hosting
# = firebase deploy --only hosting
# (predeploy in firebase.json führt automatisch expo export aus)
```

Oder manuell:

```bash
npm run export:web
firebase deploy --only hosting
```

Nach Deploy: URL in Firebase Console → **Hosting**, z. B.  
`https://YOUR_PROJECT_ID.web.app` oder Custom Domain.

**Diesen Link** an iPhone-Spieler senden.

### Firestore + Hosting

- Web-App und APK müssen auf **dieselbe** `EXPO_PUBLIC_FIREBASE_*`-Config zeigen.
- Firestore Rules in Firebase Console für MVP-Tests prüfen ([MVP_RELEASE_CHECKLIST.md](MVP_RELEASE_CHECKLIST.md)).

---

## iPhone Safari — Testcheckliste

Vollständige Release-Liste: [MVP_RELEASE_CHECKLIST.md](MVP_RELEASE_CHECKLIST.md#iphone-safari--web-mvp-detailliert).

Kurz:

1. Öffentlichen Web-Link (oder LAN-URL) in Safari öffnen
2. Spielername → Lobby-Code
3. Android APK + iPhone Web in **derselben** Lobby
4. Late Join, Würfeln, Monster, Saufstapel, Magie, Falle, Turn-Sync
5. Layout: keine kaputte horizontale Scrollbar, Modals vollständig, Buttons ≥ 44 px

---

## Cross-Platform Smoke

| Schritt | Android | iPhone |
|---------|---------|--------|
| 1 | APK installieren | Safari → Hosting-URL |
| 2 | Name eingeben | Name eingeben |
| 3 | Lobby erstellen | Code eingeben → Join |
| 4 | Ready + Start | Sync → `/game` |
| 5 | Volle Runde + optional Late Join | Gleiche Checks |

---

## Verwandte Docs

- [BUILD_ANDROID.md](BUILD_ANDROID.md) — APK
- [BUILD_IOS.md](BUILD_IOS.md) — TestFlight (optional, nicht erster MVP)
- [MVP_RELEASE_CHECKLIST.md](MVP_RELEASE_CHECKLIST.md)
- [FIREBASE_SCHEMA.md](FIREBASE_SCHEMA.md)
- [security.md](security.md)
- [PRIVATE_WEB_TESTING.md](PRIVATE_WEB_TESTING.md) — Testcode, Noindex, Grenzen
