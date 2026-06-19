#!/usr/bin/env node
/**
 * Card modal debug helpers.
 * Run: node scripts/test_card_modal_debug.js
 */

const {
  createCardModalDebugStore,
  isCardModalDebugEnabled,
  isAndroidSafeModalForced,
} = require("../src/utils/cardModalDebugCore.js");

let failed = 0;

function assert(name, condition) {
  if (!condition) {
    console.error(`FAIL: ${name}`);
    failed += 1;
  } else {
    console.log(`OK: ${name}`);
  }
}

assert(
  "debug off without explicit flag",
  !isCardModalDebugEnabled({ NODE_ENV: "development" })
);
assert(
  "debug on with EXPO_PUBLIC_CARD_MODAL_DEBUG=1 in prod",
  isCardModalDebugEnabled({ NODE_ENV: "production", EXPO_PUBLIC_CARD_MODAL_DEBUG: "1" })
);
assert(
  "safe android forced with flag",
  isAndroidSafeModalForced({ EXPO_PUBLIC_CARD_MODAL_SAFE_ANDROID: "1" })
);

const store = createCardModalDebugStore();
store.recordEvent("board_press", { name: "Drache", type: "monster" });
store.recordEvent("modal_open", { modalOpen: true, imageUri: "https://x/y.png" });
const snap = store.getSnapshot();
assert("snapshot stores tap name", snap.lastTapName === "Drache");
assert("snapshot modal open", snap.modalOpen === true);
assert("events capped", store.getEvents().length === 2);

if (failed > 0) {
  console.error(`\n${failed} test(s) failed`);
  process.exit(1);
}

console.log("\nAll card modal debug checks passed.");
