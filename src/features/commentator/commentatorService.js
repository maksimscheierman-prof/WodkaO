import { DEFAULT_COMMENTATOR_SETTINGS } from "./commentatorSettingsCore";
import { resolvePersonalityForComment } from "./commentatorPersonalityCommentCore";
import { getSessionStatRemark } from "./commentatorSessionStats";
import { COMMENTATOR_TEXTS_BY_STYLE } from "./commentatorTexts";
import { COMMENTATOR_STYLES } from "./commentatorStyles";

function pickRandom(items) {
  if (!items?.length) return null;
  return items[Math.floor(Math.random() * items.length)];
}

function formatTemplate(template, context = {}) {
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    const value = context[key];
    return value != null && value !== "" ? String(value) : "";
  });
}

function resolveStylePool(style) {
  return (
    COMMENTATOR_TEXTS_BY_STYLE[style] ||
    COMMENTATOR_TEXTS_BY_STYLE[COMMENTATOR_STYLES.LOCKER]
  );
}

/**
 * Liefert einen Kommentar-Text für ein Spielereignis oder null wenn deaktiviert.
 * @param {string} eventType
 * @param {object} [context]
 * @param {{ commentatorEnabled?: boolean, commentatorStyle?: string }} [settings]
 * @param {object|null} [sessionStats]
 * @param {{ commentatorPersonality?: object, players?: object[], random?: number }} [options]
 * @returns {string|null}
 */
export function getCommentary(
  eventType,
  context = {},
  settings = DEFAULT_COMMENTATOR_SETTINGS,
  sessionStats = null,
  options = {}
) {
  const enabled =
    settings?.commentatorEnabled ?? DEFAULT_COMMENTATOR_SETTINGS.commentatorEnabled;
  if (!enabled) return null;

  const style =
    settings?.commentatorStyle ?? DEFAULT_COMMENTATOR_SETTINGS.commentatorStyle;
  const playerName = context?.playerName ?? null;
  const { commentatorPersonality, players, random = Math.random() } = options;

  const { personalComment } = resolvePersonalityForComment({
    commentatorPersonality,
    players,
    targetPlayerName: playerName,
    eventType,
    context,
    sessionStats,
    random,
  });

  if (personalComment) return personalComment;

  const pool = resolveStylePool(style)?.[eventType];

  let base = null;
  if (pool?.length) {
    const template = pickRandom(pool);
    if (template) {
      base = formatTemplate(template, context).replace(/\s+/g, " ").trim() || null;
    }
  }

  const statRemark = sessionStats
    ? getSessionStatRemark(eventType, context, sessionStats, style)
    : null;

  if (statRemark && base) {
    return Math.random() < 0.5 ? statRemark : `${base} ${statRemark}`;
  }
  if (statRemark) return statRemark;
  return base;
}

export { DEFAULT_COMMENTATOR_SETTINGS } from "./commentatorSettingsCore";
