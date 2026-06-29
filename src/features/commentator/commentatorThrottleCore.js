/**
 * Commentator anti-spam: priorities, queue, cooldown, dedupe (Node-testable).
 * AI/Callable must only run for events that pass this layer.
 */

const MIN_OUTPUT_GAP_MS = 2000;
const EVENT_DEDUPE_MS = 5000;
const MAX_QUEUE_LENGTH = 3;

const PRIORITY_HIGH = 3;
const PRIORITY_MEDIUM = 2;
const PRIORITY_LOW = 1;

/** @typedef {'high'|'medium'|'low'} CommentatorPriorityLabel */

const HIGH_EVENT_TYPES = new Set([
  "GAME_STARTED",
  "VOTE_ACCEPTED",
  "VOTE_REJECTED",
  "PLAYER_PUNISHED",
  "GAME_ENDED",
  "MONSTER_EFFECT_ENABLED",
  "MONSTER_EFFECT_DISABLED",
  "EFFECT_SELECTED",
]);

const MEDIUM_EVENT_TYPES = new Set([
  "CARD_DRAWN",
  "MONSTER_DRAWN",
  "MAGIC_DRAWN",
  "TRAP_DRAWN",
  "MAGIC_PLAYED",
  "TRAP_REPLACED",
  "PLAYER_JOINED",
  "PLAYER_LEFT",
]);

const LOW_EVENT_TYPES = new Set([
  "ROUND_STARTED",
  "VOTE_STARTED",
  "PERSONAL_COMMENT",
  "RUNNING_GAG",
]);

function getEventPriority(eventType) {
  if (HIGH_EVENT_TYPES.has(eventType)) return PRIORITY_HIGH;
  if (MEDIUM_EVENT_TYPES.has(eventType)) return PRIORITY_MEDIUM;
  if (LOW_EVENT_TYPES.has(eventType)) return PRIORITY_LOW;
  return PRIORITY_MEDIUM;
}

function getPriorityLabel(priority) {
  if (priority >= PRIORITY_HIGH) return "high";
  if (priority >= PRIORITY_MEDIUM) return "medium";
  return "low";
}

function buildEventKey(eventType, context = {}) {
  const player = context?.playerName ?? "";
  const card = context?.cardName ?? "";
  const round = context?.round ?? "";
  const reason = context?.reason ?? "";
  return `${eventType}|${player}|${card}|${round}|${reason}`;
}

function createThrottleState() {
  return {
    queue: [],
    lastOutputAt: 0,
    recentEventKeys: new Map(),
    voicePlaying: false,
    displaying: false,
    currentPriority: 0,
  };
}

function resetThrottleState(state) {
  state.queue = [];
  state.lastOutputAt = 0;
  state.recentEventKeys.clear();
  state.voicePlaying = false;
  state.displaying = false;
  state.currentPriority = 0;
}

function isEventRecentlySeen(state, eventType, context, now) {
  const key = buildEventKey(eventType, context);
  const last = state.recentEventKeys.get(key);
  return last != null && now - last < EVENT_DEDUPE_MS;
}

function touchEventKey(state, eventType, context, now) {
  state.recentEventKeys.set(buildEventKey(eventType, context), now);
}

function recordSpokenEvent(state, eventType, context, now) {
  touchEventKey(state, eventType, context, now);
}

const isEventRecentlySpoken = isEventRecentlySeen;

function isOutputBusy(state) {
  return state.voicePlaying || state.displaying;
}

function canEnqueueWhileVoiceBusy(priority) {
  return priority >= PRIORITY_HIGH;
}

function isWithinGlobalCooldown(state, now) {
  return state.lastOutputAt > 0 && now - state.lastOutputAt < MIN_OUTPUT_GAP_MS;
}

function dropLowestQueuedItem(state) {
  if (!state.queue.length) return false;
  let lowestIndex = 0;
  let lowestPriority = state.queue[0].priority;
  for (let i = 1; i < state.queue.length; i += 1) {
    if (state.queue[i].priority < lowestPriority) {
      lowestPriority = state.queue[i].priority;
      lowestIndex = i;
    }
  }
  state.queue.splice(lowestIndex, 1);
  return true;
}

/**
 * Decide whether to enqueue a pending commentary event (before AI/Callable).
 * @returns {{ action: 'enqueue'|'drop'|'interrupt', reason?: string, entry?: object, interrupt?: boolean }}
 */
function planEventEnqueue(state, { eventType, context }, now = Date.now()) {
  const priority = getEventPriority(eventType);

  if (isEventRecentlySeen(state, eventType, context, now)) {
    return { action: "drop", reason: "dedupe" };
  }

  if (isOutputBusy(state) && !canEnqueueWhileVoiceBusy(priority)) {
    return { action: "drop", reason: "voice_busy" };
  }

  const entry = {
    eventType,
    context: context ?? {},
    priority,
    priorityLabel: getPriorityLabel(priority),
    enqueuedAt: now,
  };

  const needsInterrupt =
    priority >= PRIORITY_HIGH && isOutputBusy(state);

  if (needsInterrupt) {
    state.queue = state.queue.filter((item) => item.priority >= PRIORITY_HIGH);
    touchEventKey(state, eventType, context, now);
    return { action: "interrupt", entry, interrupt: true };
  }

  if (state.queue.length >= MAX_QUEUE_LENGTH) {
    if (priority <= PRIORITY_LOW) {
      return { action: "drop", reason: "queue_full" };
    }
    dropLowestQueuedItem(state);
  }

  state.queue.push(entry);
  state.queue.sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority;
    return a.enqueuedAt - b.enqueuedAt;
  });

  touchEventKey(state, eventType, context, now);
  return { action: "enqueue", entry };
}

/**
 * Whether the next queued item may start resolution/output now.
 */
function canDequeueForOutput(state, now = Date.now()) {
  if (!state.queue.length) {
    return { ok: false, reason: "empty" };
  }

  const next = state.queue[0];
  const withinCooldown = isWithinGlobalCooldown(state, now);

  if (withinCooldown && next.priority < PRIORITY_HIGH) {
    return { ok: false, reason: "cooldown", waitMs: MIN_OUTPUT_GAP_MS - (now - state.lastOutputAt) };
  }

  if (isOutputBusy(state) && next.priority < PRIORITY_HIGH) {
    return { ok: false, reason: "voice_busy" };
  }

  if (isOutputBusy(state) && next.priority >= PRIORITY_HIGH) {
    return { ok: true, interrupt: true, entry: next };
  }

  return { ok: true, entry: next };
}

function dequeueEvent(state) {
  return state.queue.shift() ?? null;
}

function markOutputStarted(state, priority, now = Date.now()) {
  state.lastOutputAt = now;
  state.displaying = true;
  state.currentPriority = priority;
}

function markOutputEnded(state) {
  state.displaying = false;
  state.currentPriority = 0;
}

function setVoicePlaying(state, playing) {
  state.voicePlaying = !!playing;
}

module.exports = {
  MIN_OUTPUT_GAP_MS,
  EVENT_DEDUPE_MS,
  MAX_QUEUE_LENGTH,
  PRIORITY_HIGH,
  PRIORITY_MEDIUM,
  PRIORITY_LOW,
  getEventPriority,
  getPriorityLabel,
  buildEventKey,
  createThrottleState,
  resetThrottleState,
  isEventRecentlySpoken,
  recordSpokenEvent,
  planEventEnqueue,
  canDequeueForOutput,
  dequeueEvent,
  markOutputStarted,
  markOutputEnded,
  setVoicePlaying,
  isOutputBusy,
  isWithinGlobalCooldown,
};
