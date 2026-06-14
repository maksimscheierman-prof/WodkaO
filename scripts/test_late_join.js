#!/usr/bin/env node
/**
 * Smoke tests for late-join logic (no Firestore).
 * Run: node scripts/test_late_join.js
 */

const { LOBBY_STATUS } = require("../src/utils/lobbyLifecycleCore.js");
const {
  applyLateJoin,
  drawRandomMonster,
  findLowestFreeSeat,
} = require("../src/utils/lateJoinCore.js");

let failed = 0;

function assert(name, condition) {
  if (!condition) {
    console.error(`FAIL: ${name}`);
    failed += 1;
  } else {
    console.log(`OK: ${name}`);
  }
}

const monsterA = { id: "m1", name: "Monster A" };
const monsterB = { id: "m2", name: "Monster B" };
const monsterC = { id: "m3", name: "Monster C" };

assert(
  "lowest free seat with gaps",
  findLowestFreeSeat([
    { seatIndex: 0 },
    { seatIndex: 2 },
  ]) === 1
);

assert(
  "draw removes one card",
  drawRandomMonster([monsterA, monsterB], () => 0).monsterDeck.length === 1
);

assert(
  "empty deck returns no monster",
  drawRandomMonster([]).monster === null
);

const waitingLobby = {
  status: LOBBY_STATUS.WAITING,
  players: [{ name: "Host", seatIndex: 0 }],
  monsterDeck: [monsterA],
};

const waitingJoin = applyLateJoin(waitingLobby, "Bob", "2", { now: 1000 });
assert("waiting join succeeds", !waitingJoin.error);
assert("waiting join no monster", waitingJoin.newPlayer.monster === null);
assert("waiting join ready false", waitingJoin.newPlayer.ready === false);
assert(
  "waiting join appends player",
  waitingJoin.updates.players.length === 2
);

const playingLobby = {
  status: LOBBY_STATUS.PLAYING,
  gamePhase: "playing",
  turn: 0,
  players: [
    { name: "Host", monster: monsterC, seatIndex: 0 },
    { name: "Alice", monster: monsterB, seatIndex: 1 },
  ],
  monsterDeck: [monsterA, monsterB],
  reactions: { Host: { done: true }, Alice: { done: false } },
  votes: { ja: [], nein: [] },
};

const lateJoin = applyLateJoin(playingLobby, "Charlie", "3", {
  now: 2000,
  randomFn: () => 0,
});

assert("late join succeeds", !lateJoin.error);
assert("late join draws monster", lateJoin.hadMonster === true);
assert("late join no trap", lateJoin.newPlayer.trap === null);
assert(
  "late join keeps turn unchanged in patch",
  lateJoin.updates.turn === undefined
);
assert(
  "late join does not reset votes",
  lateJoin.updates.votes === undefined
);
assert(
  "late join appends at end",
  lateJoin.updates.players[2].name === "Charlie"
);
assert(
  "late join shrinks monster deck",
  lateJoin.updates.monsterDeck.length === 1
);
assert(
  "late join adds reaction entry",
  lateJoin.updates.reactions.Charlie?.done === false
);
assert(
  "late join announcement set",
  lateJoin.updates.lastJoinAnnouncement?.name === "Charlie"
);

const emptyDeckJoin = applyLateJoin(
  {
    ...playingLobby,
    monsterDeck: [],
  },
  "Dave",
  "4",
  { now: 3000 }
);
assert("empty deck still joins", !emptyDeckJoin.error);
assert("empty deck no monster", emptyDeckJoin.hadMonster === false);
assert(
  "empty deck message mentions no monster",
  emptyDeckJoin.message.includes("Kein Monster")
);

const finishedBlock = applyLateJoin(
  { status: LOBBY_STATUS.FINISHED, players: [] },
  "Eve",
  "5"
);
assert("finished lobby blocked", finishedBlock.error === "FINISHED");

const fullLobby = applyLateJoin(
  {
    status: LOBBY_STATUS.WAITING,
    players: Array.from({ length: 8 }, (_, i) => ({ name: `P${i}` })),
  },
  "Full",
  "6"
);
assert("full lobby blocked", fullLobby.error === "LOBBY_FULL");

if (failed > 0) {
  console.error(`\n${failed} test(s) failed`);
  process.exit(1);
}

console.log("\nAll late-join checks passed.");
