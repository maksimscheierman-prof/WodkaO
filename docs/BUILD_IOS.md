# iOS Teststrategie — WodkaO / Sauf Viel-Oh

*Stand: 2026-06-09 — MVP-Test auf iPhone, kein App-Store-Release*

---

## Grundsatz

| Plattform | Installierbare App | MVP-Testweg |
|-----------|-------------------|-------------|
| **Android** | **APK** (EAS `preview`) | Sideload — siehe [BUILD_ANDROID.md](BUILD_ANDROID.md) |
| **iPhone** | **Kein APK** | **Öffentliche Web-URL** in Safari — [BUILD_WEB.md](BUILD_WEB.md) |

**Kurz:**

- **APK = nur Android.** iPhone-Nutzer können keine APK installieren.
- **iPhone braucht einen iOS-Build** — erstellt über **EAS Build** (`--platform ios`).
- **Testen auf iPhone** läuft über **TestFlight** (empfohlen für Freunde) oder **interne iOS-Distribution** (Ad Hoc / Internal).
- **Web-Version** ist der **iPhone-MVP** — öffentlicher Link via Firebase Hosting ([BUILD_WEB.md](BUILD_WEB.md)).
- TestFlight / iOS-Build: **optional**, nicht erster MVP.

Alle Befehle vom Projektroot **`Sauf Viel-Oh/`**.

---

## Testwege im Vergleich

### A) Web / Safari (MVP — empfohlen)

Siehe **[BUILD_WEB.md](BUILD_WEB.md)** — öffentlicher Firebase-Hosting-Link, kein Apple-Account.

| Aspekt | Details |
|--------|---------|
| **Geschwindigkeit** | Export + Deploy — kein Apple-Account |
| **Installation** | Safari-Browser, kein App Store |
| **Multiplayer** | Gleicher Lobby-Code + Firestore wie Android-APK |
| **Ideal für** | **Alle iPhone-Freunde im ersten MVP** |
| **Nachteil** | Keine native App; Safari-UI/Clipboard-Einschränkungen |

**LAN-Dev (ohne Deploy):**

```bash
cd "Sauf Viel-Oh"
npm run web
```

iPhone im WLAN: `http://<PC-IP>:8081`

---

### B) TestFlight (empfohlen für Freunde mit iPhone)

| Aspekt | Details |
|--------|---------|
| **Zielgruppe** | Freunde mit iPhone — installierbare Test-App |
| **Apple Developer Account** | **Pflicht** (99 USD/Jahr) |
| **App Store Connect** | App anlegen, Bundle ID `com.wodkao.app` |
| **Build** | `eas build --platform ios --profile preview` (oder `production`) |
| **Upload** | `eas submit --platform ios` → App Store Connect |
| **Tester** | Interne Tester (sofort) oder externe Tester (Beta Review beim ersten Mal) |
| **Erster externer Build** | Apple **Beta App Review** (meist 24–48 h) |
| **Vorteil** | Bis 10.000 externe Tester, keine UDID-Liste pro Gerät |

**Ablauf (Kurz):**

1. Apple Developer Program + App Store Connect App
2. EAS Env `preview` — alle `EXPO_PUBLIC_*` (wie Android)
3. `eas build --platform ios --profile preview`
4. `eas submit --platform ios` (oder manuell in Transporter)
5. TestFlight → Tester einladen → App installieren

---

### C) Internal / Ad Hoc iOS Build

| Aspekt | Details |
|--------|---------|
| **Zielgruppe** | Kleines technisches Team (1–5 Geräte) |
| **Apple Developer Account** | **Pflicht** |
| **Geräteregistrierung** | **UDID** jedes iPhones in Developer Portal |
| **Limit** | Begrenzt (Apple-Gerätelimit pro Jahr) |
| **Distribution** | `eas.json` → `distribution: "internal"` (Profil `preview`) |
| **Installation** | Download-Link von expo.dev oder Apple Configurator |
| **Nachteil** | Pro neues iPhone UDID nachtragen; unpraktisch für große Freundesgruppe |

**Eher für:** Ersten iOS-Build-Verifikation vor TestFlight — nicht Hauptweg für MVP-Freunde-Tests.

---

## Vergleichstabelle (Übersicht)

| Kriterium | A) Web Safari | B) TestFlight | C) Internal/Ad Hoc |
|-----------|---------------|---------------|---------------------|
| Apple Developer nötig | ❌ | ✅ | ✅ |
| Echte App-Installation | ❌ | ✅ | ✅ |
| Freunde ohne Setup | ✅ (Link) | ✅ (nach Einladung) | ⚠️ UDID |
| Gleicher Firebase-MVP | ✅ | ✅ | ✅ |
| MVP-Empfehlung | **Jetzt** | **Nach Apple-Setup** | Nur Tech-Check |
| Build-Zeit | 0 (lokal) | EAS + Review | EAS |

**MVP-Empfehlung:** **A) Web/Hosting** für alle iPhone-Freunde; **B) TestFlight** nur bei Bedarf nach Apple-Setup.

---

## Expo/EAS iOS Setup — Ist-Stand

### `app.json`

| Feld | Status | Wert / Anmerkung |
|------|--------|------------------|
| `expo.name` | ⚠️ Technisch | `jahw3-app` — App Store Connect kann Anzeigenamen „WodkaO“ setzen |
| `expo.slug` | ✅ | `jahw3-app` |
| `expo.icon` | ✅ | `./assets/images/icon.png` |
| `expo.ios.bundleIdentifier` | ✅ | **`com.wodkao.app`** (neu, analog Android) |
| `expo.ios.supportsTablet` | ✅ | `true` |
| Splash | ✅ | `expo-splash-screen` Plugin, `splash-icon.png` |
| Android-only Icons | — | Adaptive Icons nur Android; iOS nutzt `icon.png` |

**TODO (optional, nicht MVP-blockierend):**

- Anzeigename in App Store Connect / `expo.name` auf „WodkaO“ angleichen
- Dediziertes iOS-Icon-Set prüfen (1024×1024 aus `icon.png` ausreichend für EAS)

### Firebase & Google Sheets (iOS)

| Thema | Status |
|-------|--------|
| Firebase JS SDK | ✅ `firebaseConfig.js` — `EXPO_PUBLIC_*` |
| `GoogleService-Info.plist` | ❌ **Nicht nötig** — Web-SDK, kein natives Firebase-Plugin |
| Google Sheets Kartendaten | ✅ Gleiche `EXPO_PUBLIC_GOOGLE_*` wie Android |
| EAS Environment `preview` | ⚠️ Manuell setzen — siehe [BUILD_ANDROID.md](BUILD_ANDROID.md#eas-environment-variables-expo_public_) |

**Wichtig:** iOS-Build braucht **dieselben** `EXPO_PUBLIC_*` in EAS wie Android — sonst keine Lobby/Karten in der IPA.

### `.easignore`

Gilt auch für iOS-Builds — Upload-Optimierung siehe [BUILD_ANDROID.md](BUILD_ANDROID.md#eas-upload-größe--easignore).

---

## `eas.json` — iOS-Profile

| Profil | iOS-Verhalten | MVP-Nutzung |
|--------|---------------|-------------|
| **`preview`** | `distribution: internal`, `ios.simulator: false` → **Geräte-Build** | **Empfohlen** für TestFlight / Internal |
| **`development`** | `developmentClient: true`, internal | Dev Client, Debugging — nicht Freunde-MVP |
| **`production`** | Standard Store-Build, `environment: production` | TestFlight Store-Track oder späterer Release |

Android-spezifisch im `preview`-Profil: `buildType: "apk"` — betrifft iOS nicht.

`submit.production` — für Upload nach App Store Connect (TestFlight-Produktions-Track).

**Keine weiteren riskanten Profile-Änderungen** — `preview` reicht für MVP-iOS-Tests.

---

## Befehle (EAS iOS)

### Voraussetzungen

```bash
npm install -g eas-cli   # oder: npx eas-cli
cd "Sauf Viel-Oh"
npm install
npx eas-cli login
eas env:list --environment preview   # alle EXPO_PUBLIC_* prüfen
```

### iOS Build (Internal / TestFlight-Vorbereitung)

```bash
cd "Sauf Viel-Oh"
npx eas-cli build --platform ios --profile preview
```

EAS fragt beim **ersten iOS-Build** nach **Apple-Credentials**:

- **Empfohlen:** „Let EAS handle credentials“ — EAS erstellt/verwaltet Zertifikate & Provisioning
- **Apple-ID:** Developer-Account-E-Mail + App-spezifisches Passwort (2FA)
- **Bundle Identifier:** `com.wodkao.app` (aus `app.json`)

Build-Status: [expo.dev](https://expo.dev) → Projekt → Builds.

### Upload zu App Store Connect (TestFlight)

```bash
npx eas-cli submit --platform ios
```

Oder beim Build: `--auto-submit` (optional).

**Manuell:** `.ipa` von expo.dev laden → **Transporter** (macOS) → App Store Connect.

### TestFlight einrichten (App Store Connect)

1. **Apps** → Neue App → Bundle ID `com.wodkao.app`
2. Build erscheint nach `submit` unter **TestFlight**
3. **Interne Tester** (Team) — sofort verfügbar
4. **Externe Tester** — erste Version braucht **Beta App Review**
5. Tester per E-Mail einladen → TestFlight-App auf iPhone → Installieren

### Development Build (nur Entwicklung)

```bash
npx eas-cli build --platform ios --profile development
```

Erfordert Expo Dev Client — **nicht** für Freunde-MVP.

---

## Web-Fallback — iPhone Smoke Test

1. **PC:** `npm run web` — IP notieren
2. **iPhone Safari:** `http://<IP>:8081` öffnen
3. Spielername → Lobby erstellen / beitreten
4. **Android/APK oder zweiter Browser** als zweiter Spieler
5. Prüfen: Firestore grün, Lobby-Sync, Late Join, Zugwechsel

**Bekannte Web+iOS-Themen:**

- Safe Area / Viewport — bereits in `responsive.js` / `gameStyles` berücksichtigt
- Clipboard auf iOS Web — `LobbyCodeBadge` nutzt `expo-clipboard` (Native besser als Web)

---

## MVP Release — iPhone-Checks

Siehe [MVP_RELEASE_CHECKLIST.md](MVP_RELEASE_CHECKLIST.md#iphone--cross-platform-mvp).

| Check | Priorität |
|-------|-----------|
| Web-Fallback iPhone Safari | 🔴 MVP |
| Lobby Join iPhone ↔ Android | 🔴 MVP |
| Firebase Sync cross-platform | 🔴 MVP |
| `ios.bundleIdentifier` gesetzt | ✅ |
| EAS iOS Build erfolgreich | ⚠️ Nach Apple-Setup |
| TestFlight für Freunde | 🟡 Optional |

---

## Bekannte Risiken / fehlende Voraussetzungen

| Item | Status |
|------|--------|
| Apple Developer Program | ❌ Nicht dokumentiert als vorhanden |
| App Store Connect App | ❌ Anzulegen |
| Erster `eas build --platform ios` | ❌ |
| TestFlight-Tester | ❌ |
| `expo.name` vs. Markenname „WodkaO“ | ⚠️ Kosmetisch |

---

## Verwandte Docs

- [BUILD_ANDROID.md](BUILD_ANDROID.md) — APK, EAS Env, `.easignore`
- [MVP_ROADMAP.md](MVP_ROADMAP.md) — Gesamt-MVP
- [MVP_RELEASE_CHECKLIST.md](MVP_RELEASE_CHECKLIST.md) — Release-Checks
- [FIREBASE_SCHEMA.md](FIREBASE_SCHEMA.md) — Online-Sync
- [testing.md](testing.md) — QA
