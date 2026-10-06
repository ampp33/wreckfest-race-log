# Design: public races, Community and Personal sections

Opening the site up: every user's races are visible to everyone (signed in or
not), unless the user opts out. Race notes and other owner-only fields stay
private.

Status per step is tracked in [Rollout](#rollout). `architecture.md` describes
what actually exists; this document is the plan.

## Decisions

| Topic | Decision |
| --- | --- |
| Visibility | **Public by default, opt-out.** One switch per user (`profiles.is_public`). Per-race hiding may come later. |
| Signed-out visitors | **Can see Community pages and driver pages.** |
| Banned users | **Races stay public.** A ban only blocks writing. |
| Private fields | **Live in their own table** (`races_private`), not hidden behind a view. |
| Identity | **Display name** on `profiles`, auto-assigned `Driver-<hex>` at signup, user-editable. Never derived from email/OAuth. |
| URLs | **Prefix namespaces**: `/community/...` and `/<userId>/...`. |
| Section name | **Community** (first drafted as "Global", which didn't feel right). Nav label, URL prefix, route names and code all use it. |
| Landing (signed in) | `/community/leaderboard`. |
| "Class" | PI class (A/B/C/D), not `vehicles.class`. |
| Leaderboards | Users see their own races on boards even if opted out (RLS always shows you your own rows). Accepted. |

### What's public and what isn't

Public for every user who hasn't opted out: every column on `races` — date,
track/variation, vehicle, tuning, assists, PI (and `pi_class`), weight, place,
lap and total time, lap splits, results roster, server name, `source` — plus
the display name and "driver since" date on `profiles`.

Never public: `races_private` (notes, `api_key_id`, `plugin_version`),
`goals` (goal times and track notes), `variation_annotations`, `api_keys`,
`feedback`, `user_details` (ban status), roles, email.

## Database

### Why a separate private table rather than a view

The alternative was a `public_races` view with a column allowlist over an
owner-only `races` table. Splitting the table instead means:

- Every page — personal or community — queries `races` directly with ordinary
  PostgREST filters, ordering, ranges and embeds.
- Owner-only fields come along via an embed,
  `races_private(notes, api_key_id, api_key:api_keys(name))`, which is `null`
  for anyone else's race because RLS hides the row.
- Opt-out (and later per-race hiding) is one clause in one RLS policy, and
  leaderboard functions can be plain queries that inherit it.
- There's no allowlist to keep in sync; the rule is structural. The flip side:
  **new columns on `races` are public by default** — anything private goes in
  `races_private`. Both tables carry a comment saying so.

### Tables

- **`races`** — RLS select: `auth.uid() = user_id or wf1.is_public_user(user_id)`,
  to `anon, authenticated`. Writes remain owner-only and blocked when banned.
  Gains `pi_class` (stored generated column, thresholds mirror
  `src/utils/piInfo.js`) and a second FK `user_id → profiles(user_id)` so
  `driver:profiles(display_name)` embeds work.
- **`races_private`** — `race_id` PK (FK to `races`, cascade), `user_id`,
  `notes`, `api_key_id`, `plugin_version`. Owner-only RLS; insert/update also
  require the referenced race to belong to `auth.uid()`, so nobody can claim
  the private row for someone else's race. Rows exist only for races with
  something to store.
- **`profiles`** — `user_id` PK, `display_name` (3–24 chars, trimmed, unique
  case-insensitively), `is_public` (default true), `created_at` (copied from
  `auth.users`). Select: public profiles plus your own. Update: own row only,
  and column grants restrict it to `display_name` and `is_public`. Created by
  `handle_new_user()`; existing accounts backfilled. Separate from
  `user_details` so it can be public and user-editable without exposing or
  letting users change ban status (`user_details.display_name`, never used,
  is dropped).
- **Catalogue** (`tracks`, `track_variations`, `vehicles`) — readable by
  `anon` too.

### Functions

- `is_public_user(uid)` — security definer, used by the races policy.
- `default_display_name(uid)` — `Driver-` + md5 prefix, lengthened on
  collision; deterministic so the backfill is idempotent.
- `insert_race_with_api_key_wf1` — unchanged signature; writes `races` and
  `races_private` in one transaction.
- `get_api_keys_with_counts`, `get_all_api_keys` — count via
  `races_private.api_key_id`.

### Indexes

- `races (datetime desc, created_at desc)` — community feed.
- `races (track_variation_id, pi_class, lap_time_ms) where lap_time_ms > 0` —
  per-track/per-class leaderboards.

### Leaderboards and community stats

**Built** (security invoker, so the races select policy — and with it the
opt-out — decides whose races count):

- `get_most_races_leaderboard(limit)` — race count per driver, most first.
  Backs the "Most races" bar table on `/community/leaderboard`.
- `get_fastest_laps(pi_class, vehicle_id)` — the fastest lap on each variation
  (`distinct on (track_variation_id)`, earlier race wins a tie), optionally
  within one PI class and/or one vehicle, ordered by track then variation
  name. Backs "Fastest laps", its All/D/C/B/A class slider and vehicle
  dropdown; the page caches each class × vehicle combination after its first
  fetch.

**Planned:**

- `get_variation_leaderboard(variation_id, pi_class, source, limit)` — best
  lap per driver (`distinct on (user_id)`), re-sorted by time.
- `get_driver_totals(range)` — races, wins, podiums, ranked races, hours,
  variations raced, per driver; the client sorts it into most-races,
  most-wins, win-rate (with a minimum-races qualifier) boards. Wins/podiums
  exclude lone races, mirroring `isLoneRace()` in `src/utils/raceStats.js`.
- `get_community_stats()` — site-wide totals.

`source` stays public so boards can offer a "telemetry-logged only" filter —
web-logged races are hand-typed and can be faked.

## Frontend

### Service layer

Because `races` is publicly readable, **no query is scoped to the current
user by RLS alone**. Every "my races" read in `raceService.js` filters on
`user_id` explicitly, and callers pass it. Writes from the web go to two
tables: race first, then `races_private` if there are notes; if the second
write fails, the race is deleted again so a retry can't duplicate it.
`flattenRace()` lifts `notes` / `api_key_id` / `api_key` back onto the race
object so components didn't need to change.

`profileService.js` updates the user's own profile; `authStore.profile`
holds `{ display_name, is_public }`.

### Routes

| Group | Route | Access | Page |
| --- | --- | --- | --- |
| Community | `/community/leaderboard` | public | Most races (top 25) and fastest lap per variation, by class (signed-in landing) |
| | `/community/tracks` | public | `TrackListPage`, cards link to community track pages |
| | `/community/track/:t/:v` | public | `TrackDetailPage`, all drivers, Driver column |
| | `/community/races` | public | `RacesPage`, all drivers, 500 at a time + "load older" |
| | `/community/stats` | public | New placeholder |
| Driver | `/:userId/tracks`, `/:userId/track/:t/:v`, `/:userId/races`, `/:userId/stats` | public | Existing pages |
| Account | `/settings/profile`, `/settings/api-keys` | auth | |

- `:userId` is constrained to UUID format in the route, so it can never
  collide with `/community`, `/login`, etc. Readable handles would need a
  reserved-word list or a `/u/` segment — not planned.
- Old URLs (`/races`, `/tracks`, `/stats`, `/track/:t/:v`) redirect to
  `/<yourId>/...` when signed in, `/community/...` when not.
- Pages derive their mode from route meta (`scope: 'community'`) and the
  `:userId` param, giving one `isOwnView` computed per page. Edit/delete,
  inline add, notes, goals, track notes, annotations, API-key filter and
  export/import only render when `isOwnView`. Viewing someone else, the nav's
  scope icon shows their initial and the line above the title reads "Viewing
  **Name**". An opted-out driver's pages say the log is private.
- Community Races sorts and filters only the rows loaded so far; the page says
  so. Server-side filtering can come later if needed.

### Nav and shell

Chosen after two rounds of mockups (canvas "Race Log Nav Concepts"): one
model, **whose races × which view**, instead of separate Community and
Personal sections.

- One row only, to save vertical space. From 1200px: logo · scope icon
  (globe / person / a driver's red-outlined initial, opening a dark dropdown)
  · the scope's views · Getting Started, News, Telemetry ▾, Admin ▾, icons.
- Below 1200px (where that doesn't fit): scope icon beside the hamburger,
  each opening the red drop-down slab; the hamburger lists the scope's views
  first.
- The scope menu: Everyone, You, recently viewed drivers, Find a driver.
- A line above each scoped page's title names the scope.

NavBar renders for signed-out visitors on the landing page, Community and
driver pages, with the same scope icon (its menu has no "You" row) and a Sign
in button. `/login` has no header; `/plugin` keeps `PublicHeader`, which gains
a "Browse Races" link to `/community/races`. Quick Add, track search and the floating add button
stay signed-in only. After sign-in, the logo, the `/` redirect and the
default login redirect go to `/community/leaderboard`.

## Rollout

1. **Database and profile** — *done.* `races_private` split, `profiles`,
   opt-out RLS, catalogue open to anon, `pi_class`, indexes; services filter
   by user explicitly; `/settings/profile`; News post announcing the change.
   Shipping this before any public page exists gives existing users a window
   to opt out. **The frontend and `schema.sql` must deploy together** — the old
   frontend selects `races.notes`, which the migration drops.
2. **URL namespaces and nav** — *done.* Prefixed routes (public), legacy
   redirects, `DriverScope` private message, read-only mode on other drivers'
   pages. Signed-out legacy URLs still go to sign-in until step 3 points them
   at `/community/...`.
3. **Community pages and signed-out access** — *done.* Community Races (500 at a
   time + "load older"), Tracks, Track detail (Driver column, best lap and who
   set it, no placement rates); NavBar for signed-out visitors (Telemetry, Sign
   in); PublicHeader "Browse Races"; `T` search everywhere, staying in context;
   signed-out legacy URLs → `/community/...`; README updated.
4. **Scope nav** — *done.* The first nav (Community ▾ / Personal ▾ menus and a
   "Viewing **Name**" strip) replaced by the scope model in
   [Nav and shell](#nav-and-shell): `ScopeIcon`, `ScopeMenu` with recent
   drivers and Find a driver, `ScopeKicker` above each page title.
5. **Leaderboard** — *done.* `get_most_races_leaderboard()` and
   `get_fastest_laps()` back `/community/leaderboard` (where sign-in, `/` and
   the logo land when signed in): Most races (top 25) and Fastest laps with the
   All/D/C/B/A class slider and a vehicle dropdown. `/community/stats` is still a "coming soon"
   placeholder. Next, if wanted: `get_community_stats()` for that page, and
   `get_driver_totals(range)` for more boards.

## Known gaps

- Display names are free-form Unicode, so lookalike names are possible. An
  admin rename action is the remedy if it becomes a problem.
- An opted-out user's gamertag can still appear in other people's
  `results_roster`; that's the other racer's data.
- wf1 and wf2 share one Supabase project and both `main` schemas create a
  trigger named `on_auth_user_created`, so whichever schema ran last owns it.
  wf2 is being rebuilt; until then, re-run wf1's `schema.sql` after wf2's.
