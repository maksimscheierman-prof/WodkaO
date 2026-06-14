import AsyncStorage from "@react-native-async-storage/async-storage";

export const TEST_ACCESS_KEY = "wodkao:hasTestAccess";

/** @returns {Promise<boolean>} */
export async function hasTestAccess() {
  try {
    const value = await AsyncStorage.getItem(TEST_ACCESS_KEY);
    return value === "true";
  } catch (err) {
    console.error("[TEST ACCESS LOAD]", err);
    return false;
  }
}

export async function grantTestAccess() {
  try {
    await AsyncStorage.setItem(TEST_ACCESS_KEY, "true");
  } catch (err) {
    console.error("[TEST ACCESS GRANT]", err);
  }
}

export async function clearTestAccess() {
  try {
    await AsyncStorage.removeItem(TEST_ACCESS_KEY);
  } catch (err) {
    console.error("[TEST ACCESS CLEAR]", err);
  }
}
