// Raster primitives shared by the tracer and the line-editor build.
// Single source: tools/trace-track-paths.mjs and tools/centreline.mjs both
// import from here rather than carrying their own copies.
import { execFileSync } from 'node:child_process'

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

// Isolate the largest connected run of ink. The direction arrow is often a
// separate marker sitting above the circuit, and the topmost ink pixel lands on
// it — which sent the boundary walk around the arrowhead instead of the track.
function largestBlob (mask) {
  const { w, h, px } = mask
  const seen = new Uint8Array(w * h)
  let best = null, bestN = 0
  const stack = []
  for (let s0 = 0; s0 < px.length; s0++) {
    if (seen[s0] || !px[s0]) continue
    const blob = []
    seen[s0] = 1
    stack.push(s0)
    while (stack.length) {
      const i = stack.pop()
      blob.push(i)
      const x = i % w, y = (i / w) | 0
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx, ny = y + dy
        if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue
        const j = ny * w + nx
        if (seen[j] || !px[j]) continue
        seen[j] = 1
        stack.push(j)
      }
    }
    if (blob.length > bestN) { bestN = blob.length; best = blob }
  }
  if (!best) return mask
  const out = new Uint8Array(w * h)
  for (const i of best) out[i] = px[i]
  return { w, h, px: out }
}

function trace (rawMask) {
  const mask = largestBlob(rawMask)
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
// closed loop, so the test is on the regions the ribbon encloses. Counting them
// is too blunt: plenty of ordinary circuits enclose a second pocket from a
// direction arrow, a gate or a chicane. What separates them is dominance —
// measured across all 98 layouts, a real second lobe runs 94-100% of the
// largest hole while an incidental pocket runs 0.3-17.6%. Hence areas, sorted,
// rather than a count.
function holeAreas (mask) {
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
  const minHole = Math.max(16, (w * h) / 8000)
  const areas = []
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
    if (area >= minHole) areas.push(area)
  }
  return areas.sort((a, b) => b - a)
}

export { alphaMask, trace, largestBlob, holeAreas }
