#!/usr/bin/env node
/**
 * Commentator throttle / queue tests (client anti-spam).
 * Run: npm run test:commentator-throttle
 */

const {
  MIN_OUTPUT_GAP_MS,
  EVENT_DEDUPE_MS,
  MAX_QUEUE_LENGTH,
  PRIORITY_HIGH,
  PRIORITY_LOW,
  createThrottleState,
  planEventEnqueue,
  canDequeueForOutput,
  dequeueEvent,
  markOutputStarted,
  markOutputEnded,
  recordSpokenEvent,
  setVoicePlaying,
  getEventPriority,
} = require("../src/features/commentator/commentatorThrottleCore.js");

let failed = 0;

function assert(name, condition) {
  if (!condition) {
    console.error(`FAIL: ${name}`);
    failed += 1;
  } else {
    console.log(`OK: ${name}`);
  }
}

function runPipeline(state, events, startAt = 1_000_000) {
  let aiCalls = 0;
  const spoken = [];
  let t = startAt;

  for (const ev of events) {
    planEventEnqueue(state, ev, t);
  }

  let guard = 0;
  while (state.queue.length > 0 && guard < 50) {
    guard += 1;
    const gate = canDequeueForOutput(state, t);
    if (!gate.ok) {
      if (gate.reason === "cooldown") {
        t += gate.waitMs ?? MIN_OUTPUT_GAP_MS;
        continue;
      }
      if (gate.reason === "voice_busy") {
        t += 250;
        continue;
      }
      break;
    }

    const entry = dequeueEvent(state);
    if (!entry) break;

    aiCalls += 1;
    markOutputStarted(state, entry.priority, t);
    recordSpokenEvent(state, entry.eventType, entry.context, t);
    spoken.push(entry.eventType);
    markOutputEnded(state);
    t += MIN_OUTPUT_GAP_MS;
  }

  return { aiCalls, spoken, endAt: t };
}

assert("PLAYER_PUNISHED is high priority", getEventPriority("PLAYER_PUNISHED") === PRIORITY_HIGH);
assert("ROUND_STARTED is low priority", getEventPriority("ROUND_STARTED") === PRIORITY_LOW);
assert("VOTE_ACCEPTED maps to high", getEventPriority("VOTE_ACCEPTED") === PRIORITY_HIGH);

const dedupeState = createThrottleState();
planEventEnqueue(
  dedupeState,
  { eventType: "MAGIC_PLAYED", context: { playerName: "Max", cardName: "Feuerball" } },
  1000
);
const dupPlan = planEventEnqueue(
  dedupeState,
  { eventType: "MAGIC_PLAYED", context: { playerName: "Max", cardName: "Feuerball" } },
  1500
);
assert("duplicate event within 5s is dropped", dupPlan.action === "drop" && dupPlan.reason === "dedupe");

const gapState = createThrottleState();
const burst = runPipeline(gapState, [
  { eventType: "CARD_DRAWN", context: { playerName: "A", cardName: "X" } },
  { eventType: "CARD_DRAWN", context: { playerName: "B", cardName: "Y" } },
]);
assert("two outputs respect global gap", burst.aiCalls === 2);
assert(
  "outputs spaced at least MIN_OUTPUT_GAP_MS",
  burst.endAt - 1_000_000 >= MIN_OUTPUT_GAP_MS
);

const voiceBusyState = createThrottleState();
setVoicePlaying(voiceBusyState, true);
voiceBusyState.displaying = true;
const blocked = planEventEnqueue(
  voiceBusyState,
  { eventType: "MAGIC_PLAYED", context: { playerName: "Max" } },
  2000
);
assert("medium blocked while voice plays", blocked.action === "drop" && blocked.reason === "voice_busy");

const interruptPlan = planEventEnqueue(
  voiceBusyState,
  { eventType: "PLAYER_PUNISHED", context: { playerName: "Max" } },
  2001
);
assert("high priority can interrupt", interruptPlan.action === "interrupt");

const fullQueue = createThrottleState();
for (let i = 0; i < MAX_QUEUE_LENGTH; i += 1) {
  planEventEnqueue(
    fullQueue,
    { eventType: "ROUND_STARTED", context: { round: i + 1 } },
    3000 + i
  );
}
assert("queue fills to max", fullQueue.queue.length === MAX_QUEUE_LENGTH);

const highWhileFull = planEventEnqueue(
  fullQueue,
  { eventType: "GAME_ENDED", context: {} },
  3100
);
assert(
  "high enqueued when queue full drops lower priority item",
  highWhileFull.action === "enqueue" &&
    fullQueue.queue.length === MAX_QUEUE_LENGTH &&
    fullQueue.queue.some((item) => item.eventType === "GAME_ENDED")
);

const aiCostState = createThrottleState();
const burstEvents = [
  { eventType: "ROUND_STARTED", context: { round: 1 } },
  { eventType: "ROUND_STARTED", context: { round: 1 } },
  { eventType: "VOTE_STARTED", context: { round: 1 } },
  { eventType: "CARD_DRAWN", context: { playerName: "A", cardName: "Z" } },
];
const costResult = runPipeline(aiCostState, burstEvents, 5000);
assert(
  "dedupe prevents duplicate AI resolution",
  costResult.aiCalls < burstEvents.length
);
assert(
  "callable only for dequeued spoken events",
  costResult.aiCalls === costResult.spoken.length
);

if (failed > 0) {
  console.error(`\n${failed} test(s) failed`);
  process.exit(1);
}

console.log("\nAll commentator throttle checks passed.");
