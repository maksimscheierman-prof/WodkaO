#!/usr/bin/env node
/**
 * Reaction-phase mobile layout tests.
 * Run: npm run test:reaction-layout
 */

const {
  getReactionMagicCardBounds,
  getReactionDetailCardBounds,
  getVotingCardBounds,
  computeScaledCardSize,
  getReactionViewUi,
  hasOwnReactionMonster,
  hasOwnReactionTrap,
  cardFitsViewport,
  MAGIC_HEIGHT_RATIO,
  MAGIC_WIDTH_RATIO,
  DETAIL_HEIGHT_RATIO,
  DETAIL_WIDTH_RATIO,
  VOTING_HEIGHT_RATIO,
  VOTING_WIDTH_RATIO,
} = require("../src/utils/reactionLayoutCore.js");
const {
  safeFontSize,
  safeLineHeight,
} = require("../src/utils/safeTextMetricsCore.js");

let failed = 0;

function assert(name, condition) {
  if (!condition) {
    console.error(`FAIL: ${name}`);
    failed += 1;
  } else {
    console.log(`OK: ${name}`);
  }
}

const W = 390;
const H = 844;
const me = {
  name: "Alice",
  monster: { name: "Drache", effect: "Shot", type: "MONSTER", imageName: "drache" },
  trap: { name: "Falle", effect: "Block", type: "TRAP", imageName: "trap1" },
};
const meNoTrap = {
  name: "Bob",
  monster: { name: "Ork", effect: "X", type: "monster" },
};

assert("has monster", hasOwnReactionMonster(me));
assert("has trap", hasOwnReactionTrap(me));
assert("no trap when missing", !hasOwnReactionTrap(meNoTrap));

const defaultUi = getReactionViewUi(null, me);
assert("default shows magic", defaultUi.showMagicCard);
assert("default shows monster option", defaultUi.showMonsterOption);
assert("default shows trap option", defaultUi.showTrapOption);
assert("default shows done", defaultUi.showDone);
assert("default no activate", !defaultUi.showMonsterActivate);

const monsterUi = getReactionViewUi("monster", me);
assert("monster detail shows card", monsterUi.showMonsterCard);
assert("monster detail activate", monsterUi.showMonsterActivate);
assert("monster detail back", monsterUi.showBackToMagic);
assert("monster detail hides magic", !monsterUi.showMagicCard);

const trapUi = getReactionViewUi("trap", me);
assert("trap detail shows card", trapUi.showTrapCard);
assert("trap detail activate", trapUi.showTrapActivate);

const backUi = getReactionViewUi(null, me);
assert("back returns to magic", backUi.showMagicCard);

const noTrapUi = getReactionViewUi(null, meNoTrap);
assert("no trap button when no trap", !noTrapUi.showTrapOption);

const magicBounds = getReactionMagicCardBounds(W, H);
assert(
  "magic max height ratio",
  magicBounds.maxHeight === Math.round(H * MAGIC_HEIGHT_RATIO)
);
assert(
  "magic max width ratio",
  magicBounds.maxWidth === Math.round(W * MAGIC_WIDTH_RATIO)
);

const monsterUiBlocked = getReactionViewUi("monster", me, {
  canActivateMonster: false,
});
assert(
  "monster used hides activate",
  !monsterUiBlocked.showMonsterActivate
);
assert(
  "monster used shows hint",
  monsterUiBlocked.showMonsterUsedHint
);

const votingBounds = getVotingCardBounds(W, H);
assert(
  "voting max height ratio",
  votingBounds.maxHeight === Math.round(H * VOTING_HEIGHT_RATIO)
);
assert(
  "voting max width ratio",
  votingBounds.maxWidth === Math.round(W * VOTING_WIDTH_RATIO)
);

const votingScaled = computeScaledCardSize(votingBounds.maxWidth, votingBounds.maxHeight);
assert("voting card fits height cap", votingScaled.height <= votingBounds.maxHeight);
assert("voting card width positive", votingScaled.width > 0);

const detailBounds = getReactionDetailCardBounds(W, H);
assert(
  "detail max height ratio",
  detailBounds.maxHeight === Math.round(H * DETAIL_HEIGHT_RATIO)
);

const magicScaled = computeScaledCardSize(magicBounds.maxWidth, magicBounds.maxHeight);
assert("magic card fits viewport", cardFitsViewport(magicScaled, W, H, "magic"));
assert("magic scaled width positive", magicScaled.width > 0);
assert("magic scaled height positive", magicScaled.height > 0);
assert("magic scaled under screen height", magicScaled.height <= magicBounds.maxHeight);

const detailScaled = computeScaledCardSize(detailBounds.maxWidth, detailBounds.maxHeight);
assert("detail card fits viewport", cardFitsViewport(detailScaled, W, H, "detail"));

for (const size of [10, 12, 14, 15, 16, 20]) {
  assert(`safeFontSize(${size}) positive`, safeFontSize(size, 12) > 0);
  assert(`safeLineHeight(${size}) positive`, safeLineHeight(size, 16) > 0);
}

if (failed > 0) {
  console.error(`\n${failed} test(s) failed`);
  process.exit(1);
}

console.log("\nAll reaction layout checks passed.");
