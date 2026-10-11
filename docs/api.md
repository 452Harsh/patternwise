# API reference

All endpoints are Next.js route handlers on the Node.js runtime. There are **no server actions**; all mutations go through `PATCH /api/state`.

Authentication: every endpoint except `/api/auth/*` requires the `pw_session` cookie. `proxy.ts` returns `401 { "error": "Unauthorized" }` before the handler runs; handlers re-check with `isAuthed()` (`lib/server/http.ts`).

Mutating endpoints accept only `Content-Type: application/json` (`isJson()`); anything else returns `415`. Responses send `Cache-Control: no-store`.

---

## `POST /api/auth/login`
File: `app/api/auth/login/route.ts`

Body: `{ "password": string }`

| Status | Body | When |
|---|---|---|
| 200 | `{ ok: true }` + `Set-Cookie: pw_session=…` (httpOnly, SameSite=Lax, Secure in prod, 30 days) | password matches `APP_PASSWORD` |
| 401 | `{ error: "Wrong password" }` | wrong / invalid body |
| 415 | `{ error: "Expected JSON" }` | non-JSON body |
| 429 | `{ error: "Too many attempts…" }` | ≥ 5 failures from the IP in 15 min (in-memory, per server instance) |

## `POST /api/auth/logout`
Clears the cookie. Always `200 { ok: true }`.

## `GET /api/state`
File: `app/api/state/route.ts` → `loadState()` in `lib/server/repo.ts`.

Response:
```json
{
  "empty": false,
  "state": {
    "problems": { "<slug>": Entry },
    "patterns": { "<patternId>": PatternEntry },
    "custom": [CustomProblem], "companies": [Company], "mocks": [Mock],
    "events": [ActivityEvent],            // newest first, ≤ 300
    "daily": {}, "plans": {}, "checklist": {}, "settings": Settings?,
    "sd": { "<kind:id>": SDEntry },
    "diagrams": { "<id>": Diagram },
    "sdCustom": [SDCustomProblem], "sdSessions": [SDSession]
  }
}
```
`empty` is `true` when no user data exists yet (the client then uploads any local data).

## `PATCH /api/state`
Applies a **change set** validated by `PatchSchema` (`lib/server/schemas.ts`). Every key is optional.

| Key | Type | Semantics |
|---|---|---|
| `problems` | `Record<slug, Entry \| null>` | upsert each; `null` deletes |
| `patterns` | `Record<id, PatternEntry \| null>` | upsert / delete |
| `sd` | `Record<key, SDEntry \| null>` | upsert / delete |
| `diagrams` | `Record<id, Diagram \| null>` | upsert / delete |
| `custom`, `companies`, `mocks`, `events`, `sdCustom`, `sdSessions` | arrays | **replace the whole collection** |
| `meta` | `{ daily?, plans?, checklist?, settings? }` | `$set` the given keys on the `meta` document |

| Status | Body |
|---|---|
| 200 | `{ ok: true, savedAt }` |
| 400 | `{ error: "Invalid data", issues: [...] }` (first 5 zod issues) |
| 401 / 415 / 500 | errors as above |

The client builds patches with `diff()` in `lib/progress.ts`; you should not need to call this endpoint by hand. To add a new kind of user data, see “Adding persisted data” in [`development.md`](development.md).
