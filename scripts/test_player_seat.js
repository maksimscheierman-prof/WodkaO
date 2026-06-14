#!/usr/bin/env node
/**
 * Player seat name label tests.
 * Run: npm run test:player-seat
 */

const {
  formatSeatNameLine,
  formatSeatStatus,
} = require("../src/utils/playerSeatCore.js");

let failed = 0;

function assert(name, condition) {
  if (!condition) {
    console.error(`FAIL: ${name}`);
    failed += 1;
  } else {
    console.log(`OK: ${name}`);
  }
}

assert("plain name", formatSeatNameLine("Sanfro", false) === "Sanfro");
assert("me suffix", formatSeatNameLine("Sanfro", true) === "Sanfro (Du)");
assert("empty fallback", formatSeatNameLine("", false) === "Spieler");
assert("current turn status", formatSeatStatus({ isCurrentTurn: true }) === "am Zug");
assert(
  "start status only when not current",
  formatSeatStatus({ isStartPlayer: true, isCurrentTurn: false }) === "Start"
);
assert(
  "current turn hides start badge",
  formatSeatStatus({ isStartPlayer: true, isCurrentTurn: true }) === "am Zug"
);
assert("no status", formatSeatStatus({}) === "");

if (failed > 0) {
  console.error(`\n${failed} test(s) failed`);
  process.exit(1);
}

console.log("\nAll player seat checks passed.");
