import AsyncStorage from "@react-native-async-storage/async-storage";

const SESSION_KEY = "wodkao:lastSession";

/**
 * @typedef {Object} GameSession
 * @property {string} playerName
 * @property {string} lobbyId
 * @property {string} [playerId]
 * @property {string} [status] - last known lobby status
 * @property {string} [gamePhase]
 * @property {number} updatedAt
 */

/** @returns {Promise<GameSession|null>} */
export async function loadSession() {
  try {
    const raw = await AsyncStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.playerName || !parsed?.lobbyId) return null;
    return parsed;
  } catch (err) {
    console.error("[SESSION LOAD]", err);
    return null;
  }
}

/** @param {Partial<GameSession> & { playerName: string, lobbyId: string }} patch */
export async function saveSession(patch) {
  if (!patch?.playerName || !patch?.lobbyId) return;
  try {
    const prev = await loadSession();
    const next = {
      ...prev,
      ...patch,
      playerName: patch.playerName,
      lobbyId: patch.lobbyId,
      updatedAt: Date.now(),
    };
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(next));
  } catch (err) {
    console.error("[SESSION SAVE]", err);
  }
}

export async function clearSession() {
  try {
    await AsyncStorage.removeItem(SESSION_KEY);
  } catch (err) {
    console.error("[SESSION CLEAR]", err);
  }
}
