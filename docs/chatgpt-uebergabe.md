# WodkaO – ChatGPT Übergabe

*Stand: 2026-06-09 (Tagesabschluss)*

## Letzte Session

Pokertisch-UX, HUD-Kompaktierung, dynamische Kartenstapel, Viewing-Presence (Denkblase), Mehrfachklick-Schutz, Dokumentation, Commit-Vorbereitung.

## Aktueller Stand

### Infrastruktur

- Firestore wieder funktionsfähig (abgelaufene Rules im Firebase Console für MVP geöffnet)
- Remote: `https://github.com/maksimscheierman-prof/WodkaO`
- Multiplayer-Core: Lobby → Start → Monster/Falle → Magie-Zug → Sync via Firestore

### Game Screen (umgesetzt)

- Pokertisch-Layout (`tableLayout.js`, `GameBoard.js`)
- Dynamische Sitzplätze (max. 8, Ellipse)
- Avatare außerhalb des Tisches (`PlayerSilhouette`, Ellipsen-Normale)
- Karten innerhalb des Tisches (parametrischer Inset)
- Lobby-Code HUD oben rechts (`LobbyCodeBadge`, kopierbar Web)
- Rundenanzeige im Tisch über Stapeln
- Kartenstapel `StackPile` (0/leer, 1–4 echt, 5+ max. 5 sichtbar)
- Magie / Fallen / Ablage mit echten Counts
- Viewing-Bubble: `👀 Monsterkarte` / `👀 Fallenkarte` (weiße Sprechblase, Firestore `viewingCard`)
- Mehrfachklick-Schutz (`useAsyncLock`)
- Join während Spiel: Monster+Falle für Mid-Game-Joiner, max. 8 Spieler

### Qualität

- `npm run lint`: 0 Errors, 9 Warnings (`react-hooks/exhaustive-deps`)

## Offene Bugs

| Priorität | Bug |
|-----------|-----|
| Mittel | Viewing-Bubble Edge-Cases (Tab-Wechsel, 15s Timeout vs. Modal offen) |
| Mittel | Avatar/Karten-Positionierung Feintuning (kleine Screens, Querformat) |
| Mittel | `reactions`-Init nur für Host |
| Niedrig | Doppelte Vote-UI (`VotePanel` + `MagicCardModal`) |
| Niedrig | Timer-Settings unerreichbar |
| Info | Kein Spielende (by design) |

**Behoben heute:** `bubbleText is not defined`, Bubble-Flackern (Firestore-Clear-Loop), `handleCloseVoteResult`, Lint-Errors.

## Nächste Schritte

1. `git push origin main` (manuell)
2. Multiplayer mit 2+ Browsern testen
3. Presence-Lifecycle final testen
4. Mobile Hoch/Quer prüfen
5. Erst danach: Selfie-Avatar-Backlog, Animationen

## Wichtige Regel

Keine großen Features vor MVP-Stabilisierung. Fokus: Stabilität, Multiplayer, UX-Polish.
