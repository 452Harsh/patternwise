# Database

MongoDB (Atlas) stores **only user-owned data** — progress, notes, workspaces, diagrams, settings, activity. All curriculum content (problems, concepts, patterns) is static TypeScript in `data/` and is referenced by ID.

- Driver: official `mongodb` Node driver (no ORM/ODM). Connection: `lib/server/db.ts`.
- Database name: `MONGODB_DB` (default `patternwise`).
- Single user: there is **no `users` collection** and no `userId` field. Every document belongs to the one account. (See [`decisions.md`](decisions.md) and the multi-user item in [`roadmap.md`](roadmap.md).)
- Validation happens in the API (`lib/server/schemas.ts`, zod) — MongoDB has no schema validators.
- Types live client-side in `lib/progress.ts`; the zod schemas mirror them. **Change both together.**

## Collections

Collection names are defined once in `COLLECTIONS` (`lib/server/db.ts`).

| Collection | `_id` | Shape (TS type) | Write strategy | Module |
|---|---|---|---|---|
| `problem_progress` | DSA problem slug (e.g. `two-sum`, `custom-abc123`) | `Entry` | per-document upsert / delete | DSA |
| `pattern_progress` | DSA pattern id (e.g. `variable-longest`) | `PatternEntry` | per-document upsert / delete | DSA |
| `custom_problems` | `slug` (`custom-…`) | `CustomProblem` | replace whole list | DSA |
| `companies` | `id` | `Company` | replace whole list | DSA |
| `mock_interviews` | `id` | `Mock` | replace whole list | DSA |
| `sd_progress` | catalog key (e.g. `concept:cap-theorem`) | `SDEntry` | per-document upsert / delete | System Design |
| `sd_diagrams` | diagram id | `Diagram` (minus `id`) | per-document upsert / delete | System Design |
| `sd_custom_problems` | `id` (`sdc-…`) | `SDCustomProblem` | replace whole list | System Design |
| `sd_sessions` | `id` | `SDSession` | replace whole list | System Design |
| `activity` | `id` | `ActivityEvent` | replace whole list (≤ 300) | shared |
| `meta` | `"meta"` (single doc) | `{ daily, plans, checklist, settings, updatedAt }` | `$set` of changed keys | shared |

Indexes (created lazily in `ensureIndexes`): `activity.at`, `problem_progress.nextReview`, `problem_progress.status`, `sd_progress.nextReview`, `sd_diagrams.problemKey`.

## Document shapes

### `Entry` — DSA problem progress (`problem_progress`)
| Field | Type | Notes |
|---|---|---|
| `status` | `"todo" \| "attempted" \| "solved" \| "mastered"` | `mastered` after confidence 5 with ≥ 2 revisits |
| `understanding` | 0–5 | latest confidence (0 = unrated) |
| `revisit` | boolean | manually flagged for revision |
| `starred` | boolean | favourite |
| `statement`, `approach`, `insight`, `mistakes`, `notes` | string | user notes |
| `code`, `language` | string | user's solution |
| `time`, `space` | string | user's complexity analysis |
| `solveCount`, `revisitCount`, `failCount` | number | counters |
| `history` | `HistoryItem[]` | `{ date, at?, kind: "solve"\|"revisit", confidence, result?: "solved"\|"hints"\|"failed"\|"reviewed", durationSec?, note? }` |
| `solvedAt`, `lastAttemptAt` | ISO string | |
| `nextReview` | `yyyy-mm-dd` | spaced-repetition due date |
| `updatedAt` | ISO string | used for merge (newest wins) |

### `PatternEntry` — DSA pattern self-rating (`pattern_progress`)
`{ status: "unrated" | "learning" | "understood" | "needs-practice", note: string }` — no `updatedAt` (merge uses local-wins).

### `SDEntry` — System Design progress (`sd_progress`)
Keyed by **catalog key** `kind:id` where kind ∈ `concept | pattern | problem | diagram` (see `sdKey()` in `data/sd/index.ts`).

| Field | Type | Notes |
|---|---|---|
| `status` | `"todo" \| "learning" \| "done" \| "mastered"` | UI labels: Not started / Learning / Completed / Mastered |
| `confidence` | 0–5 | 1 Don't know/Forgot … 5 Can apply/Mastered |
| `starred`, `notes` | | |
| `reviewCount`, `lastReviewed`, `nextReview` | | `nextReview` absent when reviews are off |
| `reviewOff` | boolean? | reviews switched off for this item |
| `history` | `SDHistoryItem[]` (≤ 200) | `{ date, at, kind: "study"\|"review"\|"practice"\|"session", rating 1–5, durationSec?, note? }` |
| `workspace` | object? (≤ 400 KB) | HLD/LLD problem workspace (`HLDWorkspaceData` / `LLDWorkspaceData`, defined in `components/sd/hld-workspace.tsx` / `lld-workspace.tsx`) |
| `updatedAt` | ISO string | |

### `Diagram` (`sd_diagrams`)
`{ title, problemKey?, notes, nodes: {id,type,label,x,y,note?}[] (≤300), edges: {id,from,to,label?}[] (≤600), createdAt, updatedAt }`. `type` is a `ComponentType` (`data/sd/types.ts`). A diagram's own review progress lives in `sd_progress` under `diagram:<id>`.

### `SDSession` (`sd_sessions`)
Interview-mode session: `{ mode: "hld"|"lld"|"mixed", itemKey, title, startedAt, plannedMin, durationSec, phases: Record<id,bool>, wentWell, difficult, missing, toRevise, confidence }`.

### Other
- `CustomProblem`: `{ slug, title, url, platform, difficulty, patternId, takeaway, createdAt }`
- `SDCustomProblem`: `{ id, track: "hld"|"lld", title, difficulty, statement, createdAt }`
- `Company`: `{ id, name, notes, slugs: string[], createdAt }`
- `Mock`: `{ id, date, title, minutes, rating, notes }`
- `ActivityEvent`: `{ id, at, type, slug?, patternId?, sdKey?, text }` — types: DSA `solved|reviewed|failed|mastered|note|pattern|flagged|mock`, SD `sd-studied|sd-reviewed|sd-practiced|sd-mastered|sd-note|sd-session`.
- `meta.settings` (`Settings`): `name, dailyNew, mockTarget, sidebarCollapsed, navCollapsed, includeSD, sdAutoReview` (the `navCollapsed` and `includeSD` fields are no longer read — see technical debt in [`roadmap.md`](roadmap.md)).
- `meta.plans[date]`: `PlanTask[]` `{ id, kind: "new"|"pattern"|"failed"|"theory"|"hld"|"lld", label, slug?, patternId?, sdKey? }`.

## Conventions

- **IDs are stable contracts.** DSA problem slugs (LeetCode slugs), DSA pattern ids, and SD ids (`data/sd/ids.ts`) are database keys. Renaming one orphans user progress. Add new ids; don't rename.
- **Maps vs lists.** Data edited often or individually → map collection with per-document writes. Small lists → whole-list replace.
- **Every progress document carries `updatedAt`** (except `PatternEntry`) — the merge relies on it.
- **No deletes of unknown data on load.** The client merge never drops server-only items.
- **Size limits** are enforced in `PatchSchema` (e.g. workspace 400 KB, history 200/1000 items, events 300).

## MongoDB setup

1. Create an Atlas cluster (the free tier is enough) and a database user with read/write access.
2. **Network Access**: allow your IP for local development; for Vercel allow `0.0.0.0/0` (Vercel IPs are dynamic) and rely on a strong DB password.
3. Copy the driver connection string into `MONGODB_URI` (URL-encode special characters in the password).
4. Collections and indexes are created automatically on first use.

Backups: Settings → **Export** downloads a JSON snapshot (the same shape as `State`); **Import** replaces the database contents with a snapshot.
