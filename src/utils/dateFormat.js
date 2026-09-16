// Shared date formatting for anything that isn't a lap/total time (see
// timeFormat.js for those).

export function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
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
