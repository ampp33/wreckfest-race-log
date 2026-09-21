# Architecture

## The shape of the thing

Wreckfest Race Log is a **static single-page app with no custom backend**. Vue
3 is compiled by Vite into plain files, those files are served by GitHub Pages,
and every piece of dynamic behaviour is a direct call from the browser to
Supabase (Postgres + Auth) over PostgREST.

```
Browser (Vue 3 SPA on GitHub Pages)
  │
  ├── supabase-js ──► Supabase Postgres    (tables, gated by RLS)
  │                   Supabase Auth        (email / Google / Discord)
  │                   Postgres RPCs        (admin ops, API-key race insert)
  │
  └── Telemetry plugin (separate repo, runs beside the game)
          └── POST /rest/v1/rpc/insert_race_with_api_key_wf1
```

That "no backend" decision is the one that explains most of the others: there
is no server to hold secrets, so **all authorization lives in Postgres** as RLS
policies and `security definer` functions. The frontend ships with only the
public anon key.

## Stack

| Layer | Choice |
| --- | --- |
| UI | Vue 3, **Options API** by default |
| Routing | Vue Router, **hash history** |
| Styling | Tailwind CSS 3 + `@tailwindcss/typography`, class-based dark mode |
| Charts | Chart.js 4 |
| Markdown | `marked` + `DOMPurify` (user notes are rendered as markdown) |
| Data/Auth | `@supabase/supabase-js` 2 |
| Build | Vite 5 |
| Hosting | GitHub Pages via GitHub Actions |

## Source layout

```
src/
├── main.js          Bootstrap — awaits the auth session BEFORE mounting
├── App.vue          Shell: nav, footer, global modals, global keyboard shortcuts
├── router/index.js  Routes + the auth/admin/ban navigation guard
├── pages/           One component per route
├── components/      Reusable UI
├── composables/     The three places Composition API earns its keep
├── services/        Every Supabase call in the app
├── stores/          Shared reactive state
├── utils/           Pure helpers (formatting, slugs, images, track paths)
├── data/            Static demo data for the logged-out landing page
└── assets/icons/    Inline SVGs, imported with Vite's `?raw`
```

### Layering rule

**Components never call Supabase directly.** They import a function from
`src/services/`. That keeps the entire network surface in one directory and
makes the RLS story easy to audit. The single exception is `authStore.js`,
which reads `user_roles` and `user_details` off the client directly while
resolving the session.

| Service | Responsibility |
| --- | --- |
| `supabase.js` | The shared client. Everything else imports this. Uses `flowType: 'pkce'` deliberately — PKCE returns the OAuth code as `?code=` rather than a `#access_token=` fragment, which would otherwise collide with the hash router. |
| `authService.js` | Sign in/up (password, Google, Discord), sign out, session, auth-change subscription. |
| `trackService.js` | Track + variation catalogue lookups by slug. |
| `vehicleService.js` | Vehicle catalogue. |
| `raceService.js` | Race CRUD, per-variation and all-races queries, bulk import, vehicle→PI map. |
| `goalService.js` | Per-variation goal lap times. |
| `annotationService.js` | Track-map pins for a variation. |
| `statsService.js` | The user's aggregate stats. |
| `publicStatsService.js` | `get_total_race_count()`, the one anon-callable stats RPC. Currently unused — the landing page renders from `src/data/homePageDemoData.js` instead. |
| `apiKeyService.js` | The user's own API keys. |
| `feedbackService.js` | In-app feedback submission. |
| `adminService.js` | Admin-only RPCs: users, roles, bans, all API keys, all feedback, growth. |

### State

No Pinia, no Vuex. Shared state is a handful of plain `reactive({})` modules
with named mutator functions — the total amount of global state is small enough
that a store library would be more ceremony than help.

| Store | Holds |
| --- | --- |
| `authStore` | Session, user, `isAuthenticated` / `isAdmin` / `isBanned`, `ready`. |
| `prefsStore` | Dark mode + last-used vehicle/tuning, persisted to `localStorage`. |
| `quickAddStore` | Quick Add modal open state + a "race saved" callback hook. |
| `trackSearchStore` | Track search modal open state. |
| `feedbackStore` | Feedback modal open state. |
| `toastStore` | Toast queue. |

### Composition API usage

The codebase is **Options API by default** — 38 of 46 single-file components.
`<script setup>` is used in exactly eight, all of which had real lifecycle
duplication worth extracting into a composable:

- `src/composables/useChart.js` — owns a Chart.js instance's lifecycle
- `src/composables/useEventListener.js` — add-on-mount / remove-on-unmount
- `src/composables/useMeasuredFade.js` — measures a real DOM row to clip a
  scrolling container past its actual bottom edge

If you're adding a component, use the Options API unless you're reaching for
one of those composables.

## Routing

`createWebHashHistory` — URLs look like `wfracelog.com/#/races`. GitHub Pages
won't serve `index.html` for arbitrary deep paths, and hash history sidesteps
that without a 404-page hack.

| Path | Access | Page |
| --- | --- | --- |
| `/` | public | Marketing landing page (redirects to `/races` when signed in) |
| `/login` | public | Email / Google / Discord sign-in and sign-up |
| `/plugin` | public | Telemetry plugin install instructions |
| `/getting-started` | auth | In-app guide: shortcuts, plugin, annotations, charts |
| `/news` | auth | Changelog / release notes |
| `/tracks` | auth | Track grid, plus JSON export/import of your races |
| `/track/:trackSlug/:variationSlug` | auth | Per-variation: races, goal, notes, map annotations, lap-time chart |
| `/races` | auth | Full race history, expandable, inline edit |
| `/stats` | auth | Summary tiles, activity chart, biggest improvements |
| `/settings/api-keys` | auth | Create/revoke your own API keys |
| `/admin/users` | admin | Users, roles, bans, growth |
| `/admin/api-keys` | admin | All keys across all users |
| `/admin/feedback` | admin | Submitted feedback |

The single guard in `src/router/index.js` does four things: resolves the
session, force-signs-out banned accounts, redirects signed-in users away from
the public landing/login pages, and gates `requiresAdmin` routes. Anything
without `meta.public` requires auth.

Note that the guard is **convenience, not security** — a banned or non-admin
user who bypasses the client still can't read or write anything, because the
database says no.

## Data model

Defined in [`../supabase/schema.sql`](../supabase/schema.sql), seeded by
[`../supabase/seed.sql`](../supabase/seed.sql).

**Shared catalogue** (read-only to all authenticated users, no per-user rows):

- `tracks` — 38 base-game tracks (name, slug, image)
- `track_variations` — 98 route variations, FK to `tracks`
- `vehicles` — 84 vehicles (name, image)

**Per-user data** (RLS: you can only ever see `user_id = auth.uid()`):

- `races` — the core table. `datetime`, `track_variation_id`, `vehicle_id`,
  `tuning`, `assists` (jsonb — shifting/abs/traction_control/stability_control),
  `vehicle_weight_kg`, `place`, `lap_time_ms`, `total_time_ms`, `performance_index`,
  `lap_count`, `lap_times_ms` (jsonb), `results_roster` (jsonb),
  `notes`, `source` (`'web'` or `'api'`), `api_key_id`
- `goals` — target lap time + notes per variation
- `variation_annotations` — numbered map pins (`x`, `y`, `number`, `note`)
- `api_keys` — per-user keys for external submission. Only a SHA-256 `key_hash`
  is stored; the raw key is generated in the browser, shown once, and never
  persisted. Revocation is soft (`revoked_at`) so past races keep their
  attribution.
- `feedback` — in-app feedback (insert-own, select-admin)
- `user_details` — account status, used for the ban check
- `roles` / `user_roles` — the admin role assignment

**Times are stored as integer milliseconds** everywhere. No floats, so
comparison and "biggest improvement" arithmetic are exact. `src/utils/timeFormat.js`
parses a deliberately forgiving input format (`1:23.456`, `83.4`, `1.23.456`)
so you never have to think about separators while typing fast.

### Authorization

Three mechanisms, in order of how much they matter:

1. **RLS policies** on every user-owned table. Select is `auth.uid() = user_id`;
   every insert/update/delete additionally requires `not is_banned(auth.uid())`,
   so a ban is enforced by the database rather than by the UI. This is the real
   boundary.
2. **`security definer` RPCs** for anything a user can't be trusted to do
   directly — `is_admin()`, `set_user_role()`, `set_user_banned()`,
   `get_all_users_with_roles()`, `get_all_api_keys()`, `get_all_feedback()`,
   `admin_delete_api_key()`, `get_total_race_count()`, `get_user_growth()`.
3. **The router guard**, which only keeps honest users out of screens that
   would render empty anyway.

### The external-submission path

`insert_race_with_api_key_wf1` is the one RPC a caller hits **without a
Supabase session**. The per-user API key in the request body *is* the
credential; the anon `apikey` header only identifies the project. The function
resolves track/variant/vehicle by name, packs the four tuning dials into a
single integer, and inserts the race with `source = 'api'`.

The `_wf1` suffix is deliberate — a sibling project exposes a `_wf2` equivalent.
Full request/response contract: [external-api.md](external-api.md).

## Build and deploy

- `vite.config.js` reads `VITE_BASE_PATH` (default `/`) so the app can be
  hosted at a subpath. `src/utils/imageUrl.js` resolves DB-stored relative
  image paths against the same base.
- GitHub Actions builds on push to `main` and publishes `dist/` to Pages.
  Supabase URL and anon key come from repo secrets at build time and are baked
  into the bundle — which is fine, they're public by design.
- `index.html` carries the SEO/Open Graph metadata and a JSON-LD block by hand;
  it isn't generated.

## Global behaviours in `App.vue`

The shell mounts the modals that any screen can open (Quick Add, track search,
feedback, toasts) and owns the document-level keyboard shortcuts, which are
suppressed whenever focus is in an input:

| Key | Action |
| --- | --- |
| `Q` | Quick-add a race from anywhere |
| `T` | Track search |
| `A` | Add a race to the open variation (track page only) |
| `Esc` | Close the open dialog |

## Conventions worth knowing

- Options API unless a composable justifies `<script setup>`.
- All Supabase access goes through `src/services/`.
- Times in integer milliseconds; format only at the edge.
- Icons are inline SVG imported with `?raw`, not an icon font or component lib.
- Markdown notes are always piped through `DOMPurify` before `v-html`.
- Dark mode is a `class` on `<html>`, applied from `prefsStore` on boot.
- Schema scripts must stay re-runnable. RPCs with OUT params have to be
  `drop`ped before being redefined, and changing an RPC's signature means
  explicitly dropping the old overload or PostgREST can't resolve the call.
- There are no tests and no linter. Verification is running the app.
