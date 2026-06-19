#!/usr/bin/env node
/**
 * Monster once-per-round effect usage + trap no-cooldown tests.
 * Run: npm run test:effects-used
 */

const {
  canActivateMonsterEffect,
  isMonsterEffectUsedThisRound,
  markMonsterEffectUsed,
  applyApprovedEffectUsage,
  getMonsterUsedRound,
} = require("../src/utils/effectsUsedCore.js");

let failed = 0;

function assert(name, condition) {
  if (!condition) {
    console.error(`FAIL: ${name}`);
    failed += 1;
  } else {
    console.log(`OK: ${name}`);
  }
}

const player = "Alice";
const round = 2;

assert("fresh player can activate", canActivateMonsterEffect(null, player, round));
assert("fresh player not used", !isMonsterEffectUsedThisRound(null, player, round));

const afterJa = markMonsterEffectUsed({}, player, round);
assert(
  "Ja stores round on player",
  getMonsterUsedRound(afterJa, player) === round
);
assert(
  "Ja blocks same round",
  !canActivateMonsterEffect(afterJa, player, round)
);
assert(
  "Ja allows next round",
  canActivateMonsterEffect(afterJa, player, round + 1)
);

const approvedMonster = applyApprovedEffectUsage({}, player, "monster", round);
assert(
  "applyApproved monster marks round",
  isMonsterEffectUsedThisRound(approvedMonster, player, round)
);

const approvedTrap = applyApprovedEffectUsage({}, player, "trap", round);
assert(
  "trap approval does not set monster cooldown",
  getMonsterUsedRound(approvedTrap, player) == null
);
assert(
  "trap approval unchanged effectsUsed",
  approvedTrap.monster === undefined
);

const neinEffectsUsed = {};
assert(
  "Nein voting does not consume monster",
  !isMonsterEffectUsedThisRound(neinEffectsUsed, player, round)
);
assert(
  "Nein leaves effectsUsed empty",
  getMonsterUsedRound(neinEffectsUsed, player) == null
);

const blockedSameRound = markMonsterEffectUsed({}, player, 3);
assert(
  "same round blocked",
  isMonsterEffectUsedThisRound(blockedSameRound, player, 3)
);
assert(
  "new round unblocked",
  canActivateMonsterEffect(blockedSameRound, player, 4)
);

assert(
  "null effectsUsed safe for late join",
  canActivateMonsterEffect(undefined, "LateJoiner", 1)
);
assert(
  "missing player key safe",
  !isMonsterEffectUsedThisRound({ monster: { Alice: 1 } }, null, 1)
);

if (failed > 0) {
  console.error(`\n${failed} test(s) failed`);
  process.exit(1);
}

console.log("\nAll effects-used checks passed.");
