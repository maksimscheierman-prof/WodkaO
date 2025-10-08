// src/config/timers.js

// Alle Timer-Keys an einem Ort – füge hier neue hinzu
export const TIMER_KEYS = [
  "reactionSeconds",
  "votingSeconds",
  "ackSeconds",
  "discardSeconds",
];

// Default-Werte (einmalig gepflegt)
export const DEFAULT_TIMERS = {
  reactionSeconds: 60,
  votingSeconds: 30,
  ackSeconds: 10,
  discardSeconds: 10,
};

// Beim Lesen: Defaults + Lobby-Overrides mergen
export const getTimers = (lobby) => ({
  ...DEFAULT_TIMERS,
  ...(lobby?.timers || {}),
});

// Optionale Sanitizer (stellt sicher: Zahlen, min/max)
export const sanitizeTimers = (t = {}, { min = 1, max = 3600 } = {}) =>
  TIMER_KEYS.reduce((acc, key) => {
    const raw = t[key] ?? DEFAULT_TIMERS[key];
    const num = Number(raw);
    const val = Number.isFinite(num)
      ? Math.min(Math.max(num, min), max)
      : DEFAULT_TIMERS[key];
    acc[key] = val;
    return acc;
  }, {});

// Praktisch zum Zurücksetzen der Start-Timestamps
export const EMPTY_TIMER_STARTS = {
  reactionsStartedAt: null,
  votingStartedAt: null,
  resultStartedAt: null,
  discardStartedAt: null,
};
