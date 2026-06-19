import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  DEFAULT_COMMENTATOR_SETTINGS,
  sanitizeCommentatorSettings,
} from "./commentatorSettingsCore";

export const COMMENTATOR_SETTINGS_KEY = "wodkao:commentatorSettings";

/** @returns {Promise<{ commentatorEnabled: boolean, commentatorStyle: string }>} */
export async function loadCommentatorSettings() {
  try {
    const raw = await AsyncStorage.getItem(COMMENTATOR_SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_COMMENTATOR_SETTINGS };
    return sanitizeCommentatorSettings(JSON.parse(raw));
  } catch (err) {
    console.error("[COMMENTATOR SETTINGS LOAD]", err);
    return { ...DEFAULT_COMMENTATOR_SETTINGS };
  }
}

/** @param {{ commentatorEnabled?: boolean, commentatorStyle?: string }} settings */
export async function saveCommentatorSettings(settings) {
  try {
    const next = sanitizeCommentatorSettings(settings);
    await AsyncStorage.setItem(COMMENTATOR_SETTINGS_KEY, JSON.stringify(next));
    return next;
  } catch (err) {
    console.error("[COMMENTATOR SETTINGS SAVE]", err);
    return sanitizeCommentatorSettings(settings);
  }
}
