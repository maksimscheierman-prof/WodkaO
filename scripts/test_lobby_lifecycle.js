#!/usr/bin/env node
/**
 * Smoke tests for lobby expiry logic (no Firestore).
 * Run: node scripts/test_lobby_lifecycle.js
 */

const {
  LOBBY_INACTIVITY_MS,
  LOBBY_STATUS,
  getLastActivityMillis,
  isLobbyExpired,
  isLobbyJoinable,
} = require("../src/utils/lobbyLifecycleCore.js");

const now = Date.now();
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
  "active lobby joinable",
  isLobbyJoinable({
    status: LOBBY_STATUS.WAITING,
    lastActivityAt: now - 1000,
  })
);

assert(
  "expired status not joinable",
  !isLobbyJoinable({ status: LOBBY_STATUS.EXPIRED, lastActivityAt: now })
);

assert(
  "stale lobby not joinable",
  !isLobbyJoinable({
    status: LOBBY_STATUS.WAITING,
    lastActivityAt: now - LOBBY_INACTIVITY_MS - 1,
  })
);

assert(
  "legacy createdAt used when no lastActivityAt",
  getLastActivityMillis({ createdAt: 12345 }) === 12345
);

assert(
  "updatedAt fallback when lastActivityAt missing",
  getLastActivityMillis({ updatedAt: 99999, createdAt: 1 }) === 99999
);

assert(
  "isLobbyExpired after 2h inactivity",
  isLobbyExpired(
    {
      status: LOBBY_STATUS.PLAYING,
      lastActivityAt: now - LOBBY_INACTIVITY_MS - 5000,
    },
    now
  )
);

assert(
  "finished lobby not expired",
  !isLobbyExpired({ status: LOBBY_STATUS.FINISHED, lastActivityAt: 0 }, now)
);

if (failed > 0) {
  console.error(`\n${failed} test(s) failed`);
  process.exit(1);
}

console.log("\nAll lobby lifecycle checks passed.");
