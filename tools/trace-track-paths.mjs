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
const PY = process.env.TRACE_PYTHON || 'python3'

function alphaMask (file) {
  const out = execFileSync(PY, ['-c', `
import sys, base64
from PIL import Image
im = Image.open(sys.argv[1]).convert('RGBA')
a = im.getchannel('A').point(lambda v: 1 if v > 90 else 0)
w, h = a.size
sys.stdout.write(f"{w} {h} " + base64.b64encode(bytes(a.getdata())).decode())
`, file], { maxBuffer: 1 << 28 }).toString()
  const [w, h, b64] = out.split(' ')
  return { w: +w, h: +h, px: Buffer.from(b64, 'base64') }
}

const NB = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]]

function trace (mask) {
  const { w, h, px } = mask
  const solid = (x, y) => x >= 0 && x < w && y >= 0 && y < h && px[y * w + x] > 0

  let start = null
  for (let y = 0; y < h && !start; y++) {
    for (let x = 0; x < w; x++) if (solid(x, y)) { start = [x, y]; break }
  }
  if (!start) return null

  let backtrack = 4, cur = start
  const contour = [start]
  for (let i = 0; i < 400000; i++) {
    let moved = false
    for (let k = 1; k <= 8; k++) {
      const d = (backtrack + k) % 8
      const nx = cur[0] + NB[d][0], ny = cur[1] + NB[d][1]
      if (solid(nx, ny)) {
        backtrack = (d + 5) % 8
        cur = [nx, ny]
        contour.push(cur)
        moved = true
        break
      }
    }
    if (!moved) break
    if (contour.length > 3 && cur[0] === start[0] && cur[1] === start[1]) break
  }
  return contour.length > 40 ? contour : null
}

// A traced outer contour is only the racing line when the ribbon is a simple
// closed loop. Count the holes: an oval or circuit encloses exactly one, a
// figure-8 encloses two, and an open route encloses none. Anything but one and
// the outer contour cuts across the layout, so reject it rather than ship a
// track that is factually the wrong shape.
function holeCount (mask) {
  const { w, h, px } = mask
  const seen = new Uint8Array(w * h)
  const stack = []
  const push = (x, y) => {
    if (x < 0 || x >= w || y < 0 || y >= h) return
    const i = y * w + x
    if (seen[i] || px[i]) return
    seen[i] = 1
    stack.push(i)
  }
  // flood the background inward from every border pixel: that is "outside"
  for (let x = 0; x < w; x++) { push(x, 0); push(x, h - 1) }
  for (let y = 0; y < h; y++) { push(0, y); push(w - 1, y) }
  while (stack.length) {
    const i = stack.pop(), x = i % w, y = (i / w) | 0
    push(x + 1, y); push(x - 1, y); push(x, y + 1); push(x, y - 1)
  }
  // whatever background is left is enclosed; count the sizeable pockets
  const minHole = Math.max(64, (w * h) / 4000)
  let holes = 0
  for (let start = 0; start < seen.length; start++) {
    if (seen[start] || px[start]) continue
    let area = 0
    seen[start] = 1
    stack.push(start)
    while (stack.length) {
      const i = stack.pop(), x = i % w, y = (i / w) | 0
      area++
      push(x + 1, y); push(x - 1, y); push(x, y + 1); push(x, y - 1)
    }
    if (area >= minHole) holes++
  }
  return holes
}


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

function build (file) {
  const mask = alphaMask(file)
  const contour = trace(mask)
  if (!contour) return null
  let pts = resample(contour, POINTS)
  for (let s = 0; s < SMOOTH; s++) {
    pts = pts.map((_, i) => {
      const a = pts[(i - 1 + pts.length) % pts.length], b = pts[i], c = pts[(i + 1) % pts.length]
      return [(a[0] + 2 * b[0] + c[0]) / 4, (a[1] + 2 * b[1] + c[1]) / 4]
    })
  }
  const holes = holeCount(mask)
  if (holes !== 1) return { reject: holes }

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
  return { w: VW, h: VH, d }
}

const files = readdirSync(SRC).filter(f => f.endsWith('.png')).sort()
const out = {}
let ok = 0
for (const f of files) {
  const slug = f.replace(/\.png$/, '')
  try {
    const p = build(join(SRC, f))
    if (p && !p.reject) { out[slug] = p; ok++ }
    else if (p) process.stderr.write(`reject ${slug} (${p.reject} enclosed regions, expected 1)\n`)
    else process.stderr.write(`skip ${slug}\n`)
  } catch (e) {
    process.stderr.write(`fail ${slug}: ${e.message}\n`)
  }
}
process.stderr.write(`${ok}/${files.length} traced\n`)
process.stdout.write(JSON.stringify(out))
