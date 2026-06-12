#!/usr/bin/env node
/**
 * One-off admin cleanup for stale Firestore lobbies.
 *
 * Default: dry-run (no writes). Use --delete or --expire to apply changes.
 *
 * Credentials (never commit JSON keys):
 *   set GOOGLE_APPLICATION_CREDENTIALS=C:\path\to\key.json
 *   — or — gcloud auth application-default login
 *
 * Usage:
 *   node scripts/cleanup_old_lobbies.js --hours=2
 *   node scripts/cleanup_old_lobbies.js --hours=2 --expire
 *   node scripts/cleanup_old_lobbies.js --hours=2 --delete
 */

const {
  getActivityFieldSource,
  getLastActivityMillis,
  toMillis,
} = require("../src/utils/lobbyLifecycleCore.js");

const FIRESTORE_BATCH_LIMIT = 500;

function parseArgs(argv) {
  const flags = {
    delete: false,
    expire: false,
    hours: Number(process.env.LOBBY_INACTIVITY_HOURS) || 2,
    collection: "lobbies",
    limit: Number.POSITIVE_INFINITY,
  };

  for (const arg of argv) {
    if (arg === "--delete") flags.delete = true;
    else if (arg === "--expire") flags.expire = true;
    else if (arg === "--dry-run") {
      /* default — accepted for compatibility */
    } else if (arg.startsWith("--hours=")) {
      flags.hours = Number(arg.split("=")[1]);
    } else if (arg.startsWith("--collection=")) {
      flags.collection = arg.split("=")[1];
    } else if (arg.startsWith("--limit=")) {
      flags.limit = Number(arg.split("=")[1]);
    } else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    } else {
      console.error(`Unknown argument: ${arg}`);
      printHelp();
      process.exit(1);
    }
  }

  if (Number.isNaN(flags.hours) || flags.hours <= 0) {
    console.error("--hours must be a positive number.");
    process.exit(1);
  }
  if (Number.isNaN(flags.limit) || flags.limit <= 0) {
    console.error("--limit must be a positive number.");
    process.exit(1);
  }

  return flags;
}

function printHelp() {
  console.log(`Admin cleanup for stale Firestore lobbies.

Options:
  --hours=2              Inactivity threshold in hours (default: 2)
  --collection=lobbies   Firestore collection name (default: lobbies)
  --limit=500            Max stale documents to process
  --expire               Set status=expired (requires explicit flag)
  --delete               Hard-delete documents (requires explicit flag)

Default mode is dry-run. --delete and --expire cannot be combined.

Examples:
  node scripts/cleanup_old_lobbies.js --hours=2
  node scripts/cleanup_old_lobbies.js --hours=2 --expire
  node scripts/cleanup_old_lobbies.js --hours=2 --delete --limit=500
`);
}

function resolveMode(flags) {
  if (flags.delete && flags.expire) {
    console.error(
      "Error: --delete and --expire cannot be used together. Choose one mode."
    );
    process.exit(1);
  }
  if (flags.delete) return "delete";
  if (flags.expire) return "expire";
  return "dry-run";
}

function formatTimestamp(value) {
  const ms = toMillis(value);
  if (ms == null) return "(none)";
  return new Date(ms).toISOString();
}

function isStale(data, cutoffMs) {
  const activityMs = getLastActivityMillis(data);
  if (activityMs == null) return false;
  return activityMs < cutoffMs;
}

function printDocPreview(docSnap) {
  const data = docSnap.data();
  const activityMs = getLastActivityMillis(data);
  const source = getActivityFieldSource(data);
  const ageHours =
    activityMs != null
      ? ((Date.now() - activityMs) / 3600000).toFixed(1)
      : "?";

  console.log(
    [
      `  ${docSnap.id}`,
      `status=${data.status ?? "(none)"}`,
      `lastActivityAt=${formatTimestamp(data.lastActivityAt)}`,
      `updatedAt=${formatTimestamp(data.updatedAt)}`,
      `createdAt=${formatTimestamp(data.createdAt)}`,
      `effective=${source ?? "none"} (~${ageHours}h ago)`,
    ].join("  ")
  );
}

async function applyBatches(db, staleDocs, mode, FieldValue) {
  let processed = 0;

  for (let i = 0; i < staleDocs.length; i += FIRESTORE_BATCH_LIMIT) {
    const chunk = staleDocs.slice(i, i + FIRESTORE_BATCH_LIMIT);
    const batch = db.batch();

    for (const docSnap of chunk) {
      if (mode === "delete") {
        batch.delete(docSnap.ref);
      } else {
        batch.update(docSnap.ref, {
          status: "expired",
          expiredAt: FieldValue.serverTimestamp(),
        });
      }
    }

    await batch.commit();
    processed += chunk.length;
    console.log(`Committed batch: ${chunk.length} document(s) (${mode}).`);
  }

  return processed;
}

async function main() {
  const flags = parseArgs(process.argv.slice(2));
  const mode = resolveMode(flags);
  const cutoffMs = Date.now() - flags.hours * 60 * 60 * 1000;
  const cutoffIso = new Date(cutoffMs).toISOString();

  let admin;
  try {
    admin = require("firebase-admin");
  } catch {
    console.error(
      "firebase-admin is not installed. Run: npm install firebase-admin --save-dev"
    );
    process.exit(1);
  }

  try {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
  } catch (err) {
    console.error(
      "Failed to initialize Firebase Admin SDK. Set GOOGLE_APPLICATION_CREDENTIALS to a service account JSON outside the repo, or run:\n  gcloud auth application-default login"
    );
    console.error(err.message);
    process.exit(1);
  }

  const db = admin.firestore();
  const snap = await db.collection(flags.collection).get();

  const staleDocs = [];
  for (const docSnap of snap.docs) {
    if (isStale(docSnap.data(), cutoffMs)) {
      staleDocs.push(docSnap);
    }
  }

  const toProcess = staleDocs.slice(0, flags.limit);

  console.log("--- Lobby cleanup ---");
  console.log(`Collection:  ${flags.collection}`);
  console.log(`Cutoff:      ${cutoffIso}  (${flags.hours}h inactivity)`);
  console.log(`Mode:        ${mode}`);
  console.log(`Scanned:     ${snap.size} document(s)`);
  console.log(`Stale:       ${staleDocs.length} document(s)`);
  console.log(`Processing:  ${toProcess.length} document(s)`);
  if (staleDocs.length > toProcess.length) {
    console.log(
      `Note:        ${staleDocs.length - toProcess.length} stale doc(s) skipped (--limit=${flags.limit})`
    );
  }
  console.log("---------------------");

  if (toProcess.length === 0) {
    console.log("Nothing to do.");
    return;
  }

  if (mode === "dry-run") {
    console.log("Dry-run — no changes will be made:\n");
    for (const docSnap of toProcess) {
      printDocPreview(docSnap);
    }
    console.log(`\nDry-run complete. ${toProcess.length} lobby(s) would be affected.`);
    console.log("Use --expire or --delete to apply changes.");
    return;
  }

  const processed = await applyBatches(
    db,
    toProcess,
    mode,
    admin.firestore.FieldValue
  );

  console.log(
    `\nDone. mode=${mode} processed=${processed} collection=${flags.collection}`
  );
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
