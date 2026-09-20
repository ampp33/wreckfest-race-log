# Wreckfest Race Log

Source code for **[wfracelog.com](https://wfracelog.com)** — an online race log
and note-taking tool for the racing game
[Wreckfest](https://store.steampowered.com/app/228380/Wreckfest/).

**To use the app, go to [wfracelog.com](https://wfracelog.com).** It is free,
and signing up takes a few seconds with an email address, Google, or Discord.
There is no need to clone or run this repository; it exists only to hold the
code behind the hosted site.

---

## What the site does

### Every race, logged automatically

Install the companion **Telemetry plugin** and races log themselves. It runs
quietly alongside Wreckfest, reads your results straight out of the game's own
memory the instant a race ends, and posts them to your account — any track, any
variation, any car. You can also add races by hand if you'd rather.

Each logged race keeps your car and tuning, performance index, finishing
position, best lap, total time, lap-by-lap splits, and the full finishing
roster of everyone in the race.

### Notes and track annotations

Forgot your brake points? Where the hazards are? How to take that one tricky
turn? Keep notes on every track and every variation, and drop numbered pins
directly onto the track map with a note for each one.

### Stats and goals

Set a goal lap time per variation and chase it. Review total races, most-used
vehicle, favorite track, races per week/month/year, goal deltas, lap-time
progression charts, and your biggest improvements.

### Built to be fast to use

The site allows you to use hotkeys to quickly jump to the pages that matter most: `T` to jump to a track page, `Q` to quick-add a
race from anywhere, `A` to add a race to the track you're looking at, `Esc` to
close. Your log is private to your account, and you can export the whole thing
to JSON at any time.

### The Telemetry plugin

The plugin is a separate project:
**[ampp33/wreckfest-telemetry-asi](https://github.com/ampp33/wreckfest-telemetry-asi)**.
It works on Windows and on Linux via Steam + Proton. Setup instructions live on
the site at [wfracelog.com/#/plugin](https://wfracelog.com/#/plugin).

---

## For developers

Documentation for working on the codebase:

| Doc | What's in it |
| --- | --- |
| [docs/development.md](docs/development.md) | Running the site locally: Supabase project, env vars, dev server, deploys. |
| [docs/architecture.md](docs/architecture.md) | How the app is put together — stack, layering, data model, conventions. |
| [docs/tooling.md](docs/tooling.md) | Supporting utilities: the racing-line editor, the track tracers, and the database scripts. |
| [docs/external-api.md](docs/external-api.md) | The API-key endpoint for submitting races from an external tool. |

**Stack at a glance:** Vue 3 (Options API) + Vue Router + Tailwind, built with
Vite, backed by Supabase (Postgres + Auth), deployed as a static site to GitHub
Pages by GitHub Actions. There is no custom backend server.

## Feedback

This is a personal side project run as a free service, and it's actively being
developed. The fastest way to reach me is the **Feedback** button in the app's
nav bar — it sends along the page you were on, so you don't have to explain
where you were.

---

*Not affiliated with Bugbear Entertainment or THQ Nordic. Track names, layouts
and vehicle names are theirs.*
