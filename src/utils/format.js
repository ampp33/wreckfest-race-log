// Display formatting. Everything is stored raw — times as integer
// milliseconds, dates as ISO strings — and only formatted here, at the edge.

// ---------------------------------------------------------------- lap/total times

export function formatMsToTime(ms) {
  if (ms == null || Number.isNaN(ms)) return ''
  const total = Math.max(0, Math.round(ms))
  const minutes = Math.floor(total / 60_000)
  const ss = String(Math.floor((total % 60_000) / 1000)).padStart(2, '0')
  const mss = String(total % 1000).padStart(3, '0')
  return `${minutes}:${ss}.${mss}`
}

export function formatDelta(ms) {
  if (ms == null) return ''
  const sign = ms > 0 ? '+' : ms < 0 ? '-' : ''
  return sign + formatMsToTime(Math.abs(ms))
}

// Chart-axis form: drops the minutes when zero ("35.207", not "0:35.207").
export function formatMsCompact(ms) {
  if (ms == null) return ''
  const totalSec = ms / 1000
  const minutes = Math.floor(totalSec / 60)
  const secs = (totalSec % 60).toFixed(3).padStart(6, '0')
  return minutes > 0 ? `${minutes}:${secs}` : secs
}

// ---------------------------------------------------------------- dates

// A bare 'YYYY-MM-DD' (a news entry's date) would parse as UTC midnight and
// show as the previous day west of UTC, so it's built as a local date instead.
// Full timestamps already carry real instants.
function parseDateOnly(iso) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return new Date(iso)
  const [year, month, day] = iso.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function formatDate(iso) {
  if (!iso) return '—'
  return parseDateOnly(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

export function formatDateTime(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

// Compact mm/dd/yy, where space is tight.
export function formatCompactDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString(undefined, { month: '2-digit', day: '2-digit', year: '2-digit' })
}

// ---------------------------------------------------------------- race fields

export function formatWeight(kg) {
  return kg != null ? kg + ' kg' : '—'
}

// Assists are stored as { shifting, abs, traction_control, stability_control },
// each a full word ("manual", "half", ...) as the plugin sends them. Tables
// show them as a compact code in that fixed order, e.g. "M,O,H,O"; an unknown
// value shows as "?" rather than dropping a position.
const SHIFTING_ABBR = { automatic: 'A', manual: 'M', manual_clutch: 'MC' }
const LEVEL_ABBR = { off: 'O', half: 'H', full: 'F' }
const ASSIST_FIELDS = [
  ['shifting', SHIFTING_ABBR],
  ['abs', LEVEL_ABBR],
  ['traction_control', LEVEL_ABBR],
  ['stability_control', LEVEL_ABBR]
]

export function formatAssists(assists) {
  if (!assists || typeof assists !== 'object' || Object.keys(assists).length === 0) return '—'
  return ASSIST_FIELDS.map(([key, abbr]) => abbr[assists[key]] ?? '?').join(',')
}
