#!/usr/bin/env node
/**
 * Session resume routing tests.
 * Run: node scripts/test_session_resume.js
 */

const {
  getResumeRoute,
  isSessionStale,
  LOBBY_STATUS,
} = require("../src/utils/sessionResumeCore.js");

let failed = 0;

function assert(name, condition) {
  if (!condition) {
    console.error(`FAIL: ${name}`);
    failed += 1;
  } else {
    console.log(`OK: ${name}`);
  }
}

const session = { playerName: "Alice", lobbyId: "ABCDE", updatedAt: Date.now() };

assert(
  "waiting -> lobby",
  getResumeRoute({ status: LOBBY_STATUS.WAITING }, session).pathname === "/lobby"
);

assert(
  "playing -> game",
  getResumeRoute(
    { status: LOBBY_STATUS.PLAYING, gamePhase: "rollingForStartPlayer" },
    session
  ).pathname === "/game"
);

assert(
  "drawingMonsters -> game",
  getResumeRoute(
    { status: LOBBY_STATUS.PLAYING, gamePhase: "drawingMonsters" },
    session
  ).pathname === "/game"
);

assert(
  "expired clears",
  getResumeRoute({ status: LOBBY_STATUS.EXPIRED }, session).action === "clear"
);

assert(
  "finished clears",
  getResumeRoute({ status: LOBBY_STATUS.FINISHED }, session).action === "clear"
);

assert(
  "not found clears",
  getResumeRoute(null, session).action === "clear"
);

assert("fresh session not stale", !isSessionStale({ updatedAt: Date.now() }));
assert(
  "old session stale",
  isSessionStale({ updatedAt: Date.now() - 8 * 24 * 60 * 60 * 1000 })
);

if (failed > 0) {
  console.error(`\n${failed} test(s) failed`);
  process.exit(1);
}

console.log("\nAll session resume checks passed.");
