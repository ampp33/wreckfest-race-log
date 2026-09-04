#!/usr/bin/env node
// Builds the racing-line editor.
//
//   node tools/make-line-editor.mjs local  -> public/line-editor.html
//        Small file that points at the images and fonts already in public/.
//        Open it through the dev server (or as a file) and it works with no
//        network: every edit is kept in this browser's localStorage.
//
//   node tools/make-line-editor.mjs bundle -> dist-editor.html
//        Everything inlined as data URIs — one portable file, no server.
//
// Seed handles come from the automatic tracer, so most tracks start from a
// close shape rather than blank.
import { readFileSync, writeFileSync } from 'node:fs'
import { readdirSync } from 'node:fs'
import { alphaMask, trace } from './trace-lib.mjs'
import { centreline, fitHandles, resampleLoop, handleCurve, onTrackRatio } from './centreline.mjs'

const MODE = process.argv[2] === 'bundle' ? 'bundle' : 'local'

// Per-track handle count, where the automatic fit stops short. It stops as soon
// as the curve tracks the centreline to within half a percent, which is right
// for most layouts but leaves the biggest, twistiest maps cutting corners the
// measure is too coarse to notice.
const HANDLE_OVERRIDE = {
  // Measured: mean error off the centreline falls 1.09px -> 0.72px between
  // 54 and 78 handles, and flattens past it (0.69 at 86, 0.61 at 120).
  'rally-trophy--special-stage': 78
}
const HANDLES = 26
const IMG = 'public/track-variation-images'
const WEIGHTS = [400, 500, 900]

function resample (pts, n) {
  const d = [0]
  for (let i = 1; i < pts.length; i++) d.push(d[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]))
  const total = d[d.length - 1] + Math.hypot(pts[0][0] - pts[pts.length - 1][0], pts[0][1] - pts[pts.length - 1][1])
  const out = []
  for (let k = 0, j = 0; k < n; k++) {
    const t = total * k / n
    while (j < d.length - 1 && d[j + 1] < t) j++
    const a = pts[j], b = pts[(j + 1) % pts.length]
    const seg = (d[j + 1] ?? total) - d[j]
    const u = seg > 0 ? (t - d[j]) / seg : 0
    out.push([Math.round(a[0] + (b[0] - a[0]) * u), Math.round(a[1] + (b[1] - a[1]) * u)])
  }
  return out
}

const b64 = p => readFileSync(p).toString('base64')
const slugs = readdirSync(IMG).filter(f => f.endsWith('.png')).map(f => f.slice(0, -4)).sort()
const traced = new Set(Object.keys(JSON.parse(readFileSync('public/track-paths.json', 'utf8'))))

const art = {}, data = {}
for (const slug of slugs) {
  const file = `${IMG}/${slug}.png`
  art[slug] = MODE === 'bundle'
    ? 'data:image/png;base64,' + b64(file)
    : `track-variation-images/${slug}.png`
  let m, strokes = [], fit = 0
  try {
    m = alphaMask(file)
    const cl = centreline(file)
    if (cl) {
      // Handle count is fitted per track: a coarse resample of a twisty layout
      // cuts corners even with every handle centred.
      const forced = HANDLE_OVERRIDE[slug]
      const f = forced
        ? { handles: resampleLoop(cl.pts, forced),
            onTrack: onTrackRatio(handleCurve(resampleLoop(cl.pts, forced)), cl.mask) }
        : fitHandles(cl.pts, cl.mask)
      strokes = [{ pts: f.handles, closed: true }]
      fit = Math.round(f.onTrack * 100)
    } else {
      const c = trace(m)
      if (c) strokes = [{ pts: resample(c, 26), closed: true }]
    }
  } catch { m = { w: 0, h: 0 } }
  data[slug] = {
    w: m.w, h: m.h, strokes, fit,
    name: slug.replace('--', ' — ').replace(/-/g, ' '),
    auto: traced.has(slug)
  }
}

// Reverse counterpart, for the "fill reverses" action.
const known = new Set(slugs)
for (const slug of slugs) {
  const rev = slug.endsWith('-reverse') ? slug.slice(0, -'-reverse'.length) : slug + '-reverse'
  data[slug].rev = known.has(rev) ? rev : null
}

const faces = WEIGHTS.map(w => MODE === 'bundle'
  ? `@font-face{font-family:Switzer;src:url(data:font/woff2;base64,${b64(`public/fonts/Switzer-${w}.woff2`)}) format("woff2");font-weight:${w};font-style:normal;font-display:swap}`
  : `@font-face{font-family:Switzer;src:url(fonts/Switzer-${w}.woff2) format("woff2");font-weight:${w};font-style:normal;font-display:swap}`
).join('')

const shell = readFileSync('tools/line-editor-shell.html', 'utf8')
const payload = `var ART=${JSON.stringify(art)};\nvar DATA=${JSON.stringify(data)};\nvar SLUGS=${JSON.stringify(slugs)};`
const out = shell.replace('/*FACES*/', faces).replace('/*PAYLOAD*/', payload)
const dest = MODE === 'bundle' ? 'dist-editor.html' : 'public/line-editor.html'
writeFileSync(dest, out)
process.stderr.write(`${dest} — ${slugs.length} tracks, ${(out.length / 1024).toFixed(0)} KB (${MODE})\n`)
