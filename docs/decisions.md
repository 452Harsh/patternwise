# Architecture decisions

These are short records of the decisions that shape the codebase. Each one has the context, the decision, and what it costs. Read this before proposing a large change.

## D1. Curriculum is static TypeScript, not database content
- **Context:** the curriculum is hand-curated, versioned and reviewed together with the code. Only one person uses the app.
- **Decision:** problems, patterns, concepts and SD content live in `data/` and ship in the bundle. The database stores only user progress, keyed by stable ids.
- **Cost:** editing content requires a deploy. IDs must never be renamed (see `database.md`).

## D2. Backend is Next.js route handlers (no separate Node server)
- **Context:** the user asked for a Node.js backend and chose "Next.js API routes" over a separate Express server.
- **Decision:** `app/api/**/route.ts` together with `proxy.ts`. Everything deploys to Vercel as one project.
- **Cost:** serverless instances don't share memory, so the login rate limiter is per instance (see roadmap).

## D3. Single user, password login, signed cookie
- **Context:** this is a personal tool. The user chose "Just me, with a login".
- **Decision:**
  - The only credential is `APP_PASSWORD`, compared in constant time.
  - The session is a stateless HMAC-signed cookie (`lib/server/session.ts`), so there is no sessions collection and no user id on documents.
  - There's an in-memory lockout.
- **Cost:** supporting multiple users means adding a `users` collection, a `userId` on every document, and per-user queries.

## D4. One client store with local-first writes and diff sync
- **Context:** the UI should feel instant and keep working through flaky networks. The app was originally localStorage-only.
- **Decision:**
  - `lib/progress.ts` is the only state container (built on `useSyncExternalStore`, with no Redux or React Query).
  - Mutations apply locally and are mirrored to localStorage.
  - Only changed documents are sent, in a debounced `PATCH`.
  - A dirty marker plus `mergeStates` protect unsaved edits.
- **Cost:**
  - The whole state is loaded at boot; that's fine for one user's data, but it isn't paginated.
  - Lists are replaced whole on each save.
  - The merge is last-write-wins per item.

## D5. Maps for per-item data, whole-list replace for small lists
- **Decision:** `problems`, `patterns`, `sd` and `diagrams` are maps with one MongoDB document per key. `custom`, `companies`, `mocks`, `events`, `sdCustom` and `sdSessions` are arrays that get replaced whole.
- **Why:** per-item writes keep payloads small where edits are frequent; whole lists keep small, rarely edited collections simple.

## D6. Validation with zod at the API boundary
- **Decision:** `lib/server/schemas.ts` validates every `PATCH`, including size caps such as the 400 KB workspace limit, 300 diagram nodes and 300 events. There are no MongoDB schema validators.
- **Cost:** the types in `lib/progress.ts` and the schemas must be kept in sync by hand.

## D7. Two modules in one app, separated by route prefix
- **Context:** the user asked for DSA and System Design to be independent environments that share nothing visible.
- **Decision:**
  - Everything under `/system-design` is the SD module, and the shell is driven by `MODULES` in `components/shell/nav.ts`.
  - Stats, activity, streaks, notes, plans and revision are scoped per module.
  - Settings is shared.
  - The stored daily plan is one document filtered by track.
- **Cost:** shared components need a `scope` or `tracks` prop, and new shared views must respect it.

## D8. SD progress keyed by `kind:id`
- **Decision:** all SD items (concepts, patterns, problems, diagrams, custom problems) share one `sd` map and one collection. They are keyed by `sdKey(kind, id)` and use one rating and review model.
- **Why:** one revision queue, one progress panel and one set of stats cover every SD item kind.

## D9. "Complete" means a rating of 3+, and reviews are optional per item
- **Context:**
  - The user wanted a one-click "Mark as complete".
  - Later they wanted to complete an item *without* it coming back for review.
- **Decision:**
  - `markSDComplete` rates the item at least 3.
  - Superseded (Oct 2026): revision is now opt-in for both DSA and SD. Completing never schedules a review; "Add to revision" (note + days) does. `reviewOff` and `settings.sdAutoReview` are legacy fields.
  - A same-day re-rating corrects the day's entry instead of counting as a new review.

## D10. Next.js 16 conventions
- `proxy.ts` replaces `middleware.ts` and runs on the Node runtime.
- Route `params` are Promises (`await params`).
- Detail routes for curated content use `generateStaticParams`. Routes that also serve user-created items set `dynamicParams = true` and resolve the item on the client.
- The `AGENTS.md` block is written by `next dev` and points at `node_modules/next/dist/docs/`. Check it before using any Next API you're not sure about.

## D11. UI kit: shadcn on Base UI, dark-first
- **Decision:**
  - The primitives are shadcn "base-nova" components generated into `components/ui/`, with app-level building blocks in `components/kit.tsx` and `components/sd/sd-kit.tsx`.
  - The app is dark by default, there is no "system" theme, and colours always come from semantic tokens.
- **Cost:** Base UI uses `render` props, so many shadcn/Radix examples (`asChild`) don't apply as written.
