<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Patternwise: guide for coding agents

Patternwise is a single-user study app with two independent modules:
- **DSA** (data structures and algorithms), at `/`
- **System Design** (HLD and LLD), at `/system-design`

Stack: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, shadcn/ui on Base UI, and MongoDB. The backend is Next.js route handlers plus `proxy.ts`.

**The full documentation is in `docs/`. Read what's relevant before changing code:**

| Task | Read |
|---|---|
| Anything | `docs/architecture.md`, `docs/development.md` (§7 is written for agents) |
| Current state, known bugs, what's next | `docs/roadmap.md` |
| Data / persistence | `docs/database.md`, `docs/api.md` |
| DSA features | `docs/dsa.md` |
| System Design features | `docs/system-design.md`, `docs/hld.md`, `docs/lld.md` |
| UI work | `docs/ui-architecture.md` |
| "Why is it like this?" | `docs/decisions.md` |

## Commands

```bash
npm run dev          # http://localhost:3000 (needs .env.local)
npm run lint         # ESLint + React Compiler rules
npm run check:data   # curriculum integrity (DSA + SD)
npm run build        # production build (type-checks)
```

Before finishing a change, run `npm run lint && npm run check:data && npm run build`. CI (`.github/workflows/ci.yml`) runs the same checks on every push; there are no browser tests in the repo yet.

## Where things go

- **DSA page:** `app/(app)/<route>/page.tsx`, plus a nav item in `MODULES.dsa` (`components/shell/nav.ts`).
- **System Design page:** `app/(app)/system-design/<route>/page.tsx`, plus a nav item in `MODULES.sd`. Every SD page must live under `/system-design`, because `moduleForPath` relies on that prefix.
- **Shared page:** register it in `SHARED_NAV`. Only Settings is shared today.
- **User state and mutations:** `lib/progress.ts`, the only client store. New persisted data must also be added to:
  - `diff` and `mergeStates` in `lib/progress.ts`;
  - `PatchSchema` in `lib/server/schemas.ts`;
  - `loadState` / `applyPatch` in `lib/server/repo.ts`.

  `docs/development.md` §5 has the full recipe.
- **Derived metrics:** pure functions in `lib/stats.ts` (DSA) or `lib/sd.ts` (SD).
- **Curriculum:** static TypeScript in `data/` (DSA) or `data/sd/` (SD). For SD, register new ids in `data/sd/ids.ts`.
- **Components:**
  - `components/` holds DSA and shared components.
  - `components/sd/` holds SD components.
  - `components/shell/` holds the app shell.
  - `components/ui/` holds the generated shadcn primitives.

## Reuse; don't duplicate

- **UI kits:**
  - `components/kit.tsx`: Panel, PageHeader, Meter, Ring, badges, EmptyState, Shimmer.
  - `components/sd/sd-kit.tsx`: SDProgressPanel, CompleteButton, SDRevisionButton, SDQuickReview, SDNotes.
  - `components/sd/workspace-kit.tsx`: workspace sections.
- **Item lists:** `useCatalog()` (DSA) and `useSDItems()` (SD) include user-created items.
- **Status helpers:** `isSolved`, `isDue`, `needsRevisit`, `displayStatus`, `isSDDue`. Use these instead of comparing status strings.
- **Scheduling:** `reviewInterval`.
- **Progress updates:**
  - DSA: `markSolved`, `addToRevision`, `removeFromRevision`, `quickReview` (`logAttempt` is used by timed practice).
  - SD: `markSDComplete`, `addSDToRevision`, `removeSDFromRevision`, `sdQuickReview` (`rateSD` is internal).
- **Shared views:** `ActivityFeed`, `DailyPlan` and `NotesView` take a `scope` or `tracks` prop. Pass it instead of forking the component.

## Rules

- **Next.js 16 conventions:**
  - Route `params` is a Promise.
  - The middleware file is `proxy.ts`.
  - Wrap any component that uses `useSearchParams` in `<Suspense>`.
  - Check `node_modules/next/dist/docs/` when unsure.
- **Base UI composition:** use the `render` prop, not `asChild`. In `cmdk`, `CommandDialog` contents go inside `<Command>`.
- **React Compiler lint rules:**
  - Never mutate props or state.
  - No `Date.now()` or `Math.random()` during render.
  - Don't name a variable `module`.
- **Immutable state:** state updates must be immutable, and every write goes through `write()`, because sync finds changes by reference. Components never call the API or touch localStorage directly.
- **Stable ids:** never rename curriculum ids, SD ids or LeetCode slugs. They are database keys.
- **Module separation:** DSA views never show SD data, and SD views never show DSA data. SD activity event types start with `sd-`.
- **Styling:**
  - Use semantic colour tokens only (`primary`, `success`, `warning`, `surface`, …). The app is dark-first.
  - Show `Shimmer` until `useHydrated()` is true.
  - Build mobile-first and add `min-w-0` to grid children.
- **Security:** don't loosen it. That covers:
  - the `proxy.ts` gate;
  - JSON-only mutating requests;
  - cookie flags;
  - constant-time password check;
  - `PatchSchema` size caps.
- **Wording:** the product is "DSA preparation". Don't use "FAANG".
- **Docs:** when a feature lands or changes, update `docs/roadmap.md` (and any other affected doc) in the same change.
