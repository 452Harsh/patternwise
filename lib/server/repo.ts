import "server-only";
import type { AnyBulkWriteOperation, Document } from "mongodb";
import { COLLECTIONS, db } from "./db";
import type { Patch } from "./schemas";

type WithId = Document & { _id: string };

const strip = <T extends Document>({ _id, ...rest }: T) => ({ ...rest, __id: _id as string });

/** Read every collection and assemble the client-side State shape. */
export async function loadState() {
  const d = await db();
  const [progress, patterns, custom, companies, mocks, events, meta] = await Promise.all([
    d.collection<WithId>(COLLECTIONS.progress).find().toArray(),
    d.collection<WithId>(COLLECTIONS.patterns).find().toArray(),
    d.collection<WithId>(COLLECTIONS.custom).find().sort({ createdAt: 1 }).toArray(),
    d.collection<WithId>(COLLECTIONS.companies).find().sort({ createdAt: 1 }).toArray(),
    d.collection<WithId>(COLLECTIONS.mocks).find().sort({ date: -1 }).toArray(),
    d.collection<WithId>(COLLECTIONS.events).find().sort({ at: -1 }).limit(300).toArray(),
    d.collection<WithId>(COLLECTIONS.meta).findOne({ _id: "meta" }),
  ]);

  const byId = (docs: WithId[]) =>
    Object.fromEntries(docs.map((doc) => {
      const { __id, ...rest } = strip(doc);
      return [__id, rest];
    }));
  const list = (docs: WithId[], key: string) =>
    docs.map((doc) => {
      const { __id, ...rest } = strip(doc);
      return { [key]: __id, ...rest };
    });

  const empty = !progress.length && !patterns.length && !custom.length && !companies.length && !mocks.length && !meta;

  return {
    empty,
    state: {
      problems: byId(progress),
      patterns: byId(patterns),
      custom: list(custom, "slug"),
      companies: list(companies, "id"),
      mocks: list(mocks, "id"),
      events: list(events, "id"),
      daily: meta?.daily ?? {},
      plans: meta?.plans ?? {},
      checklist: meta?.checklist ?? {},
      ...(meta?.settings ? { settings: meta.settings } : {}),
    },
  };
}

function upsertMap(entries: Record<string, Document | null>): AnyBulkWriteOperation<WithId>[] {
  return Object.entries(entries).map(([id, value]) =>
    value === null
      ? { deleteOne: { filter: { _id: id } } }
      : { replaceOne: { filter: { _id: id }, replacement: { _id: id, ...value }, upsert: true } },
  );
}

/** Replace a whole collection with `items`, keyed by `key`. */
async function replaceAll(name: string, items: Document[], key: string) {
  const col = (await db()).collection<WithId>(name);
  const ids = items.map((x) => String(x[key]));
  await col.deleteMany({ _id: { $nin: ids } });
  if (items.length) {
    await col.bulkWrite(
      items.map(({ [key]: id, ...rest }) => ({
        replaceOne: { filter: { _id: String(id) }, replacement: { _id: String(id), ...rest }, upsert: true },
      })),
      { ordered: false },
    );
  }
}

export async function applyPatch(patch: Patch) {
  const d = await db();
  const jobs: Promise<unknown>[] = [];

  if (patch.problems && Object.keys(patch.problems).length) {
    jobs.push(d.collection<WithId>(COLLECTIONS.progress).bulkWrite(upsertMap(patch.problems), { ordered: false }));
  }
  if (patch.patterns && Object.keys(patch.patterns).length) {
    jobs.push(d.collection<WithId>(COLLECTIONS.patterns).bulkWrite(upsertMap(patch.patterns), { ordered: false }));
  }
  if (patch.custom) jobs.push(replaceAll(COLLECTIONS.custom, patch.custom, "slug"));
  if (patch.companies) jobs.push(replaceAll(COLLECTIONS.companies, patch.companies, "id"));
  if (patch.mocks) jobs.push(replaceAll(COLLECTIONS.mocks, patch.mocks, "id"));
  if (patch.events) jobs.push(replaceAll(COLLECTIONS.events, patch.events, "id"));
  if (patch.meta && Object.keys(patch.meta).length) {
    jobs.push(
      d.collection<WithId>(COLLECTIONS.meta).updateOne({ _id: "meta" }, { $set: { ...patch.meta, updatedAt: new Date() } }, { upsert: true }),
    );
  }
  await Promise.all(jobs);
}
