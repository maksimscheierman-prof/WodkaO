# Layout-System — Tisch-Slots

*Stand: 2026-06-13*

Alle Spielobjekte werden **relativ zur Tischfläche** (`tableRect`) positioniert — nicht relativ zum Screen-Center.

---

## Koordinatensystem

| Begriff | Beschreibung |
|---------|--------------|
| `boardWidth` / `boardHeight` | Verfügbare Fläche aus `onLayout` (GameBoard) |
| `tableRect` | Filz-Ellipse als Rechteck: `left`, `top`, `width`, `height`, `centerX`, `centerY` |
| `Slot` | `{ centerX, centerY, width, height, left, top, right, bottom }` in **Board-Koordinaten** |

---

## Slot-Modell (`TableLayout`)

| Slot | ID | Positionierung | Inhalt |
|------|-----|----------------|--------|
| Tischfläche | `tableRect` | Board-Layout | Filz-Hintergrund |
| Oberer Spieler | `topPlayerArea` | über `tableRect.top` | Avatar + Name |
| Oberes Monster | `topMonsterSlot` | **Tischrand oben** + Randabstand | Monsterkarte Gegner |
| Saufstapel | `centerDeckSlot` | Freie Mitte zwischen Monster-Zonen | Stack + Label |
| Ablage | `centerDiscardSlot` | Mitte, rechts vom Deck | Stack + Label |
| Ziehen-Button | `drawButtonSlot` | **Entfernt vom Tisch** — siehe `GameActionBar` unten am Screen |
| Deck-Spalte | `deckColumnSlot` | Deck + Button (Kollisionsbox) | Bounding Box |
| Unteres Monster | `bottomMonsterSlot` | **Tischrand unten** + Randabstand | Eigenes Monster |
| Unterer Spieler | `bottomPlayerArea` | unter `tableRect.bottom` | Avatar + Name |
| Seiten-Monster | `playerSlots[left/right]` | (16 % / 84 %, 50 %) | 3+ Spieler |

---

## Monster-Positionierung (Top / Bottom)

Monsterkarten stehen **nah am jeweiligen Tischrand**, nicht mehr bei 24 % / 76 % der Tischhöhe. So wirken sie dem Besitzer zugeordnet; die Mitte bleibt für Stapel und Aktionen frei.

### Randabstand (`getMonsterEdgeMargin`)

| Eigenschaft | Wert |
|-------------|------|
| Minimum | **15 px** |
| Maximum | **25 px** |
| Skalierung | Tischhöhe 160 px → 15 px; ab ~520 px → 25 px |
| Kollision | zusätzlich × `contentScale` (min. 12 px) |

### Formeln (Board-Koordinaten)

```text
topMonster.centerY    = tableRect.top  + edgeMargin + monsterCardH / 2
bottomMonster.centerY = tableRect.bottom - edgeMargin - monsterCardH / 2
topMonster.centerX    = bottomMonster.centerX = tableRect.centerX
```

**Garantien:**

- `topMonster.top >= tableRect.top + edgeMargin`
- `bottomMonster.bottom <= tableRect.bottom - edgeMargin`
- Karte bleibt vollständig innerhalb der Tischfläche
- Deck / Ablage / Button liegen in der **Mitte** zwischen `topMonster.bottom` und `bottomMonster.top`

### Seiten-Monster (3+ Spieler)

Unverändert: Anker links/rechts bei 16 % / 84 % Breite, 50 % Höhe.

---

## Spieler-Rollen

Nach `orderPlayersWithMeAtBottom`:

| Spielerzahl | Index 0 | Index `floor(n/2)` | Weitere |
|-------------|---------|---------------------|---------|
| 2 | `top` | `bottom` (Du) | — |
| 3+ | `top` | `bottom` (Du) | `left` / `right` alternierend |

**Avatare:** Außerhalb des `tableRect`-Randes mit `monsterAvatar`-Abstand.

**Deck / Ablage:** Horizontal in der freien **vertikalen Mitte** zwischen den Monster-Slots.

**Ziehen-Button:** Nicht mehr auf dem Tisch — `GameActionBar` am unteren Bildschirmrand (`src/components/GameActionBar.js`), 50 % Breite Desktop / ~90 % Mobile, min. 64 px Touch-Höhe.

---

## Mindestabstände (`MIN_GAPS`)

| Paar | px (Basis) | Skaliert mit `contentScale` |
|------|------------|-------------------------------|
| Deck ↔ Ablage | 20 | ja |
| Deck ↔ Monster | 12 | ja |
| Monster ↔ Avatar | 10 | ja |
| Monster ↔ Button | 8 | ja |
| Monster ↔ Tischrand | 15–25 | ja (`monsterEdgeMargin`) |

---

## Kollisionsprüfung

`computeTableSlotLayout()` in `src/utils/tableSlotLayout.js`:

1. Monster an Tischrand, Deck/Ablage in Mitte berechnen
2. Paare prüfen (Deck↔Ablage, Deck-Spalte↔Monster, Button↔unteres Monster, …)
3. Bei Überlappung: `contentScale` um 0.04 verringern (min. **0.55**)
4. Karten, Stacks, Randabstände proportional verkleinern
5. **Niemals** Überlappung zulassen (iterativ bis 0.55)

---

## Debug-Overlay

`.env`:

```env
EXPO_PUBLIC_LAYOUT_DEBUG=1
```

Zeigt farbige Rechtecke für alle Slots (siehe `DEBUG_SLOT_COLORS` in `tableSlotLayout.js`).

Konsole: `[LayoutDebug:GameBoard]` mit Slot-Zentren, `monsterEdgeMargin`, `contentScale`.

---

## Viewports

Getestet / vorgesehen für:

| Viewport | Hinweis |
|----------|---------|
| Desktop-Browser | Standard-Portrait ~390×844 |
| Cursor-Browser | Squash-Viewport — `isSquashedViewport` in `tableLayout.js` |
| Smartphone Hochformat | Randabstand skaliert; bei knapper Höhe `contentScale` |

---

## Dateien

| Datei | Rolle |
|-------|--------|
| `src/utils/tableSlotLayout.js` | Slot-Berechnung, Randabstand, Kollision |
| `src/utils/tableLayout.js` | Tischgröße, `computeBoardLayout` |
| `src/components/GameBoard.js` | Rendering aus Slots |
| `src/components/GameActionBar.js` | Ziehen / Aufdecken / Ablegen (Touch-Bar) |
| `src/components/LobbyCodeBadge.js` | Lobby-Code HUD (ganzer Block kopierbar) |
| `scripts/test_table_layout.js` | Unit-Checks inkl. Monster-Rand |
| `docs/layout_debug.md` | Viewport/Squash-Bug (Cursor Browser) |

---

## Verwandt

- [layout_debug.md](layout_debug.md) — flacher Tisch im Cursor-Browser (behoben)
