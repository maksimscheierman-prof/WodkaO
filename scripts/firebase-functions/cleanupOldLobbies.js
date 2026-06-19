/**
 * Copy into Firebase Cloud Functions (Gen 2) after `firebase init functions`.
 * Schedule: every 30 minutes — expires stale lobbies (does not hard-delete).
 *
 * See docs/firebase_cleanup.md for full setup.
 */

const { onSchedule } = require("firebase-functions/v2/scheduler");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue, Timestamp } = require("firebase-admin/firestore");

initializeApp();

const LOBBY_WAITING_INACTIVITY_MS = 30 * 60 * 1000;
const LOBBY_PLAYING_INACTIVITY_MS = 2 * 60 * 60 * 1000;

function toMillis(value) {
  if (!value) return null;
  if (typeof value === "number") return value;
  if (value instanceof Timestamp) return value.toMillis();
  if (typeof value.toMillis === "function") return value.toMillis();
  return null;
}

function getLastActivityMillis(data) {
  return (
    toMillis(data.lastActivityAt) ??
    toMillis(data.updatedAt) ??
    toMillis(data.createdAt)
  );
}

function isStale(data, nowMs) {
  const last = getLastActivityMillis(data);
  if (last == null) return false;
  const limit =
    data.status === "waiting"
      ? LOBBY_WAITING_INACTIVITY_MS
      : LOBBY_PLAYING_INACTIVITY_MS;
  return nowMs - last > limit;
}

exports.expireStaleLobbies = onSchedule(
  {
    schedule: "every 30 minutes",
    timeZone: "Europe/Berlin",
  },
  async () => {
    const db = getFirestore();
    const nowMs = Date.now();
    const snap = await db
      .collection("lobbies")
      .where("status", "in", ["waiting", "playing"])
      .get();

    const batch = db.batch();
    let count = 0;

    snap.forEach((docSnap) => {
      const data = docSnap.data();
      if (!isStale(data, nowMs)) return;
      batch.update(docSnap.ref, {
        status: "expired",
        expiredAt: FieldValue.serverTimestamp(),
        lastActivityAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      count += 1;
    });

    if (count > 0) {
      await batch.commit();
    }

    console.log(`expireStaleLobbies: marked ${count} lobbies as expired`);
  }
);

/**
 * Note: Lobbies with only legacy `createdAt` (number) and no `lastActivityAt`
 * are handled by the one-off admin script `scripts/cleanup_old_lobbies.js`.
 * After app deploy, new writes always set lastActivityAt via serverTimestamp.
 */
