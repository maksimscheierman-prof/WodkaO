#!/usr/bin/env node
/**
 * Smoke tests for lobby expiry logic (no Firestore).
 * Run: node scripts/test_lobby_lifecycle.js
 */

const {
  LOBBY_INACTIVITY_MS,
  LOBBY_PLAYING_INACTIVITY_MS,
  LOBBY_WAITING_INACTIVITY_MS,
  LOBBY_STATUS,
  FINISHED_LOBBY_MESSAGE,
  getInactivityLimitMs,
  getLastActivityMillis,
  isLobbyExpired,
  isLobbyJoinable,
  isLobbyTerminated,
  shouldRunLobbyBackgroundServices,
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
  "waiting lobby expires after 30 minutes",
  isLobbyExpired(
    {
      status: LOBBY_STATUS.WAITING,
      lastActivityAt: now - LOBBY_WAITING_INACTIVITY_MS - 1,
    },
    now
  )
);

assert(
  "waiting lobby still active before 30 minutes",
  !isLobbyExpired(
    {
      status: LOBBY_STATUS.WAITING,
      lastActivityAt: now - LOBBY_WAITING_INACTIVITY_MS + 60000,
    },
    now
  )
);

assert(
  "playing lobby expires after 2 hours",
  isLobbyExpired(
    {
      status: LOBBY_STATUS.PLAYING,
      lastActivityAt: now - LOBBY_PLAYING_INACTIVITY_MS - 5000,
    },
    now
  )
);

assert(
  "stale waiting lobby not joinable",
  !isLobbyJoinable({
    status: LOBBY_STATUS.WAITING,
    lastActivityAt: now - LOBBY_WAITING_INACTIVITY_MS - 1,
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
  "isLobbyExpired after 2h inactivity for playing",
  isLobbyExpired(
    {
      status: LOBBY_STATUS.PLAYING,
      lastActivityAt: now - LOBBY_INACTIVITY_MS - 5000,
    },
    now
  )
);

assert(
  "finished lobby not expired by time",
  !isLobbyExpired({ status: LOBBY_STATUS.FINISHED, lastActivityAt: 0 }, now)
);

assert(
  "finished lobby not joinable",
  !isLobbyJoinable({ status: LOBBY_STATUS.FINISHED, lastActivityAt: now })
);

assert(
  "playing lobby joinable",
  isLobbyJoinable({
    status: LOBBY_STATUS.PLAYING,
    lastActivityAt: now - 1000,
  })
);

assert(
  "waiting inactivity limit is 30 minutes",
  getInactivityLimitMs({ status: LOBBY_STATUS.WAITING }) === LOBBY_WAITING_INACTIVITY_MS
);

assert(
  "playing inactivity limit is 2 hours",
  getInactivityLimitMs({ status: LOBBY_STATUS.PLAYING }) === LOBBY_PLAYING_INACTIVITY_MS
);

assert("isLobbyTerminated for finished", isLobbyTerminated({ status: LOBBY_STATUS.FINISHED }));
assert("isLobbyTerminated for expired", isLobbyTerminated({ status: LOBBY_STATUS.EXPIRED }));
assert(
  "isLobbyTerminated false for waiting",
  !isLobbyTerminated({ status: LOBBY_STATUS.WAITING })
);

assert(
  "background services off for finished",
  !shouldRunLobbyBackgroundServices({ status: LOBBY_STATUS.FINISHED, lastActivityAt: now })
);

assert(
  "background services off for expired",
  !shouldRunLobbyBackgroundServices({ status: LOBBY_STATUS.EXPIRED, lastActivityAt: now })
);

assert(
  "background services on for active playing lobby",
  shouldRunLobbyBackgroundServices({
    status: LOBBY_STATUS.PLAYING,
    lastActivityAt: now - 1000,
  })
);

assert(
  "background services off for stale waiting lobby",
  !shouldRunLobbyBackgroundServices(
    {
      status: LOBBY_STATUS.WAITING,
      lastActivityAt: now - LOBBY_WAITING_INACTIVITY_MS - 1,
    },
    now
  )
);

assert("finished message defined", typeof FINISHED_LOBBY_MESSAGE === "string");

if (failed > 0) {
  console.error(`\n${failed} test(s) failed`);
  process.exit(1);
}

console.log("\nAll lobby lifecycle checks passed.");
