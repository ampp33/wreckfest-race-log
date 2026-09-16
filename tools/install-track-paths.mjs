#!/usr/bin/env node
// Install a hand-drawn export from the line editor as the site's path data.
//
//   node tools/install-track-paths.mjs ~/Downloads/track-paths.json
//
// Validates before overwriting: every entry must name a real variation, carry
// at least one path, and use the viewBox the app draws in. Refuses the whole
// file if anything looks wrong rather than half-installing it.
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs'

const src = process.argv[2]
if (!src) {
  process.stderr.write('usage: node tools/install-track-paths.mjs <exported.json>\n')
  process.exit(1)
}
if (!existsSync(src)) {
  process.stderr.write(`no such file: ${src}\n`)
  process.exit(1)
}

const DEST = 'public/track-paths.json'
const VW = 620, VH = 540
const known = new Set(
  readdirSync('public/track-variation-images').filter(f => f.endsWith('.png')).map(f => f.slice(0, -4))
)

let data
try {
  data = JSON.parse(readFileSync(src, 'utf8'))
} catch (e) {
  process.stderr.write(`not valid JSON: ${e.message}\n`)
  process.exit(1)
}

// A two-point line is a legitimate straight, so nothing is dropped here. But
// every stroke of a track is fitted into ONE frame, so a line reaching past the
// layout shrinks the rest — that gets reported, not silently repaired.
function pointsOf (d) {
  return d.replace(/Z$/, '').split(/(?=[ML])/).map(seg => {
    const [x, y] = seg.slice(1).split(',').map(Number)
    return [x, y]
  }).filter(p => Number.isFinite(p[0]) && Number.isFinite(p[1]))
}

const problems = []
let closed = 0, open = 0, multi = 0
for (const [slug, entry] of Object.entries(data)) {
  if (!known.has(slug)) { problems.push(`${slug}: not a variation this site ships`); continue }
  if (!entry || typeof entry !== 'object') { problems.push(`${slug}: not an object`); continue }
  if (entry.w !== VW || entry.h !== VH) problems.push(`${slug}: viewBox ${entry.w}x${entry.h}, expected ${VW}x${VH}`)
  const paths = Array.isArray(entry.paths) ? entry.paths : (entry.d ? [{ d: entry.d, closed: true }] : [])
  if (!paths.length) { problems.push(`${slug}: no paths`); continue }
  if (paths.length > 1) multi++
  for (const p of paths) {
    if (typeof p.d !== 'string' || !p.d.startsWith('M')) { problems.push(`${slug}: malformed path`); break }
    if (pointsOf(p.d).length < 2) { problems.push(`${slug}: path has fewer than two points`); break }
    if (p.closed === false) open++; else closed++
  }
}

if (problems.length) {
  process.stderr.write(`refusing to install — ${problems.length} problem(s):\n`)
  for (const p of problems.slice(0, 20)) process.stderr.write('  ' + p + '\n')
  if (problems.length > 20) process.stderr.write(`  …and ${problems.length - 20} more\n`)
  process.exit(1)
}

const before = existsSync(DEST) ? Object.keys(JSON.parse(readFileSync(DEST, 'utf8'))).length : 0
writeFileSync(DEST, JSON.stringify(data))
const bytes = readFileSync(DEST).length
process.stderr.write(
  `installed ${Object.keys(data).length} variations (was ${before})\n` +
  `  ${closed} closed loops, ${open} open lines, ${multi} tracks with more than one line\n` +
  `  ${DEST} — ${(bytes / 1024).toFixed(0)} KB\n` +
  `  missing: ${known.size - Object.keys(data).length} of ${known.size} (these fall back to the artwork)\n`
)
