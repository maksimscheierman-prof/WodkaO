/** Stimmen-Profile — OpenAI TTS + ElevenLabs (Node-testbar). */

const VOICE_PROFILE_KEYS = {
  OPENAI_ONYX: "openai_onyx",
  KNEIPENMEISTER: "kneipenmeister",
  ANIME: "anime",
  SPORT: "sport",
  DUNGEON_MASTER: "dungeon_master",
};

const DEFAULT_VOICE_PROFILE = VOICE_PROFILE_KEYS.OPENAI_ONYX;

const VOICE_PROFILE_ORDER = [
  VOICE_PROFILE_KEYS.OPENAI_ONYX,
  VOICE_PROFILE_KEYS.KNEIPENMEISTER,
  VOICE_PROFILE_KEYS.ANIME,
  VOICE_PROFILE_KEYS.SPORT,
  VOICE_PROFILE_KEYS.DUNGEON_MASTER,
];

/** Metadaten + Env-Keys für voiceId-Auflösung. */
const VOICE_PROFILE_DEFINITIONS = {
  [VOICE_PROFILE_KEYS.OPENAI_ONYX]: {
    name: "Kneipenmeister (OpenAI Onyx)",
    description: "Natürliche tiefe Männerstimme",
    provider: "openai",
    fixedVoiceId: "onyx",
    envKeys: [],
    legacyEnvKeys: [],
  },
  [VOICE_PROFILE_KEYS.KNEIPENMEISTER]: {
    name: "Kneipenmeister",
    description: "Warm und rustikal — wie der Wirt an der Theke.",
    provider: "elevenlabs",
    envKeys: ["EXPO_PUBLIC_ELEVENLABS_VOICE_KNEIPENMEISTER"],
    legacyEnvKeys: ["EXPO_PUBLIC_ELEVENLABS_VOICE_ID", "ELEVENLABS_VOICE_ID"],
  },
  [VOICE_PROFILE_KEYS.ANIME]: {
    name: "Anime-Erzähler",
    description: "Dramatisch und energiegeladen wie ein Duell-Kommentator.",
    provider: "elevenlabs",
    envKeys: ["EXPO_PUBLIC_ELEVENLABS_VOICE_ANIME"],
    legacyEnvKeys: [],
  },
  [VOICE_PROFILE_KEYS.SPORT]: {
    name: "Sportkommentator",
    description: "Dynamisch und mit Live-Stadion-Feeling.",
    provider: "elevenlabs",
    envKeys: ["EXPO_PUBLIC_ELEVENLABS_VOICE_SPORT"],
    legacyEnvKeys: [],
  },
  [VOICE_PROFILE_KEYS.DUNGEON_MASTER]: {
    name: "Dungeon Master",
    description: "Episch und geheimnisvoll — Abenteuer pur.",
    provider: "elevenlabs",
    envKeys: ["EXPO_PUBLIC_ELEVENLABS_VOICE_DUNGEON_MASTER"],
    legacyEnvKeys: [],
  },
};

function readFirstEnvValue(env, keys = []) {
  for (const key of keys) {
    const value = String(env?.[key] ?? "").trim();
    if (value) return value;
  }
  return "";
}

function sanitizeVoiceProfile(profileKey) {
  if (VOICE_PROFILE_DEFINITIONS[profileKey]) return profileKey;
  return DEFAULT_VOICE_PROFILE;
}

function getVoiceProvider(profileKey) {
  const def = VOICE_PROFILE_DEFINITIONS[sanitizeVoiceProfile(profileKey)];
  return def?.provider || "elevenlabs";
}

function isOpenAiVoiceProfile(profileKey) {
  return getVoiceProvider(profileKey) === "openai";
}

function resolveVoiceIdForProfile(profileKey, env = process.env) {
  const key = sanitizeVoiceProfile(profileKey);
  const def = VOICE_PROFILE_DEFINITIONS[key];
  if (def?.provider === "openai" && def.fixedVoiceId) {
    return def.fixedVoiceId;
  }
  const primary = readFirstEnvValue(env, def.envKeys);
  if (primary) return primary;
  return readFirstEnvValue(env, def.legacyEnvKeys || []);
}

function getVoiceProfile(profileKey, env = process.env) {
  const key = sanitizeVoiceProfile(profileKey);
  const def = VOICE_PROFILE_DEFINITIONS[key];
  return {
    key,
    voiceId: resolveVoiceIdForProfile(key, env),
    name: def.name,
    description: def.description,
  };
}

function getVoiceProfilesList(env = process.env) {
  return VOICE_PROFILE_ORDER.map((key) => getVoiceProfile(key, env));
}

module.exports = {
  VOICE_PROFILE_KEYS,
  DEFAULT_VOICE_PROFILE,
  VOICE_PROFILE_ORDER,
  VOICE_PROFILE_DEFINITIONS,
  sanitizeVoiceProfile,
  getVoiceProvider,
  isOpenAiVoiceProfile,
  resolveVoiceIdForProfile,
  getVoiceProfile,
  getVoiceProfilesList,
};
