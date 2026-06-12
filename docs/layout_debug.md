# Layout Debug Report — Spielfeld / Pokertisch

*Stand: 2026-06-09*

## Symptom

Im **Cursor Simple Browser** (eingebetteter Webview):

- Tisch extrem flach („Platte“)
- Avatare, Saufstapel, Ziehen-Button und Ablage überlappen
- In **Chrome** (volles Fenster) korrekt

## Analyse

### Verwendete Größenquellen (vor Fix)

| Quelle | Verwendung | Problem |
|--------|------------|---------|
| `useWindowDimensions()` | Karten-/Avatar-Größe, `compact`, `minHeight` | Fenstergröße |
| `onLayout` auf GameBoard | Tisch-Ellipse, Spielerpositionen | Tatsächliche Flex-Fläche |
| `useSafeAreaInsets()` | HUD, Modals (game.js) | OK für Overlays |

**Kernproblem:** Zwei getrennte Größenquellen. Im Cursor-Browser ist die **verfügbare Board-Höhe** oft stark komprimiert (breites, flaches Panel), während `useWindowDimensions` teils andere Werte liefert.

### Kritische Berechnung in `getTableScaleFactors` (alt)

```javascript
const landscape = boardWidth > boardHeight;  // bei 800×220 → true
// ...
height: landscape ? 0.62 : 0.68   // veryShort
```

Bei **breit + niedrig** (typisch Cursor-Panel):

1. `landscape === true` (obwohl kein echtes Querformat)
2. `veryShort === true` (Höhe < 520)
3. `safeH` nach Avatar-Reserven oft nur ~80px
4. `tableH = safeH × 0.62` → **~50px** Tischhöhe
5. Stacks/Avatare behalten absolute Größe → **Überlappung**

### Weitere Faktoren

- Kein Mindest-Seitenverhältnis für die Ellipse
- `getCardSize(screenWidth, screenHeight)` nutzte Fenster, Tisch nutzte Layout → Inkonsistenz
- Keine Erkennung von „squashed viewport“ (Panel, nicht Landscape)

## Debug-Logs aktivieren

In `.env`:

```env
EXPO_PUBLIC_LAYOUT_DEBUG=1
```

Neu starten (`npm run web`), Konsole öffnen. Ausgabe-Präfix: `[LayoutDebug:GameBoard]`

Geloggte Werte:

- `board.w/h` — onLayout-Fläche
- `squashed`, `landscape`, `scale`
- `table.w/h`, `aspect`, `centerY`
- `cards`, `avatarBlockHeight`
- `samplePositions` — erste Avatar/Karten-Koordinaten

## Lösung (implementiert)

### 1. Eine Layout-Quelle

`computeBoardLayout(boardWidth, boardHeight)` in `tableLayout.js`:

- Alle Maße nur aus **onLayout** (`GameBoard`)
- `useWindowDimensions` in `GameBoard` entfernt

### 2. Squashed-Viewport-Erkennung

```javascript
isSquashedViewport(w, h) =>
  h < 380 || w / h > 1.65
```

Breit-flache Panels (Cursor) werden **nicht** als Landscape behandelt.

### 3. Schutzmechanismen

| Konstante | Wert | Zweck |
|-----------|------|--------|
| `MIN_BOARD_HEIGHT` | 300 | Mindesthöhe Spielfeld-Container |
| `MIN_TABLE_HEIGHT` | 160 | Mindest-Tischhöhe |
| `MIN_TABLE_ASPECT` | 0.36 | Mindestverhältnis Höhe/Breite |
| `getMinTableHeight()` | dynamisch | Avatar + Stack + Button reservieren |

### 4. Geänderte Dateien

- `src/utils/tableLayout.js` — `computeBoardLayout`, Squashed-Logik, Mindestmaße
- `src/components/GameBoard.js` — nur onLayout, Debug-Logs
- `app/game.js` — `minHeight: 300` auf Board-Wrapper
- `src/styles/gameStyles.js` — `minHeight: 0` für Flex-Kette (RN Web)

## Browser-Kompatibilität

| Browser | Erwartung |
|---------|-----------|
| Chrome (Desktop) | Unverändert korrekt |
| Cursor Simple Browser | Squashed-Erkennung + Mindesthöhen |
| Android Chrome | Portrait/Querformat via `isTrueLandscape` (H ≥ 420) |

## Verifikation

1. `EXPO_PUBLIC_LAYOUT_DEBUG=1` setzen
2. Cursor Browser + Chrome öffnen (`npm run web`)
3. Spiel starten, Konsole prüfen:
   - Cursor: `squashed: true`, `table.aspect` ≥ 0.36
   - Chrome: normale Werte, kein Squash
4. Visuell: keine Überlappung von Stacks und Avataren

```bash
npm run lint
```

## Offen / nicht geändert

- HUD (`game.js`) nutzt weiter `useWindowDimensions` + SafeArea — bewusst, da außerhalb des Boards
- Modals (`MagicCardModal`) — eigene Viewport-Logik, unabhängig vom Tisch
