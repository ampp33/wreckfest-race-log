// Parses a Wreckfest race-results screenshot into race data.
//
// The results screen is a fixed template (same font, same relative column
// layout) regardless of resolution/aspect ratio or game mode (Custom Event
// vs Multiplayer, which adds PING and sometimes PTS columns) — only the
// digits/text inside each cell change. So instead of a hardcoded template
// per resolution, this self-calibrates per image: the caller OCRs the header
// row and the POS column (Tesseract handles arbitrary text/layout well),
// and the functions here derive column x-ranges and row y-bands from those
// live-detected word positions.
//
// Numeric columns (POS, PI, PING, PTS, TIME, BEST LAP) are then read via
// glyph template matching rather than OCR: the character set is only
// `0123456789:.`, and the font is pixel-identical every time, so matching
// each character's shape against a small set of reference bitmaps is both
// faster and more reliable than a general-purpose recognition engine. Free
// text (NAME, CAR) still goes through Tesseract since it's arbitrary text.
import referenceData from './ocrReferenceGlyphs.json'
import { parseTimeToMs } from './timeFormat.js'

const HEADER_LABELS = ['POS', 'NAME', 'PING', 'CLASS', 'CAR', 'PTS', 'TIME', 'BEST', 'LAP', 'BESTLAP']
const COLUMN_ORDER = ['POS', 'NAME', 'PING', 'CLASS', 'CAR', 'PTS', 'TIME', 'BESTLAP']

// ---- Header / column / mode detection ----
// `words` is Tesseract's recognized word list (bbox {x0,y0,x1,y1} + text)
// from a crop of roughly the top-left ~70% width / 18-30% height region
// (tight to the table's horizontal extent — including the blurred left-side
// menu/background art corrupts Tesseract's layout analysis for the whole
// region, even though the header text itself is perfectly legible).
export function detectHeaderColumns(words, imageWidth) {
  const found = {}
  for (const w of words) {
    const clean = w.text.toUpperCase().replace(/[^A-Z]/g, '')
    if (HEADER_LABELS.includes(clean)) {
      if (!found[clean] || w.conf > found[clean].conf) found[clean] = w
    }
  }
  // "BEST" and "LAP" render as two stacked lines with no space, so Tesseract
  // often reads them as one merged token — normalize both forms to a single
  // logical BESTLAP column.
  if (!found.BESTLAP && found.BEST && found.LAP) {
    found.BESTLAP = {
      text: 'BESTLAP', x0: found.BEST.x0, x1: found.LAP.x1,
      y0: Math.min(found.BEST.y0, found.LAP.y0), y1: Math.max(found.BEST.y1, found.LAP.y1),
      conf: (found.BEST.conf + found.LAP.conf) / 2,
    }
  }

  const missing = ['POS', 'NAME', 'CAR'].filter(k => !found[k])
  if (missing.length) return { ok: false, missing }

  const present = COLUMN_ORDER.filter(k => found[k])
  const cols = {}
  for (let i = 0; i < present.length; i++) {
    const key = present[i]
    const x0 = Math.max(0, found[key].x0 - 6)
    const next = present[i + 1]
    const x1 = next ? found[next].x0 - 10 : Math.min(imageWidth, found[key].x1 + 40)
    cols[key] = { x0, x1 }
  }
  const headerBottom = Math.max(...Object.values(found).map(w => w.y1))
  const mode = found.PING ? (found.PTS ? 'multiplayer-points' : 'multiplayer') : 'custom-event'
  return { ok: true, cols, headerBottom, mode, hasTimeColumns: Boolean(found.TIME && found.BESTLAP) }
}

// ---- Row detection ----
// `anchorWords` are Tesseract word results (text + bbox) from a crop of just
// the POS column's digits (excluding the avatar icon that follows). Row
// numbers don't all OCR cleanly in one pass, but the row grid is perfectly
// evenly spaced, so: use whichever rows *do* read confidently to derive the
// spacing (from the actual digit values, since anchors aren't necessarily
// adjacent rows), then generate the full grid arithmetically.
export function detectRowBands(anchorWords, headerBottom, imageHeight) {
  const anchors = anchorWords
    .map(w => ({ value: parseInt(w.text.trim(), 10), y0: w.y0 }))
    .filter(w => /^\d{1,2}$/.test(String(w.value)) && w.value >= 1 && w.value <= 40)
    .sort((a, b) => a.y0 - b.y0)

  if (anchors.length === 0) return { rows: [], rowHeight: null }

  // Row bands are the *text* band only, not the full row slot — the full
  // slot's bottom edge sits right at the row divider line, which fragments
  // into many extra blobs under thresholding if included in a glyph-match
  // crop. `y` below tracks each row's text-top position (as Tesseract
  // reported it for the anchors), so a small fraction above/below that is
  // enough to fully contain the glyphs while staying clear of the divider.
  if (anchors.length === 1) {
    // Only one row exists (e.g. a solo time-trial result) — no delta to
    // derive spacing from. Estimate proportionally to image height using
    // the reference screenshot's row-height-to-image-height ratio.
    const rowHeight = Math.round(imageHeight * (referenceData.referenceRowHeight / 1600))
    return { rows: [{ y0: Math.round(anchors[0].y0 - rowHeight * 0.03), y1: Math.round(anchors[0].y0 + rowHeight * 0.47) }], rowHeight }
  }

  const estimates = []
  for (let i = 0; i < anchors.length; i++) {
    for (let j = i + 1; j < anchors.length; j++) {
      const rowGap = anchors[j].value - anchors[i].value
      if (rowGap > 0) estimates.push((anchors[j].y0 - anchors[i].y0) / rowGap)
    }
  }
  estimates.sort((a, b) => a - b)
  const rowHeight = Math.round(estimates[Math.floor(estimates.length / 2)])
  const firstRowTop = anchors[0].y0 - (anchors[0].value - 1) * rowHeight

  const rows = []
  for (let y = firstRowTop; y < imageHeight - rowHeight * 0.5; y += rowHeight) {
    rows.push({ y0: Math.round(y - rowHeight * 0.03), y1: Math.round(y + rowHeight * 0.47) })
  }
  return { rows, rowHeight }
}

// ---- Glyph template matching ----
// `pixels` is raw RGBA (or RGB) image data for the cropped cell (e.g. from
// canvas ImageData.data), `width`/`height` its dimensions.

// max(R,G,B) rather than luminance-weighted grayscale: PI numbers render in
// saturated colors (crimson for class A, green for class C, etc.) that have
// low perceived luminance but a high peak channel — luminance thresholding
// misses them entirely, while max-channel catches white AND colored text.
function toMaxChannel(pixels, width, height, channels) {
  const out = new Uint8Array(width * height)
  for (let i = 0; i < out.length; i++) {
    const base = i * channels
    out[i] = Math.max(pixels[base], pixels[base + 1], pixels[base + 2])
  }
  return out
}

function threshold(gray, cutoff = 150) {
  const bin = new Uint8Array(gray.length)
  for (let i = 0; i < gray.length; i++) bin[i] = gray[i] > cutoff ? 1 : 0
  return bin
}

function connectedComponents(bin, width, height) {
  const visited = new Uint8Array(width * height)
  const blobs = []
  const stack = []
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x
      if (!bin[idx] || visited[idx]) continue
      let x0 = x, x1 = x, y0 = y, y1 = y, count = 0
      stack.push(idx); visited[idx] = 1
      while (stack.length) {
        const cur = stack.pop()
        const cy = Math.floor(cur / width), cx = cur % width
        count++
        if (cx < x0) x0 = cx; if (cx > x1) x1 = cx
        if (cy < y0) y0 = cy; if (cy > y1) y1 = cy
        const neighbors = [cur - 1, cur + 1, cur - width, cur + width, cur - width - 1, cur - width + 1, cur + width - 1, cur + width + 1]
        for (const n of neighbors) {
          if (n < 0 || n >= width * height) continue
          const nx = n % width
          if (Math.abs(nx - cx) > 1) continue
          if (!bin[n] || visited[n]) continue
          visited[n] = 1; stack.push(n)
        }
      }
      if (count >= 4) blobs.push({ x0, y0, x1, y1, count })
    }
  }
  return blobs
}

// The colon's two dots are separate connected components — merge blob pairs
// that are vertically stacked with overlapping x-ranges into one glyph.
function mergeColonDots(blobs) {
  const merged = []
  const used = new Set()
  for (let i = 0; i < blobs.length; i++) {
    if (used.has(i)) continue
    let cur = blobs[i]
    for (let j = i + 1; j < blobs.length; j++) {
      if (used.has(j)) continue
      const b = blobs[j]
      const xOverlap = Math.min(cur.x1, b.x1) - Math.max(cur.x0, b.x0)
      const minWidth = Math.min(cur.x1 - cur.x0, b.x1 - b.x0) + 1
      const vGap = Math.max(cur.y0, b.y0) - Math.min(cur.y1, b.y1)
      if (xOverlap > minWidth * 0.4 && vGap < 20 && vGap > -30) {
        cur = { x0: Math.min(cur.x0, b.x0), x1: Math.max(cur.x1, b.x1), y0: Math.min(cur.y0, b.y0), y1: Math.max(cur.y1, b.y1), count: cur.count + b.count }
        used.add(j)
      }
    }
    merged.push(cur)
  }
  return merged
}

function columnFgCount(bin, width, x, y0, y1) {
  let n = 0
  for (let y = y0; y <= y1; y++) if (bin[y * width + x]) n++
  return n
}

// Some digit pairs render close enough together to form a single connected
// component (e.g. "5" and "0" in "50"). Aspect ratio alone isn't a reliable
// signal (a merged "77" has ~the same ratio as a single "7") — comparing
// against the known median single-character width (learned from the
// reference glyphs, scaled to this image's font size) is much more robust.
function splitOnce(bin, width, blob) {
  const w = blob.x1 - blob.x0 + 1
  const searchX0 = blob.x0 + Math.round(w * 0.25)
  const searchX1 = blob.x0 + Math.round(w * 0.75)
  let bestX = -1, bestCount = Infinity
  for (let x = searchX0; x <= searchX1; x++) {
    const count = columnFgCount(bin, width, x, blob.y0, blob.y1)
    if (count < bestCount) { bestCount = count; bestX = x }
  }
  if (bestX === -1) return [blob]
  return [
    { x0: blob.x0, x1: bestX - 1, y0: blob.y0, y1: blob.y1, count: blob.count },
    { x0: bestX, x1: blob.x1, y0: blob.y0, y1: blob.y1, count: blob.count },
  ]
}

function splitWideBlobs(bin, width, blobs, medianCharWidth) {
  if (!medianCharWidth) return blobs
  const out = []
  for (const blob of blobs) {
    const w = blob.x1 - blob.x0 + 1
    const n = Math.round(w / medianCharWidth)
    if (n <= 1 || w < medianCharWidth * 1.4) { out.push(blob); continue }
    let pieces = [blob]
    for (let i = 1; i < n; i++) {
      const widest = pieces.reduce((a, b) => (b.x1 - b.x0 > a.x1 - a.x0 ? b : a))
      pieces = pieces.filter(p => p !== widest).concat(splitOnce(bin, width, widest))
    }
    out.push(...pieces)
  }
  return out
}

function normalizeBlob(bin, width, blob, canonW, canonH) {
  const w = blob.x1 - blob.x0 + 1, h = blob.y1 - blob.y0 + 1
  const out = new Array(canonW * canonH)
  for (let cy = 0; cy < canonH; cy++) {
    for (let cx = 0; cx < canonW; cx++) {
      const srcX = blob.x0 + Math.min(w - 1, Math.floor((cx / canonW) * w))
      const srcY = blob.y0 + Math.min(h - 1, Math.floor((cy / canonH) * h))
      out[cy * canonW + cx] = bin[srcY * width + srcX]
    }
  }
  return out
}

function glyphDist(a, b) {
  let d = 0
  for (let i = 0; i < a.length; i++) d += (a[i] - b[i]) ** 2
  return d
}

/**
 * Reads a numeric cell (digits + optionally `:` and `.`) via glyph template
 * matching. `rowHeight` is this image's actual detected row height, used to
 * scale the reference median character width to this image's font size.
 */
export function matchNumericCell(pixels, width, height, channels, rowHeight) {
  const gray = toMaxChannel(pixels, width, height, channels)
  const bin = threshold(gray)
  let blobs = connectedComponents(bin, width, height).filter(b => b.count >= 4)
  blobs.sort((a, b) => a.x0 - b.x0)
  blobs = mergeColonDots(blobs)
  const scaledMedianWidth = rowHeight
    ? referenceData.medianCharWidth * (rowHeight / referenceData.referenceRowHeight)
    : referenceData.medianCharWidth
  blobs = splitWideBlobs(bin, width, blobs, scaledMedianWidth)
  blobs.sort((a, b) => a.x0 - b.x0)

  let result = ''
  for (const blob of blobs) {
    const norm = normalizeBlob(bin, width, blob, referenceData.canonW, referenceData.canonH)
    let best = null, bestDist = Infinity
    for (const [ch, samples] of Object.entries(referenceData.glyphs)) {
      for (const s of samples) {
        const d = glyphDist(norm, s)
        if (d < bestDist) { bestDist = d; best = ch }
      }
    }
    result += best ?? '?'
  }
  return result
}

// A row past the real table has no bright (white/yellow/colored text) pixels
// at all, even though the dark background art continues — use that to trim
// the arithmetically-generated row grid down to the real row count.
export function cellHasText(pixels, width, height, channels) {
  const gray = toMaxChannel(pixels, width, height, channels)
  let bright = 0
  for (let i = 0; i < gray.length; i++) if (gray[i] > 190) bright++
  return bright > width * 0.5
}

// ---- Row -> race payload mapping ----
export function parseNumericTime(str) {
  if (!str || str.includes('?')) return null
  return parseTimeToMs(str)
}

export function matchVehicle(carNameRaw, vehicles) {
  if (!carNameRaw) return null
  const norm = s => s.toLowerCase().replace(/[^a-z0-9]/g, '')
  const target = norm(carNameRaw)
  if (!target) return null
  const match = vehicles.find(v => norm(v.name) === target)
  return match ? match.id : null
}
