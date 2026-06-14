/** Pure helpers for player seat name display (no React). */

function formatSeatStatus({ isCurrentTurn, isStartPlayer }) {
  const parts = [];
  if (isCurrentTurn) parts.push("am Zug");
  if (isStartPlayer && !isCurrentTurn) parts.push("Start");
  return parts.join(" · ");
}

function formatSeatNameLine(name, isMe) {
  const base = (name || "Spieler").trim() || "Spieler";
  return isMe ? `${base} (Du)` : base;
}

module.exports = {
  formatSeatStatus,
  formatSeatNameLine,
};
