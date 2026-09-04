// The racing line as the ribbon's centreline.
//
// A boundary walk follows the OUTSIDE edge of the ribbon, which sits half a
// ribbon-width off the racing line everywhere and cuts across every pinch. The
// centre is what we want, and for a ribbon it is the midline between the outer
// outline and the enclosed hole's outline — the same thing you would compute
// from a vectorised outline, done straight off the raster.
//
// Two things get in the way and both are handled here: the direction arrow,
// which is a solid triangle roughly twice the ribbon's thickness; and branching
// layouts, whose centreline is a GRAPH rather than a curve. No amount of
// precision fixes the second — choosing a route through a junction is a fact
// about the track, not about the picture — so those are rejected by measuring
// whether the resulting line actually lies on the ink.
import { alphaMask, trace, largestBlob } from './trace-lib.mjs'

// Chamfer distance-to-background, two passes.
function distanceTransform (m) {
  const { w, h, px } = m, INF = 1e9
  const d = new Float64Array(w * h)
  for (let i = 0; i < d.length; i++) d[i] = px[i] ? INF : 0
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x
    if (!d[i]) continue
    let b = d[i]
    if (x > 0) b = Math.min(b, d[i-1] + 1)
    if (y > 0) b = Math.min(b, d[i-w] + 1)
    if (x > 0 && y > 0) b = Math.min(b, d[i-w-1] + 1.414)
    if (x < w-1 && y > 0) b = Math.min(b, d[i-w+1] + 1.414)
    d[i] = b
  }
  for (let y = h-1; y >= 0; y--) for (let x = w-1; x >= 0; x--) {
    const i = y * w + x
    if (!d[i]) continue
    let b = d[i]
    if (x < w-1) b = Math.min(b, d[i+1] + 1)
    if (y < h-1) b = Math.min(b, d[i+w] + 1)
    if (x < w-1 && y < h-1) b = Math.min(b, d[i+w+1] + 1.414)
    if (x > 0 && y < h-1) b = Math.min(b, d[i+w-1] + 1.414)
    d[i] = b
  }
  return d
}

// Drop the direction arrow: it is markedly fatter than the ribbon, which runs
// at near-constant width, so a cutoff on distance-to-background separates them.
export function ribbonOnly (m) {
  const d = distanceTransform(m)
  const vals = []
  for (let i = 0; i < d.length; i++) if (d[i] > 0) vals.push(d[i])
  if (!vals.length) return m
  vals.sort((a, b) => a - b)
  const cutoff = vals[Math.floor(vals.length * 0.5)] * 1.9
  const px = new Uint8Array(m.px.length)
  for (let i = 0; i < d.length; i++) if (d[i] > 0 && d[i] <= cutoff) px[i] = 1
  return largestBlob({ w: m.w, h: m.h, px })
}

// The largest region the ribbon encloses.
export function holePocket (m) {
  const { w, h, px } = m
  const outside = new Uint8Array(w * h), stack = []
  const push = (x, y) => {
    if (x < 0 || x >= w || y < 0 || y >= h) return
    const i = y * w + x
    if (outside[i] || px[i]) return
    outside[i] = 1; stack.push(i)
  }
  for (let x = 0; x < w; x++) { push(x, 0); push(x, h-1) }
  for (let y = 0; y < h; y++) { push(0, y); push(w-1, y) }
  while (stack.length) { const i = stack.pop(), x = i % w, y = (i/w)|0
    push(x+1,y); push(x-1,y); push(x,y+1); push(x,y-1) }
  const seen = new Uint8Array(w * h)
  let best = []
  for (let s = 0; s < px.length; s++) {
    if (outside[s] || px[s] || seen[s]) continue
    const cur = []; seen[s] = 1; stack.push(s)
    while (stack.length) { const i = stack.pop(); cur.push(i)
      const x = i % w, y = (i/w)|0
      for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
        const nx = x+dx, ny = y+dy
        if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue
        const j = ny*w + nx
        if (outside[j] || px[j] || seen[j]) continue
        seen[j] = 1; stack.push(j)
      }
    }
    if (cur.length > best.length) best = cur
  }
  const out = new Uint8Array(w * h)
  for (const i of best) out[i] = 1
  return { w, h, px: out, size: best.length }
}

// Fraction of the line that actually lands on the ribbon. A correct centreline
// sits inside the ink throughout; one that cuts across a junction does not.
// This is the acceptance test — it measures the thing we care about directly,
// rather than inferring it from hole counts.
export function onTrackRatio (pts, mask) {
  const { w, h, px } = mask
  let on = 0
  for (const [x, y] of pts) {
    const xi = Math.round(x), yi = Math.round(y)
    if (xi < 0 || xi >= w || yi < 0 || yi >= h) continue
    if (px[yi * w + xi]) on++
  }
  return pts.length ? on / pts.length : 0
}

export function centreline (file) {
  const raw = largestBlob(alphaMask(file))
  const m = ribbonOnly(raw)
  const outer = trace(m)
  const hole = holePocket(m)
  if (!outer || hole.size < 60) return null
  const inner = trace(hole)
  if (!inner) return null
  const step = Math.max(1, Math.floor(inner.length / 500))
  const cand = []
  for (let i = 0; i < inner.length; i += step) cand.push(inner[i])
  const mid = []
  for (const [ox, oy] of outer) {
    let bx = 0, by = 0, bd = Infinity
    for (const [ix, iy] of cand) {
      const d = (ix-ox)*(ix-ox) + (iy-oy)*(iy-oy)
      if (d < bd) { bd = d; bx = ix; by = iy }
    }
    mid.push([(ox + bx) / 2, (oy + by) / 2])
  }
  // Scored against the ORIGINAL ink, not the arrow-stripped mask: the strip
  // step shaves the ribbon's own core (distance-to-background peaks there), so
  // a correct centreline would score badly against it.
  return { pts: mid, mask: raw, onTrack: onTrackRatio(mid, raw) }
}

// Resample a closed loop to n evenly spaced points.
export function resampleLoop (pts, n) {
  const d = [0]
  for (let i = 1; i < pts.length; i++) d.push(d[i-1] + Math.hypot(pts[i][0]-pts[i-1][0], pts[i][1]-pts[i-1][1]))
  const total = d[d.length-1] + Math.hypot(pts[0][0]-pts[pts.length-1][0], pts[0][1]-pts[pts.length-1][1])
  const out = []
  for (let k = 0, j = 0; k < n; k++) {
    const t = total * k / n
    while (j < d.length - 1 && d[j+1] < t) j++
    const a = pts[j], b = pts[(j+1) % pts.length]
    const seg = (d[j+1] ?? total) - d[j]
    const u = seg > 0 ? (t - d[j]) / seg : 0
    out.push([Math.round(a[0] + (b[0]-a[0])*u), Math.round(a[1] + (b[1]-a[1])*u)])
  }
  return out
}

// The curve the editor draws through a set of handles — Catmull-Rom, closed.
export function handleCurve (p, samples = 400) {
  const out = [], n = p.length
  if (n < 3) return p.slice()
  for (let i = 0; i < n; i++) {
    const p0 = p[(i-1+n)%n], p1 = p[i], p2 = p[(i+1)%n], p3 = p[(i+2)%n]
    const steps = Math.max(2, Math.round(samples / n))
    for (let s = 0; s < steps; s++) {
      const t = s/steps, t2 = t*t, t3 = t2*t
      out.push([
        0.5*((2*p1[0]) + (-p0[0]+p2[0])*t + (2*p0[0]-5*p1[0]+4*p2[0]-p3[0])*t2 + (-p0[0]+3*p1[0]-3*p2[0]+p3[0])*t3),
        0.5*((2*p1[1]) + (-p0[1]+p2[1])*t + (2*p0[1]-5*p1[1]+4*p2[1]-p3[1])*t2 + (-p0[1]+3*p1[1]-3*p2[1]+p3[1])*t3)
      ])
    }
  }
  return out
}

// How many draggable handles this layout needs. A coarse resample of a twisty
// track leaves the curve cutting corners even though every handle is centred —
// which is what made a 100%-scoring centreline seed an 81% shape. Add handles
// until the curve through them tracks the centreline, then stop: fewer handles
// are easier to edit, so this spends them only where the shape earns it.
export function fitHandles (pts, mask, { min = 22, max = 84, step = 8 } = {}) {
  const target = onTrackRatio(pts, mask)
  let best = resampleLoop(pts, min)
  let bestScore = onTrackRatio(handleCurve(best), mask)
  for (let n = min + step; n <= max; n += step) {
    if (bestScore >= target - 0.005) break
    const cand = resampleLoop(pts, n)
    const score = onTrackRatio(handleCurve(cand), mask)
    if (score > bestScore) { best = cand; bestScore = score }
  }
  return { handles: best, onTrack: bestScore }
}
