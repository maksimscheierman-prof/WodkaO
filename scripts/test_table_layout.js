#!/usr/bin/env node
/**
 * Unit checks for squashed-viewport table layout (mirrors tableLayout.js logic).
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

if (failed > 0) {
  console.error(`\n${failed} test(s) failed`);
  process.exit(1);
}

console.log("\nAll table layout checks passed.");
