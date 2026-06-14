# Privater Web-Testzugang (MVP)

*Stand: 2026-06-13 — kein echter Auth-Ersatz, nur MVP-Schutz*

---

## Ziel

Die öffentlich gehostete Web-App (Firebase Hosting) ist per URL erreichbar, aber **nicht direkt nutzbar**. Nur Freunde mit **Test-Zugangscode** kommen zur Lobby. Schutz gegen Bots, Scanner und zufällige Besucher — **nicht** Enterprise-Security.

---

## Wie es funktioniert

| Schicht | Verhalten |
|---------|-----------|
| **Access Gate** | Screen vor der App (`TestAccessGate` in `app/_layout.js`) |
| **Code** | `EXPO_PUBLIC_TEST_ACCESS_CODE` in `.env` / EAS / Hosting-Build |
| **Speicher** | `wodkao:hasTestAccess=true` in AsyncStorage (Web: localStorage) |
| **Plattform** | Standard: **nur Web** — Android-APK bleibt offen |
| **Noindex** | `public/robots.txt` + `app.json` → `meta.robots: noindex, nofollow` |

Nach korrektem Code: Nutzer sieht normale App (Home, Lobby, Game). Reload behält Zugang.

---

## ENV-Variablen

| Variable | Pflicht | Werte | Beschreibung |
|----------|---------|-------|--------------|
| `EXPO_PUBLIC_TEST_ACCESS_CODE` | Web-Prod ja | Beliebiger String | Zugangscode für Tester |
| `EXPO_PUBLIC_TEST_ACCESS_PLATFORMS` | Nein | `web` (default), `all`, `none` | Wo Gate aktiv ist |

### Verhalten ohne gesetzten Code

| Modus | Verhalten |
|-------|-----------|
| **Development** (`__DEV__`) | Gate **aus** — lokales Arbeiten ohne Code |
| **Production / Web-Export** | Gate **an**, Eingabe **blockiert** mit Hinweis „nicht konfiguriert“ |

---

## Code setzen

### Lokal (Dev)

`.env` anlegen (Vorlage: `.env.example`):

```env
EXPO_PUBLIC_TEST_ACCESS_CODE=mein-geheimer-testcode
```

Dev ohne Code: Gate aus. Mit Code + Web: Gate testen via `npx expo start --web`.

### Web-Deploy (Firebase Hosting)

`.env` muss beim Export existieren:

```bash
cd "Sauf Viel-Oh"
# .env mit EXPO_PUBLIC_TEST_ACCESS_CODE + allen Firebase/Sheets-Variablen
npm run deploy:hosting
```

`firebase.json` → `predeploy` führt `npx expo export --platform web` aus — ENV wird in den JS-Bundle eingebettet.

**Code an Freunde:** Zugangscode separat teilen (Messenger), nicht in der URL.

### EAS (optional)

Falls Gate auch in Preview-Builds: `EXPO_PUBLIC_TEST_ACCESS_CODE` in EAS Environment `preview` setzen und `EXPO_PUBLIC_TEST_ACCESS_PLATFORMS=all` nur wenn gewünscht.

---

## Dateien

| Datei | Rolle |
|-------|------|
| `src/utils/testAccessCore.js` | Gate-Logik (testbar, pure) |
| `src/utils/testAccessStorage.js` | AsyncStorage `hasTestAccess` |
| `src/hooks/useTestAccess.js` | Hook für `_layout.js` |
| `src/components/TestAccessGate.js` | UI: Code-Feld, Disclaimer, Betreten |
| `app/_layout.js` | Gate vor `<Stack />` |
| `app/+html.tsx` | Global `<meta name="robots" content="noindex, nofollow">` |
| `public/robots.txt` | `Disallow: /` |
| `app.json` → `web.meta.robots` | Zusätzliche Expo-Web-Konfiguration |

Tests: `npm run test:test-access`

---

## Noindex

- **`app/+html.tsx`:** `<meta name="robots" content="noindex, nofollow">` im statischen HTML-Export
- **`public/robots.txt`:** `User-agent: *` / `Disallow: /`

**Hinweis:** Noindex ist **kein Zugriffsschutz** — nur Hinweis für Suchmaschinen. Der echte MVP-Schutz ist der **Zugangscode-Gate**.

---

## Grenzen (wichtig)

| Limit | Erklärung |
|-------|-----------|
| **Kein echter Auth** | `EXPO_PUBLIC_*` ist im Client-Bundle sichtbar — technisch versierter Nutzer kann Code aus JS lesen |
| **Nur UI-Schutz** | Firestore bleibt separat absichern ([security.md](security.md), Rules in Console) |
| **Kein Rate-Limit** | Brute-Force am Gate nicht serverseitig begrenzt |
| **Shared Code** | Ein Code für alle Tester — kein per-User-Login |
| **APK** | Standard: ohne Gate (`EXPO_PUBLIC_TEST_ACCESS_PLATFORMS=web`) |

Für MVP-Freundetest **ausreichend**. Für öffentlichen Release: Firebase Auth oder serverseitiges Gate.

---

## Manueller Test-Checkliste

1. Web **ohne** gespeicherten Zugang → Gate sichtbar
2. Falscher Code → Fehlermeldung, App bleibt gesperrt
3. Richtiger Code → Home/Lobby erreichbar
4. Reload → weiterhin eingeloggt (`hasTestAccess`)
5. „Zugang zurücksetzen“ (Dev) → Gate wieder sichtbar
6. Lobby Join nach Gate → funktioniert wie zuvor
7. Android APK (ohne `platforms=all`) → **kein** Gate

---

## Verwandte Docs

- [BUILD_WEB.md](BUILD_WEB.md) — Export & Hosting
- [MVP_RELEASE_CHECKLIST.md](MVP_RELEASE_CHECKLIST.md)
- [security.md](security.md) — Firestore, keine Admin-Secrets im Frontend
