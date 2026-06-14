#!/usr/bin/env node
/**
 * Card display normalization tests.
 * Run: node scripts/test_card_display.js
 */

const {
  normalizeCardForDisplay,
  normalizeCardImage,
  isValidPlayableCard,
  DEFAULT_CARD_IMAGE_URI,
} = require("../src/utils/cardDisplayCore.js");

let failed = 0;

function assert(name, condition) {
  if (!condition) {
    console.error(`FAIL: ${name}`);
    failed += 1;
  } else {
    console.log(`OK: ${name}`);
  }
}

const fullCard = {
  name: "Drache",
  effect: "Trink 2",
  type: "MONSTER",
  stars: 4,
  atk: 100,
  def: 200,
  image: { uri: "https://example.com/card.png" },
};

const normalized = normalizeCardForDisplay(fullCard);
assert("full card normalizes", normalized?.name === "Drache");
assert("full card image kept", normalized?.image?.uri === "https://example.com/card.png");

const noEffect = normalizeCardForDisplay({ name: "X", type: "monster" });
assert("missing effect fallback", noEffect?.effect === "Kein Effekttext verfügbar.");

const noImage = normalizeCardForDisplay({ name: "X", type: "monster", effect: "Y" });
assert(
  "missing image fallback",
  noImage?.image?.uri === DEFAULT_CARD_IMAGE_URI
);

const noName = normalizeCardForDisplay({ type: "monster", effect: "Y" });
assert("missing name fallback", noName?.name === "Unbekannte Karte");

assert("null card invalid", !isValidPlayableCard(null));
assert("empty object still valid", isValidPlayableCard({}));

const lateJoinMonster = normalizeCardForDisplay({
  name: "Late",
  effect: "Shot",
  type: "MONSTER",
  image: { uri: "https://cdn.test/monster.png" },
});
assert("late join monster opens", lateJoinMonster?.type === "monster");

assert(
  "undefined image uses default",
  normalizeCardImage(undefined).uri === DEFAULT_CARD_IMAGE_URI
);

assert(
  "string image becomes uri object",
  normalizeCardImage("https://a.com/b.png").uri === "https://a.com/b.png"
);

const hugeStars = normalizeCardForDisplay({ name: "S", type: "monster", stars: 99 });
assert("stars capped at 12", hugeStars.stars === 12);

if (failed > 0) {
  console.error(`\n${failed} test(s) failed`);
  process.exit(1);
}

console.log("\nAll card display checks passed.");
