import { MongoClient } from "mongodb";

const BATCH_SIZE = parseInt(process.env.BATCH_SIZE || "1000", 10);
const CLEAR_DEST = process.env.CLEAR_DESTINATION !== "false";
const DRY_RUN = process.env.DRY_RUN === "true";

const SOURCE_URI = process.env.SOURCE_MONGO_URI;
const DEST_URI = process.env.DESTINATION_MONGO_URI;

if (!SOURCE_URI || !DEST_URI) {
  console.error(
    "Missing required environment variables: SOURCE_MONGO_URI and DESTINATION_MONGO_URI"
  );
  process.exit(1);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function listCollections(db) {
  const collections = await db.listCollections().toArray();
  const result = [];
  for (const col of collections) {
    const count = await db.collection(col.name).countDocuments();
    result.push({ name: col.name, count });
  }
  return result;
}

async function getDatabases(client) {
  const adminDb = client.db().admin();
  const { databases } = await adminDb.listDatabases();
  return databases
    .filter((db) => ["admin", "local", "config"].indexOf(db.name) === -1)
    .map((db) => db.name);
}

async function copyCollection(sourceDb, destDb, collectionName, summary, dbName) {
  const sourceCol = sourceDb.collection(collectionName);
  const destCol = destDb.collection(collectionName);

  const totalDocs = await sourceCol.countDocuments();

  if (totalDocs === 0) {
    summary.skipped.push({
      db: dbName,
      collection: collectionName,
      reason: "empty source collection",
    });
    return;
  }

  if (CLEAR_DEST) {
    await destCol.deleteMany({});
  }

  const cursor = sourceCol.find({}).batchSize(BATCH_SIZE);
  let copied = 0;

  let batch = [];
  for await (const doc of cursor) {
    batch.push(doc);
    if (batch.length >= BATCH_SIZE) {
      if (!DRY_RUN) {
        await destCol.insertMany(batch, { ordered: false });
      }
      copied += batch.length;
      printProgress(dbName, collectionName, totalDocs, copied);
      batch = [];
      await sleep(0);
    }
  }

  if (batch.length > 0) {
    if (!DRY_RUN) {
      await destCol.insertMany(batch, { ordered: false });
    }
    copied += batch.length;
  }

  printProgress(dbName, collectionName, totalDocs, copied);

  summary.migrated.push({
    db: dbName,
    collection: collectionName,
    documents: copied,
  });
  summary.totalDocuments += copied;
}

function printProgress(dbName, collectionName, total, copied) {
  const pct = total > 0 ? ((copied / total) * 100).toFixed(1) : "100.0";
  process.stdout.write(
    `\r  [${dbName}/${collectionName}] ${copied}/${total} (${pct}%)   `
  );
  if (copied >= total) {
    process.stdout.write("\n");
  }
}

async function main() {
  console.log("MongoDB Migration Tool\n");
  console.log(`Batch size: ${BATCH_SIZE}`);
  console.log(`Clear destination: ${CLEAR_DEST}`);
  console.log(`Dry run: ${DRY_RUN}\n`);

  let sourceClient, destClient;

  const summary = {
    migrated: [],
    skipped: [],
    errors: [],
    totalDocuments: 0,
  };

  try {
    sourceClient = new MongoClient(SOURCE_URI);
    destClient = new MongoClient(DEST_URI);

    await Promise.all([sourceClient.connect(), destClient.connect()]);

    console.log("Connected to both clusters.\n");

    const dbNames = await getDatabases(sourceClient);

    if (dbNames.length === 0) {
      console.log("No user databases found on source.");
      return;
    }

    console.log(`Found databases: ${dbNames.join(", ")}\n`);

    for (const dbName of dbNames) {
      const sourceDb = sourceClient.db(dbName);
      const destDb = destClient.db(dbName);

      const collections = await listCollections(sourceDb);
      console.log(
        `\n--- Database: ${dbName} (${collections.length} collections) ---`
      );

      for (const col of collections) {
        try {
          await copyCollection(sourceDb, destDb, col.name, summary, dbName);
        } catch (err) {
          console.error(`\n  ERROR: [${dbName}/${col.name}] ${err.message}`);
          summary.errors.push({
            db: dbName,
            collection: col.name,
            error: err.message,
          });
        }
      }
    }
  } catch (err) {
    console.error(`\nFatal error: ${err.message}`);
    summary.errors.push({ db: "-", collection: "-", error: err.message });
  } finally {
    if (sourceClient) await sourceClient.close();
    if (destClient) await destClient.close();
    console.log("\nConnections closed.\n");
  }

  console.log("=".repeat(50));
  console.log("MIGRATION SUMMARY");
  console.log("=".repeat(50));
  console.log(`\nMigrated collections: ${summary.migrated.length}`);
  for (const m of summary.migrated) {
    console.log(`  \u2713 ${m.db}/${m.collection}: ${m.documents} documents`);
  }
  console.log(`\nTotal documents copied: ${summary.totalDocuments}`);

  if (summary.skipped.length > 0) {
    console.log(`\nSkipped collections: ${summary.skipped.length}`);
    for (const s of summary.skipped) {
      console.log(`  - ${s.db}/${s.collection}: ${s.reason}`);
    }
  }

  if (summary.errors.length > 0) {
    console.log(`\nErrors: ${summary.errors.length}`);
    for (const e of summary.errors) {
      console.log(`  \u2717 ${e.db}/${e.collection}: ${e.error}`);
    }
  }

  console.log("");
}

main().catch((err) => {
  console.error("Unhandled error:", err);
  process.exit(1);
});
