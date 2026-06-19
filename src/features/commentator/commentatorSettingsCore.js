const VALID_STYLES = new Set(["neutral", "locker", "chaotic", "anime", "tavern"]);

const { DEFAULT_VOICE_PROFILE, sanitizeVoiceProfile } = require("./voiceProfilesCore");

const DEFAULT_COMMENTATOR_SETTINGS = {
  commentatorEnabled: true,
  commentatorStyle: "locker",
  useAiCommentator: false,
  voiceCommentatorEnabled: false,
  voiceProfile: DEFAULT_VOICE_PROFILE,
};

function sanitizeCommentatorSettings(raw = {}) {
  const enabled =
    raw.commentatorEnabled === undefined
      ? DEFAULT_COMMENTATOR_SETTINGS.commentatorEnabled
      : !!raw.commentatorEnabled;

  const style = VALID_STYLES.has(raw.commentatorStyle)
    ? raw.commentatorStyle
    : DEFAULT_COMMENTATOR_SETTINGS.commentatorStyle;

  const useAiCommentator =
    raw.useAiCommentator === undefined
      ? DEFAULT_COMMENTATOR_SETTINGS.useAiCommentator
      : !!raw.useAiCommentator;

  const voiceCommentatorEnabled =
    raw.voiceCommentatorEnabled === undefined
      ? DEFAULT_COMMENTATOR_SETTINGS.voiceCommentatorEnabled
      : !!raw.voiceCommentatorEnabled;

  const voiceProfile = sanitizeVoiceProfile(
    raw.voiceProfile ?? DEFAULT_COMMENTATOR_SETTINGS.voiceProfile
  );

  return {
    commentatorEnabled: enabled,
    commentatorStyle: style,
    useAiCommentator,
    voiceCommentatorEnabled,
    voiceProfile,
  };
}

module.exports = {
  DEFAULT_COMMENTATOR_SETTINGS,
  VALID_STYLES,
  sanitizeCommentatorSettings,
};
