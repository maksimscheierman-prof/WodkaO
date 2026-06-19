# AI-Kommentator / Spielmoderator

## Ziel

Das Spiel soll langfristig einen optionalen Moderator erhalten, der als Schiedsrichter, Kommentator und humorvoller Spielleiter agiert.

Der Kommentator soll:

* Spielereignisse kommentieren
* Abstimmungen begleiten
* Karteneffekte erklären
* Spieler neckisch erwähnen
* Session-Statistiken aufgreifen
* optional per AI-API dynamische Texte generieren (Standard: **deaktiviert**)
* optional per Sprachausgabe sprechen (Standard: **deaktiviert**)

Wichtig: Der Kommentator darf das eigentliche Regelwerk nicht unkontrolliert verändern. Er ist rein kommentierend und blockiert keine Spielaktionen.

---

## Umsetzungsstatus

| Phase | Thema | Status |
|-------|--------|--------|
| 1 | Lokaler Kommentator (Textbausteine) | ✅ umgesetzt |
| 2 | Kommentator-UI + An/Aus-Setting | ✅ umgesetzt |
| 3 | Humor-Stufen / Persönlichkeiten | ✅ umgesetzt |
| 4 | Session-Statistiken | ✅ umgesetzt |
| 5 | AI-API (optional) | ✅ umgesetzt (Standard: aus) |
| 6 | Sprachausgabe (OpenAI TTS + ElevenLabs) | ✅ umgesetzt (Standard: aus) |
| 7 | Abschlussbericht / Awards | ✅ umgesetzt |
| 8 | Group Personality / Inside Jokes | ✅ MVP (Lobby, Firestore, Live-Kommentare) |
| 9 | Cross-Session Memory | 📋 geplant |

**Zusatzfeatures (2026-06-19):**

| Feature | Status |
|---------|--------|
| Host-only Voice (TTS nur auf Host-Gerät) | ✅ |
| Anti-Repetition / Dedupe | ✅ |
| OpenAI Onyx (Default) + ElevenLabs Voice-Profile | ✅ optional |
| Lobby Auto-Cleanup (`waiting` 30m / `playing` 2h) | ✅ clientseitig |

Details zum Code: `src/features/commentator/` · Einstellungen: `/settings/commentator` · Abschlussbildschirm: `/session-summary`

---

# Phasenplan

## Phase 1: Lokaler Kommentator ohne AI

**Status:** ✅ umgesetzt

Ziel: Schnell testbarer MVP.

Der Kommentator nutzt vorbereitete Textbausteine und Spielzustand.

Beispiele:

* Spielstart
* Spieler zieht Karte
* Monsterkarte erhalten
* Magiekarte gezogen
* Fallenkarte gezogen
* Karteneffekt aktiviert
* Voting gestartet
* Voting angenommen
* Voting abgelehnt
* Spieler muss trinken
* Runde beendet

Vorteile:

* keine API-Kosten
* offline möglich
* schnell implementierbar
* stabil
* gut testbar

Technisch:

* Neue Datei z.B. `src/features/commentator/commentatorService.js`
* Funktion `getCommentary(eventType, context)`
* Rückgabe: kurzer Text
* Anzeige im Game-Screen als kleine Moderator-Box oder Sprechblase

Beispiel-API:

```js
getCommentary('CARD_DRAWN', {
  playerName: 'Max',
  cardType: 'trap',
  cardName: 'Spiegelkraft'
});
```

Rückgabe:

```js
"Max zieht eine Fallenkarte. Das riecht nach Ärger."
```

---

## Phase 2: Kommentator-UI

**Status:** ✅ umgesetzt (`CommentatorBubble.js`, `/settings/commentator`)

Der Kommentar soll sichtbar ins Spiel integriert werden.

Mögliche Darstellung:

* kleine Box am oberen oder unteren Spielfeldrand
* Avatar/Icon des Moderators
* Text erscheint für einige Sekunden
* letzter Kommentar bleibt optional sichtbar
* keine Blockierung wichtiger Spielaktionen
* auf kleinen Handy-Screens kompakt halten

Optional:

* Button „Kommentar ausblenden“
* Setting „Kommentator: An/Aus“
* Humor-Stufe auswählbar

---

## Phase 3: Humor-Stufen

**Status:** ✅ umgesetzt (5 Stile: neutral, locker, chaotic, anime, tavern)

Vor Spielstart oder in den Einstellungen auswählbar:

* Neutral
* Locker
* Chaotisch
* Anime-Duell
* Kneipenmeister

Die Stufen werden lokal über unterschiedliche Textlisten gelöst (`commentatorTexts.js`).

Beispiel:

Neutral:
„Max hat eine Fallenkarte gezogen.“

Chaotisch:
„Max zieht eine Fallenkarte. Irgendwo lacht gerade das Schicksal.“

Anime-Duell:
„Max aktiviert sein Schicksal! Eine Fallenkarte erscheint auf dem Feld!“

Kneipenmeister:
„Max zieht eine Falle. Der Abend wird nicht nüchterner.“

---

## Phase 4: Session-Memory / Statistiken

**Status:** ✅ umgesetzt (`commentatorSessionStats.js`, in-memory pro Partie)

Der Kommentator soll einfache Statistiken nutzen:

* wer hat wie oft getrunken
* wer hat die meisten Fallen gezogen
* wer hat die meisten Votes gewonnen
* wer wurde am häufigsten bestraft
* wer hat sein Monster oft benutzt
* wer ist besonders lucky/unlucky

Beispiele:

„Laura gewinnt schon wieder eine Abstimmung. Demokratie scheint ihr Spezialgebiet zu sein.“

„Max hat heute mehr Fallen gesehen als ein Anfänger im Dungeon.“

---

## Phase 5: AI-API optional

**Status:** ✅ umgesetzt · Standard: **deaktiviert** (`useAiCommentator: false`)

Die AI-Integration ist optional und fällt bei Fehlern oder fehlender Konfiguration auf lokale Textbausteine zurück.

AI bekommt nur kompakten Kontext:

```json
{
  "eventType": "VOTE_ACCEPTED",
  "style": "chaotic",
  "players": ["Max", "Laura", "Robert"],
  "actor": "Laura",
  "cardName": "Hane-Hane",
  "effect": "Schickt einen Spieler zurück",
  "voteResult": {
    "yes": 3,
    "no": 1
  },
  "sessionStats": {
    "mostPunished": "Max",
    "luckiest": "Laura"
  }
}
```

AI soll maximal 1–2 kurze Sätze zurückgeben.

Regeln:

* keine echten Beleidigungen
* keine diskriminierenden Inhalte
* kein Druck zum exzessiven Trinken
* keine Regeländerungen ohne explizite Game-Logik
* Text maximal ca. 160 Zeichen
* immer optional deaktivierbar

Fallback:

Wenn API fehlschlägt, wird lokaler Kommentar genutzt.

---

## Phase 6: Sprachausgabe

**Status:** ✅ umgesetzt · Standard: **deaktiviert** (`voiceCommentatorEnabled: false`)

Implementiert via **OpenAI TTS** (Default) + **ElevenLabs** (optional), `expo-av`, Audio-Cache:

| Profil | Provider | Beschreibung |
|--------|----------|--------------|
| **Kneipenmeister (OpenAI Onyx)** | OpenAI | Default — `gpt-4o-mini-tts`, Stimme `onyx` |
| Kneipenmeister | ElevenLabs | Warm/rustikal |
| Anime-Erzähler | ElevenLabs | Dramatisch |
| Sportkommentator | ElevenLabs | Dynamisch |
| Dungeon Master | ElevenLabs | Episch |

Nur kurze Kommentare (max. 160 Zeichen). Env: `EXPO_PUBLIC_COMMENTATOR_AI_API_KEY` oder `EXPO_PUBLIC_OPENAI_API_KEY` (OpenAI TTS); `EXPO_PUBLIC_ELEVENLABS_*` (ElevenLabs) — siehe `.env.example`.

---

## Phase 7: Abschlussbericht / Session-Awards

**Status:** ✅ umgesetzt

Am Ende einer Session erzeugt der Kommentator einen Abschlussbericht mit Awards und passenden Kommentaren.

**Award-Kategorien:**

* Glückspilz
* Fallenmagnet
* König der Abstimmungen
* Meistbestrafter
* Monster-MVP
* Drama des Abends

**Technik:**

* `commentatorAwards.js` / `commentatorAwardsCore.js` — Berechnung + lokale Kommentare
* `CommentatorSessionSummary.js` + Route `/session-summary`
* Report wird beim Verlassen des Spiels gespeichert (`commentatorSessionReportStorage.js`), wenn Kommentator aktiv war und Session-Aktivität vorliegt
* Optional AI-Intro für den Abschluss (`GAME_ENDED`, Fallback auf lokale Intro-Texte)
* Mobil + Web (ScrollView, responsives Layout)

**Hinweis:** Der Abschlussbericht erscheint beim manuellen Verlassen der Lobby, nicht bei einem automatischen Spiel-Ende (Spiel hat derzeit kein `status: "finished"`).

---

## Phase 8 – Group Personality System & Crowd-Sourced Inside Jokes

**Status:** ✅ MVP umgesetzt (lobbybezogen, UI in Wartelobby, Live-Kommentare + AI-Kontext)

## Ziel

Der AI-Kommentator soll nicht wie ein generischer Chatbot wirken, sondern wie ein langjähriger Freund der Gruppe.

Die Persönlichkeit eines Spielers wird hauptsächlich durch die anderen Spieler beschrieben.

Der betroffene Spieler kontrolliert lediglich seine Grenzen.

---

# Grundprinzip

Jeder Spieler beantwortet vor dem Spiel einige kurze Fragen über andere Spieler.

Dadurch entstehen:

* Spitznamen
* Running Gags
* typische Verhaltensweisen
* harmlose Roasts
* bekannte Eigenarten

Der Kommentator kann diese Informationen später für Kommentare verwenden.

---

# Selbstkontrolle des Spielers

Jeder Spieler besitzt eigene Einstellungen:

```ts
consentToPersonalComments: boolean

roastLevel:
'off'
'mild'
'medium'
'hard'
'no_boundaries'

noGoTopics: string[]
```

---

## roastLevel

### off

Keine persönlichen Kommentare.

Nur neutrale Spielkommentare.

---

### mild

Leichte Neckereien.

Beispiel:

"Frank musste schon wieder trinken. Langsam wird das zur Tradition."

---

### medium

Deutlich mehr Running Gags.

Beispiel:

"Frank nähert sich gefährlich der Knarf-Phase."

---

### hard

Freunde dürfen kräftiger roasten.

Beispiel:

"Frank hat schon wieder verloren. Seine Siegquote konkurriert langsam mit der Deutschen Bahn."

---

### no_boundaries

Alles ist erlaubt.

Voraussetzungen:

* explizite Zustimmung des Spielers
* nur innerhalb privater Lobbys
* jederzeit abschaltbar

Der Kommentator darf hier sehr schwarzen, chaotischen oder absurden Humor verwenden.

Trotzdem verboten:

* Hassrede
* Diskriminierung
* reale Krankheiten
* Herkunft
* Religion
* Politik
* Sexualität
* Körpermerkmale
* Gewaltandrohungen

---

# Friend Inputs

Jeder Spieler beantwortet Fragen über andere Spieler.

Beispiel:

Für Frank:

Nickname:
Knarf

Typischer Moment:
Wird nach vielen Shots komplett verwirrt.

Running Gag:
Wenn Frank zu viel trinken musste, wird er zu Knarf.

Harmloser Roast:
Frank verliert grundsätzlich jedes Voting.

Lieblingsspruch:
"Der Junge ist schon halb Knarf."

---

# Datenmodell

```ts
playerCommentatorSettings

playerId
consentToPersonalComments
roastLevel
noGoTopics[]
```

```ts
playerFriendInputs

authorPlayerId
targetPlayerId

suggestedNickname
typicalMoment
runningJoke
harmlessRoast
oneLiner
```

---

# Kommentator-Regeln

Der Kommentator darf:

* Spitznamen benutzen
* Running Gags verwenden
* Ereignisse mit bekannten Eigenarten verbinden
* alte Witze gelegentlich wiederholen

Der Kommentator darf nicht:

* dieselben Witze ständig wiederholen
* No-Go-Themen benutzen
* roastLevel ignorieren
* Spieler bloßstellen

---

# Beispiel

Frank:

nickname:
Knarf

runningJoke:
Wird nach vielen Shots zu Knarf.

roastLevel:
medium

Kommentar:

"Frank musste schon wieder trinken. Die Knarf-Verwandlung schreitet unaufhaltsam voran."

---

## Phase-8-MVP (Scope)

Für **Phase 8** gelten diese Grenzen (unabhängig von Phase 5/6 — AI/TTS für Spielkommentare existieren bereits):

* Nur lobbybezogen speichern
* Noch keine langfristigen Profile über Sessions hinaus
* Friend-Inputs werden manuell erfasst — **keine AI-Generierung** der Inside-Joke-Daten in Phase 8
* Kommentator verwendet Friend-Inputs **gelegentlich** in Live-Kommentaren (lokal + optional AI-Kontext)
* Persönliche Kommentare jederzeit deaktivierbar (`consentToPersonalComments`, `roastLevel: off`)

---

## Phase 9 – Cross-Session Memory (geplant)

**Status:** 📋 geplant — nicht umgesetzt

Ziel: Kommentator erinnert sich über mehrere Sessions hinweg (Rivalitäten, wiederkehrende Gags, Langzeit-Stats).

Geplant u. a.:

* Persistenz außerhalb einzelner Lobbys
* Wiedererkennung von Stammgruppen / Spielern
* Kein Ersatz für Phase-8-Consent — Grenzen bleiben pro Spieler

---

## Ursprünglicher MVP-Umfang (Phase 1)

Historisch war der erste Stand auf lokale Textbausteine beschränkt. Folgendes ist **seitdem umgesetzt** (Phasen 2–7):

1. ✅ `commentatorService` mit lokalen Textbausteinen
2. ✅ Event-Types definiert (`commentatorEvents.js`, Erkennung in `commentatorCore.js`)
3. ✅ Kommentare im Game-Screen (`CommentatorBubble`)
4. ✅ Kommentare bei wichtigen Aktionen (`useCommentator` in `app/game.js`)
5. ✅ Setting zum Aktivieren/Deaktivieren (`/settings/commentator`)

Zusätzlich umgesetzt (über ursprünglichen MVP hinaus): AI-Kommentator, OpenAI/ElevenLabs-TTS, Voice-Profile, Session-Awards, Group Personality.

**Phase 9 (geplant):** Cross-Session Memory, globale Langzeit-Profile.

**Bekannte Lücken:** Kommentar-Queue pausiert bei offenen Modals nicht; Host kann Lobby per „Beenden“-Button schließen (`status: finished`).

---

## Host-only Voice (2026-06-19)

**Problem:** Wenn Voice aktiv war, spielten alle Geräte TTS gleichzeitig ab.

**Lösung:** Nur das **Host-Gerät** ruft TTS auf und spielt Audio ab. Alle Clients sehen weiterhin die Kommentar-Bubble.

| Aspekt | Verhalten |
|--------|-----------|
| Bubble/Text | Alle Geräte |
| TTS/API | Nur Host (`shouldPlayCommentaryVoice`) |
| Erkennung | `players[].isHost` + lokaler `playerName` |

Code: `voiceServiceCore.js`, `useCommentator.js`, `app/session-summary.js`

---

## Anti-Repetition / Dedupe (2026-06-19)

Pro Lobby/Session (in-memory, kein Firestore):

| Regel | Cooldown |
|-------|----------|
| Exakt gleicher Text | 10 Kommentare |
| Gleiche Karte | 3 Kommentare |
| Running Gag / Spitzname | 5 Kommentare |
| Gleicher Joke/One-Liner | 8 Kommentare |

Fallback-Kette: alternatives Template → AI-Retry mit `avoidTopics` → neutraler lokaler Text.

Code: `commentatorDedupeCore.js`, integriert in `resolveCommentary` und `getCommentary`.

---

## Relevante Event-Types

```js
GAME_STARTED
ROUND_STARTED
CARD_DRAWN
MONSTER_DRAWN
MAGIC_DRAWN
TRAP_DRAWN
EFFECT_SELECTED
VOTE_STARTED
VOTE_ACCEPTED
VOTE_REJECTED
PLAYER_PUNISHED
TRAP_REPLACED
MONSTER_EFFECT_DISABLED
MONSTER_EFFECT_ENABLED
GAME_ENDED
```

**Erkennung im Code (`commentatorCore.js`):** alle Events oben; `TRAP_REPLACED` nur bei Fallen-Auswahl mit `keep_drawn` (Spieler behält `drawnTrap`). `keep_existing` erzeugt kein `TRAP_REPLACED`. `GAME_ENDED` live beim Verlassen (`announceGameEnded`); Abschlussbericht zusätzlich unter `/session-summary`. Bei gleichzeitigem `EFFECT_SELECTED` + `VOTE_STARTED` erscheint nur `EFFECT_SELECTED` in der Bubble.

---

## UI-Anforderung

Der Kommentar darf keine bestehenden Buttons verdecken.

Besonders prüfen:

* Web-Ansicht
* Handy-Ansicht
* kleine Displays
* Voting Overlay
* Kartenmodal
* Action-Bar

Wenn ein Modal offen ist, wechselt die Bubble nach oben (`overlayActive` in `app/game.js`); pausieren der Kommentar-Queue ist optional und noch nicht umgesetzt.

---

## Code-Struktur (Ist-Stand)

```txt
src/features/commentator/
  commentatorEvents.js
  commentatorTexts.js
  commentatorService.js
  commentatorCore.js          # Event-Erkennung aus Lobby-Snapshots
  commentatorSessionStats.js
  commentatorAiService.js       # optional AI + Fallback
  commentatorAwards.js          # Phase 7
  commentatorPersonalityCommentCore.js  # Phase 8 — Friend-Inputs in Kommentare
  commentatorPersonalityComment.js
  voiceService.js               # OpenAI TTS + ElevenLabs
  voiceServiceCore.js
  voiceProfilesCore.js
  audioCacheService.js
  voiceProfiles.js
  CommentatorBubble.js
  CommentatorSessionSummary.js
  useCommentator.js
  useCommentatorSettings.js
  commentatorPersonality.js       # Phase 8 — Consent + Friend Inputs (Firestore)
  commentatorPersonalityCore.js
  CommentatorLobbyPrepPanel.js
  … (*Core.js, Storage, Config)

app/
  settings/commentator.js
  session-summary.js
```

Tests: `npm run test:commentator` (99 Assertions, Stand 2026-06)

---

## Akzeptanzkriterien (Phase 1–7)

* App startet ohne Fehler ✅
* Kommentator kann deaktiviert werden ✅
* Bei Spielstart erscheint ein Kommentar ✅
* Beim Kartenziehen erscheint ein passender Kommentar ✅
* Beim Voting-Start erscheint ein Kommentar ✅
* Bei Voting-Ergebnis erscheint ein Kommentar ✅
* Bei Monster-/Magie-/Fallenkarte wird Kartentyp korrekt erwähnt ✅
* Keine UI-Elemente werden verdeckt ✅ (`pointerEvents="none"`, Overlay-Positionierung)
* Web und Mobile rendern konsistent ✅
* Build läuft erfolgreich ✅

**Bekannte Lücken:** Kommentar-Queue pausiert bei offenen Modals nicht; automatisches Spiel-Ende (`status: "finished"`) existiert im Spiel noch nicht.

---

## Langfristige Vision (Phase 9+)

**Geplant (Phase 9):**

* Cross-Session Memory / dynamische Rivalitäten über Sessions hinweg
* globale Langzeit-Profile über Lobbys hinaus

**Bereits umgesetzt (Phasen 1–8):**

* Lokaler + optional AI-Kommentator
* Group Personality (Consent, roastLevel, Friend-Inputs in Live-Kommentaren)
* Abschlussbericht am Spielende (beim Verlassen)
* Awards pro Spieler (6 Kategorien)
* optionale Sprachausgabe — OpenAI Onyx (Default-Profil) + ElevenLabs (Standard aus)
* auswählbare Moderator-Persönlichkeiten (5 Text-Stile + 5 Voice-Profile)

Beispiel-Awards im Abschlussbericht:

* Glückspilz
* Fallenmagnet
* König der Abstimmungen
* Meistbestrafter
* Monster-MVP
* Drama des Abends
