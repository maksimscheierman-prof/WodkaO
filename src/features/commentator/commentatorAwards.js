import { fetchAiCommentary } from "./commentatorAiService";
import {
  AWARD_IDS,
  computeSessionAwards,
  getAwardComment,
  getSessionIntro,
  hasSessionActivity,
} from "./commentatorAwardsCore";

export {
  AWARD_IDS,
  computeSessionAwards,
  getAwardComment,
  getSessionIntro,
  hasSessionActivity,
};

/**
 * Intro-Text für den Abschlussbericht — optional AI mit lokalem Fallback.
 */
export async function resolveSessionIntro({
  awards = [],
  settings = {},
  sessionStats = null,
}) {
  const style = settings.commentatorStyle || "locker";

  try {
    if (settings.useAiCommentator && settings.commentatorEnabled !== false) {
      const aiText = await fetchAiCommentary({
        eventType: "GAME_ENDED",
        style,
        context: {
          awards: awards.map((a) => ({
            title: a.title,
            playerName: a.playerName,
            value: a.value,
          })),
        },
        sessionStats,
      });
      if (aiText) return aiText;
    }
  } catch (err) {
    console.warn("[COMMENTATOR AWARDS AI]", err?.message || err);
  }

  return getSessionIntro(style);
}
