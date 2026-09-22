import { reactive } from 'vue'

// Per-table 3-state column sort (unsorted -> asc -> desc -> unsorted), shared
// by RacesPage.vue and TrackDetailPage.vue. Unlike createColumnVisibility.js,
// this isn't persisted — sort resets on reload/navigation like the column
// filters do.
export function createSortState() {
  const state = reactive({ key: null, direction: null })

  function toggle(key) {
    if (state.key !== key) {
      state.key = key
      state.direction = 'asc'
    } else if (state.direction === 'asc') {
      state.direction = 'desc'
    } else {
      state.key = null
      state.direction = null
    }
  }

  function directionFor(key) {
    return state.key === key ? state.direction : null
  }

  // Accessible name for a header's clickable label+caret button — there's no
  // separate visible text for the caret's state, so it goes in the title/
  // aria-label instead.
  function titleFor(key, label) {
    const dir = directionFor(key)
    const status = dir === 'asc' ? 'ascending' : dir === 'desc' ? 'descending' : 'not sorted'
    return `Sort by ${label} (${status})`
  }

  // Drops straight to unsorted in one step — for SortMenu.vue's "Clear sort"
  // button, where cycling toggle() up to three times would be tedious.
  function clear() {
    state.key = null
    state.direction = null
  }

  return { state, toggle, directionFor, titleFor, clear }
}

// Missing values (null/undefined, or the display fallback '—' for columns
// whose value-getter returns a formatted string) always sort last, in either
// direction — the same convention filterOptions.js's sortOptions() uses for
// the "—" bucket in filter dropdowns.
function isMissing(v) {
  return v == null || v === '—'
}

// Returns a new sorted array; `rows` itself is left untouched. `valueGetters`
// maps a column key to a `(row) => value` function returning either a number
// (or a timestamp, for dates) or a string, so comparison can pick the right
// datatype per column instead of always comparing display strings.
export function sortRows(rows, state, valueGetters) {
  const getValue = state.key && valueGetters[state.key]
  if (!getValue) return rows
  const dir = state.direction === 'desc' ? -1 : 1
  return [...rows].sort((a, b) => {
    const va = getValue(a)
    const vb = getValue(b)
    const aMissing = isMissing(va)
    const bMissing = isMissing(vb)
    if (aMissing || bMissing) {
      if (aMissing && bMissing) return 0
      return aMissing ? 1 : -1
    }
    if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir
    return String(va).localeCompare(String(vb), undefined, { numeric: true, sensitivity: 'base' }) * dir
  })
}
