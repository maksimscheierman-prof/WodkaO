import AsyncStorage from "@react-native-async-storage/async-storage";

export const COMMENTATOR_REPORT_KEY = "wodkao:commentatorSessionReport";

/** @returns {Promise<object|null>} */
export async function loadCommentatorSessionReport() {
  try {
    const raw = await AsyncStorage.getItem(COMMENTATOR_REPORT_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.error("[COMMENTATOR REPORT LOAD]", err);
    return null;
  }
}

/** @param {object} report */
export async function saveCommentatorSessionReport(report) {
  try {
    await AsyncStorage.setItem(COMMENTATOR_REPORT_KEY, JSON.stringify(report));
    return report;
  } catch (err) {
    console.error("[COMMENTATOR REPORT SAVE]", err);
    return null;
  }
}

export async function clearCommentatorSessionReport() {
  try {
    await AsyncStorage.removeItem(COMMENTATOR_REPORT_KEY);
  } catch (err) {
    console.error("[COMMENTATOR REPORT CLEAR]", err);
  }
}
