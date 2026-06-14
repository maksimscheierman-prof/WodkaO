#!/usr/bin/env node
/**
 * Card modal + display tests for gallery/game card detail views.
 * Run: npm run test:card-modal
 */

const {
  normalizeCardForDisplay,
  getCardOpenLog,
  isValidPlayableCard,
} = require("../src/utils/cardDisplayCore.js");
const {
  shouldShowCardModal,
  getGameCardModalSource,
  CARD_MODAL_SOURCES,
} = require("../src/utils/cardModalCore.js");

let failed = 0;

function assert(name, condition) {
  if (!condition) {
    console.error(`FAIL: ${name}`);
    failed += 1;
  } else {
    console.log(`OK: ${name}`);
  }
}

const galleryMonster = {
  name: "Test-Monster",
  effect: "Trink 1",
  type: "MONSTER",
  image: { uri: "https://example.com/m.png" },
};

const gameMonster = {
  name: "Drache",
  effect: "Shot",
  imageName: "drache",
  stars: 3,
};

assert(
  "gallery card normalizes for modal",
  normalizeCardForDisplay(galleryMonster)?.type === "monster"
);
assert(
  "monster card normalizes from imageName",
  normalizeCardForDisplay(gameMonster)?.image?.uri?.includes("drache.png")
);
assert(
  "missing effect fallback",
  normalizeCardForDisplay({ name: "X", type: "monster" })?.effect ===
    "Kein Effekttext verfügbar."
);
assert(
  "missing imageName uses default",
  normalizeCardForDisplay({ name: "X", type: "monster", effect: "Y" })?.image
    ?.uri?.includes("default_card")
);
assert(
  "missing type is unbekannt",
  normalizeCardForDisplay({ name: "X", effect: "Y" })?.type === "unbekannt"
);
assert("null card invalid", !isValidPlayableCard(null));
assert(
  "modal hidden when card null",
  !shouldShowCardModal(true, null)
);
assert(
  "modal visible with valid card",
  shouldShowCardModal(true, galleryMonster)
);
assert(
  "modal hidden when not visible",
  !shouldShowCardModal(false, galleryMonster)
);

const log = getCardOpenLog(galleryMonster, "gallery");
assert("open log has source", log.source === "gallery");
assert("open log has name", log.name === "Test-Monster");
assert("open log valid", log.valid === true);
assert("open log image uri", log.imageKind === "uri");

assert(
  "game monster source",
  getGameCardModalSource("MONSTER") === CARD_MODAL_SOURCES.GAME_MONSTER
);
assert(
  "game trap source",
  getGameCardModalSource("trap") === CARD_MODAL_SOURCES.GAME_TRAP
);

if (failed > 0) {
  console.error(`\n${failed} test(s) failed`);
  process.exit(1);
}

console.log("\nAll card modal checks passed.");
