#!/usr/bin/env node
/**
 * Card modal + display tests for gallery/game card detail views.
 * Run: npm run test:card-modal
 */

const {
  normalizeCardForDisplay,
  getCardOpenLog,
  isValidPlayableCard,
  getMonsterPressLog,
  getNativeImageSourceFromCard,
} = require("../src/utils/cardDisplayCore.js");
const {
  shouldShowCardModal,
  getGameCardModalSource,
  CARD_MODAL_SOURCES,
} = require("../src/utils/cardModalCore.js");
const { getFrameAssetPath } = require("../src/utils/cardFrameCore.js");

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

const unsafeMonster = normalizeCardForDisplay(
  {
    name: "Crash",
    effect: "x",
    type: "MONSTER",
    image: { uri: "" },
  },
  { defaultType: "monster" }
);
assert(
  "empty uri monster still opens modal",
  shouldShowCardModal(true, unsafeMonster)
);
assert(
  "game monster press never undefined image",
  getNativeImageSourceFromCard({ name: "M", imageName: "drache" })?.uri != null
);
const gamePress = getMonsterPressLog(
  { name: "Drache", imageName: "drache", effect: "Shot" },
  { playerKey: "seat-1", defaultType: "monster" }
);
assert("game monster press log valid", gamePress.valid === true);
assert("game monster press source type", gamePress.sourceType === "uri");

const monster = normalizeCardForDisplay(gameMonster);
assert(
  "monster modal resolves frame path",
  getFrameAssetPath(monster?.type).endsWith("monster_frame.png")
);

const votingMonster = normalizeCardForDisplay(
  {
    name: "Drache",
    effect: "Alle trinken 2 Shots",
    type: "MONSTER",
    imageName: "drache",
    atk: 5,
    def: 3,
  },
  { defaultType: "monster" }
);
assert(
  "voting activeEffect has effect text",
  votingMonster.effect.includes("trinken")
);
assert(
  "voting activeEffect uses monster frame",
  getFrameAssetPath(votingMonster.type).endsWith("monster_frame.png")
);
assert("voting activeEffect has atk", votingMonster.atk === 5);
assert("voting activeEffect has def", votingMonster.def === 3);

if (failed > 0) {
  console.error(`\n${failed} test(s) failed`);
  process.exit(1);
}

console.log("\nAll card modal checks passed.");
