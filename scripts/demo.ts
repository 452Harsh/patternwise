/**
 * Demo data for presentations and judging.
 *
 *   npm run demo -- backup               save every user collection to backups/<db>-<timestamp>.json
 *   npm run demo -- seed --yes           back up, then REPLACE user data with a realistic 3-week history
 *   npm run demo -- restore <file> --yes put a backup back
 *
 * Uses MONGODB_URI / MONGODB_DB from .env.local. The curriculum knowledge index is never touched.
 * After seeding or restoring, sign out and back in so the browser drops its local copy.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { allPatterns } from "../data/curriculum";
import { SD_INDEX } from "../data/sd";
import { addDays, reviewInterval, today } from "../lib/day";
import type { ActivityEvent, AttemptResult, Diagram, Entry, Mock, SDEntry, SDSession } from "../lib/progress";
import { COLLECTIONS, db } from "../lib/server/db";
import { applyPatch } from "../lib/server/repo";
import { PatchSchema } from "../lib/server/schemas";

/** Collections holding the user's own data (not the global `knowledge` index). */
const USER_COLLECTIONS = [
  COLLECTIONS.progress,
  COLLECTIONS.patterns,
  COLLECTIONS.custom,
  COLLECTIONS.companies,
  COLLECTIONS.mocks,
  COLLECTIONS.events,
  COLLECTIONS.meta,
  COLLECTIONS.sd,
  COLLECTIONS.diagrams,
  COLLECTIONS.sdCustom,
  COLLECTIONS.sdSessions,
  COLLECTIONS.coachPlans,
  COLLECTIONS.coachThreads,
];

const DB = process.env.MONGODB_DB ?? "patternwise";
const T = today();
const day = (ago: number) => addDays(T, -ago);
const at = (ago: number, hour = 19, min = 0) => `${day(ago)}T${String(hour - 5).padStart(2, "0")}:${String(min).padStart(2, "0")}:00.000Z`;

/* ---------- backup / restore ---------- */

async function backup(): Promise<string> {
  const d = await db();
  const out: Record<string, unknown[]> = {};
  for (const name of USER_COLLECTIONS) out[name] = await d.collection(name).find().toArray();
  mkdirSync("backups", { recursive: true });
  const file = `backups/${DB}-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
  writeFileSync(file, JSON.stringify({ db: DB, createdAt: new Date().toISOString(), collections: out }, null, 2));
  const counts = Object.entries(out).map(([k, v]) => `${k}:${v.length}`).join(" ");
  console.log(`Backup written: ${file}\n  ${counts}`);
  return file;
}

async function restore(file: string) {
  const data = JSON.parse(readFileSync(file, "utf8")) as { collections: Record<string, Record<string, unknown>[]> };
  const d = await db();
  for (const name of USER_COLLECTIONS) {
    const docs = data.collections[name] ?? [];
    await d.collection(name).deleteMany({});
    if (docs.length) await d.collection(name).insertMany(docs as never[]);
    console.log(`  ${name}: ${docs.length}`);
  }
  console.log(`Restored from ${file}`);
}

/* ---------- realistic history ---------- */

type Attempt = [ago: number, result: AttemptResult, confidence: number, minutes?: number];

/** Replays attempts the way logAttempt does, so status, counters and review dates are consistent. */
function entry(attempts: Attempt[], notes: Partial<Entry> = {}): Entry {
  const e: Entry = {
    status: "todo",
    understanding: 0,
    revisit: false,
    starred: false,
    statement: "",
    approach: "",
    insight: "",
    mistakes: "",
    notes: "",
    code: "",
    language: "python",
    time: "",
    space: "",
    solveCount: 0,
    revisitCount: 0,
    failCount: 0,
    history: [],
    updatedAt: "",
  };
  attempts.forEach(([ago, result, confidence, minutes], i) => {
    const failed = result === "failed";
    const kind = e.solveCount === 0 ? "solve" : "revisit";
    if (kind === "solve" && !failed) e.solveCount++;
    if (kind === "revisit" && !failed) e.revisitCount++;
    if (failed) {
      e.failCount++;
      e.status = e.status === "todo" ? "attempted" : e.status === "mastered" ? "solved" : e.status;
    } else {
      if (e.status === "todo" || e.status === "attempted") e.status = "solved";
      if (confidence >= 5 && e.revisitCount >= 2) e.status = "mastered";
      e.solvedAt ??= at(ago, 19, i);
    }
    e.understanding = failed ? 1 : confidence;
    e.revisit = failed;
    e.lastAttemptAt = at(ago, 19, i);
    e.nextReview = addDays(day(ago), failed ? 1 : reviewInterval(confidence, e.revisitCount));
    e.history.push({ date: day(ago), at: at(ago, 19, i), kind, confidence: e.understanding, result, durationSec: (minutes ?? 25) * 60 });
    e.updatedAt = at(ago, 19, i);
  });
  return { ...e, ...notes };
}

type Rating = [ago: number, rating: number, kind?: "study" | "review" | "practice" | "session"];

function sdEntry(ratings: Rating[], extra: Partial<SDEntry> = {}): SDEntry {
  const e: SDEntry = { status: "todo", confidence: 0, starred: false, notes: "", reviewCount: 0, history: [], updatedAt: "" };
  ratings.forEach(([ago, rating, kind], i) => {
    const isReview = e.history.length > 0;
    if (isReview) e.reviewCount++;
    e.status = rating >= 5 && e.reviewCount >= 2 ? "mastered" : rating >= 3 ? "done" : "learning";
    e.confidence = rating;
    e.lastReviewed = at(ago, 21, i);
    e.nextReview = addDays(day(ago), rating <= 1 ? 1 : reviewInterval(rating, e.reviewCount));
    e.history.push({ date: day(ago), at: at(ago, 21, i), kind: kind ?? (isReview ? "review" : "study"), rating });
    e.updatedAt = at(ago, 21, i);
  });
  return { ...e, ...extra };
}

const problemsOf = (patternId: string) => {
  const p = allPatterns.find((x) => x.pattern.id === patternId);
  if (!p) throw new Error(`Unknown pattern ${patternId}`);
  return p.pattern.problems;
};

function buildDemo() {
  const problems: Record<string, Entry> = {};
  const put = (patternId: string, i: number, attempts: Attempt[], notes?: Partial<Entry>) => {
    const p = problemsOf(patternId)[i];
    if (p) problems[p.slug] = entry(attempts, notes);
  };

  // Strong: hashing and two pointers (clean, confident, revisited).
  put("complement-lookup", 0, [[19, "solved", 4, 12], [9, "solved", 5, 6], [2, "reviewed", 5, 4]], { approach: "One pass: store value → index; look up target − x before inserting x.", time: "O(n)", space: "O(n)" });
  put("complement-lookup", 1, [[18, "solved", 5, 10], [7, "solved", 5, 5]]);
  put("complement-lookup", 2, [[16, "solved", 4, 18]]);
  put("grouping-by-key", 0, [[17, "solved", 4, 20], [6, "solved", 5, 9]]);
  put("grouping-by-key", 1, [[15, "solved", 4, 22]]);
  put("opposite-ends", 0, [[14, "solved", 4, 15], [5, "solved", 5, 8]]);
  put("opposite-ends", 1, [[13, "solved", 4, 25]]);
  put("opposite-ends", 2, [[11, "hints", 3, 35], [4, "solved", 4, 20]]);

  // Struggling: variable-size sliding window. Repeated failures across problems → the coach's stop rule.
  put("variable-longest", 0, [[12, "solved", 3, 40], [6, "failed", 1, 45]], {
    mistakes: "Moved the left pointer one step at a time instead of jumping past the duplicate; updated the best length before the window was valid again.",
  });
  put("variable-longest", 1, [[4, "hints", 2, 50]], { mistakes: "Didn't see that the window stays valid while (size − maxCount) ≤ k." });
  put("variable-longest", 2, [[2, "failed", 1, 45]]);
  put("variable-longest", 3, [[1, "hints", 2, 40]]);

  // Solid but stale: binary search, now overdue.
  put("classic-boundary", 0, [[22, "solved", 4, 15]]);
  put("classic-boundary", 1, [[21, "solved", 4, 20]]);
  put("classic-boundary", 2, [[20, "hints", 3, 30]]);

  // In progress: stack, linked list, trees.
  put("matching-nesting", 0, [[10, "solved", 4, 12]]);
  put("matching-nesting", 1, [[9, "solved", 3, 28]]);
  put("fast-slow", 0, [[8, "solved", 4, 15]]);
  put("reversal", 0, [[7, "solved", 3, 30], [1, "solved", 4, 15]]);
  put("dfs-bottom-up", 0, [[3, "solved", 3, 25]]);

  const patterns = {
    "complement-lookup": { status: "understood" as const, note: "Ask: what am I looking for, and what have I seen before?" },
    "variable-longest": { status: "needs-practice" as const, note: "Expand right; shrink left with WHILE until valid; only then record the answer." },
    "classic-boundary": { status: "understood" as const, note: "" },
  };

  // System Design: a mix of strong, studied-but-not-applied, and slipping items.
  const sd: Record<string, SDEntry> = {};
  const sdPut = (key: string, ratings: Rating[], extra?: Partial<SDEntry>) => {
    if (SD_INDEX.has(key)) sd[key] = sdEntry(ratings, extra);
  };
  sdPut("concept:scalability", [[18, 4], [8, 5]]);
  sdPut("concept:availability", [[17, 4], [3, 4]]);
  sdPut("concept:cache-aside", [[15, 4], [6, 5]], { notes: "Cache-aside by default; write-through when reads must never be stale." });
  sdPut("concept:replication", [[9, 4]], { notes: "Leader–follower; async replication means replica lag." });
  sdPut("concept:cap-theorem", [[14, 3], [5, 2], [1, 2]]);
  sdPut("concept:sharding", [[11, 3], [2, 4]]);
  sdPut("pattern:consistent-hashing", [[10, 2], [3, 2]]);
  sdPut("pattern:cache-aside-pattern", [[12, 4]]);
  sdPut("concept:encapsulation", [[16, 5]]);
  sdPut("concept:single-responsibility", [[13, 4]]);
  sdPut("pattern:observer", [[12, 4], [4, 4]]);
  sdPut("pattern:strategy", [[8, 3]]);
  sdPut("problem:url-shortener", [[7, 3, "practice"], [5, 3, "session"]]);
  sdPut("problem:parking-lot", [[6, 4, "practice"]]);

  const sdSessions: SDSession[] = [
    {
      id: "demo-session-1",
      mode: "hld",
      itemKey: "problem:url-shortener",
      title: "Design a URL Shortener",
      startedAt: at(5, 20),
      plannedMin: 45,
      durationSec: 41 * 60,
      phases: { requirements: true, clarify: true, scale: true, api: true, architecture: true, database: true, scaling: false, failures: false, tradeoffs: false },
      wentWell: "Clear requirements and API; base62 ID generation.",
      difficult: "Estimating storage and QPS on the spot.",
      missing: "Didn't cover cache eviction or what happens when the ID generator fails.",
      toRevise: "Consistent hashing and failover.",
      confidence: 3,
    },
  ];

  const diagrams: Record<string, Diagram> = {
    "demo-url-shortener": {
      id: "demo-url-shortener",
      title: "URL shortener: read path",
      problemKey: "problem:url-shortener",
      notes: "Reads dominate 100:1, so the cache sits in front of the KV store.",
      nodes: [
        { id: "n1", type: "client", label: "Client", x: 10, y: 150 },
        { id: "n2", type: "load-balancer", label: "Load balancer", x: 165, y: 150 },
        { id: "n3", type: "service", label: "Redirect service", x: 320, y: 150 },
        { id: "n4", type: "cache", label: "Redis", x: 480, y: 60 },
        { id: "n5", type: "database", label: "KV store", x: 480, y: 240 },
      ],
      edges: [
        { id: "e1", from: "n1", to: "n2" },
        { id: "e2", from: "n2", to: "n3" },
        { id: "e3", from: "n3", to: "n4", label: "hit" },
        { id: "e4", from: "n3", to: "n5", label: "miss" },
      ],
      createdAt: at(7, 20),
      updatedAt: at(7, 21),
    },
  };

  const mocks: Mock[] = [
    { id: "demo-mock-1", date: day(10), title: "Peer mock: arrays & hashing", minutes: 45, rating: 4, notes: "Fast on hashing; slow to state complexity." },
    { id: "demo-mock-2", date: day(3), title: "Peer mock: strings", minutes: 45, rating: 2, notes: "Froze on a sliding-window question." },
  ];

  // Activity feed derived from the history above.
  const titleOf = new Map(allPatterns.flatMap((x) => x.pattern.problems.map((p) => [p.slug, p.title])));
  const events: ActivityEvent[] = [];
  for (const [slug, e] of Object.entries(problems)) {
    e.history.forEach((h, i) => {
      const name = titleOf.get(slug) ?? slug;
      const type = h.result === "failed" ? "failed" : i === 0 ? "solved" : "reviewed";
      const text = type === "failed" ? `Couldn't solve ${name} yet` : type === "solved" ? `Solved ${name}` : `Reviewed ${name}`;
      events.push({ id: "", at: h.at!, type, slug, text });
    });
  }
  for (const [key, e] of Object.entries(sd)) {
    const name = SD_INDEX.get(key)!.title;
    e.history.forEach((h, i) => {
      const type = h.kind === "session" ? "sd-session" : h.kind === "practice" ? "sd-practiced" : i === 0 ? "sd-studied" : "sd-reviewed";
      const text = type === "sd-session" ? `Mock session: ${name}` : type === "sd-practiced" ? `Practiced ${name}` : type === "sd-studied" ? `Learned ${name}` : `Reviewed ${name}`;
      events.push({ id: "", at: h.at, type, sdKey: key, text });
    });
  }
  for (const m of mocks) events.push({ id: "", at: `${m.date}T15:00:00.000Z`, type: "mock", text: `Mock interview: ${m.title}` });
  events.sort((a, b) => b.at.localeCompare(a.at));
  events.forEach((e, i) => (e.id = `demo-ev-${i}`));

  return { problems, patterns, mocks, events: events.slice(0, 300), sd, sdSessions, diagrams };
}

async function seed() {
  const file = await backup();
  const d = await db();
  const meta = await d.collection<{ _id: string; settings?: Record<string, unknown> }>(COLLECTIONS.meta).findOne({ _id: "meta" });
  const demo = buildDemo();
  const patch = PatchSchema.parse({
    ...demo,
    custom: [],
    companies: [],
    sdCustom: [],
    meta: {
      daily: {},
      plans: {},
      checklist: {},
      settings: { name: "", dailyNew: 2, mockTarget: 10, sidebarCollapsed: false, sdAutoReview: true, ...(meta?.settings ?? {}), coach: { minutes: 90, focus: "balanced", difficulty: "auto", dailyProblems: 2 } },
    },
  });
  for (const name of USER_COLLECTIONS) await d.collection(name).deleteMany({});
  await applyPatch(patch);
  console.log(
    `Demo data written to "${DB}": ${Object.keys(demo.problems).length} problems, ${Object.keys(demo.sd).length} System Design items, ${demo.events.length} activity events.\nYour previous data is in ${file}. Sign out and back in to see the demo.`,
  );
}

async function main() {
  const [cmd, arg] = process.argv.slice(2).filter((a) => a !== "--yes");
  const yes = process.argv.includes("--yes");
  if (cmd === "backup") return void (await backup());
  if (cmd === "seed") {
    if (!yes) throw new Error(`This replaces all progress in "${DB}". Re-run with --yes.`);
    return seed();
  }
  if (cmd === "restore") {
    if (!arg || !yes) throw new Error(`Usage: npm run demo -- restore <backup-file> --yes  (replaces all progress in "${DB}")`);
    return restore(arg);
  }
  throw new Error("Usage: npm run demo -- backup | seed --yes | restore <file> --yes");
}

main().then(
  () => process.exit(0),
  (err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  },
);
