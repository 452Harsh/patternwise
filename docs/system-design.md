# System Design module

The System Design (SD) module lives entirely under `/system-design`. It covers **High-Level Design (HLD)** and **Low-Level Design (LLD)**. Track-specific details are in [`hld.md`](hld.md) and [`lld.md`](lld.md).

It is **separate from DSA** in navigation, data and statistics. It shares only the app shell, authentication, the database connection, the client store, Settings and the stored daily-plan document (see [`architecture.md`](architecture.md#5-modules-dsa-vs-system-design)).

## Content (`data/sd/`)

| File | Contents |
|---|---|
| `types.ts` | `SDTrack`, `ComponentType`, `FlowSpec`, `SDCategory`, `SDConcept`, `HLDPattern`, `UMLSpec`/`UMLClass`/`UMLRelation`, `LLDPattern`, `CapacityDefaults`, `HLDProblem`, `LLDProblem` |
| `ids.ts` | **Canonical id lists**, the single source of truth for cross-references between concepts, patterns and problems |
| `hld-concepts.ts` / `lld-concepts.ts` | Categories (`HLD_CATEGORY_LIST`, `LLD_CATEGORY_LIST`) and concepts |
| `hld-patterns.ts` / `lld-patterns.ts` | Architecture patterns with flow diagrams; GoF patterns with UML and Java/Python code |
| `hld-problems.ts` / `lld-problems.ts` | Design problems |
| `index.ts` | `SD_ITEMS` (a flat catalog of every item), `SD_INDEX`, `sdKey(kind, id)`, `sdHref(key)`, `conceptById`, `hldPatternById`, `lldPatternById`, `hldProblemById`, `lldProblemById`, `findPattern`, `findProblem`, `categoriesFor`, `conceptsIn` |
| `study-plan.ts` | `SD_PHASES`: Foundations → Building Blocks → Async & Reliability → Patterns → Practice & Interviews |

Size: **77 concepts** (54 HLD in 7 categories, 23 LLD in 3), **35 patterns** (16 HLD, 19 LLD), **34 problems** (17 HLD, 17 LLD). `npm run check:data` validates every cross-reference.

### Item keys

Every trackable thing is an `SDItem` with a key of the form `kind:id`:

```
concept:cap-theorem   pattern:circuit-breaker-pattern   problem:url-shortener   diagram:<generated id>
```

`sdItemsFor(state)` and `useSDItems()` (`lib/sd.ts`) extend `SD_ITEMS` with the user's custom problems (`state.sdCustom`) and diagrams. **Always use these hooks for lists that should include user-created items.**

## Pages (`app/(app)/system-design/`)

| Route | What it does |
|---|---|
| `/system-design` | Dashboard: HLD/LLD mastery, due reviews, weak items, recent activity, SD daily tasks (`DailyPlan tracks={["hld","lld"]}`), SD streak |
| `/hld`, `/lld` | Track overviews: categories, patterns and problems for that track |
| `/concepts`, `/concepts/[id]` | Concept library and pages (`components/sd/concept-detail.tsx`) |
| `/patterns`, `/patterns/[id]` | HLD architecture patterns and LLD design patterns (`sd-pattern-detail.tsx`) |
| `/problems`, `/problems/[id]` | Problem list (`?track=hld\|lld`, `?add=1` adds a custom problem) and workspace (`sd-problem-page.tsx`) |
| `/architecture`, `/architecture/[id]` | Saved architecture diagrams and the editor (`architecture-editor.tsx`) |
| `/uml` | UML / LLD design: the class diagrams behind the patterns and problems |
| `/study-plan` | `SD_PHASES` roadmap with progress (`sdPhaseProgress`) |
| `/revision` | Queues: due today, HLD concepts, HLD problems, LLD concepts, LLD patterns, LLD problems, diagrams |
| `/interview` | Timed interview mode (`?mode=hld\|lld\|mixed`, `?item=<key>`): phase checklist, then a debrief saved as an `SDSession` |
| `/progress` | Progress and analytics (`?tab=analytics`, `components/sd/sd-analytics.tsx`) |
| `/notes` | `NotesView scope="sd"` |

## Progress model (`lib/progress.ts`)

`SDEntry.status` takes one of four values: `todo`, `learning`, `done` and `mastered`. The UI labels them **Not started**, **Learning**, **Completed** and **Mastered**.

| Action | Function | Effect |
|---|---|---|
| Rate 1–5 | `rateSD(key, rating, opts)` | The first rating counts as **study**; later ones count as **reviews**, which increment `reviewCount`. Status becomes `done` at rating ≥ 3 and `learning` below that. It becomes `mastered` at rating 5 with ≥ 2 reviews, and stays mastered while ratings are ≥ 4. Sets `nextReview = today + reviewInterval(rating, reviewCount)`, or tomorrow for a rating of 1. **A same-day re-rating corrects today's entry instead of adding a review.** |
| Mark as complete | `markSDComplete` (`CompleteButton`) | Rates the item at least 3. If `settings.sdAutoReview` is off, it sets `reviewOff` first, so no review is scheduled. |
| Undo complete | `unmarkSDComplete` | Sets the status back to `learning`; history is kept. |
| Stop / resume reviews | `setSDReviews(key, on)` | Sets `reviewOff` and clears `nextReview` (stop), or reschedules (resume). Stopped items leave the revision queues. |
| Review later | `snoozeSD` | Sets `nextReview` to tomorrow without a rating. |
| Notes / workspace / star | `updateSD(key, patch)` | Saving notes or a workspace on a `todo` item moves it to `learning`. A notes event is logged at most every 10 minutes. |

Rating labels: the concept scale is `SD_CONFIDENCE` (Don't know → Can apply) and the review marks are `SD_REVIEW_MARKS` (Forgot → Mastered).

UI building blocks are in `components/sd/sd-kit.tsx`:
- `SDProgressPanel`: status, Mark as complete, rating, reviews on/off, next review;
- `SDProgressCard`;
- `ReviewButtons`;
- `CompleteButton`;
- `SDNotes`;
- `StarToggle`;
- `SDStatusBadge`;
- `TrackTag`;
- `SDItemList`.

## Metrics (`lib/sd.ts`)

- **`sdScore`:** 0 if untouched; 1 if mastered; otherwise `min(0.95, 0.2 + 0.15 × confidence)`.
- **`trackStats`:**
  - mastery: the mean score;
  - concepts and patterns: counted as mastered at **confidence ≥ 4** (`MASTERED_CONFIDENCE`);
  - problems: counted as completed when `isPracticed` (done, mastered, or has a practice or session entry).
- **Other aggregates:** `categoryStats` (weak when the average rating is below 3), `sdOverview`, `sdPhaseProgress` (the practice phase uses the share of problems practised), `currentSDPhase` (the first phase below 0.6).

## Daily plan

`systemDesignTasks` in `lib/plan.ts` produces up to three tasks with `kind: "hld" | "lld"` and an `sdKey`:
- one HLD concept: an overdue review, otherwise the next untouched concept;
- one LLD pattern or concept;
- one design problem, alternating between HLD and LLD by date.
