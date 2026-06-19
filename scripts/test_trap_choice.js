#!/usr/bin/env node
/**
 * Trap choice flow tests (second trap drawn).
 * Run: npm run test:trap-choice
 */

const fs = require("fs");
const path = require("path");

const {
  shouldStartTrapChoice,
  buildPendingTrapChoice,
  applyTrapChoiceUpdate,
  applyTrapDrawNoChoice,
  canResolveTrapChoice,
  isTrapChoiceForPlayer,
  shouldAutoResolveTrapChoice,
  TRAP_CHOICE_TIMEOUT_CHOICE,
} = require("../src/utils/trapChoiceCore.js");

let failed = 0;

function assert(name, condition) {
  if (!condition) {
    console.error(`FAIL: ${name}`);
    failed += 1;
  } else {
    console.log(`OK: ${name}`);
  }
}

const oldTrap = {
  name: "Alte Falle",
  effect: "Trink 1",
  type: "TRAP",
  imageName: "falle_alt",
};

const newTrap = {
  name: "Neue Falle",
  effect: "Trink 2",
  type: "TRAP",
  imageName: "falle_neu",
};

const playerA = { name: "Alice", trap: null };
const playerB = { name: "Bob", trap: oldTrap };

function baseLobby(overrides = {}) {
  return {
    gamePhase: "playing",
    turn: 0,
    round: 2,
    players: [
      { ...playerA, trap: oldTrap },
      { name: "Bob", trap: null },
    ],
    discardPile: [],
    saufDeck: [{ name: "X", type: "MAGIC" }],
    ...overrides,
  };
}

assert(
  "no trap on player → no choice flow",
  !shouldStartTrapChoice({ name: "Alice", trap: null }, newTrap)
);
assert(
  "player with trap + trap draw → choice",
  shouldStartTrapChoice({ name: "Alice", trap: oldTrap }, newTrap)
);

const noChoiceLobby = baseLobby({
  players: [{ name: "Alice", trap: null }, { name: "Bob", trap: null }],
});
const noChoiceResult = applyTrapDrawNoChoice(noChoiceLobby, 0, newTrap);
assert("no existing trap → trap stored", noChoiceResult.players[0].trap?.name === "Neue Falle");
assert("no existing trap → turn advances", noChoiceResult.turn === 1);
assert("no existing trap → no pending", noChoiceResult.pendingTrapChoice === null);

const pending = buildPendingTrapChoice("Alice", oldTrap, newTrap, 1000);
const pendingLobby = baseLobby({
  pendingTrapChoice: pending,
  saufDeck: [],
});

assert("pending set for chooser", isTrapChoiceForPlayer(pending, "Alice"));
assert("pending hidden from others", !isTrapChoiceForPlayer(pending, "Bob"));
assert("only active chooser can resolve", canResolveTrapChoice(pendingLobby, "Alice"));
assert("non-active cannot resolve", !canResolveTrapChoice(pendingLobby, "Bob"));

const keepOld = applyTrapChoiceUpdate(pendingLobby, "keep_existing");
assert("keep old → trap unchanged name", keepOld.players[0].trap?.name === "Alte Falle");
assert("keep old → new in discard", keepOld.discardPile.length === 1);
assert(
  "keep old → discarded is new trap",
  keepOld.discardPile[0]?.name === "Neue Falle"
);
assert("keep old → pending cleared", keepOld.pendingTrapChoice === null);
assert("keep old → turn advances", keepOld.turn === 1);

const keepNew = applyTrapChoiceUpdate(pendingLobby, "keep_drawn");
assert("keep new → trap is new", keepNew.players[0].trap?.name === "Neue Falle");
assert("keep new → old in discard", keepNew.discardPile[0]?.name === "Alte Falle");
assert("keep new → pending cleared", keepNew.pendingTrapChoice === null);

const afterResolve = {
  ...pendingLobby,
  pendingTrapChoice: null,
  players: keepOld.players,
  discardPile: keepOld.discardPile,
  turn: keepOld.turn,
};
assert(
  "double resolve blocked after pending cleared",
  !canResolveTrapChoice(afterResolve, "Alice")
);
assert(
  "second discard not duplicated",
  applyTrapChoiceUpdate(afterResolve, "keep_existing") === null
);

assert(
  "timeout uses keep_existing",
  TRAP_CHOICE_TIMEOUT_CHOICE === "keep_existing"
);
assert(
  "auto resolve when timer elapsed",
  shouldAutoResolveTrapChoice({ startedAt: Date.now() - 61_000 })
);

const trapModalSrc = fs.readFileSync(
  path.join(__dirname, "../src/components/TrapChoiceModal.js"),
  "utf8"
);
assert(
  "TrapChoiceModal uses TemplateCardRenderer",
  trapModalSrc.includes("TemplateCardRenderer")
);
assert(
  "TrapChoiceModal uses trap fallback",
  trapModalSrc.includes('fallbackType="trap"')
);
assert(
  "TrapChoiceModal has ScrollView for small screens",
  trapModalSrc.includes("ScrollView")
);
assert(
  "TrapChoiceModal keep old button",
  trapModalSrc.includes("Alte Falle behalten")
);
assert(
  "TrapChoiceModal keep new button",
  trapModalSrc.includes("Neue Falle behalten")
);

const gameActionsSrc = fs.readFileSync(
  path.join(__dirname, "../src/utils/gameActions.js"),
  "utf8"
);
assert(
  "handleDraw sets pendingTrapChoice",
  gameActionsSrc.includes("pendingTrapChoice")
);
assert(
  "handleResolveTrapChoice exported",
  gameActionsSrc.includes("handleResolveTrapChoice")
);

if (failed > 0) {
  console.error(`\n${failed} test(s) failed`);
  process.exit(1);
}

console.log("\nAll trap choice checks passed.");
