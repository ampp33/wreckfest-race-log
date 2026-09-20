# Tooling and other odds and ends

The repo carries a few one-off utilities that aren't part of the app build.
None of them are wired into `package.json` — `dev`, `build` and `preview` are
the only scripts. Everything here is run by hand with `node`.

## The racing-line pipeline

The track maps you annotate in the app aren't bitmaps — they're SVG paths, so
the track name can be set as text along the racing line. Those paths are
produced by a four-stage pipeline that ends in
[`public/track-paths.json`](../public/track-paths.json), which
`src/utils/trackPath.js` loads and `src/components/AnnotationMap.vue` draws.

```
public/track-variation-images/*.png   (source artwork)
        │  trace-track-paths.mjs      automatic trace
        ▼
   traced centrelines
        │  make-line-editor.mjs       seed a hand-editing UI
        ▼
   line-editor.html  ──(you draw)──►  exported JSON
        │  install-track-paths.mjs    validate + install
        ▼
public/track-paths.json
```

### `tools/trace-track-paths.mjs` — automatic tracing

```bash
node tools/trace-track-paths.mjs > public/track-paths.json
```

Traces every variation PNG into a smoothed 110-point polyline in a 620×540
viewBox. The interesting part is that it follows the **centreline** of the
track ribbon, not its outline — an outline walk sits half a ribbon-width off
everywhere and cuts across every pinch. `tools/centreline.mjs` recovers the
midline with a chamfer distance transform.

Two things defeat it, both handled honestly rather than fudged:

- The **direction arrow** is a separate ink blob, and the topmost ink pixel
  lands on it, which used to send the boundary walk around the arrowhead.
  `largestBlob()` in `tools/trace-lib.mjs` isolates the circuit.
- **Branching layouts** (figure-8s, self-crossing routes) have a centreline
  that's a *graph*, not a curve. Choosing a route through a junction is a fact
  about the track, not about the picture, so no amount of precision fixes it.
  Those are detected by measuring whether the resulting line actually lies on
  the ink (a <97% hit rate is rejected) and left for the hand editor.

`tools/trace-lib.mjs` shells out to **python3 + Pillow** to read the PNG alpha
channel. Override the interpreter with `TRACE_PYTHON=/path/to/python3`.

### `tools/make-line-editor.mjs` — build the line editor

```bash
node tools/make-line-editor.mjs local    # -> public/line-editor.html
node tools/make-line-editor.mjs bundle   # -> dist-editor.html
```

`local` writes a small file that points at the images and fonts already in
`public/`; open it through the dev server at `/line-editor.html` and it works
offline, keeping every edit in that browser's `localStorage`. `bundle` inlines
all artwork and fonts as data URIs into one portable file.

Both are generated from the 44 KB template
[`tools/line-editor-shell.html`](../tools/line-editor-shell.html), which is the
editor itself: a full UI for hand-drawing racing lines with prev/next, undo,
reset-to-auto, multi-stroke lines, arrow/flip/open-loop toggles, copy-paste
between tracks, "fill reverses" (mirror a track's `-reverse` twin), a name
preview that renders the track name as text on your path, and
confirm/download/backup. Keyboard: `←`/`→` change track, `z` undo, `Enter`
confirm, `Ctrl/Cmd+C`/`V` copy and paste strokes.

Each track is seeded from the automatic tracer so you start from a close shape
rather than a blank canvas. `HANDLE_OVERRIDE` in the script bumps the handle
count for the few layouts where the automatic fit stops short (it stops at half
a percent of error, which is too coarse for the biggest, twistiest maps —
`rally-trophy--special-stage` needs 78 handles against a default of 26).

Both outputs are **gitignored**. Regenerate rather than committing them.

### `tools/racing-line-handles.json` — the hand-tuned source of truth

The editor's "Back up handles" export, checked in. This is the real source for
the hand-drawn lines; `public/track-paths.json` is derived from it. Load it
back into the editor with **Restore handles** before making changes.

### `tools/install-track-paths.mjs` — install an export

```bash
node tools/install-track-paths.mjs ~/Downloads/track-paths.json
```

Validates before overwriting `public/track-paths.json` and **refuses the whole
file** if anything is off — unknown variation slug, wrong viewBox, no paths,
malformed `d`, fewer than two points — rather than half-installing it. Reports
how many closed loops, open lines and multi-stroke entries it installed, and
how many variations will fall back to bitmap artwork.

## `tools/font-to-css.mjs`

Unrelated to tracks.

```bash
node tools/font-to-css.mjs public/fonts/*.woff2 > faces.css
```

Emits `@font-face` rules with the woff2 base64-inlined, for embedding fonts in
design artboards whose sandbox blocks every font host except Google Fonts.
Weight and style are parsed from the `<Family>-<weight><style>.woff2` filename
convention described in [`public/fonts/README.md`](../public/fonts/README.md).

## `vite.compare.config.js` — currently broken

A harness that aliases six services plus `authStore` to hand-written stubs, so
the whole app renders with fake data and no Supabase and no login — useful for
comparing UI variants side by side.

**It does not work as committed.** The stub directory constant `S` points at a
scratchpad path that no longer exists. To revive it, recreate stub modules
exporting the same functions as `trackService`, `vehicleService`, `raceService`,
`goalService`, `annotationService`, `publicStatsService` and `authStore`, point
`S` at them, and run:

```bash
npx vite --config vite.compare.config.js
```

## Database scripts

All three live in `supabase/` and are meant to be pasted into the Supabase SQL
editor. There is no migrations directory and there are no edge functions.

| File | Purpose |
| --- | --- |
| `schema.sql` | The entire schema, RLS policies and RPC functions in one idempotent script. Re-running it is how schema changes get applied. |
| `seed.sql` | The shared catalogue — 38 tracks, 98 variations, 84 vehicles, generated from the Wreckfest fandom wiki. Idempotent. |
| `admin_setup.sql` | One-time bootstrap granting the `admin` role to a named email. Edit the address before running. |

## Local-only directories

These are **gitignored**, so they won't exist after a clone. Listed here so
their absence isn't confusing:

- `references/` — a mood board of design reference images plus notes on what
  was worth stealing from each.
- `.design/`, `.design2/`, `.design3/`, `.design4/` — four rounds of design
  exploration as standalone HTML artboards, the last one generated by Python
  with a headless-Chromium script that measures each preview's real rendered
  height. All superseded by the shipped "Grid Break" theme; kept as history.
- `.env.local.off` — an env file parked with a disabled extension, for flipping
  between a local and the hosted Supabase project.
