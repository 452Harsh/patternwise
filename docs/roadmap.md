# Roadmap & current state

_Last verified against the code on 2026-10-03._ Items are ticked only where the implementation was confirmed in the source. Update this file whenever a feature lands or a decision changes.

## 1. Implemented

### Platform
- [x] Next.js 16 App Router app with route groups (`app/(app)/`) and a separate login page
- [x] Single-user password login, HMAC-signed session cookie, 30-day sessions (`app/api/auth/*`, `lib/server/session.ts`)
- [x] Auth gate on all pages and APIs (`proxy.ts`); JSON-only mutating requests
- [x] Login lockout: 5 failures per IP lock it for 15 minutes (in memory)
- [x] MongoDB persistence across 11 collections (`lib/server/db.ts`, `repo.ts`), with lazy index creation
- [x] zod validation and size caps on all writes (`lib/server/schemas.ts`)
- [x] Local-first client store with diff sync, debounce, retry with backoff, and a keepalive save on page hide (`lib/progress.ts`)
- [x] Offline mode: banner, local copy, retry every 15 s; a dirty marker plus `mergeStates` keep unsaved edits
- [x] First-run upload of browser-only data to an empty database; migration of the legacy v1 localStorage data
- [x] JSON export and import, reset progress, sign out (Settings)
- [x] Dark-first theme with a light option; responsive shell (sidebar, mobile top bar and bottom tabs)
- [x] ⌘K command palette and `G`-key shortcuts, scoped per module; `?` help
- [x] Two independent modules with a switcher (`G 1` / `G 2`) that remembers the last page per module

### DSA module
- [x] Curriculum: 27 topics, 112 patterns, 364 LeetCode problems, 119 interview essentials, coverage map, 5-phase study plan
- [x] Integrity checks (`npm run check:data`) and LeetCode slug verification (`npm run verify:links`)
- [x] Problem list with filters, search, sorting and lists; custom problems (`?add=1`)
- [x] Problem workspace: own-words statement, approach, code (Prism highlighting incl. Java), complexity, mistakes, notes, history, similar problems
- [x] Attempt logging (solved / hints / failed / reviewed, confidence, duration, note) and mastery promotion
- [x] Spaced-repetition revision queues with quick actions
- [x] Pattern library with recognition signals, template, variations, pitfalls, transfer and complexity; pattern self-rating
- [x] Topics pages, study plan phases, a daily plan with a configurable number of new problems
- [x] Interview prep: readiness score, timed practice, mock interview log, company lists
- [x] Progress, analytics (charts, activity calendar, heatmap) and coverage tabs
- [x] Notes page aggregating all DSA notes

### System Design module
- [x] Content: 77 concepts (54 HLD, 23 LLD), 16 HLD architecture patterns, 19 GoF patterns (UML plus Java and Python), 17 HLD and 17 LLD problems
- [x] Dashboard, HLD and LLD overviews, concept, pattern and problem libraries and detail pages
- [x] HLD workspace with a capacity calculator, API and data-model tables, an embedded diagram, scaling prompts and trade-offs
- [x] LLD workspace with actors, use cases, classes, interfaces, relationships, a generated UML diagram, patterns, code in 4 languages and a review checklist
- [x] Architecture diagram editor (drag, connect, rename, annotate, delete, zoom, autosave)
- [x] UML renderer with standard arrowheads and draggable nodes
- [x] Custom SD problems
- [x] Rating (1–5) with spaced repetition; same-day re-rating corrects instead of adding a review
- [x] Mark as complete and undo; stop and resume reviews per item; global "schedule reviews when I mark complete" setting
- [x] Revision queues by kind, review later
- [x] Timed interview mode (HLD, LLD or mixed) with a phase checklist and saved debrief sessions
- [x] Progress, analytics, notes and study plan (5 phases), all scoped to SD
- [x] SD tasks in the daily plan (shown only on SD pages)

### AI Coach (`/coach`; see [`ai-coach.md`](ai-coach.md))
- [x] Model-agnostic AI layer: `ChatModel`/`EmbeddingModel`, Ollama provider and OpenAI-compatible provider (`lib/ai/`)
- [x] Default open-weight stack: Gemma 4 E2B (QAT) for chat and EmbeddingGemma for embeddings, run locally via Ollama; streaming responses
- [x] Deterministic recommendation engine for DSA and SD: explainable priorities, the stop rule, difficulty progression, variation coverage, the "studied but not applied" check (`lib/coach/`); 29 engine checks (`npm run check:coach`)
- [x] Today's Plan: preferences (time, focus, difficulty, interview date, problems/day), timed steps per module, after-today pick, avoid-for-now, saved per day, auto-ticked when practice is logged, plus a streamed "Coach's take"
- [x] RAG: 649 curriculum documents, incremental indexer, Atlas Vector Search index `knowledge_vector` with in-memory and keyword fallbacks, sources shown under each answer
- [x] Ask Coach (grounded chat with saved private threads), Spot the pattern, 4-level progressive hints, Explain it back (score feeds pattern rating / SD rating)
- [x] Interview mode for DSA, HLD and LLD with stages, timer, interviewer follow-ups, feedback and save-to-progress
- [x] My Weak Areas (deterministic, per module)
- [x] AI Coach as a third module in the shell (switcher, ⌘K, `G 3`, mobile tabs); DSA/SD context kept separate on every coach page

## 2. Partially implemented

- [ ] **Stop reviews:** exists for System Design (`setSDReviews`) but **not for DSA**; DSA problems can only be snoozed ("Review later").
- [ ] **Multi-device sync:** works through load-time merge and per-item newest-wins, but there is no live update across devices. Tabs in the same browser stay in step through the shared localStorage copy (`storage` events); another device only sees changes after a reload.
- [ ] **Diagram editor:** core editing works. Missing: undo/redo, multi-select, export (PNG/SVG), curved or orthogonal edge routing.
- [ ] **UML layout:** `autoLayout` is a simple level-based layout. Large diagrams can need manual dragging.
- [ ] **AI Coach on Vercel:** the deterministic parts work anywhere, but the model needs a reachable endpoint. Locally that's Ollama; a deployment needs `AI_PROVIDER=openai-compatible` pointing at a hosted open-model server (not set up yet).
- [ ] **Coach grounding:** the prompts forbid invented statistics and every fact is supplied, but replies are not automatically checked against the data.
- [ ] **Login rate limiting:** in memory, so it is per server instance and resets on cold start (weak on Vercel).

## 3. Not implemented

- [x] CI: GitHub Actions runs lint, type-check, curriculum checks, coach engine checks and the build on every push and PR; LeetCode links are re-verified weekly
- [ ] Automated browser (e2e) tests in the repo
- [ ] Multiple users or accounts (no `users` collection, no `userId`)
- [ ] Password change from the UI (the password is the `APP_PASSWORD` env var)
- [ ] Real-time sync between devices (same-browser tabs already share state)
- [ ] Server-side pagination; the whole state is loaded at boot
- [ ] Database transactions for multi-collection writes
- [ ] Embedded problem statements (deliberately not done; see [`decisions.md`](decisions.md))
- [ ] Compile-checking the Java/Python/C++ snippets in the SD content

## 4. Known bugs & quirks

- **Inconsistent SD "mastered" counts.** `trackStats` (`lib/sd.ts`) counts concepts and patterns as "mastered" at confidence ≥ 4 (`MASTERED_CONFIDENCE`). An item's *status* only becomes `mastered` at rating 5 with ≥ 2 reviews. A dashboard count can therefore exceed the number of items showing a "Mastered" badge.
- **Inflated `reviewCount` in existing data.** Before the same-day correction fix, re-rating an item several times on one day incremented `reviewCount` each time (e.g. 21 on one concept). Later intervals for those items are longer than intended. A one-off recount from `history` would fix it; that hasn't been run.
- **Deleted items can come back after an offline merge.** `mergeStates` never drops server-only items, so something deleted on a device that was offline can reappear when another device's copy is merged.
- **Pattern ratings have no `updatedAt`.** When merging, the local copy always wins for `patterns`, even if it's older.
- **Lists are last-write-wins as a whole.** `events`, `mocks`, `companies`, `custom`, `sdCustom` and `sdSessions` are replaced whole on save. Concurrent edits from two devices can overwrite each other (the merge unions by id at load time only).
- **The import success toast** reports only the number of DSA problems, even when SD data was imported too.
- **Dev only:** after moving or renaming routes, stale `.next/types` can cause type errors; delete `.next`. `next dev` re-adds the `AGENTS.md` block.

- **Coach plan vs today's edits.** A saved plan is a snapshot; logging practice auto-ticks its steps, but new weaknesses only show after **Regenerate**.

## 5. Technical debt

- **Unused settings:** `Settings.navCollapsed` and `Settings.includeSD` are still in the type, `DEFAULT_SETTINGS` and the schema, but nothing reads them.
- **Unused component:** `ConfidencePicker` in `components/sd/sd-kit.tsx` (replaced by `SDProgressPanel`).
- **`lib/progress.ts` is large** (~1,150 lines): types, persistence, sync, merge, and DSA and SD mutations in one file. Candidates to split out: `lib/progress/sync.ts`, `dsa.ts`, `sd.ts`, keeping the same exports.
- **Types are duplicated** between `lib/progress.ts` and `lib/server/schemas.ts`. Deriving the types from zod (`z.infer`) would remove the drift risk.
- **Two `mean` helpers** (in `lib/stats.ts` and `lib/sd.ts`) and similar scoring code. Could move to `lib/utils.ts`.
- **Testing:** the manual verification scripts used during development are not in the repo.

## 6. Suggested implementation order

0. **AI Coach next steps:** a hosted Gemma endpoint for the Vercel deployment; a post-check that numbers in replies match the facts; plan regeneration hints when progress changes during the day.
1. **Add a test baseline:** unit tests for `reviewInterval`, `logAttempt`, `rateSD` (including the same-day correction), `diff` and `mergeStates`; one Playwright smoke test (login → rate → reload); a GitHub Action running lint, `check:data`, build and tests.
2. **Data fixes:** align the SD "mastered" definition (pick one rule and use it in both `rateSD` and `trackStats`), and run a one-off `reviewCount` recount from `history`.
3. **Stop reviews for DSA,** mirroring `setSDReviews` (`reviewOff` on `Entry` plus a schema field and UI on the problem page and revision rows).
4. **Remove dead code:** `navCollapsed`, `includeSD` (keep accepting them in the schema for old snapshots, or strip them on load), and `ConfidencePicker`.
5. **Move the login rate limiter into MongoDB** (a TTL-indexed `login_attempts` collection).
6. **Merge tombstones:** record deletions (e.g. `deletedAt`) so offline deletes survive merges; add `updatedAt` to `PatternEntry`.
7. **Split `lib/progress.ts`** and derive types from the zod schemas.
8. **Editor improvements:** undo/redo, multi-select, PNG/SVG export, better edge routing.
9. **Optional:** live sync (polling or SSE), multi-user accounts.

## 7. Do not change without a strong reason

- **Coach rule: the engine decides, the model explains.** Don't move calculations into prompts or let the client send user statistics to `/api/coach/chat`; the server recomputes them from MongoDB.
- **Coach privacy:** never index user data into `knowledge`.

- **Curriculum and SD ids, and LeetCode slugs:** they're database keys.
- **The `kind:id` SD key format** and the single `sd` map.
- **The `/system-design` route prefix:** module detection depends on it.
- **The immutable-update plus reference-diff sync model and the dirty-marker merge:** they protect against data loss; every change here needs the offline, two-device and sign-out scenarios re-tested.
- **The sign-out guard (`signingOut`)** and the "don't drop server-only items" merge rule.
- **Auth properties:** constant-time password compare, httpOnly/SameSite/Secure cookie, JSON-only mutations, the `proxy.ts` matcher.
- **`PatchSchema` size caps.**
- **Module separation:** no DSA content in SD views and vice versa.
- **Dark-first theme and the semantic colour tokens.**
