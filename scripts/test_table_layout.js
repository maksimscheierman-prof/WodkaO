#!/usr/bin/env node
/**
 * Unit checks for table layout + monster edge slots.
 * Run: node scripts/test_table_layout.js
 */

const MIN_TABLE_HEIGHT = 160;
const MIN_TABLE_ASPECT = 0.36;

function isSquashedViewport(boardWidth, boardHeight) {
  if (!boardWidth || !boardHeight) return false;
  const aspect = boardWidth / boardHeight;
  return boardHeight < 380 || aspect > 1.65;
}

function isTrueLandscape(boardWidth, boardHeight) {
  if (!boardWidth || !boardHeight) return false;
  if (isSquashedViewport(boardWidth, boardHeight)) return false;
  return boardWidth > boardHeight && boardHeight >= 420;
}

function getTableScaleFactors(boardWidth, boardHeight) {
  const squashed = isSquashedViewport(boardWidth, boardHeight);
  if (squashed) return { width: 0.9, height: 0.76 };
  const landscape = isTrueLandscape(boardWidth, boardHeight);
  const veryShort = boardHeight < 520;
  if (veryShort) return { width: 0.76, height: landscape ? 0.68 : 0.72 };
  return { width: 0.88, height: 0.86 };
}

function estimateTableHeight(boardWidth, boardHeight, avatarBlockHeight = 104) {
  const MIN_BOARD_HEIGHT = 300;
  const effectiveHeight = Math.max(boardHeight, MIN_BOARD_HEIGHT);
  const topReserve = avatarBlockHeight / 2 + avatarBlockHeight / 2 + 14;
  const bottomReserve = topReserve + 8;
  const safeH = Math.max(
    MIN_TABLE_HEIGHT,
    effectiveHeight - topReserve - bottomReserve
  );
  const scale = getTableScaleFactors(boardWidth, boardHeight);
  let tableW = Math.max(220, boardWidth - 120) * scale.width;
  let tableH = safeH * scale.height;
  tableH = Math.max(MIN_TABLE_HEIGHT, tableH);
  const edgeMinH = 2 * 20 + 2 * 106 + (88 + 14 + 24);
  tableH = Math.max(edgeMinH, tableH);
  if (tableH / tableW < MIN_TABLE_ASPECT) {
    tableH = tableW * MIN_TABLE_ASPECT;
  }
  return { tableW, tableH };
}

let failed = 0;

function assert(name, condition) {
  if (!condition) {
    console.error(`FAIL: ${name}`);
    failed += 1;
  } else {
    console.log(`OK: ${name}`);
  }
}

assert("cursor-like panel is squashed", isSquashedViewport(900, 220) === true);
assert("chrome portrait is not squashed", isSquashedViewport(390, 844) === false);
assert("squashed is not true landscape", isTrueLandscape(900, 220) === false);

const cursor = estimateTableHeight(900, 220);
assert(
  "squashed table has min aspect ratio",
  cursor.tableH / cursor.tableW >= MIN_TABLE_ASPECT
);
assert("squashed table height >= MIN_TABLE_HEIGHT", cursor.tableH >= MIN_TABLE_HEIGHT);

const chrome = estimateTableHeight(390, 700);
assert(
  "normal viewport table is taller than squashed",
  chrome.tableH > cursor.tableH * 0.8
);

async function runMonsterSlotTests() {
  const {
    computeTableSlotLayout,
    getMonsterEdgeMargin,
    slotsOverlap,
    MONSTER_EDGE_MARGIN,
  } = await import("../src/utils/tableSlotLayout.js");

  assert(
    "edge margin within 15-25",
    getMonsterEdgeMargin(400) >= MONSTER_EDGE_MARGIN.min &&
      getMonsterEdgeMargin(400) <= MONSTER_EDGE_MARGIN.max
  );

  const viewports = [
    { name: "desktop portrait", w: 390, h: 844, players: 2 },
    { name: "cursor squashed", w: 900, h: 220, players: 2 },
    { name: "phone short", w: 360, h: 640, players: 2 },
  ];

  for (const vp of viewports) {
    const tableH = estimateTableHeight(vp.w, vp.h).tableH;
    const tableW = estimateTableHeight(vp.w, vp.h).tableW;
    const tableRect = {
      left: 60,
      top: 80,
      width: tableW,
      height: tableH,
      centerX: 60 + tableW / 2,
      centerY: 80 + tableH / 2,
    };
    const dims = {
      cardWidth: 72,
      cardHeight: 100,
      seatWidth: 140,
      stackW: 64,
      stackH: 88,
      avatarBlockHeight: 104,
      avatarLabelWidth: 120,
    };
    const { slots, hasOverlap } = computeTableSlotLayout(tableRect, dims, vp.players);
    const edge = slots.monsterEdgeMargin ?? getMonsterEdgeMargin(tableH);
    const t = tableRect.top;
    const b = t + tableRect.height;

    assert(
      `${vp.name}: top monster near top edge`,
      slots.topMonsterSlot.top >= t + edge - 1
    );
    assert(
      `${vp.name}: bottom monster near bottom edge`,
      slots.bottomMonsterSlot.bottom <= b - edge + 1
    );
    assert(
      `${vp.name}: monsters not in table center band`,
      slots.topMonsterSlot.centerY < tableRect.centerY - 8 &&
        slots.bottomMonsterSlot.centerY > tableRect.centerY + 8
    );
    assert(
      `${vp.name}: deck between monsters vertically`,
      slots.centerDeckSlot.centerY > slots.topMonsterSlot.bottom &&
        slots.centerDeckSlot.centerY < slots.bottomMonsterSlot.top
    );
    assert(`${vp.name}: no slot overlap`, hasOverlap === false);
    assert(
      `${vp.name}: deck clear of top monster`,
      !slotsOverlap(slots.centerDeckSlot, slots.topMonsterSlot, 2)
    );
    assert(
      `${vp.name}: deck clear of bottom monster`,
      !slotsOverlap(slots.centerDeckSlot, slots.bottomMonsterSlot, 2)
    );
  }
}

runMonsterSlotTests()
  .then(() => {
    if (failed > 0) {
      console.error(`\n${failed} test(s) failed`);
      process.exit(1);
    }
    console.log("\nAll table layout checks passed.");
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
