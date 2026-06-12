# Layout-System — Tisch-Slots

*Stand: 2026-06-09*

Alle Spielobjekte werden **relativ zur Tischfläche** (`tableRect`) positioniert — nicht relativ zum Screen-Center.

---

## Koordinatensystem

| Begriff | Beschreibung |
|---------|--------------|
| `boardWidth` / `boardHeight` | Verfügbare Fläche aus `onLayout` (GameBoard) |
| `tableRect` | Filz-Ellipse als Rechteck: `left`, `top`, `width`, `height`, `centerX`, `centerY` |
| `Slot` | `{ centerX, centerY, width, height, left, top, right, bottom }` in **Board-Koordinaten** |

Umrechnung Tisch → Board:

```text
boardX = tableRect.left + tableRect.width * anchorX
boardY = tableRect.top  + tableRect.height * anchorY
```

---

## Slot-Modell (`TableLayout`)

| Slot | ID | Anker (relativ zu tableRect) | Inhalt |
|------|-----|------------------------------|--------|
| Tischfläche | `tableRect` | 0–100 % | Filz-Hintergrund |
| Oberer Spieler | `topPlayerArea` | über `top` | Avatar + Name |
| Oberes Monster | `topMonsterSlot` | (0.50, 0.24) | Monsterkarte oben |
| Saufstapel | `centerDeckSlot` | Mitte zwischen Monster-Zonen | Stack + Label |
| Ablage | `centerDiscardSlot` | Mitte, rechts vom Deck | Stack + Label |
| Ziehen-Button | `drawButtonSlot` | unter `centerDeckSlot` | Aktions-Button |
| Deck-Spalte | `deckColumnSlot` | Deck + Button (Kollisionsbox) | Bounding Box |
| Unteres Monster | `bottomMonsterSlot` | (0.50, 0.76) | Monsterkarte unten (eigener Spieler) |
| Unterer Spieler | `bottomPlayerArea` | unter `bottom` | Avatar + Name |
| Seiten-Monster | `playerSlots[left/right]` | (0.16/0.84, 0.50) | 3+ Spieler |

---

## Spieler-Rollen

Nach `orderPlayersWithMeAtBottom`:

| Spielerzahl | Index 0 | Index `floor(n/2)` | Weitere |
|-------------|---------|---------------------|---------|
| 2 | `top` | `bottom` (Du) | — |
| 3+ | `top` | `bottom` (Du) | `left` / `right` alternierend |

### Positionierungsregeln

**Oberes Monster:** Zwischen oberem Avatar und Tischmitte → Anker Y = **24 %** der Tischhöhe.

**Unteres Monster:** Zwischen Tischmitte und eigenem Avatar → Anker Y = **76 %**.

**Avatare:** Außerhalb des `tableRect`-Randes mit `monsterAvatar`-Abstand.

**Deck / Ablage:** Horizontal zentriert in der **freien Mitte** zwischen `topMonster.bottom` und `bottomMonster.top`.

**Ziehen-Button:** Eigener Slot **unter** dem Saufstapel, nicht im Monster-Slot.

---

## Mindestabstände (`MIN_GAPS`)

| Paar | px (Basis) | Skaliert mit `contentScale` |
|------|------------|-------------------------------|
| Deck ↔ Ablage | 20 | ja |
| Deck ↔ Monster | 12 | ja |
| Monster ↔ Avatar | 10 | ja |
| Monster ↔ Button | 8 | ja |

---

## Kollisionsprüfung

`computeTableSlotLayout()` in `src/utils/tableSlotLayout.js`:

1. Slots aus Ankern + Maßen berechnen
2. Paare prüfen (Deck↔Ablage, Deck-Spalte↔Monster, Button↔unteres Monster, …)
3. Bei Überlappung: `contentScale` um 0.04 verringern (min. 0.72)
4. Karten, Stacks, Abstände proportional verkleinern
5. **Niemals** Überlappung zulassen (iterativ bis 0.72)

---

## Debug-Overlay

`.env`:

```env
EXPO_PUBLIC_LAYOUT_DEBUG=1
```

Zeigt farbige Rechtecke für alle Slots (siehe `DEBUG_SLOT_COLORS` in `tableSlotLayout.js`).

Konsole: `[LayoutDebug:GameBoard]` mit Slot-Zentren und `contentScale`.

---

## Dateien

| Datei | Rolle |
|-------|--------|
| `src/utils/tableSlotLayout.js` | Slot-Berechnung, Kollision, Debug |
| `src/utils/tableLayout.js` | Tischgröße, `computeBoardLayout` |
| `src/components/GameBoard.js` | Rendering aus Slots |
| `docs/layout_debug.md` | Viewport/Squash-Bug (Cursor Browser) |

---

## Verwandt

- [layout_debug.md](layout_debug.md) — flacher Tisch im Cursor-Browser (behoben)
- [layout_system.md](layout_system.md) — dieses Dokument
