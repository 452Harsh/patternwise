# System Design module

The System Design (SD) module lives entirely under `/system-design`. It covers **High-Level Design (HLD)** and **Low-Level Design (LLD)**. Track-specific details are in [`hld.md`](hld.md) and [`lld.md`](lld.md).

It is **separate from DSA** in navigation, data and statistics. It shares only the app shell, authentication, the database connection, the client store, Settings and the stored daily-plan document (see [`architecture.md`](architecture.md#5-modules-dsa-vs-system-design)).

## Content (`data/sd/`)

| File | Contents |
|---|---|
| `types.ts` | `SDTrack`, `ComponentType`, `FlowSpec`, `SDCategory`, `SDConcept`, `HLDPattern`, `UMLSpec`/`UMLClass`/`UMLRelation`, `LLDPattern`, `CapacityDefaults`, `HLDProblem`, `LLDProblem` |
| `ids.ts` | **Canonical id lists**, the single source of truth for cross-references between concepts, patterns and problems |
| `hld-concepts.ts` / `lld-concepts.ts` | Categories (`HLD_CATEGORY_LIST`, `LLD_CATEGORY_LIST`) and concepts |
| `hld-patterns.ts` / `lld-patterns.ts` | Architecture patterns with flow diagrams; GoF patterns with UML and Python code |
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

Reviews work the same way as DSA: completing is one click, and revision is opt-in with a note and a chosen number of days. There is no confidence rating and no "mastered" in the UI.

`SDEntry.status` is `todo`, `learning`, `done` or legacy `mastered`. The UI shows three states via `sdDisplayStatus` (`components/sd/sd-kit.tsx`): **Not started**, **Completed** (`isSDDone`: `done` or `mastered`) and **Needs revision** (`revisit: true`).

| Action | Function | Effect |
|---|---|---|
| Mark as complete / practiced | `markSDComplete(key, title, kind?)` (`CompleteButton`) | Records a study (or `practice`) entry and sets `done`. Doesn't schedule anything unless the item is in revision. |
| Undo complete | `unmarkSDComplete` | Sets the status back to `todo`; history is kept. |
| Add to / edit revision | `addSDToRevision(key, note, days)` (`SDRevisionButton` → shared `RevisionDialogFor`) | Sets `revisit`, `revisionNote` and `nextReview = today + days`. |
| Remove from revision | `removeSDFromRevision` | Clears `revisit`, the note and `nextReview`. |
| Revision quick actions | `sdQuickReview(key, "got-it" \| "practice" \| "forgot" \| "later")` (`SDQuickReview`) | Same four buttons as DSA. "Later" moves `nextReview` to tomorrow; the others go through `rateSD` with ratings 4 / 2 / 1. |
| Internal | `rateSD(key, rating, opts)` | Appends history (a same-day re-rating corrects today's entry). Keeps `done` once completed. Schedules `nextReview` only when `revisit` is set. Also used by interview-mode sessions. |
| Notes / workspace / star | `updateSD(key, patch)` | Saving notes or a workspace on a `todo` item moves it to `learning` (shown as Not started). A notes event is logged at most every 10 minutes. |

`isSDDue` requires `revisit` and `nextReview <= today`. Legacy `reviewOff` and `settings.sdAutoReview` are still accepted in stored data but no longer used.

UI building blocks are in `components/sd/sd-kit.tsx`: `SDProgressPanel` (complete, favourite, revision), `SDProgressCard` (problem pages), `CompleteButton`, `SDRevisionButton`, `SDQuickReview`, `SDNotes`, `StarToggle`, `SDStatusBadge`, `TrackTag`, `SDItemList`.

## Metrics (`lib/sd.ts`)

- **`sdScore`:** 1 if completed, else 0 (same as DSA).
- **`trackStats`:** mastery is the mean score; concepts and patterns count as completed when `isSDDone`; problems count as completed when `isPracticed` (completed, or has a practice or session entry).
- **Other aggregates:** `categoryStats` (completed count; weak when any concept is in revision), `sdOverview` (includes `inRevision`, soonest first), `sdPhaseProgress`, `currentSDPhase` (the first phase below 0.6).

## Daily plan

`systemDesignTasks` in `lib/plan.ts` produces up to three tasks with `kind: "hld" | "lld"` and an `sdKey`:
- one HLD concept: an overdue review, otherwise the next untouched concept;
- one LLD pattern or concept;
- one design problem, alternating between HLD and LLD by date.
