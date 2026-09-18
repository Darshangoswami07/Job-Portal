/**
 * ONE shared in-memory MongoDB for the whole Vitest run. Each test file gets
 * its own database name (see test/mongo.js) so they stay isolated, but only a
 * single `mongod` process is spawned — avoids the resource contention that
 * happens when every DB test file starts its own instance.
 */
import { MongoMemoryServer } from "mongodb-memory-server";

let mongod;

export async function setup() {
  mongod = await MongoMemoryServer.create();
  process.env.MONGO_TEST_URI = mongod.getUri();
}

export async function teardown() {
  if (mongod) await mongod.stop();
}
