import { Platform } from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import {
  buildCacheKey,
  getCacheFileName,
} from "./audioCacheServiceCore";

const CACHE_SUBDIR = "commentator-voice/";
const memoryCache = new Map();

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, chunk);
  }
  if (typeof btoa === "function") {
    return btoa(binary);
  }
  return null;
}

function getNativeCacheDir() {
  const base = FileSystem.cacheDirectory || FileSystem.documentDirectory;
  return base ? `${base}${CACHE_SUBDIR}` : null;
}

async function ensureNativeCacheDir() {
  const dir = getNativeCacheDir();
  if (!dir) return null;
  const info = await FileSystem.getInfoAsync(dir);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  }
  return dir;
}

function getNativeCachePath(cacheKey) {
  const dir = getNativeCacheDir();
  if (!dir) return null;
  return `${dir}${getCacheFileName(cacheKey)}`;
}

/**
 * @returns {Promise<string|null>} URI für expo-av (file:// oder blob:)
 */
export async function getCachedAudioUri(text, voiceId) {
  try {
    const cacheKey = buildCacheKey(text, voiceId);

    if (Platform.OS === "web") {
      return memoryCache.get(cacheKey) || null;
    }

    const path = getNativeCachePath(cacheKey);
    if (!path) return null;

    const info = await FileSystem.getInfoAsync(path);
    return info.exists ? path : null;
  } catch (err) {
    console.warn("[AUDIO CACHE READ]", err?.message || err);
    return null;
  }
}

/**
 * @param {ArrayBuffer} audioBuffer
 * @returns {Promise<string|null>}
 */
export async function saveAudioToCache(text, voiceId, audioBuffer) {
  try {
    if (!audioBuffer || audioBuffer.byteLength === 0) return null;

    const cacheKey = buildCacheKey(text, voiceId);

    if (Platform.OS === "web") {
      const blob = new Blob([audioBuffer], { type: "audio/mpeg" });
      const oldUri = memoryCache.get(cacheKey);
      if (oldUri) URL.revokeObjectURL(oldUri);
      const uri = URL.createObjectURL(blob);
      memoryCache.set(cacheKey, uri);
      return uri;
    }

    await ensureNativeCacheDir();
    const path = getNativeCachePath(cacheKey);
    if (!path) return null;

    const base64 = arrayBufferToBase64(audioBuffer);
    if (!base64) return null;
    await FileSystem.writeAsStringAsync(path, base64, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return path;
  } catch (err) {
    console.warn("[AUDIO CACHE WRITE]", err?.message || err);
    return null;
  }
}

export { buildCacheKey } from "./audioCacheServiceCore";
