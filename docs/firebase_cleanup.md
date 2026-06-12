# Firebase Lobby Cleanup — WodkaO / Sauf Viel-Oh

*Stand: 2026-06-09*

Lobbys in `lobbies/{code}` laufen nach **2 Stunden ohne Aktivität** ab. Die App blockiert Join und setzt `status: "expired"`. Serverseitiger Cleanup und einmaliges Admin-Löschen sind optional, aber empfohlen.

---

## Datenmodell (Ist nach App-Update)

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `createdAt` | `serverTimestamp` | Erstellung (neue Lobbys) |
| `lastActivityAt` | `serverTimestamp` | Letzte Spiel-/Lobby-Aktion |
| `updatedAt` | `Timestamp` \| number | Optionaler Fallback (Admin-Script) |
| `expiredAt` | `serverTimestamp` | Optional, beim Ablauf gesetzt |
| `status` | string | `waiting` \| `playing` \| `finished` \| `expired` |

**Legacy:** Alte Lobbys haben ggf. nur `createdAt` als Client-`number`. Ablauf nutzt dann `createdAt` als Fallback (`lobbyLifecycleCore.js`).

**Aktivität wird aktualisiert bei:** Lobby erstellen, joinen, starten, verlassen, würfeln, Karte ziehen, Zug beenden (Ablage / Fallen-Zug).

---

## App-Verhalten (implementiert)

| Situation | Verhalten |
|-----------|-----------|
| Join abgelaufene Lobby | Fehlermeldung: *„Diese Lobby ist abgelaufen. Bitte erstelle eine neue Lobby.“* |
| Snapshot in Wartelobby | Redirect zu `/game` nur wenn nicht abgelaufen |
| Spiel läuft, Lobby abgelaufen | Redirect zu `/lobby` mit Meldung |
| `status: "expired"` | Nicht joinbar |

Code: `src/utils/lobbyLifecycle.js`, `app/lobby.js`, `app/game.js`, `src/utils/gameActions.js`

---

## Cloud Functions — noch nicht im Repo

Im Projekt gibt es **kein** `firebase/` Functions-Setup. Vorbereitetes Snippet:

```text
scripts/firebase-functions/cleanupOldLobbies.js
```

### Einrichtung (einmalig)

1. **Firebase CLI installieren** (global):

   ```bash
   npm install -g firebase-tools
   firebase login
   ```

2. **Im Firebase-Projekt** (Console) → Projekt-ID notieren (`EXPO_PUBLIC_FIREBASE_PROJECT_ID`).

3. **Functions initialisieren** (neuer Ordner neben oder oberhalb von `jahw3-app` — nicht ins Expo-Bundle):

   ```bash
   mkdir wodkao-firebase
   cd wodkao-firebase
   firebase init functions
   ```

   - JavaScript oder TypeScript
   - ESLint optional
   - **Blaze Plan** (Pay-as-you-go) für Scheduled Functions nötig

4. **Snippet kopieren** nach `functions/index.js` (oder importieren):

   ```javascript
   const { expireStaleLobbies } = require("./cleanupOldLobbies");
   exports.expireStaleLobbies = expireStaleLobbies;
   ```

   Oder Inhalt von `scripts/firebase-functions/cleanupOldLobbies.js` direkt in `functions/index.js` einfügen.

5. **Firestore Index** (falls Query-Fehler in Logs):

   Composite Index für Collection `lobbies`:
   - `status` (Ascending)
   - `lastActivityAt` (Ascending)

   Firebase Console → Firestore → Indexes → Link aus Fehlermeldung folgen.

6. **Deploy:**

   ```bash
   firebase deploy --only functions:expireStaleLobbies
   ```

### Scheduled Function — Verhalten

- **Intervall:** alle 60 Minuten (`Europe/Berlin`)
- **Bedingung:** `status in ["waiting","playing"]` AND `lastActivityAt < now - 2h`
- **Aktion:** `status → "expired"`, `expiredAt → serverTimestamp()`
- **Kein Hard-Delete** (Daten bleiben für Debug; Admin-Script kann löschen)

Für 30-Minuten-Intervall: `schedule: "every 30 minutes"` im Snippet ändern.

---

## Einmaliges Admin-Cleanup (bestehende alte Lobbys)

Collection: **`lobbies/{lobbyCode}`** (5-stelliger Code = Document-ID).

**Zeitfeld-Priorität** (identisch in App und Script):

1. `lastActivityAt` (bevorzugt)
2. `updatedAt` (Fallback)
3. `createdAt` (Legacy-Fallback)

### Setup

1. Service Account: Firebase Console → Project Settings → Service accounts → **Generate new private key**
2. JSON **lokal** speichern (z. B. `C:\secrets\wodkao-admin.json`) — **nie committen**
3. In `jahw3-app`:

   ```bash
   npm install
   npm install firebase-admin --save-dev
   ```

4. Credentials setzen (eine Option):

   ```powershell
   # Option A: Service-Account-Datei (außerhalb des Repos)
   $env:GOOGLE_APPLICATION_CREDENTIALS = "C:\secrets\wodkao-admin.json"

   # Option B: gcloud Application Default Credentials
   gcloud auth application-default login
   ```

### Script: `scripts/cleanup_old_lobbies.js`

| Flag | Wirkung |
|------|---------|
| *(keins)* | **Dry-run** — nur anzeigen, nichts ändern |
| `--expire` | `status → expired`, `expiredAt → serverTimestamp()` |
| `--delete` | Dokumente endgültig löschen |
| `--hours=2` | Schwellwert in Stunden (Default: 2) |
| `--collection=lobbies` | Collection-Name (Default: `lobbies`) |
| `--limit=500` | Max. Anzahl stale Docs verarbeiten |

**Sicherheit:** Ohne `--delete` oder `--expire` werden **keine** Daten geändert. `--delete` und `--expire` dürfen nicht kombiniert werden.

Vor der Ausführung gibt das Script aus: Collection, Cutoff-Zeit, Modus, Anzahl gefundener Lobbys.

### Beispiele

```bash
cd jahw3-app

# Dry-run (Standard) — IDs + Zeitfelder anzeigen
node scripts/cleanup_old_lobbies.js --hours=2
npm run cleanup:lobbies -- --hours=2

# Auf expired setzen (Batch, max 500)
node scripts/cleanup_old_lobbies.js --hours=2 --expire --limit=500

# Hard-delete
node scripts/cleanup_old_lobbies.js --hours=2 --delete
npm run cleanup:lobbies -- --hours=2 --delete
```

Dry-run-Ausgabe pro Lobby:

```text
  ABC12  status=waiting  lastActivityAt=2026-06-09T10:00:00.000Z  updatedAt=(none)  createdAt=2026-06-09T08:00:00.000Z  effective=lastActivityAt (~3.5h ago)
```

### Option B — Firebase Console (manuell)

1. Firestore → Collection `lobbies`
2. Sortieren/filtern nach `createdAt` oder `lastActivityAt`
3. Alte Dokumente manuell löschen oder `status` auf `expired` setzen

Nur für wenige Dutzend Einträge praktikabel.

### Option C — Firestore CLI / REST

Für Bulk ohne Admin SDK: Export → Script — für MVP meist Option A.

---

## Firestore Security Rules

Beispiel: `firestore.rules.example` (nicht automatisch deployed).

| Regel | Begründung |
|-------|------------|
| Clients dürfen **lesen/schreiben** im MVP oft offen | Bestehender Test-Stand |
| Clients dürfen `status: "expired"` setzen | App markiert stale Lobbys beim Join |
| Clients dürfen **nicht löschen** | Hard-Delete nur Admin / Cloud Function |
| `lastActivityAt` nur mit gültigem Lobby-Kontext | Vollständige Erzwingung ohne Auth schwer |

Production: Firebase Auth + Custom Claims oder Cloud Function als einziger Writer für sensible Felder.

---

## Tests lokal

```bash
cd jahw3-app
node scripts/test_lobby_lifecycle.js
npm run lint
```

Manuell (2 Browser):

1. Lobby erstellen → Join mit Code → OK
2. In Firestore `lastActivityAt` auf >2h zurücksetzen (oder warten) → Join zeigt Ablauf-Meldung
3. Würfeln / Ziehen → `lastActivityAt` in Console aktualisiert sich

---

## Verwandte Dateien

| Datei | Rolle |
|-------|--------|
| `src/utils/lobbyLifecycleCore.js` | Pure Expiry-Logik |
| `src/utils/lobbyLifecycle.js` | Firestore + Activity |
| `scripts/cleanup_old_lobbies.js` | Admin Einmal-Cleanup |
| `scripts/firebase-functions/cleanupOldLobbies.js` | Scheduled Function Snippet |
| `firestore.rules.example` | Rules-Vorschlag |
| [FIREBASE_SCHEMA.md](FIREBASE_SCHEMA.md) | Gesamtschema |

---

## Offene Setup-Schritte

- [ ] Blaze Plan aktivieren (für Scheduled Functions)
- [ ] `firebase init functions` + Deploy `expireStaleLobbies`
- [ ] Composite Index für `status` + `lastActivityAt`
- [ ] Einmalig `npm run cleanup:lobbies -- --hours=2` (dry-run), dann `--expire` oder `--delete` für Legacy-Lobbys
- [ ] Firestore Rules in Console an `firestore.rules.example` anlehnen
