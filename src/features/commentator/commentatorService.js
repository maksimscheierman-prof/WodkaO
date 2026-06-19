import { DEFAULT_COMMENTATOR_SETTINGS } from "./commentatorSettingsCore";
import { resolvePersonalityForComment } from "./commentatorPersonalityCommentCore";
import { getSessionStatRemark } from "./commentatorSessionStats";
import { COMMENTATOR_TEXTS_BY_STYLE } from "./commentatorTexts";
import { COMMENTATOR_STYLES } from "./commentatorStyles";
import {
  buildCommentKeys,
  getNeutralFallback,
  inferPersonalityMeta,
  pickCandidate,
  shuffleArray,
} from "./commentatorDedupeCore";

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

function tryPersonalCandidates({
  eventType,
  context,
  sessionStats,
  commentatorPersonality,
  players,
  dedupeState,
  random,
}) {
  const playerName = context?.playerName ?? null;
  if (!playerName) return null;

  for (let attempt = 0; attempt < 6; attempt += 1) {
    const attemptRandom = (random + attempt * 0.137) % 1;
    const { personalComment, bundle } = resolvePersonalityForComment({
      commentatorPersonality,
      players,
      targetPlayerName: playerName,
      eventType,
      context,
      sessionStats,
      random: attemptRandom,
    });

    if (!personalComment) continue;

    const personalityMeta = inferPersonalityMeta(personalComment, playerName, bundle);
    const keys = buildCommentKeys({
      eventType,
      context,
      text: personalComment,
      personalityMeta,
    });
    const candidate = pickCandidate(personalComment, keys, dedupeState);
    if (candidate) return candidate;
  }

  return null;
}

function tryTemplateCandidates({ eventType, context, style, dedupeState, random }) {
  const pool = resolveStylePool(style)?.[eventType];
  if (!pool?.length) return null;

  const shuffled = shuffleArray(pool, random);
  for (const template of shuffled) {
    const text = formatTemplate(template, context).replace(/\s+/g, " ").trim();
    if (!text) continue;

    const keys = buildCommentKeys({
      eventType,
      context,
      text,
      templateId: template,
    });
    const candidate = pickCandidate(text, keys, dedupeState);
    if (candidate) return candidate;
  }

  return null;
}

function tryStatRemark({ eventType, context, sessionStats, style, dedupeState }) {
  if (!sessionStats) return null;

  const statRemark = getSessionStatRemark(eventType, context, sessionStats, style);
  if (!statRemark) return null;

  const keys = buildCommentKeys({
    eventType,
    context,
    text: statRemark,
    templateId: "statRemark",
  });
  return pickCandidate(statRemark, keys, dedupeState);
}

/**
 * Liefert einen Kommentar-Text für ein Spielereignis oder null wenn deaktiviert.
 * Mit dedupeState werden wiederholte Witze/Themen vermieden.
 * @returns {{ text: string, keys: object }|null}
 */
export function resolveLocalCommentary(
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
  const {
    commentatorPersonality,
    players,
    random = Math.random(),
    dedupeState = null,
  } = options;

  const personal = tryPersonalCandidates({
    eventType,
    context,
    sessionStats,
    commentatorPersonality,
    players,
    dedupeState,
    random,
  });
  if (personal) return personal;

  const template = tryTemplateCandidates({
    eventType,
    context,
    style,
    dedupeState,
    random,
  });
  if (template) return template;

  const stat = tryStatRemark({
    eventType,
    context,
    sessionStats,
    style,
    dedupeState,
  });
  if (stat) return stat;

  return getNeutralFallback(eventType, context, dedupeState, random);
}

/**
 * @returns {string|null}
 */
export function getCommentary(
  eventType,
  context = {},
  settings = DEFAULT_COMMENTATOR_SETTINGS,
  sessionStats = null,
  options = {}
) {
  const result = resolveLocalCommentary(
    eventType,
    context,
    settings,
    sessionStats,
    options
  );
  return result?.text ?? null;
}

export { isCommentBlocked, buildCommentKeys } from "./commentatorDedupeCore";
export { DEFAULT_COMMENTATOR_SETTINGS } from "./commentatorSettingsCore";
