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
which reads `user_roles`, `user_details` and `profiles` off the client directly while
resolving the session.

| Service | Responsibility |
| --- | --- |
| `supabase.js` | The shared client. Everything else imports this. Uses `flowType: 'pkce'` deliberately — PKCE returns the OAuth code as `?code=` rather than a `#access_token=` fragment, which would otherwise collide with the hash router. |
| `authService.js` | Sign in/up (password, Google, Discord), sign out, session, auth-change subscription. |
| `trackService.js` | Track + variation catalogue lookups by slug. |
| `vehicleService.js` | Vehicle catalogue. |
| `raceService.js` | Race CRUD, per-variation and all-races queries, bulk import, vehicle→PI map. Every read filters on `user_id` explicitly (see [Data model](#data-model)); writes split notes into `races_private`. |
| `goalService.js` | Per-variation goal lap times. |
| `annotationService.js` | Track-map pins for a variation. |
| `statsService.js` | The user's aggregate stats. |
| `profileService.js` | Update your own display name and public/private switch. |
| `leaderboardService.js` | Community leaderboards: `get_most_races_leaderboard()`, `get_fastest_laps()`. |
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
| `authStore` | Session, user, `isAuthenticated` / `isAdmin` / `isBanned`, `ready`, `profile` (`display_name`, `is_public`). |
| `prefsStore` | Dark mode + last-used vehicle/tuning, persisted to `localStorage`. |
| `quickAddStore` | Quick Add modal open state + a "race saved" callback hook. |
| `trackSearchStore` | Track search modal open state. |
| `feedbackStore` | Feedback modal open state. |
| `toastStore` | Toast queue. |

### Composition API usage

The codebase is **Options API by default** — 52 of 63 single-file components.
`<script setup>` is used in eleven: ten had real lifecycle duplication worth
extracting into a composable, and the eleventh, `ColumnFilterPanel.vue`, is
the shared body of `ColumnFilterMenu.vue`. The composables:

- `src/composables/useChart.js` — owns a Chart.js instance's lifecycle
- `src/composables/useEventListener.js` — add-on-mount / remove-on-unmount
- `src/composables/useMeasuredFade.js` — measures a real DOM row to clip a
  scrolling container past its actual bottom edge

If you're adding a component, use the Options API unless you're reaching for
one of those composables.

## Routing

`createWebHashHistory` — URLs look like `wfracelog.com/#/<userId>/races`. GitHub Pages
won't serve `index.html` for arbitrary deep paths, and hash history sidesteps
that without a 404-page hack.

| Path | Access | Page |
| --- | --- | --- |
| `/` | public | Marketing landing page (redirects to the leaderboard when signed in) |
| `/login` | public | Email / Google / Discord sign-in and sign-up |
| `/plugin` | public | Telemetry plugin install instructions |
| `/getting-started` | auth | In-app guide: shortcuts, plugin, annotations, charts |
| `/news` | auth | Changelog / release notes |
| `/community/leaderboard` | public | Most races (top 25 drivers) and the fastest lap on every variation, filterable by PI class and vehicle; where signed-in users land |
| `/community/stats` | public | Placeholder for site-wide stats |
| `/community/tracks` | public | Track grid; cards open each track's all-drivers page |
| `/community/track/:trackSlug/:variationSlug` | public | Every public driver's races at a variation, best lap and who set it |
| `/community/races` | public | Every public driver's races, newest first, 500 at a time ("load older") |
| `/:userId/tracks` | public | Track grid, plus JSON export/import (your own only) |
| `/:userId/track/:trackSlug/:variationSlug` | public | Per-variation: races, lap-time chart; on your own, also goal, notes, map annotations |
| `/:userId/races` | public | Full race history, expandable; inline edit on your own |
| `/:userId/stats` | public | Summary tiles, activity chart, biggest improvements; goal progress on your own |
| `/tracks`, `/track/...`, `/races`, `/stats` | — | Legacy: redirect to the same page under your own id; signed out, to `/community/...` |
| `/settings/api-keys` | auth | Create/revoke your own API keys |
| `/settings/profile` | auth | Display name, and whether your races are public |
| `/admin/users` | admin | Users, roles, bans, growth |
| `/admin/api-keys` | admin | All keys across all users |
| `/admin/feedback` | admin | Submitted feedback |

**Community pages** reuse the same three components, switched by `meta.scope:
'community'`: a Driver column, no `:userId`, everything read-only, and races
fetched via `getCommunityRaces()` a page at a time. Sorting and column filters
apply to the rows loaded so far. The router reuses one component instance
across a driver's page and its community twin, so the pages watch the route
rather than relying on `mounted()`.

**Driver pages** are one set of components for everyone's log. `:userId` only
matches a UUID, so it can't shadow a top-level route. Each page compares it to
the signed-in user (`isOwnView`): editing, notes, goals, track notes, map
annotations, the API-key filter and export/import only exist on your own log —
and goals/annotations aren't even fetched otherwise, since their RLS would
return *yours*. `DriverScope.vue` is the pages' root element: on someone else's
log it replaces the page with "This driver's log is private" when they've
opted out (or don't exist — deliberately the same message).

**Scope: whose races × which view.** Every scoped page is one of three
scopes — everyone (`/community/...`), you, or one other driver — and
`src/utils/scope.js` holds the rules: which scope a route is in, each scope's
views (Leaderboard only for everyone, Profile only for you), and where
switching scope goes (the same view, even the same track, when the new scope
has it). The NavBar shows it two ways:

- **1200px and up:** one row — logo, the scope icon (a globe, a person, or a
  driver's initial outlined in red) opening a dark dropdown, that scope's
  view links, then the site links and controls on the right.
- **Below 1200px:** the same scope icon beside the hamburger, each opening
  its own red drop-down; the hamburger lists the scope's views. (Everything
  doesn't fit in one row below ~1200px, and the nav never takes two rows.)

Both pickers are `ScopeMenu.vue`: everyone, you, recently viewed drivers
(`recentDriversStore`, localStorage) and a "Find a driver" search
(`searchProfiles()`). Pages outside any scope keep the last one. Above each
scoped page's title, `ScopeKicker.vue` names it ("Everyone", "Your log · …",
"Viewing …"), so the icon is never the only clue. Driver names come from
`getProfile()`, memoized so the nav, the kicker and `DriverScope` share one
request.

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

**Shared catalogue** (read-only to everyone, signed in or not; no per-user rows):

- `tracks` — 38 base-game tracks (name, slug, image)
- `track_variations` — 98 route variations, FK to `tracks`
- `vehicles` — 84 vehicles (name, image)

**Public per-user data** (readable by anyone for users who haven't opted out;
you can always read your own; only the owner can write):

- `races` — the core table. `datetime`, `track_variation_id`, `vehicle_id`,
  `tuning`, `assists` (jsonb — shifting/abs/traction_control/stability_control),
  `vehicle_weight_kg`, `place`, `lap_time_ms`, `total_time_ms`, `performance_index`,
  `pi_class` (generated A/B/C/D from the PI), `lap_count`, `lap_times_ms` (jsonb),
  `results_roster` (jsonb), `server_name` (raw, with color codes; null offline),
  `parts` (jsonb — the logging player's engine/armor upgrades),
  `source` (`'web'` or `'api'`). **Every column here is public** — anything
  owner-only goes in `races_private`. Because of that, a query on `races` is
  not scoped to the current user unless it filters on `user_id` itself.
- `profiles` — `display_name` (auto-assigned `Driver-<hex>` at signup,
  user-editable, unique ignoring case) and `is_public`, the opt-out switch the
  `races` select policy checks via `is_public_user()`. Users can update only
  those two columns of their own row.

**Private per-user data** (RLS: you can only ever see `user_id = auth.uid()`):

- `races_private` — the owner-only half of a race, one row per race that has
  any: `notes`, `api_key_id`, `plugin_version` (companion plugin release that
  submitted it; API only). Pulled in with a `races_private(...)` embed, which is
  null on anyone else's race.
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

1. **RLS policies** on every user-owned table. Select is `auth.uid() = user_id`
   (for `races` and `profiles`: or the owner hasn't opted out);
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
single integer, and inserts the race with `source = 'api'`. Callers also send
their `plugin_version`, which is stored with the race (in `races_private`) so we can see which plugin
releases users are running and trace bad data back to the version that sent it.

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

The shell mounts the NavBar (for signed-out visitors too, except on `/plugin`,
which carries its own `PublicHeader`, and `/login`, which has none), the modals any screen can
open (Quick Add, track search, feedback, toasts), `NavIntroOverlay` (a
one-time walkthrough of the scope nav, shown to each signed-in user once per
browser: everything but the nav's `data-nav-intro` controls is washed in the
accent colour, with screenshots from `public/images/getting-started/nav-*`),
and the document-level keyboard shortcuts, which are suppressed whenever focus
is in an input:

| Key | Action |
| --- | --- |
| `Q` | Quick-add a race from anywhere (signed in) |
| `T` | Track search — stays in context: community pages → community track, a driver's pages → that driver's, else your own (or community, signed out) |
| `A` | Add a race to the open variation (your own track page only) |
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
