/** Voice TTS — OpenAI + ElevenLabs, reine Logik (Node-testbar). */

const {
  isOpenAiVoiceProfile,
  resolveVoiceIdForProfile,
  sanitizeVoiceProfile,
} = require("./voiceProfilesCore");

const MAX_VOICE_TEXT_LENGTH = 160;
const VOICE_REQUEST_TIMEOUT_MS = 15000;

const ELEVENLABS_TTS_BASE = "https://api.elevenlabs.io/v1/text-to-speech";
const OPENAI_TTS_URL = "https://api.openai.com/v1/audio/speech";
const OPENAI_TTS_MODEL = "gpt-4o-mini-tts";

function getElevenLabsApiKey(env = process.env) {
  return (
    env.EXPO_PUBLIC_ELEVENLABS_API_KEY ||
    env.ELEVENLABS_API_KEY ||
    ""
  ).trim();
}

function getOpenAiApiKey(env = process.env) {
  return (
    env.EXPO_PUBLIC_OPENAI_API_KEY ||
    env.EXPO_PUBLIC_COMMENTATOR_AI_API_KEY ||
    env.OPENAI_API_KEY ||
    ""
  ).trim();
}

function isVoiceApiConfigured(env = process.env) {
  return !!getElevenLabsApiKey(env) || !!getOpenAiApiKey(env);
}

function isVoiceProfileReady(profileKey, env = process.env) {
  const key = sanitizeVoiceProfile(profileKey);
  if (isOpenAiVoiceProfile(key)) {
    return !!getOpenAiApiKey(env);
  }
  return (
    !!getElevenLabsApiKey(env) &&
    !!resolveVoiceIdForProfile(key, env)
  );
}

function sanitizeVoiceText(text, maxLen = MAX_VOICE_TEXT_LENGTH) {
  const clean = String(text || "")
    .replace(/\s+/g, " ")
    .trim();
  if (!clean) return "";
  if (clean.length <= maxLen) return clean;
  const cut = clean.slice(0, maxLen);
  const lastSpace = cut.lastIndexOf(" ");
  if (lastSpace > maxLen * 0.6) {
    return cut.slice(0, lastSpace).trim();
  }
  return cut.trim();
}

function buildElevenLabsUrl(voiceId) {
  return `${ELEVENLABS_TTS_BASE}/${encodeURIComponent(voiceId)}`;
}

function buildElevenLabsRequestBody(text) {
  return {
    text: sanitizeVoiceText(text),
    model_id: "eleven_multilingual_v2",
  };
}

function buildOpenAiTtsUrl() {
  return OPENAI_TTS_URL;
}

function buildOpenAiTtsRequestBody(text, voice = "onyx") {
  return {
    model: OPENAI_TTS_MODEL,
    input: sanitizeVoiceText(text),
    voice,
    response_format: "mp3",
  };
}

module.exports = {
  MAX_VOICE_TEXT_LENGTH,
  VOICE_REQUEST_TIMEOUT_MS,
  OPENAI_TTS_MODEL,
  getElevenLabsApiKey,
  getOpenAiApiKey,
  isVoiceApiConfigured,
  isVoiceProfileReady,
  sanitizeVoiceText,
  buildElevenLabsUrl,
  buildElevenLabsRequestBody,
  buildOpenAiTtsUrl,
  buildOpenAiTtsRequestBody,
};
