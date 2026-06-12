# Android APK Build — WodkaO / Sauf Viel-Oh

*Stand: 2026-06-09 — Test-APK, kein Store-Release*

---

## Projektart & Startordner

| Eigenschaft | Wert |
|-------------|------|
| Framework | **Expo SDK ~54** + **React Native 0.81** |
| Routing | **expo-router** (`app/`) |
| Web | **react-native-web** (`npm run web`) |
| Native | Managed Workflow — **kein** `android/` im Repo (gitignored) |
| Backend | Firebase Firestore (Multiplayer-Sync) |

**Alle npm-/expo-Befehle aus diesem Ordner:**

```text
c:\Users\maksi\OneDrive\Desktop\ProjectApps\Games\Sauf Viel-Oh\jahw3-app
```

Kurz: **`jahw3-app/`** (nicht der übergeordnete `Sauf Viel-Oh`-Ordner).

---

## Ist-Zustand Build-Konfiguration

| Datei | Status |
|-------|--------|
| `package.json` | ✅ Scripts: `start`, `android`, `web`, `lint` |
| `app.json` | ✅ Expo-Config; Android adaptive Icon |
| `app.json` → `android.package` | ✅ `com.wodkao.app` |
| `eas.json` | ✅ Profile `preview` (APK), `production` (AAB) |
| `app/_layout.js` | Einstieg über expo-router |
| `.env` | Lokal (gitignored); Werte für EAS → siehe unten |

---

## EAS Environment Variables (`EXPO_PUBLIC_*`)

Beim **Cloud Build** wird `.env` **nicht** mit hochgeladen (gitignored). Alle Variablen müssen in EAS hinterlegt sein — sonst fehlen Firebase/Sheets in der APK.

### Variablen (Pflicht für Online-MVP)

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

Vollständige Liste: `.env.example`

### Option A — Expo Dashboard (empfohlen)

1. [expo.dev](https://expo.dev) → Projekt **jahw3-app** / WodkaO  
2. **Environment variables** → Environment **`preview`**  
3. Alle `EXPO_PUBLIC_*` aus lokaler `.env` eintragen (Plain text / sensitive nach Bedarf)

### Option B — EAS CLI (einmalig pro Variable)

```bash
cd jahw3-app
eas env:create --environment preview --name EXPO_PUBLIC_FIREBASE_API_KEY --value "DEIN_WERT" --visibility plaintext
eas env:create --environment preview --name EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN --value "DEIN_WERT" --visibility plaintext
eas env:create --environment preview --name EXPO_PUBLIC_FIREBASE_PROJECT_ID --value "DEIN_WERT" --visibility plaintext
eas env:create --environment preview --name EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET --value "DEIN_WERT" --visibility plaintext
eas env:create --environment preview --name EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID --value "DEIN_WERT" --visibility plaintext
eas env:create --environment preview --name EXPO_PUBLIC_FIREBASE_APP_ID --value "DEIN_WERT" --visibility plaintext
eas env:create --environment preview --name EXPO_PUBLIC_MEASUREMENT_ID --value "DEIN_WERT" --visibility plaintext
eas env:create --environment preview --name EXPO_PUBLIC_GOOGLE_SHEET_ID --value "DEIN_WERT" --visibility plaintext
eas env:create --environment preview --name EXPO_PUBLIC_GOOGLE_GID_MONSTER --value "DEIN_WERT" --visibility plaintext
eas env:create --environment preview --name EXPO_PUBLIC_GOOGLE_GID_TRAPS --value "DEIN_WERT" --visibility plaintext
eas env:create --environment preview --name EXPO_PUBLIC_GOOGLE_GID_MAGIC --value "DEIN_WERT" --visibility plaintext
```

Prüfen:

```bash
eas env:list --environment preview
```

### Option C — Bulk aus `.env` (lokal, nicht committen)

```bash
cd jahw3-app
eas env:push --environment preview --path .env
```

(Hinweis: Nur Variablen, die EAS unterstützt; `.env` muss lokal existieren.)

### Build-Profil

`eas.json` → Profil **`preview`** nutzt `"environment": "preview"` und `"buildType": "apk"`.

---

## Expo Go vs. Development Build vs. APK

| Variante | Wofür | Freunde testen? |
|----------|-------|-----------------|
| **Expo Go** | Schnelle Dev-Tests (`npm run android`) | ❌ Freunde bräuchten Expo Go + gleichen Dev-Server |
| **Development Build** | Native Module + Debugging | ⚠️ Möglich, aber umständlich zu verteilen |
| **APK (EAS)** | Installierbare Datei | ✅ **Empfohlen für MVP** |

**Empfohlener schnellster Weg:** **EAS Build** mit Profil `preview` und `buildType: "apk"`.

---

## Voraussetzungen

### Lokal (Entwicklung)

- Node.js LTS
- `npm install` in `jahw3-app/`
- `.env` (siehe `.env.example`)
- Optional: Android Studio + Emulator für `npm run android`

### APK (EAS Cloud Build)

- [Expo-Account](https://expo.dev/signup) (kostenlos)
- EAS CLI: `npm install -g eas-cli`
- `eas login`
- Firebase-/Sheets-Keys als EAS Environment Variables oder in `eas.json` env

### Umgebungsvariablen (Build einbetten)

Alle `EXPO_PUBLIC_*` aus `.env.example` müssen beim Build gesetzt sein — sonst startet die App ohne Firebase/Sheets.

**Online-Multiplayer in der APK:** Alle installierten APKs müssen auf **dieselbe Firebase-Projekt-Config** zeigen (`EXPO_PUBLIC_FIREBASE_*`). Dann können mehrere Geräte per **Lobby-Code** dieselbe Partie spielen. Ohne gültige Keys: Firestore-Test auf Home schlägt fehl, Lobby/Spiel nicht nutzbar.

Siehe auch [FIREBASE_SCHEMA.md](FIREBASE_SCHEMA.md).

---

## Schritte zur testbaren APK

### 1. Android Package Name ✅

`app.json` → `expo.android.package`: **`com.wodkao.app`**

### 2. `eas.json` ✅

Im Repo: Profile `development`, `preview` (APK), `production` (AAB).

### 3. EAS Login & Projekt

```bash
cd jahw3-app
npm install -g eas-cli
eas login
eas init   # falls noch kein Expo-Projekt verknüpft
```

### 4. Environment Variables setzen

Siehe Abschnitt **EAS Environment Variables** oben — alle `EXPO_PUBLIC_*` für Environment **`preview`**.

### 5. APK bauen

```bash
cd jahw3-app
eas build --platform android --profile preview
```

Nach Abschluss: Download-Link von expo.dev → APK auf Geräte kopieren → Installation aus unbekannten Quellen erlauben.

### 6. Alternativ: Lokaler Build (fortgeschritten)

```bash
eas build --platform android --profile preview --local
```

Benötigt Android SDK, JDK, mehr Setup — Cloud Build meist schneller zum ersten Erfolg.

---

## APK vs. AAB

| Format | Verwendung |
|--------|------------|
| **APK** | Direkt installieren, Freunde-Test, sideload |
| **AAB** | Google Play Store Upload |

MVP: **`buildType: "apk"`** im `preview`-Profil.

---

## Dev-Befehle (ohne APK)

```bash
cd jahw3-app
npm install
npm run web          # Browser
npm start            # Metro; dann a/w für Android/Web
npm run android      # Expo Go / Emulator
npm run lint
npx expo-doctor
```

---

## Bekannte Risiken / Blocker

| Risiko | Auswirkung | Mitigation |
|--------|------------|------------|
| Kein `eas.json` | ~~Kein Cloud-APK~~ | ✅ `eas.json` im Repo |
| Fehlendes `android.package` | ~~Build-Fehler~~ | ✅ `com.wodkao.app` |
| Fehlende `EXPO_PUBLIC_*` im Build | App ohne Firebase/Karten | EAS Secrets setzen |
| Firestore Rules zu restriktiv | Lobby/Spiel sync fehlt | Firebase Console prüfen |
| Google Sheets / Internet nötig | Keine Karten offline | MVP: WLAN/Mobile Data voraussetzen |
| Große Remote-Bilder | Langsamer erster Load | Akzeptabel für MVP |
| Expo SDK 54 Paket-Drift | `expo-doctor` Warnings | Vor Build prüfen |
| `newArchEnabled: true` | Selten Build-Issues | Bei Fehler temporär deaktivieren testen |

---

## Smoke Test nach APK-Install

1. App öffnet sich (Splash → Home)
2. Firestore-Status auf Home grün / verbunden
3. Spielername → Lobby erstellen
4. Zweites Gerät: gleicher Lobby-Code (oder Browser zum Vergleich)
5. Ready → Start → Würfeln → Monster → Saufstapel-Zug
6. App 10 Min im Hintergrund → zurück → State ok

---

## Verwandte Docs

- [MVP_ROADMAP.md](MVP_ROADMAP.md) — Phasen & Checkliste
- [release-workflow.md](release-workflow.md) — späterer Store-Release
- [security.md](security.md) — `EXPO_PUBLIC_*` sind im Client sichtbar
