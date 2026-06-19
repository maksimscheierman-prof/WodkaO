# Projektstruktur — WodkaO / Sauf Viel-Oh

*Stand: 2026-06-13 — einheitlicher Projektroot*

---

## Aktuelle Struktur

| Pfad | Rolle |
|------|--------|
| `Sauf Viel-Oh/` | **Einziges Projektroot** — Git, Expo-App, npm, EAS |
| `app/`, `src/`, `assets/` | React Native / Expo App |
| `docs/` | Kanonische Dokumentation |
| `project.md` | Haupt-Projektdoku |

Der frühere Legacy-Unterordner (ehemals separates Expo-Root) wurde am 2026-06-13 aufgelöst; Inhalt liegt im Root.

---

## npm-Befehle (vom Root)

```bash
npm install
npm start
npm run web
npm run android
npm run lint
npm run test:lobby-lifecycle
npm run test:table-layout
npm run cleanup:lobbies
```

Kein `npm --prefix` mehr nötig.

---

## Git

```bash
cd "Sauf Viel-Oh"
git status
git branch
```

`.git` liegt im Projektroot (nicht mehr im Legacy-Unterordner).

---

## Technische Namen (unverändert)

| Feld | Wert | Hinweis |
|------|------|---------|
| npm `name` | `wodkao` | package.json |
| Expo `slug` | `wodkao` | app.json |
| Android package | `com.wodkao.app` | app.json |
| Repo | WodkaO | GitHub |

---

## Migration 2026-06-13

- `.git` vom Legacy-Unterordner nach Root verschoben
- App-Code, Config, `docs/`, `.cursor/`, `.vscode/` konsolidiert
- Alte Root-`package.json` (Delegator) entfernt
- `npm install` im Root ausgeführt

Falls ein leerer Legacy-Ordner noch sichtbar ist: Cursor/Terminal schließen und Ordner manuell löschen (Dateisperre).

---

## Verwandte Dokumente

- [../project.md](../project.md)
- [BUILD_ANDROID.md](BUILD_ANDROID.md)
- [MVP_ROADMAP.md](MVP_ROADMAP.md)
