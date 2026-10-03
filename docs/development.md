# Development guide

This is for anyone changing the code, people and AI assistants alike. Read [`architecture.md`](architecture.md) first, then the doc for the module you're touching.

## 1. Setup

Requirements: Node.js 20 or newer (developed on Node 24), npm, and a MongoDB Atlas cluster (see [`database.md`](database.md#mongodb-setup)).

```bash
npm install
cp .env.example .env.local     # then fill it in (see below)
npm run dev                    # http://localhost:3000 → sign in with APP_PASSWORD
```

### Environment variables (`.env.local`, never committed)

| Variable | Required | Purpose |
|---|---|---|
| `MONGODB_URI` | yes | Atlas connection string; URL-encode special characters in the password |
| `MONGODB_DB` | no (default `patternwise`) | Database name; use a throwaway name such as `patternwise_test` for experiments |
| `APP_PASSWORD` | yes | The password typed on `/login` |
| `SESSION_SECRET` | yes | 32+ random characters that sign the session cookie. Generate one with `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"`. Changing it signs everyone out. |

`.gitignore` excludes `.env*` but keeps `.env.example`.

### Scripts (`package.json`)

| Command | What it does |
|---|---|
| `npm run dev` | Dev server (Turbopack) |
| `npm run build` / `npm start` | Production build / server |
| `npm run lint` | ESLint (`eslint-config-next` core-web-vitals + TypeScript, which include the React Compiler rules) |
| `npm run check:data` | Curriculum integrity for DSA and SD: unique ids and slugs, all cross-references resolve, every pattern has transfer notes and complexity, coverage and study-plan references are valid |
| `npm run verify:links` | Checks every DSA slug against LeetCode's public GraphQL API (needs network access) |

**Before you push:** `npm run lint && npm run check:data && npm run build`.

## 2. Deploying to Vercel

1. Import the GitHub repository (`patternwise`). The framework is detected as Next.js and the root directory is the repo root.
2. Add the four environment variables for Production (and Preview if you use it). Point Preview at a separate `MONGODB_DB` if you don't want previews writing to your real data.
3. In Atlas → Network Access, allow `0.0.0.0/0`, because Vercel uses dynamic IPs.
4. Deploy. No `vercel.json` or custom `next.config.ts` options are needed. A push to the default branch redeploys.

## 3. Folder structure

```
app/
  layout.tsx                 root html/body, fonts, Providers
  login/page.tsx             sign-in (outside the app shell)
  (app)/                     authenticated shell (layout.tsx, template.tsx)
    page.tsx, problems/, topics/, patterns/, study-plan/, revision/,
    interview/, progress/, notes/            → DSA module
    system-design/…                           → System Design module
    settings/                                 → shared
  api/auth/{login,logout}/route.ts, api/state/route.ts
proxy.ts                     auth gate (Next 16 "middleware")
components/
  ui/                        shadcn primitives (generated; edit sparingly)
  shell/                     nav, module switcher, sidebar, mobile nav, ⌘K, sync boot, theme
  sd/                        System Design components
  *.tsx                      DSA and shared components (kit, charts, daily plan, notes, …)
lib/
  progress.ts                client store, types, mutations, sync
  stats.ts | sd.ts           DSA | SD derived metrics
  plan.ts, catalog.ts, related.ts, format.ts, utils.ts
  server/                    db, session, http helpers, zod schemas, repo
data/                        DSA curriculum
data/sd/                     System Design curriculum
scripts/                     check-data.ts, verify-leetcode.ts
docs/                        this documentation
```

## 4. Conventions

### Code
- TypeScript strict. Import with `@/…` paths.
- **React Compiler lint rules are enforced:** no mutating props or state, no impure calls during render (`Date.now()`, `Math.random()` belong in handlers and effects), don't access a function before it's declared, and don't name a variable `module`.
- Client components start with `"use client"`. Server code lives only in `app/api/**` and `lib/server/**`, and must never be imported by client code.
- Keep comment density low; comment the *why*, not the *what*.
- Formatting: double quotes, semicolons, about 140-column lines (match the surrounding code).

### Naming
- **Files:** kebab-case (`problem-workspace.tsx`). **Components:** PascalCase. **Hooks:** `useX`.
- **Mutations** are verbs in `lib/progress.ts`: `updateX`, `addX`, `removeX`, `toggleX`, `rateSD`, `markSDComplete`, …
- **SD symbols** are prefixed `SD`/`sd` (`SDEntry`, `sdKey`, `useSDItems`). Track ids are `"hld"` / `"lld"`; module ids are `"dsa"` / `"sd"`.
- **IDs** are kebab-case and **permanent** once shipped (they're database keys).

### Routing
- DSA routes sit at the root of `app/(app)/`; SD routes go under `app/(app)/system-design/`. **Never put SD pages outside `/system-design`.** `moduleForPath` depends on that prefix.
- Shared pages go in `SHARED_NAV` (`components/shell/nav.ts`).
- Linkable UI state belongs in search params; wrap `useSearchParams` users in `<Suspense>`.
- `params` is a Promise in Next 16: `const { id } = await params`.

### UI
See [`ui-architecture.md`](ui-architecture.md). Key rules:
- Reuse the kits.
- Use semantic tokens only.
- Show `Shimmer` until hydrated.
- Make it mobile-first with `min-w-0`.
- Use `AlertDialog` for destructive actions.

## 5. How to…

### Add a page to a module
1. Create `app/(app)/<route>/page.tsx` (for SD: `app/(app)/system-design/<route>/page.tsx`).
2. Add a `NavItem` to the right group in `MODULES` (`components/shell/nav.ts`). Pick an unused `key` for the `G` shortcut within that module. The sidebar, ⌘K and the Settings shortcuts list pick it up automatically.
3. Start with `PageHeader` (SD pages use `eyebrow="System Design"`), then `Panel`s.

### Add curriculum content
- **DSA:** add `P(slug, title, difficulty, takeaway)` to a pattern in `data/topics-*.ts`, or add a pattern (with `signals`, `approach`, `variations`, `pitfalls`, `transfer`), plus its complexity in `data/pattern-meta.ts`.
- **SD:** add the id to `data/sd/ids.ts`, then the content to the matching file, and cross-link it (`related`, `concepts`, `patterns`, `problems`).
- **Then:** run `npm run check:data` (and `npm run verify:links` for new LeetCode slugs).

### Add persisted user data
1. Add the type and a field on `State` in `lib/progress.ts`, including its default in `EMPTY`.
2. Write a mutation that builds new objects immutably and calls `write()`.
3. Teach `diff()` about the field (map or list), and `mergeStates()` how to merge it.
4. Add a zod schema to `PatchSchema` (`lib/server/schemas.ts`), with size caps.
5. Add a collection to `COLLECTIONS`, plus `loadState` / `applyPatch` handling in `lib/server/repo.ts` (including the `empty` check in `loadState`, if relevant).
6. Update `importJson` / `resetAll` if needed, and update [`database.md`](database.md).

### Add an SD item kind or field
Extend `SDItem` / `SD_ITEMS` in `data/sd/index.ts` and `sdItemsFor` in `lib/sd.ts`. Progress then works automatically through the `sd` map and `SDProgressPanel`.

### Add a setting
Add it to `Settings` and `DEFAULT_SETTINGS` (`lib/progress.ts`) and to `SettingsSchema`, then add a control in a `SettingsCard` in `app/(app)/settings/page.tsx`. Keep side-by-side cards symmetric.

## 6. Testing

**CI (GitHub Actions).**
- `.github/workflows/ci.yml` runs on every push to `main`, on pull requests, and on demand. It does `npm ci`, then lint, type-check, `check:data` and a production build. It needs no secrets, because the database and password are only read at runtime.
- `.github/workflows/verify-links.yml` runs `verify:links` every Monday (and on demand). It's kept separate because it depends on LeetCode being reachable.

Beyond CI there are **no browser (e2e) tests in the repo** (see [`roadmap.md`](roadmap.md)). Current practice:
- `npm run lint`, `npm run check:data` and `npm run build` must pass.
- Manual checks run against a **throwaway database** (`MONGODB_DB=patternwise_test`), **never your real `patternwise` database**.
- Areas worth re-checking by hand after a change:
  - sign-in and sign-out, and API 401s;
  - edits made offline that land after reconnecting;
  - two-tab or two-device merges;
  - mark complete, plus stop and resume reviews;
  - the mobile layout at 375px.

## 7. Guide for AI coding assistants

**Read first**, in this order:
1. `AGENTS.md`: this is Next.js 16, so check `node_modules/next/dist/docs/` before using unfamiliar APIs.
2. This file.
3. `architecture.md`.
4. The doc for the module you're touching.

**Where things go**

| You are adding… | Put it in… |
|---|---|
| A DSA page | `app/(app)/<route>/page.tsx` + `MODULES.dsa` in `components/shell/nav.ts` |
| An SD page | `app/(app)/system-design/<route>/page.tsx` + `MODULES.sd` |
| A shared page | `app/(app)/<route>/` + `SHARED_NAV` |
| User state or a mutation | `lib/progress.ts` (and the schema and repo, see §5) |
| A derived metric | `lib/stats.ts` (DSA) or `lib/sd.ts` (SD), as a pure function of `State` |
| Curriculum | `data/` (DSA) or `data/sd/` (SD) |
| A reusable DSA/shared component | `components/` |
| An SD component | `components/sd/` |
| A shell or navigation behaviour | `components/shell/` |
| A server endpoint | `app/api/<name>/route.ts` using the `lib/server/http.ts` helpers (`json`, `isAuthed`, `isJson`, `serverError`) |

**Extend, don't duplicate**
- Use `useCatalog()` for DSA problem lists and `useSDItems()` for SD lists, because they include user-created items.
- Use `isSolved`, `isDue`, `needsRevisit`, `displayStatus` and `isSDDue`; don't re-derive status.
- Use `reviewInterval` for any scheduling.
- Use `rateSD`, `markSDComplete` and `setSDReviews` for SD progress, and `logAttempt` / `quickReview` for DSA.
- Use `SDProgressPanel`, `CompleteButton` and `ReviewButtons` for SD item pages.
- For shared widgets, pass `scope` / `tracks` instead of forking components.
- Use `withEvent` for activity, with the event types defined in `EventType`.

**Keep DSA and System Design separate**
- SD UI never shows DSA data, and vice versa. A component used by both must take a `scope`/`tracks` prop and filter by it.
- SD event types start with `sd-`, and `eventScope(type)` relies on that.
- Don't add DSA items to `MODULES.sd` or the reverse. Settings is the only shared nav item.

**Constraints to preserve**
- Never commit `.env.local` or print secrets. Never point experiments at the real database.
- Never rename curriculum or SD ids.
- Mutations must stay immutable: `diff()` detects changes by reference.
- Every write goes through `write()`; never write to localStorage or call the API directly from components.
- Keep the `PatchSchema` caps. Don't widen them without considering the 16 MB MongoDB document limit and the payload size.
- Keep `proxy.ts` gating everything except `/api/auth/*` and static assets, and keep the JSON-only check on mutating endpoints.
- Don't reintroduce "FAANG" wording.
