/**
 * Per-file connection to the shared in-memory MongoDB (see test/globalSetup.js).
 *
 *   import { useTestDb } from "../../test/mongo.js";
 *   useTestDb();   // registers beforeAll / afterEach / afterAll
 */
import { afterAll, afterEach, beforeAll } from "vitest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

let ownServer;

export function useTestDb() {
  beforeAll(async () => {
    let uri = process.env.MONGO_TEST_URI;
    if (!uri) {
      // fallback if globalSetup did not run (e.g. single-file invocation)
      ownServer = await MongoMemoryServer.create();
      uri = ownServer.getUri();
    }
    const dbName = `t_${Math.random().toString(36).slice(2, 10)}`;
    await mongoose.connect(uri, { dbName });
  }, 120000);

  afterEach(async () => {
    const { collections } = mongoose.connection;
    for (const key of Object.keys(collections)) {
      await collections[key].deleteMany({});
    }
  });

  afterAll(async () => {
    await mongoose.disconnect();
    if (ownServer) await ownServer.stop();
  });
}
