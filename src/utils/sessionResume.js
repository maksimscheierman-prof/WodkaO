import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { isLobbyExpired } from "./lobbyLifecycle";
import { getResumeRoute, isSessionStale } from "./sessionResumeCore.js";
import { clearSession, loadSession } from "./sessionStorage";

export { getResumeRoute, isSessionStale } from "./sessionResumeCore.js";
export { clearSession, loadSession, saveSession } from "./sessionStorage";

/**
 * Validate saved session against Firestore and return navigation target.
 * @returns {Promise<{ ok: boolean, route?: object, message?: string, session?: object }>}
 */
export async function resolveResumeSession() {
  const session = await loadSession();
  if (!session) {
    return { ok: false, message: "Keine gespeicherte Session." };
  }

  if (isSessionStale(session)) {
    await clearSession();
    return { ok: false, message: "Gespeicherte Session ist abgelaufen." };
  }

  const ref = doc(db, "lobbies", session.lobbyId);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await clearSession();
    return { ok: false, message: "Lobby nicht mehr vorhanden." };
  }

  const data = snap.data();
  if (isLobbyExpired(data)) {
    await clearSession();
    return { ok: false, message: "Diese Lobby ist abgelaufen." };
  }

  const route = getResumeRoute(data, session);
  if (route.action === "clear") {
    await clearSession();
    return { ok: false, message: route.message };
  }

  return {
    ok: true,
    route,
    session,
    lobby: data,
  };
}
