/** Monster effect once-per-round tracking (Node-testable). */

function getMonsterUsedRound(effectsUsed, playerKey) {
  if (!effectsUsed || !playerKey) return null;
  const round = effectsUsed?.monster?.[playerKey];
  return typeof round === "number" ? round : null;
}

function isMonsterEffectUsedThisRound(effectsUsed, playerKey, currentRound) {
  if (playerKey == null || currentRound == null) return false;
  const usedRound = getMonsterUsedRound(effectsUsed, playerKey);
  return usedRound === currentRound;
}

function canActivateMonsterEffect(effectsUsed, playerKey, currentRound) {
  return !isMonsterEffectUsedThisRound(effectsUsed, playerKey, currentRound);
}

function markMonsterEffectUsed(effectsUsed, playerKey, currentRound) {
  return {
    ...(effectsUsed || {}),
    monster: {
      ...(effectsUsed?.monster || {}),
      [playerKey]: currentRound,
    },
  };
}

/** Apply Ja-vote outcome for monster/trap — traps discard only, no cooldown. */
function applyApprovedEffectUsage(effectsUsed, playerKey, cardType, currentRound) {
  const type = String(cardType || "").toLowerCase();
  if (type === "monster") {
    return markMonsterEffectUsed(effectsUsed, playerKey, currentRound);
  }
  return effectsUsed || {};
}

module.exports = {
  getMonsterUsedRound,
  isMonsterEffectUsedThisRound,
  canActivateMonsterEffect,
  markMonsterEffectUsed,
  applyApprovedEffectUsage,
};
