// Shared date formatting for anything that isn't a lap/total time (see
// timeFormat.js for those).

// A bare 'YYYY-MM-DD' string (e.g. a news entry's date) has no time
// component, so the spec parses it as UTC midnight rather than local
// midnight — `new Date(iso)` would then render as the previous day in any
// timezone west of UTC. Parsing the parts directly builds a local date
// instead, sidestepping that shift. Full timestamps (e.g. `created_at`) are
// left to `new Date(iso)` as before, since those already carry real instants.
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

// Compact mm/dd/yy — used where space is tight (e.g. the homepage's races
// preview table).
export function formatCompactDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString(undefined, { month: '2-digit', day: '2-digit', year: '2-digit' })
}
