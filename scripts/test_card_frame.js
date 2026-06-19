#!/usr/bin/env node
/**
 * Card frame template + text metric tests.
 * Run: npm run test:card-frame
 */

const fs = require("fs");
const path = require("path");
const {
  resolveCardFrameType,
  getFrameAssetPath,
  getFrameFileName,
  getCardLayoutTextMetrics,
  FRAME_FILES,
} = require("../src/utils/cardFrameCore.js");
const {
  safeFontSize,
  safeLineHeight,
  safeLetterSpacing,
} = require("../src/utils/safeTextMetricsCore.js");
const {
  shouldShowCardModal,
} = require("../src/utils/cardModalCore.js");
const {
  normalizeCardForDisplay,
  getCardOpenLog,
} = require("../src/utils/cardDisplayCore.js");

const ROOT = path.join(__dirname, "..");
const TEMPLATES_DIR = path.join(ROOT, "assets", "images", "templates");

let failed = 0;

function assert(name, condition) {
  if (!condition) {
    console.error(`FAIL: ${name}`);
    failed += 1;
  } else {
    console.log(`OK: ${name}`);
  }
}

assert("monster uses monster_frame", getFrameFileName(resolveCardFrameType("MONSTER")) === FRAME_FILES.monster);
assert("magic uses magic_frame", getFrameFileName(resolveCardFrameType("magic")) === FRAME_FILES.magic);
assert("spell maps to magic_frame", getFrameAssetPath("spell").endsWith(FRAME_FILES.magic));
assert("trap uses trap_frame", getFrameAssetPath("TRAP").endsWith(FRAME_FILES.trap));
assert(
  "unknown type uses monster fallback",
  getFrameAssetPath("weird").endsWith(FRAME_FILES.monster)
);

for (const file of Object.values(FRAME_FILES)) {
  assert(`template file exists: ${file}`, fs.existsSync(path.join(TEMPLATES_DIR, file)));
}

function metricIsSafe(metric) {
  const fontSize = safeFontSize(metric.fontSize, 12);
  if (!Number.isFinite(fontSize) || fontSize <= 0) return false;
  if (metric.lineHeight != null) {
    const lh = safeLineHeight(metric.lineHeight, 16);
    if (!Number.isFinite(lh) || lh <= 0) return false;
  }
  if (metric.letterSpacing != null) {
    const ls = safeLetterSpacing(metric.letterSpacing, 0);
    if (!Number.isFinite(ls)) return false;
  }
  return metric.fontSize > 0 && !(metric.lineHeight != null && metric.lineHeight <= 0);
}

for (const metric of getCardLayoutTextMetrics()) {
  assert(`layout metric safe: ${metric.component}`, metricIsSafe(metric));
}

const cardStylesSrc = fs.readFileSync(
  path.join(ROOT, "src", "styles", "CardStyles.js"),
  "utf8"
);
assert("CardStyles has no fontSize: 0", !/fontSize:\s*0\b/.test(cardStylesSrc));

const remoteMonster = normalizeCardForDisplay({
  name: "Remote",
  effect: "Shot",
  type: "MONSTER",
  image: { uri: "https://example.com/monster.png" },
});
assert(
  "modal opens monster with remote image",
  shouldShowCardModal(true, remoteMonster)
);
const remoteLog = getCardOpenLog(
  { name: "Remote", type: "MONSTER", image: { uri: "https://example.com/monster.png" } },
  "game-monster"
);
assert("remote monster log valid", remoteLog.valid === true);
assert("remote monster log uri", remoteLog.imageKind === "uri");

if (failed > 0) {
  console.error(`\n${failed} test(s) failed`);
  process.exit(1);
}

console.log("\nAll card frame checks passed.");
