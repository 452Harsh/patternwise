import "server-only";
import { MongoClient, type Db } from "mongodb";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB ?? "patternwise";

// Reuse one client across hot reloads in dev and across requests in prod.
const globalForMongo = globalThis as unknown as { _mongo?: Promise<MongoClient>; _indexes?: Promise<void> };

function client(): Promise<MongoClient> {
  if (!uri) throw new Error("MONGODB_URI is not set. Add it to .env.local.");
  globalForMongo._mongo ??= new MongoClient(uri, { maxPoolSize: 10, serverSelectionTimeoutMS: 10_000 }).connect();
  return globalForMongo._mongo;
}

export const COLLECTIONS = {
  progress: "problem_progress",
  patterns: "pattern_progress",
  custom: "custom_problems",
  companies: "companies",
  mocks: "mock_interviews",
  events: "activity",
  meta: "meta",
  sd: "sd_progress",
  diagrams: "sd_diagrams",
  sdCustom: "sd_custom_problems",
  sdSessions: "sd_sessions",
} as const;

export async function db(): Promise<Db> {
  const d = (await client()).db(dbName);
  globalForMongo._indexes ??= ensureIndexes(d);
  await globalForMongo._indexes;
  return d;
}

async function ensureIndexes(d: Db) {
  await Promise.all([
    d.collection(COLLECTIONS.events).createIndex({ at: -1 }),
    d.collection(COLLECTIONS.progress).createIndex({ nextReview: 1 }),
    d.collection(COLLECTIONS.progress).createIndex({ status: 1 }),
    d.collection(COLLECTIONS.sd).createIndex({ nextReview: 1 }),
    d.collection(COLLECTIONS.diagrams).createIndex({ problemKey: 1 }),
  ]);
}
