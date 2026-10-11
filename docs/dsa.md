# DSA module

The DSA module is the original part of Patternwise. It is built around one idea: **learn to recognise the pattern, not memorise the problem.** Every route outside `/system-design` belongs to it.

## Curriculum (`data/`)

| File | Contents |
|---|---|
| `data/types.ts` | `Problem` (`slug`, `title`, `difficulty`, `takeaway`), `Pattern` (`signals`, `approach`, `template`, `variations`, `pitfalls`, `transfer`, `problems`), `Topic`; `lcUrl(slug)`; the `P(...)` helper |
| `data/topics-1.ts` … `topics-5.ts` | Topics with their patterns and problems (content only) |
| `data/curriculum.ts` | Composes topics into study order (with `pick`/`omit`); exports `topics`, `allProblems`, `problemIndex`, `allPatterns`, `patternIndex`, `getTopic` |
| `data/important.ts` | `IMPORTANT`: the 119 "interview essentials" slugs |
| `data/coverage.ts` | `COVERAGE`: interview areas mapped to patterns, with tiers (`core`, …), used for readiness and the coverage tab |
| `data/pattern-meta.ts` | `COMPLEXITY`: typical time/space per pattern |
| `data/study-plan.ts` | `PHASES`: Fundamentals → Core Patterns → Trees & Graphs → Advanced Patterns → Interview Revision |

Size: **27 topics, 112 patterns, 364 problems.** Every problem slug is a LeetCode slug. `npm run verify:links` checks that each one exists, isn't premium-only, and matches its title and difficulty. Problem statements are **not** reproduced; each problem links to LeetCode and has a field for restating it in your own words.

Custom problems (`state.custom`, slug `custom-…`) are merged with the curated list by `useCatalog()` in `lib/catalog.ts`. Use that hook, not `allProblems`, anywhere a user may expect their own problems to appear.

## Pages

| Route | File | What it does |
|---|---|---|
| `/` | `app/(app)/page.tsx` | Dashboard: greeting, daily plan (`DailyPlan tracks={["dsa"]}`), streaks, due count, preparation and readiness, activity |
| `/problems` | `app/(app)/problems/page.tsx` | Filterable list (status, difficulty, topic, pattern, list, revision state; search; sort). `?add=1` opens `AddProblemDialog` |
| `/problems/[slug]` | `app/(app)/problems/[slug]/page.tsx` → `components/problem-workspace.tsx` | Read-only problem page (nothing to fill in): link to the statement with an input-size → complexity guide, step-by-step pattern hints (area → signals → pattern → key idea), collapsed technique / template / pitfalls / variations, similar problems. The pattern name is hidden until revealed. Mark as solved and Add to revision (with a note) are the only writes. Older `statement` / `approach` / `notes` / `code` fields stay in the data but are no longer shown |
| `/topics`, `/topics/[topic]` | `components/topic-detail.tsx` | Topic overview and its patterns |
| `/patterns`, `/patterns/[id]` | `components/pattern-detail.tsx`, `pattern-status.tsx` | Pattern library: signals, approach, template, variations, pitfalls, transfer, complexity, problems, self-rating |
| `/study-plan` | `app/(app)/study-plan/page.tsx` | Five phases and their progress (`phaseProgress`), today's plan |
| `/revision` | `app/(app)/revision/page.tsx` | Only problems added to revision (`revisit: true`). Queues: Due today, All in revision, Previously failed; each card shows the revision note; quick actions Got it / Need more practice / Forgot / Review later |
| `/interview` | `app/(app)/interview/page.tsx` | Readiness breakdown, timed practice (`components/timed-practice.tsx`), mock interview log, company lists |
| `/interview/companies/[id]` | | One company list: notes and problems |
| `/progress` | `app/(app)/progress/page.tsx` | Tabs via `UrlTabs`: progress, analytics (`?tab=analytics`), coverage (`components/coverage.tsx`) |
| `/notes` | `components/notes-view.tsx` (`scope="dsa"`) | Every note across problems and patterns, searchable |
| `/python`, `/python/[lesson]` | `components/python-track.tsx`, content in `data/python/` | Python for C++ developers: roadmap and 12 lessons (STL comparison, examples, complexity, when to use, mistakes). **Deliberately not in the nav or dashboard**; reached by URL only. Static content, no user state |

## Progress model

- **Logging an attempt** (`logAttempt(slug, { result, confidence, durationSec?, note?, fresh?, revise?, reviewInDays? })`):
  - The result is one of `solved`, `hints`, `failed` or `reviewed`.
  - The first success counts as a **solve**; later attempts count as **revisits**.
  - Revision is opt-in. `revise` (default: the problem's current `revisit` flag) sets `revisit`. Without it, `nextReview` is cleared and the problem is just solved.
  - When revising, `nextReview = today + reviewInDays`, falling back to 1 day for a failure or `reviewInterval(confidence, revisitCount)`. `LogAttemptDialog` has an "Add to revision" checkbox and a day picker.
  - There is no confidence rating or "mastered" status in the UI. A success sets the status to **solved** (legacy `mastered` entries display as solved). `confidence` is still stored with a fixed value for schema compatibility.
- **Problem page**: "Mark as solved" is one click (`markSolved`, with an Undo toast); the timer's "Stop & mark solved" records the duration. "Add to revision" opens `RevisionDialog`: a note on what to revise (`Entry.revisionNote`) and the number of days (`addToRevision` / `removeFromRevision`). `LogAttemptDialog` is now only used by timed practice. The problem page no longer shows attempt counts or the attempt history, and there is no "Attempted" status: `displayStatus` returns needs-revision, solved or not-started, and `problemScore` counts solved problems only (attempt history is still stored).
- **Quick review** (`quickReview`) maps revision buttons onto `logAttempt`. "Later" only moves `nextReview` to tomorrow.
- **Derived helpers** (`lib/progress.ts`): `isSolved`, `needsRevisit` (only `revisit: true`), `isDue` (in revision and `nextReview <= today`), `displayStatus`. Use these instead of comparing `status` strings directly.
- **Pattern self-rating** (`updatePattern`): `unrated | learning | understood | needs-practice`, plus a note.

## Metrics (`lib/stats.ts`)

- `problemScore`: not started 0 · attempted 0.2 · solved 0.4 + 0.12 × confidence · mastered 1.
- `patternStat` and `topicStat`: mastery is the mean score. A pattern counts as weak below an average confidence of 3. A pattern is mastered at 0.8; a topic is complete at 0.8.
- `overview(state)`:
  - **Preparation:** five equal segments (topics completed, patterns mastered, problems solved, problems revised, mocks against the target).
  - **Readiness:** 0.35 × essentials solved + 0.35 × core-pattern mastery + 0.15 × essentials revised and not overdue + 0.15 × mocks.
- `phaseProgress` and `currentPhaseIndex`: the first phase below 0.8 is the current one.
- `streaks(state, "dsa")` and `activityByDay(state, "dsa")` count DSA events only.

## Daily plan (`lib/plan.ts`)

`buildDailyPlan` produces:
- `settings.dailyNew` **new** problems from the current phase onward. In the last phase it picks unsolved essentials instead.
- One **pattern** to revise: the weakest, else one you're learning, else one you've touched.
- One **failed** or shaky problem to retry, or else something that's due.
- A **theory** block on the pattern behind today's first new problem.

The plan is generated once per day and stored in `plans[today]`. SD tasks are appended to the same list (see [`system-design.md`](system-design.md)).
