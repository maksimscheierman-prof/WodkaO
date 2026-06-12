# Projektstruktur — Cleanup & Workspace

*Kanonische Kopie — identisch mit Parent `docs/project_structure_cleanup.md`*

Siehe auch Workspace-README im Parent: `../README.md`

## Kurzfassung

- **Git / App / EAS:** `jahw3-app/` (dieser Ordner)
- **Cursor Parent-Workspace:** ein Ordner höher (`Sauf Viel-Oh/`)
- **npm vom Parent:** Root-`package.json` delegiert mit `npm --prefix jahw3-app`

## Cursor öffnen

| Ziel | Ordner |
|------|--------|
| Git/EAS direkt | `jahw3-app` ← **dieser Ordner** |
| Parent + delegierte npm | `Sauf Viel-Oh` |

## npm

Von `jahw3-app/` (direkt):

```bash
npm run start
npm run lint
```

Vom Parent:

```bash
npm run start    # delegiert nach jahw3-app
```

Vollständige Analyse, Inventar und Lösch-Entscheidungen: Parent-Datei  
`../docs/project_structure_cleanup.md`
