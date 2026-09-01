## What I want

Visual design directions for **Wreckfest Race Log**, a web app I'm about to
release publicly. Build them as a **multi-page design canvas** — one page per
direction, four artboards per page — using the `design` skill.

I am not asking you to match the app's current look. It is a placeholder.
Care about the **functionality** — which screens exist, what data they show,
what actions are available — and nothing else about how it looks today.

**Read the real components before designing.** Match the actual data
structures; do not invent fields.

---

## The product

A personal timing archive for the racing game Wreckfest. You log each race
(track, variation, vehicle, class, finishing place, lap times), set a target
time per *track variation*, and watch personal bests move over time.

It is deliberately narrow: no social feed, no leaderboard against strangers,
no coaching. A table, a target, and a gap that either closes or doesn't.

**Stack:** Vue 3 + Vite + Tailwind 3 + Supabase. Chart.js is already a
dependency. Dark mode is real, via Tailwind's `class` strategy.

**Routes:** `/` tracks grid · `/track/:trackSlug/:variationSlug` detail ·
`/races` table · `/stats` · `/settings/api-keys` · admin pages.

**Keyboard:** `Q` opens quick-add, `T` opens track search.

---

## Screens to mock (all four, every direction)

**1. Home — public landing page.** Logged-out marketing page. Does not exist
yet, so this is entirely net-new. Real marketing anatomy: one clear offer, one
repeated call to action, proof, and answers to a visitor's actual doubts.

**2. Tracks.** Grid of track cards — name, variation count, variation chips,
your best lap. Real artwork exists (see Assets below); you may also draw
abstract vector circuits instead if it serves the direction better.

**3. Races.** The main table. Columns exactly, in this order:
`Date · Track / Variation · Vehicle · Class (PI) · Place · Laps · Lap time ·
Total time`. Paginated, newest first, page-size control (25/50/100).

**4. Race results (track detail).** Personal best, editable goal, gap to goal,
race count; a lap-time trend chart across every run; a per-lap split breakdown
with deltas to the best lap; freeform notes tied to the variation; numbered
turn markers on the layout map.

---

## Sample data — use this exact set in every direction

So directions stay comparable side by side.

| Date | Track / Variation | Vehicle | Class (PI) | Place | Laps | Lap time | Total time |
|---|---|---|---|---|---|---|---|
| 08.29.26 | Sandpit — Main Loop | Rocket RS | B (534) | 1 | 6 | 1:12.483 | 7:18.902 |
| 08.28.26 | Bloomfield Speedway — Oval | Speedemon | A (698) | 3 | 8 | 0:24.117 | 3:16.440 |
| 08.28.26 | Fire Rock Raceway — Long | Killerbee | B (571) | 2 | 5 | 1:44.026 | 8:52.331 |
| 08.27.26 | Rattlesnake Ridge — Reverse | Rammer RS | C (412) | 5 | 4 | 1:31.774 | 6:12.588 |
| 08.26.26 | Big Valley Speedway — Figure 8 | Warwagon | A (704) | 1 | 10 | 0:41.209 | 6:55.117 |
| 08.25.26 | Espedalen Raceway — Short | Roadslayer GT | B (556) | 4 | 6 | 1:08.955 | 6:59.204 |

**Totals:** 247 races · 38 tracks · 89 podiums.

**Sandpit / Main Loop:** personal best 1:12.483, goal 1:12.000, gap +0.483,
18 races there, 6 podiums, 2 wins.

**Its six lap splits:** 1:14.902 · 1:13.117 · **1:12.483 (best)** · 1:13.905 ·
1:12.940 · 1:13.412

PI class colours are real — take them from `src/utils/piInfo.js`
(A `#C41E1E`, B `#f97316`, C `#22c55e`, D `#2563eb`).

---

## The aesthetic direction

**Swiss punk / Basel New Wave — Weingart, not Müller-Brockmann.**

`references/` holds ~13 images I collected. **Look at all of them before you
start.** They are consistent and they are the brief. What is in them:

- Enormous neutral grotesk letterforms, cropped and bleeding off every edge
- Type rotated 90°/270°, interlocking, overlapping, layered, ghosted, outlined
- Letterforms used as pure shape — the word is often unreadable and that's fine
- Solid colour bars slicing across at hard right angles
- Extreme scale contrast: 300px letters against 9px justified paragraphs
- Tiny dense text blocks as counterweight, placed on a strict grid
- One or two saturated accents — red, orange, pink, occasionally blue —
  against off-white or near-black. Never more.
- The grid is visibly *there* and then visibly *broken*

The tension I'm after: **rigorously gridded and legibly dense, then violated
on purpose.** Not messy for its own sake. The data has to stay readable —
especially the Races table, which needs to survive 100 rows.

Give me **5-8 genuinely different directions inside this family** — different
in structure and philosophy, not six recolours of one layout. Vary what
carries the idea: the grid logic, what breaks it, where type is used as
image, how density is handled, whether it is light-dominant or dark-dominant.

Argue for each one honestly, with its real tradeoff. A set where only your
favourite gets a case made is a rigged vote.

---

## Assets on disk

**`references/`** — the images above. Read them first. Gitignored, local only.  See the README in this dir explaining what I liked about each image.

**`public/fonts/`** — display faces I collected: Hey November, Rockville
Solid, Silent Brush, White Shadows, Yakin. All `.otf`.

> ⚠ **Two problems with these, fix them rather than working around them.**
>
> 1. They are all *decorative/script/display* faces. Swiss punk is built on a
>    hard neutral grotesk, and there isn't one in the folder. Before designing,
>    tell me which free grotesk you want and why — **Switzer** (Fontshare) is
>    the obvious Helvetica-adjacent candidate; **Lack** (Velvetyne) if you want
>    the condensed punk edge. These decorative faces are for *accents* — one
>    per direction, at most.
> 2. They are `.otf`. The design-canvas sandbox blocks every font host except
>    Google Fonts, so anything non-Google must be inlined as a base64
>    `@font-face` data URI per artboard — and `.otf` inlines about 3× larger
>    than `.woff2`. Convert first. `tools/font-to-css.mjs` generates the
>    inlined `@font-face` block from `.woff2` files.

**`public/track-images/`** — 38 real track PNGs, named by slug.
**`public/track-variation-images/`** — 98 real variation PNGs.
Real photography is allowed. Prefer vector or generated where you can.

---

## Tools you have

**`chrome-devtools` MCP** — navigate, screenshot, inspect computed styles,
resize the viewport, read console/network. Use it. Two things it's for:

1. **Look at your own work.** Render an artboard, screenshot it, criticise it,
   fix it — *before* showing me. Do not hand me something you have not seen.
2. **Study references properly.** Open a site you're borrowing from and read
   its actual type scale and spacing instead of guessing from a screenshot.

**`design` skill** — builds the multi-artboard canvas and publishes it.

**`tools/font-to-css.mjs`** — inlines `.woff2` as base64 `@font-face`.

---

## Hard constraints

- **Both themes, every direction.** Dark mode is real in the app. Put a
  **working light/dark toggle on every artboard** and check both actually work.
- **The app has no footer today.** All directions should propose one — it's a
  net-new opportunity, not an afterthought.
- **Data legibility is not negotiable.** Go as far as you like everywhere
  else, but the Races table has to stay scannable at 100 rows, and lap times
  need tabular figures.
- Minimum 44px hit targets on anything interactive.
- Static mockups, not clickable prototypes — except the theme toggle.

---

## Anti-goals — what went wrong before

- **Do not give me a standard corporate SaaS page.** No centred hero with a
  gradient headline and three feature cards below it. If it could be any
  B2B product, it has failed.
- **Do not give me six shades of one look.** Directions must differ
  structurally, not just in accent colour.
- **No filler.** No dummy sections to fill space, no invented stats, no
  "data slop" — numbers and icons that aren't doing work. If a section feels
  empty, that's a layout problem, not a content problem.
- **Write real copy.** Specific to this app, this game, this habit. Never
  lorem ipsum, never interchangeable marketing filler.
- **Avoid the tells:** gradient backgrounds everywhere, emoji, rounded cards
  with a left-border accent stripe, Inter/Roboto/Arial/Fraunces.

---

## Deliverable

One published design canvas. An index artboard first: what each direction is,
why you'd pick it, its tradeoff, its palette and type pairing. Then one page
per direction, four artboards each, laid out left to right in the order Home,
Tracks, Races, Race results.

Ask me anything genuinely ambiguous before you build, but don't stall on
questions you can answer by reading the repo.
