# Development

How to get Wreckfest Race Log running locally.

> You only need this if you're working on the code. To *use* the app, go to
> [wfracelog.com](https://wfracelog.com).

## Prerequisites

- Node 20+ (the deploy workflow pins Node 20)
- A free [Supabase](https://supabase.com) project — the app has no other
  backend, so you need one to run anything past the login screen

## 1. Clone and install

```bash
git clone https://github.com/ampp33/wreckfest-race-log.git
cd wreckfest-race-log
npm install
```

## 2. Set up Supabase

1. Create a new project at <https://supabase.com>.
2. Open **SQL Editor → New query**, paste [`supabase/schema.sql`](../supabase/schema.sql),
   and run it. This creates every table, RLS policy, and RPC function the app
   uses. The file is written to be **idempotent** (`create ... if not exists`,
   `add column if not exists`, `create or replace function`) — it doubles as
   the migration file, so re-running it after a pull is how you apply schema
   changes.
3. In a new query, run [`supabase/seed.sql`](../supabase/seed.sql). This
   populates the shared catalogue: 38 tracks, 98 route variations, and 84
   vehicles. Also idempotent — re-running updates names without touching user
   data.
4. Open **Authentication → Providers** and enable **Email**. Google and Discord
   are also wired up in the UI; enable those too if you want to test OAuth
   sign-in.
5. For local dev, turn **Confirm email** *off* under the Email provider.
   Otherwise every test signup needs a verification click. The login page
   handles both cases.
6. To give yourself the admin screens, edit the email address in
   [`supabase/admin_setup.sql`](../supabase/admin_setup.sql) and run it *after*
   `schema.sql`. Without this you'll get a normal user account and
   `/admin/*` routes will bounce you back to `/races`.
7. From **Project Settings → API**, copy the **Project URL** and the
   **anon public** key.

> Never commit the `service_role` key. The frontend only ever uses the `anon`
> key — per-row access is enforced server-side by RLS policies, so the anon key
> being public is fine and expected.

## 3. Environment variables

```bash
cp .env.example .env
```

| Variable | Description |
| --- | --- |
| `VITE_SUPABASE_URL` | Project URL from Supabase. |
| `VITE_SUPABASE_ANON_KEY` | The anon/publishable key. |
| `VITE_BASE_PATH` | `/` for local dev and for the live site. Only set to `/<repo-name>/` if hosting under a GitHub Pages *project* subpath. |

## 4. Run it

```bash
npm run dev      # http://localhost:5173
```

To check a production build:

```bash
npm run build
npm run preview
```

That's the full script list — there are no tests and no linter configured.

## Deployment

[`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml) builds the
site and publishes `dist/` to GitHub Pages on every push to `main` (and on
manual `workflow_dispatch`).

One-time repo setup:

1. **Settings → Pages**, set **Source** to **GitHub Actions**.
2. **Settings → Secrets and variables → Actions**, add two **secrets**:
   `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
3. `VITE_BASE_PATH` is hardcoded to `/` in the workflow, since the site is
   served from the apex domain `wfracelog.com`. Change it there if you host
   under a subpath.

Because the app uses **hash routing** (`#/races`, `#/track/...`), GitHub Pages
needs no SPA 404 fallback — see [architecture.md](architecture.md#routing) for
why.

## Gotchas

- **Images are committed, not uploaded.** `public/track-images/` (38) and
  `public/track-variation-images/` (98) ship with the repo. The database stores
  relative paths that `src/utils/imageUrl.js` resolves against Vite's
  `BASE_URL`.
- **`public/line-editor.html` is generated and gitignored.** Build it with
  `node tools/make-line-editor.mjs local` — see [tooling.md](tooling.md).
- **`references/` and `.design*/` are gitignored** local scratch directories of
  design references. You won't have them after a clone, and nothing in the app
  needs them.
