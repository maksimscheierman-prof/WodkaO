/**
 * Copy into Firebase Cloud Functions (Gen 2) after `firebase init functions`.
 * Schedule: every 60 minutes — expires stale lobbies (does not hard-delete).
 *
 * See docs/firebase_cleanup.md for full setup.
 */

const { onSchedule } = require("firebase-functions/v2/scheduler");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue, Timestamp } = require("firebase-admin/firestore");

initializeApp();

const LOBBY_INACTIVITY_MS = 2 * 60 * 60 * 1000;

function toMillis(value) {
  if (!value) return null;
  if (typeof value === "number") return value;
  if (value instanceof Timestamp) return value.toMillis();
  if (typeof value.toMillis === "function") return value.toMillis();
  return null;
}

function getLastActivityMillis(data) {
  return toMillis(data.lastActivityAt) ?? toMillis(data.createdAt);
}

exports.expireStaleLobbies = onSchedule(
  {
    schedule: "every 60 minutes",
    timeZone: "Europe/Berlin",
  },
  async () => {
    const db = getFirestore();
    const cutoff = Timestamp.fromMillis(Date.now() - LOBBY_INACTIVITY_MS);
    const snap = await db
      .collection("lobbies")
      .where("status", "in", ["waiting", "playing"])
      .where("lastActivityAt", "<", cutoff)
      .get();

    const batch = db.batch();
    let count = 0;

    snap.forEach((docSnap) => {
      batch.update(docSnap.ref, {
        status: "expired",
        expiredAt: FieldValue.serverTimestamp(),
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
