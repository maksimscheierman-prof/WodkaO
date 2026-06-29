# Commentator Backend (Firebase Callable)

*Stand: 2026-06-19 · Phase 2 — Client Callable*

Der AI-Kommentator trägt **keinen OpenAI-API-Key** mehr im Expo-/EAS-Client für **Text-Kommentare**. Die App ruft `httpsCallable("generateCommentatorComment")` auf; der Key liegt nur im **Firebase Secret Manager**.

**Voice/TTS** (Phase 3): optional weiterhin clientseitig via `EXPO_PUBLIC_OPENAI_API_KEY` / ElevenLabs — siehe `.env.example`.
---

## Warum nicht mehr im Client?

| Problem (bisher) | Lösung (Ziel) |
|------------------|---------------|
| `EXPO_PUBLIC_COMMENTATOR_AI_API_KEY` im Web/APK-Bundle sichtbar | Secret nur in Cloud Functions |
| Jeder Client kann OpenAI direkt ansprechen | Nur serverseitiger Request |
| Keys in EAS Environment für Preview-Builds | Secret einmal in Firebase setzen |

**Phase 2 (implementiert):** Client nutzt Firebase Callable — keine `EXPO_PUBLIC_COMMENTATOR_AI_API_KEY` / `EXPO_PUBLIC_COMMENTATOR_AI_URL` mehr für Text-KI.

---

## Architektur

```
App (useCommentator → throttle/queue → resolveCommentary)
  → commentatorCallableService (httpsCallable, keine API-Key)
                        ↓
              Cloud Function (europe-west3)
                        ↓
              OPENAI_API_KEY (Secret Manager)
                        ↓
              OpenAI Chat Completions (gpt-4o-mini)
                        ↓
              { ok: true, comment: "…" }
```

**Function-Name:** `generateCommentatorComment`  
**Region:** `europe-west3`  
**Secret:** `OPENAI_API_KEY`

---

## Voraussetzungen

1. **Firebase Blaze Plan** (Pay-as-you-go) — erforderlich für:
   - Callable Functions mit externem HTTPS (OpenAI)
   - Secret Manager
   - Optional: Scheduled Functions (Lobby-Cleanup)

2. **Firebase CLI** installiert und eingeloggt:

   ```bash
   npm install -g firebase-tools
   firebase login
   ```

3. Projekt verknüpft (lokal `.firebaserc`, nicht committen — siehe `.firebaserc.example`):

   ```bash
   firebase use <PROJECT_ID>
   ```

---

## Secret setzen

**Niemals** den Key in Git, `.env` oder `EXPO_PUBLIC_*` committen.

```bash
firebase functions:secrets:set OPENAI_API_KEY
```

CLI fragt interaktiv nach dem Wert. Alternativ aus stdin (nur lokal, nicht loggen):

```bash
# PowerShell — Key nicht in Shell-History speichern
$env:OPENAI_API_KEY = "sk-..."   # nur lokal setzen, nicht committen
# Besser: interaktive Eingabe über firebase functions:secrets:set
```

Nach dem Setzen beim Deploy bindet die Function das Secret automatisch (`defineSecret`).

---

## EAS / Client Env (Phase 2)

| Variable | Client nötig? | Hinweis |
|----------|---------------|---------|
| `EXPO_PUBLIC_FIREBASE_*` | **Ja** | Öffentliche Firebase-Config — okay im Bundle |
| `EXPO_PUBLIC_COMMENTATOR_AI_API_KEY` | **Nein** | Entfernen aus EAS Secrets (Text-KI) |
| `EXPO_PUBLIC_COMMENTATOR_AI_URL` | **Nein** | Entfernen aus EAS Secrets |
| `EXPO_PUBLIC_COMMENTATOR_CALLABLE` | Optional | `0` = Callable deaktivieren, nur lokale Texte |
| `EXPO_PUBLIC_FUNCTIONS_EMULATOR` | Dev only | `1` = lokaler Functions-Emulator |
| `OPENAI_API_KEY` | **Nein (Client)** | Nur `firebase functions:secrets:set` |

Voice/TTS-Keys (`EXPO_PUBLIC_OPENAI_API_KEY`, `EXPO_PUBLIC_ELEVENLABS_*`) bleiben optional clientseitig bis Phase 3.

---

## Functions installieren & deployen

```bash
cd functions
npm install
cd ..

# Nur die Commentator-Function
firebase deploy --only functions:generateCommentatorComment
```

`firebase.json` enthält neben **Hosting** jetzt:

```json
"functions": { "source": "functions" }
```

Hosting-`predeploy` (`expo export`) bleibt unverändert.

---

## Logs prüfen

```bash
firebase functions:log --only generateCommentatorComment
```

Die Function loggt **keine** API-Keys, Roh-Prompts oder vollständigen Client-Payloads — nur Fehlercodes und `eventType`.

---

## Anti-Spam & Rate Limits

### Client (implementiert)

| Mechanismus | Wert |
|-------------|------|
| Globaler Mindestabstand | **2000 ms** zwischen Ausgaben |
| Event-Dedupe | gleicher Event-Key **5000 ms** |
| Queue max | **3** Einträge |
| Voice busy | LOW/MEDIUM werden nicht gestartet; HIGH darf unterbrechen |

Prioritäten: `src/features/commentator/commentatorThrottleCore.js`  
Queue-Verarbeitung: `useCommentator.js` — **AI/Callable erst beim Dequeue**, nicht beim Event-Detect.

### Server (best-effort pro Function-Instanz)

| Limit | Wert |
|-------|------|
| Min. Abstand pro `lobbyId` | **2000 ms** |
| Max. Calls pro 10 s Fenster | **8** |

Überschreitung → `HttpsError("resource-exhausted", …)`.

**TODO (Produktion):** Verteiltes Rate-Limit (Firestore/Redis/Memorystore), da In-Memory pro Cold-Start-Instanz nicht global gilt.

---

## Callable Request (Vorschau Phase 2)

**Input** (JSON):

| Feld | Typ | Pflicht | Beschreibung |
|------|-----|---------|--------------|
| `eventType` | string | ja | Whitelist z. B. `VOTE_ACCEPTED`, `GAME_ENDED` |
| `style` | string | nein | `neutral` \| `locker` \| `chaotic` \| `anime` \| `tavern` |
| `lobbyId` | string | nein | max 32 Zeichen |
| `context` | object | nein | `playerName`, `targetName`, `cardName`, … |
| `sessionStats` | object | nein | kompakte Session-Statistik |
| `personalityForAi` | object | nein | begrenzte Nicknames/Gags |
| `dedupeContext` | object | nein | letzte Texte/Themen vermeiden |

**Response:**

```json
{ "ok": true, "comment": "Kurzer deutscher Kommentar." }
```

**Fehler (HttpsError):**

| Code | Bedeutung |
|------|-----------|
| `invalid-argument` | Ungültiger/fehlender `eventType`, Payload zu groß |
| `failed-precondition` | Secret `OPENAI_API_KEY` nicht gesetzt |
| `resource-exhausted` | Rate-Limit pro Lobby überschritten |
| `unavailable` | OpenAI nicht erreichbar oder keine sichere Antwort |

---

## Lokale Tests (ohne Deploy)

```bash
npm run test:commentator-ai-server
npm run test:commentator-throttle
npm run test:commentator-callable
```

Testet Validierung, Sanitize und Prompt-Bau in `functions/src/commentatorAiServerCore.js`.

Functions-Entry smoke test:

```bash
cd functions && npm run lint && cd ..
```

---

## Dateien

| Pfad | Rolle |
|------|--------|
| `firebaseConfig.js` | `getFunctions(app, europe-west3)` |
| `src/features/commentator/commentatorCallableService.js` | Client `httpsCallable` |
| `src/features/commentator/commentatorCallableCore.js` | Payload + Fehler-Mapping (testbar) |
| `src/features/commentator/commentatorAiService.js` | Callable + lokaler Fallback |
| `functions/index.js` | Export `generateCommentatorComment` |
| `functions/src/generateCommentatorComment.js` | Callable Handler |
| `functions/src/commentatorAiServerCore.js` | Validierung, Prompt, OpenAI, Sanitize |
| `scripts/test_commentator_ai_server.js` | Node-Tests (Server) |
| `scripts/test_commentator_callable.js` | Node-Tests (Client Callable) |
| `scripts/firebase-functions/cleanupOldLobbies.js` | Separates Snippet (Lobby-Cleanup) |

---

## Phase 3 (optional)

- Voice/TTS serverseitig (kein TTS-Key im Client)
- Verteiltes Rate-Limit (Firestore/Redis)

Siehe auch [KOMMENTATOR.md](KOMMENTATOR.md) und [security.md](security.md).
