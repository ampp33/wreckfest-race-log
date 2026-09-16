#!/usr/bin/env node
// Trace every variation's racing line out of public/track-variation-images/*.png
// into a single SVG-path lookup, so the app can draw a track as type on a path
// instead of as a bitmap.
//
//   node tools/trace-track-paths.mjs > public/track-paths.json
//
// Each entry is { w, h, d } — a normalised viewBox and a closed polyline.
// Polyline rather than bezier because at ~110 points it reads as smooth and
// costs about a tenth of the bytes.

import { readdirSync, readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { join } from 'node:path'

const SRC = 'public/track-variation-images'
const POINTS = 110          // samples around the loop
const SMOOTH = 10           // smoothing passes
const VW = 620, VH = 540, PAD = 34

// Decode the PNG alpha channel with whatever Python/Pillow is on the machine.
import { alphaMask, trace, largestBlob } from './trace-lib.mjs'
import { centreline } from './centreline.mjs'

function resample (pts, n) {
  const d = [0]
  for (let i = 1; i < pts.length; i++) {
    d.push(d[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]))
  }
  const total = d[d.length - 1]
  if (!total) return pts.slice(0, n)
  const out = []
  let j = 0
  for (let i = 0; i < n; i++) {
    const t = total * i / n
    while (j < d.length - 1 && d[j] < t) j++
    out.push(pts[j])
  }
  return out
}

// Minimum share of the line that must lie on the ribbon. Measured across all
// 98 layouts: a correct centreline sits at 97-100%, while one that takes the
// wrong route through a junction can still reach 95.5% (pinehills), so the bar
// sits above that. Route errors are not detectable from the picture alone —
// that is the part a person has to settle.
const ON_TRACK_MIN = 0.97

function build (file) {
  const cl = centreline(file)
  if (!cl) return { reject: 'no enclosed region — open route' }
  if (cl.onTrack < ON_TRACK_MIN) {
    return { reject: `line lies on the ribbon only ${(cl.onTrack * 100).toFixed(1)}% of the way round` }
  }
  const mask = cl.mask
  const contour = cl.pts
  if (!contour) return null
  let pts = resample(contour, POINTS)
  for (let s = 0; s < SMOOTH; s++) {
    pts = pts.map((_, i) => {
      const a = pts[(i - 1 + pts.length) % pts.length], b = pts[i], c = pts[(i + 1) % pts.length]
      return [(a[0] + 2 * b[0] + c[0]) / 4, (a[1] + 2 * b[1] + c[1]) / 4]
    })
  }
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1])
  const x0 = Math.min(...xs), x1 = Math.max(...xs)
  const y0 = Math.min(...ys), y1 = Math.max(...ys)
  if (x1 - x0 < 4 || y1 - y0 < 4) return null
  const sc = Math.min((VW - 2 * PAD) / (x1 - x0), (VH - 2 * PAD) / (y1 - y0))
  const ox = (VW - (x1 - x0) * sc) / 2 - x0 * sc
  const oy = (VH - (y1 - y0) * sc) / 2 - y0 * sc
  const d = pts
    .map((p, i) => `${i ? 'L' : 'M'}${Math.round(p[0] * sc + ox)},${Math.round(p[1] * sc + oy)}`)
    .join('') + 'Z'
  // `paths` rather than a lone `d`: a layout with junctions needs more than one
  // stroke, and an open stroke carries text just as well as a closed loop.
  // `d` stays for the single-loop case so older readers keep working.
  return { w: VW, h: VH, d, paths: [{ d, closed: true }] }
}

const files = readdirSync(SRC).filter(f => f.endsWith('.png')).sort()
const out = {}
let ok = 0
for (const f of files) {
  const slug = f.replace(/\.png$/, '')
  try {
    const p = build(join(SRC, f))
    if (p && !p.reject) { out[slug] = p; ok++ }
    else if (p) process.stderr.write(`reject ${slug} (${p.reject})\n`)
    else process.stderr.write(`skip ${slug}\n`)
  } catch (e) {
    process.stderr.write(`fail ${slug}: ${e.message}\n`)
  }
}
process.stderr.write(`${ok}/${files.length} traced\n`)
process.stdout.write(JSON.stringify(out))
