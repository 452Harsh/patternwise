# Architecture

This document explains how Patternwise works internally: the layers, the data flow, and the key mechanisms (sync, auth, modules). Read [`decisions.md`](decisions.md) for *why* things are built this way.

## 1. Big picture

Patternwise is a **single-user** Next.js 16 application (App Router) with a **Node.js backend inside the same app** (route handlers + `proxy.ts`) and **MongoDB Atlas** for persistence.

```
Browser                                                     Server (Next.js, Node runtime)          MongoDB
────────────────────────────────────────────────────────    ──────────────────────────────────────  ─────────────
React pages (app/(app)/…)                                    proxy.ts  ── session check on every
  │  read via hooks: useStore / useProgress / useSDItems…              request (pages + /api)
  ▼                                                          app/api/state/route.ts
lib/progress.ts  (client store)                                GET   → lib/server/repo.ts loadState() ──► 11 collections
  • in-memory State + localStorage copy                        PATCH → zod PatchSchema → applyPatch() ─►
  • mutations: logAttempt, rateSD, updateSD…                 app/api/auth/{login,logout}/route.ts
  • diff vs last-synced → debounced PATCH /api/state  ─────►   → lib/server/session.ts (HMAC cookie)
```

Static curriculum content (DSA problems, System Design concepts/patterns/problems) is **TypeScript data compiled into the bundle** (`data/`), not stored in the database. The database stores only **your progress, notes, workspaces, diagrams, settings and activity**.

## 2. Layers

| Layer | Location | Responsibility |
|---|---|---|
| Curriculum data | `data/` (DSA), `data/sd/` (System Design) | Static, typed content. IDs are the join keys for progress. |
| Client store | `lib/progress.ts` | Single source of client state, all mutations, server sync, offline/dirty handling. |
| Derived logic | `lib/stats.ts`, `lib/sd.ts`, `lib/plan.ts`, `lib/catalog.ts`, `lib/related.ts`, `lib/format.ts` | Pure functions over `State`: mastery, streaks, readiness, daily plan, catalogs. |
| UI shell | `components/shell/*` | Module switcher, sidebar, mobile nav, ⌘K palette, sync boot, theme. |
| UI components | `components/*`, `components/sd/*`, `components/ui/*` | Reusable UI; `ui/` is shadcn (Base UI). |
| Pages | `app/(app)/**/page.tsx` | Compose components; most are client components reading the store. |
| Server | `proxy.ts`, `app/api/**`, `lib/server/*` | Auth gate, session cookies, validation, MongoDB reads/writes. |

## 3. Client state & sync (`lib/progress.ts`)

### State shape

`State` (exported type) contains everything the user owns:

- DSA: `problems` (map slug → `Entry`), `patterns` (map patternId → `PatternEntry`), `custom` (custom DSA problems), `companies`, `mocks`
- System Design: `sd` (map catalog key → `SDEntry`), `sdCustom`, `diagrams` (map id → `Diagram`), `sdSessions`
- Shared: `events` (activity log, max 300), `daily` (task checkboxes per date), `plans` (generated daily plan per date), `checklist`, `settings`

See [`database.md`](database.md) for every field.

### Reading

Components call hooks built on `useSyncExternalStore`:

- `useStore()` – whole state; `useProgress()` – DSA problems map; `usePatternProgress()` – DSA pattern map
- Subscribers also listen for `storage` events, so other tabs in the same browser re-render when the local copy changes.
- `useHydrated()` – `true` once data has loaded from the server (or the local copy is being used offline). **Pages render skeletons until this is true.**
- `useSyncStatus()` – `"idle" | "loading" | "ready" | "saving" | "error" | "offline"` (shown by `SyncIndicator`)

### Writing

Every mutation (e.g. `logAttempt`, `updateEntry`, `rateSD`, `updateSD`, `createDiagram`, `toggleDaily`) is a plain function that:

1. reads current state (`read()`), builds the **next state immutably**, optionally appends an activity event (`withEvent`),
2. calls `write(next)` → updates the in-memory cache, writes the `localStorage` copy (`dsa-tracker:v2`), marks it **dirty** (`dsa-tracker:dirty`), notifies subscribers,
3. schedules a debounced sync (700 ms).

### Syncing (diff-based)

`flush()` computes `diff(lastSynced, current)`:

- maps (`problems`, `patterns`, `sd`, `diagrams`) → only changed keys (`null` = delete), detected by **reference inequality** (mutations are immutable, so a changed entry is a new object);
- lists (`custom`, `companies`, `mocks`, `events`, `sdCustom`, `sdSessions`) → whole list when its reference changed;
- `daily`, `plans`, `checklist`, `settings` → sent inside `meta`.

It `PATCH`es `/api/state`. On success `lastSynced = target` and the dirty flag is cleared (only if nothing changed meanwhile). On failure it retries with exponential backoff (2 s → 60 s). On `401` it redirects to `/login`.

### Loading (`initRemote`, called by `components/shell/sync-boot.tsx`)

1. `GET /api/state` → `{ empty, state }`.
2. If the database is **empty** but the browser has data → upload everything (first-run migration).
3. If the local copy is **dirty** (unsaved edits from a closed tab, offline period or edits made while loading) → `mergeStates(remote, local)`: per-item newest-wins by `updatedAt` for `problems`/`sd`/`diagrams`, unions by id for lists, local overrides for `patterns`/`plans`/`checklist`, and only non-default local settings. **Nothing that exists only on the server is dropped.** Then re-sync.
4. Otherwise the server copy replaces the local copy.
5. If the request fails → status `offline`, keep using the local copy, retry every 15 s.

`logout()` flushes, calls `/api/auth/logout`, clears local copies and does a full page load to `/login` (a `signingOut` flag prevents late writes from re-creating the local copy).

Legacy: a v1 `localStorage` key (`dsa-tracker:v1`) from the original browser-only version is migrated on first read.

## 4. Server

- **`proxy.ts`** (Next 16's replacement for middleware; Node runtime): every request except `/api/auth/*` and static assets needs a valid session. Pages redirect to `/login?next=…`; API calls get `401`. `/login` redirects to `/` when already signed in.
- **`app/api/auth/login/route.ts`**: JSON body `{ password }`, constant-time compare with `APP_PASSWORD`, sets `pw_session` cookie (HMAC-signed, httpOnly, SameSite=Lax, Secure in production, 30 days). In-memory lockout: 5 failures per IP → 15 minutes.
- **`app/api/auth/logout/route.ts`**: clears the cookie.
- **`app/api/state/route.ts`**: `GET` → `loadState()`; `PATCH` → validate with `PatchSchema` (zod) → `applyPatch()`. Only `application/json` bodies are accepted (CSRF guard).
- **`lib/server/repo.ts`**: maps collections ↔ `State`. Maps use `bulkWrite` upserts/deletes; lists use `replaceAll` (delete ids not present + upsert the rest); `meta` uses `$set`.
- **`lib/server/db.ts`**: one cached `MongoClient` (survives hot reload / serverless reuse), lazy index creation.

Full endpoint reference: [`api.md`](api.md).

## 5. Modules: DSA vs System Design

The app is two independent preparation environments sharing one shell, store, database and auth.

- **Module detection** (`components/shell/nav.ts` → `moduleForPath`): any path under `/system-design` is System Design; everything else is DSA. Shared routes (`/settings`, `isSharedRoute`) keep the last module (`components/shell/module.ts` → `useModule`, stored in `localStorage` key `pw:module`).
- **Navigation** is defined per module in `MODULES` (`nav.ts`); the sidebar, mobile nav, ⌘K palette (`command-menu.tsx`) and `G`-shortcuts read only the active module's items. `G 1` / `G 2` switch modules; the switcher returns to the last page visited in that module (`pw:last:dsa`, `pw:last:sd`).
- **Data separation**: DSA progress lives in `problems`/`patterns`/…; System Design progress lives in `sd`/`diagrams`/…. Stats are separate (`lib/stats.ts` for DSA, `lib/sd.ts` for SD); `activityByDay(state, scope)` and `streaks(state, scope)` take the module scope; `ActivityFeed` and `DailyPlan` accept a `scope` / `tracks` filter.
- **The one shared document** is the daily plan (`plans[date]`), which contains both DSA and SD tasks; each module's page filters by track (`DailyPlan tracks={["dsa"]}` vs `tracks={["hld","lld"]}`).

## 6. Rendering model

- `app/layout.tsx` – html/body, fonts (Geist, Geist Mono), `Providers` (next-themes, tooltips, sonner toasts).
- `app/(app)/layout.tsx` – authenticated shell: `SyncBoot`, `AppSidebar`, `MobileNav`, `CommandMenu`, `<main>`.
- `app/(app)/template.tsx` – re-mounts per navigation for a subtle page fade.
- `app/login/page.tsx` – outside the `(app)` group, so no shell.
- Curriculum detail routes pre-render with `generateStaticParams` (DSA problems/topics/patterns, SD concepts/patterns/problems). Custom-item routes (`/problems/[slug]`, `/system-design/problems/[id]`) set `dynamicParams = true` and look items up client-side.
- Most pages are client components because they read the browser store; data appears after `useHydrated()`.

## 7. Key algorithms (where to find them)

| Concern | Function | File |
|---|---|---|
| Review interval | `reviewInterval(confidence, revisitCount)` = `[1,1,3,7,14,30][c] × (1 + 0.5·revisits)` days | `lib/progress.ts` |
| DSA attempt logging & mastery promotion | `logAttempt`, `quickReview` | `lib/progress.ts` |
| SD rating, same-day correction, review scheduling | `rateSD`, `markSDComplete`, `setSDReviews`, `snoozeSD` | `lib/progress.ts` |
| DSA problem / pattern / topic mastery | `problemScore`, `patternStat`, `topicStat`, `overview` | `lib/stats.ts` |
| SD mastery & roadmap | `sdScore`, `trackStats`, `categoryStats`, `sdOverview`, `sdPhaseProgress` | `lib/sd.ts` |
| Daily plan (DSA + SD tasks) | `buildDailyPlan`, `systemDesignTasks` | `lib/plan.ts` |
| Streaks / activity calendar | `streaks(state, scope)`, `activityByDay(state, scope)` | `lib/stats.ts` |
| Diff / merge | `diff`, `mergeStates`, `replayLocalEdits` | `lib/progress.ts` |
