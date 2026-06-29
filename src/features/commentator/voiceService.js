import { Audio } from "expo-av";
import { getCachedAudioUri, saveAudioToCache } from "./audioCacheService";
import {
  buildElevenLabsRequestBody,
  buildElevenLabsUrl,
  buildOpenAiTtsRequestBody,
  buildOpenAiTtsUrl,
  getElevenLabsApiKey,
  getOpenAiApiKey,
  sanitizeVoiceText,
  shouldPlayCommentaryVoice,
  VOICE_REQUEST_TIMEOUT_MS,
} from "./voiceServiceCore";
import {
  isOpenAiVoiceProfile,
  resolveVoiceIdForProfile,
  sanitizeVoiceProfile,
} from "./voiceProfiles";

let currentSound = null;
let audioModeReady = false;
let voicePlaying = false;

export function isCommentaryVoicePlaying() {
  return voicePlaying;
}

async function ensureAudioMode() {
  if (audioModeReady) return;
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });
    audioModeReady = true;
  } catch (err) {
    console.warn("[VOICE AUDIO MODE]", err?.message || err);
  }
}

async function stopCurrentSound() {
  if (!currentSound) {
    voicePlaying = false;
    return;
  }
  try {
    await currentSound.stopAsync();
    await currentSound.unloadAsync();
  } catch (_) {
    /* ignore */
  }
  currentSound = null;
  voicePlaying = false;
}

async function fetchMp3Buffer(url, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), VOICE_REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });

    if (!response.ok) {
      console.warn("[VOICE API]", response.status);
      return null;
    }

    return await response.arrayBuffer();
  } finally {
    clearTimeout(timeoutId);
  }
}

async function fetchElevenLabsMp3(text, voiceId, apiKey) {
  return fetchMp3Buffer(buildElevenLabsUrl(voiceId), {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify(buildElevenLabsRequestBody(text)),
  });
}

async function fetchOpenAiMp3(text, voiceId, apiKey) {
  return fetchMp3Buffer(buildOpenAiTtsUrl(), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify(buildOpenAiTtsRequestBody(text, voiceId)),
  });
}

async function fetchVoiceMp3(text, profileKey) {
  const voiceId = resolveVoiceIdForProfile(profileKey);
  if (isOpenAiVoiceProfile(profileKey)) {
    const apiKey = getOpenAiApiKey();
    if (!apiKey) return null;
    return fetchOpenAiMp3(text, voiceId, apiKey);
  }

  const apiKey = getElevenLabsApiKey();
  if (!apiKey || !voiceId) return null;
  return fetchElevenLabsMp3(text, voiceId, apiKey);
}

async function playAudioUri(uri) {
  await ensureAudioMode();
  await stopCurrentSound();

  const { sound } = await Audio.Sound.createAsync(
    { uri },
    { shouldPlay: true, volume: 1.0 }
  );

  currentSound = sound;
  voicePlaying = true;

  return new Promise((resolve) => {
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        voicePlaying = false;
        stopCurrentSound().catch(() => {});
        resolve();
      }
    });
  });
}

/**
 * Kommentartext → MP3 (OpenAI oder ElevenLabs) → Cache → Wiedergabe.
 * Nur auf dem Host-Gerät (voiceContext). Fehler blockieren nie.
 */
export async function speakCommentary(text, settings = {}, voiceContext = {}) {
  try {
    if (!shouldPlayCommentaryVoice(settings, voiceContext)) {
      return;
    }

    const spokenText = sanitizeVoiceText(text);
    if (!spokenText) return;

    const profileKey = sanitizeVoiceProfile(settings.voiceProfile);
    const voiceId = resolveVoiceIdForProfile(profileKey);

    let uri = await getCachedAudioUri(spokenText, voiceId);

    if (!uri) {
      const mp3Buffer = await fetchVoiceMp3(spokenText, profileKey);
      if (!mp3Buffer) return;
      uri = await saveAudioToCache(spokenText, voiceId, mp3Buffer);
      if (!uri) return;
    }

    await playAudioUri(uri);
  } catch (err) {
    voicePlaying = false;
    console.warn("[COMMENTATOR VOICE]", err?.message || err);
  }
}

export async function stopCommentaryVoice() {
  try {
    await stopCurrentSound();
  } catch (_) {
    /* ignore */
  }
}

export {
  isVoiceApiConfigured,
  isVoiceProfileReady,
  shouldPlayCommentaryVoice,
} from "./voiceServiceCore";
