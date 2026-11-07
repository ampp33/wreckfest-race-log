// What RacesPage and TrackDetailPage share about their race tables: per-page
// column visibility (persisted), 3-state column sorting (not persisted — it
// resets on navigation like the filters do) and Excel-style column filters.
//
// A page using the mixin keeps its races in `races` and declares a
// `raceTable` component option:
//   storageKey    — localStorage key for its hidden columns
//   columns       — every toggleable column key
//   defaultHidden — hidden on a first-ever visit, before the picker has
//                   saved anything
//   filters       — { key: { value(race, vm), label(race, vm), numeric? } }
//   sortValues    — { columnKey: (race, vm) => number | string }
import { isFavorite } from '../stores.js'

// ---------------------------------------------------------------- filter definitions both pages use

export const DRIVER_FILTER = { value: race => race.user_id, label: race => race.driverName }

export const PI_FILTER = {
  value: race => race.performance_index != null ? race.performance_index : null,
  label: race => race.performance_index != null ? String(race.performance_index) : '—',
  numeric: true
}

const FAVORITE_LABELS = { favorite: 'Favorites', other: 'Not favorited' }
const favoriteKey = race => isFavorite(race.id) ? 'favorite' : 'other'
export const FAVORITE_FILTER = { value: favoriteKey, label: race => FAVORITE_LABELS[favoriteKey(race)] }

// ---------------------------------------------------------------- per-race helpers both tables use

export function lapCount(race) {
  if (race.lap_count != null) return race.lap_count
  // Older races may only carry the splits array.
  if (Array.isArray(race.lap_times_ms)) return race.lap_times_ms.length
  return null
}

// Whether expanding the row has anything to show.
export function hasDetails(race) {
  return !!(race.notes || race.server_name
    || (Array.isArray(race.lap_times_ms) && race.lap_times_ms.some(ms => ms != null))
    || (Array.isArray(race.results_roster) && race.results_roster.length > 0))
}

export function apiSourceTitle(race) {
  return race.api_key?.name ? `Logged via API — key: ${race.api_key.name}` : 'Logged via API'
}

// RaceForm's starting values when editing `race`.
export function editDefaults(race) {
  const d = new Date(race.datetime)
  return {
    // datetime-local wants local time, minute precision.
    datetime: new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16),
    vehicleId: race.vehicle_id,
    tuning: race.tuning,
    place: race.place || '',
    lapTimeMs: race.lap_time_ms,
    totalTimeMs: race.total_time_ms,
    performanceIndex: race.performance_index != null ? String(race.performance_index) : '0',
    notes: race.notes || ''
  }
}

// ---------------------------------------------------------------- helpers

// The "—" (missing) bucket always sorts last; Number('—') is NaN, so numeric
// sorting would otherwise place it unpredictably.
function filterOptions(races, { value, label, numeric }, vm) {
  const map = new Map()
  for (const race of races) {
    const key = value(race, vm)
    const entry = map.get(key)
    if (entry) entry.count++
    else map.set(key, { value: key, label: label(race, vm), count: 1 })
  }
  const options = [...map.values()]
  const real = options.filter(o => o.label !== '—')
  real.sort(numeric
    ? (a, b) => Number(a.value) - Number(b.value)
    // String() guards against a non-string label breaking localeCompare.
    : (a, b) => String(a.label).localeCompare(String(b.label)))
  return [...real, ...options.filter(o => o.label === '—')]
}

// Missing values (null/undefined, or the display fallback '—') sort last in
// either direction. Numbers compare as numbers, everything else as text.
const isMissing = v => v == null || v === '—'

function sortRows(rows, { key, direction }, getValue, vm) {
  if (!key || !getValue) return rows
  const dir = direction === 'desc' ? -1 : 1
  return [...rows].sort((a, b) => {
    const va = getValue(a, vm)
    const vb = getValue(b, vm)
    if (isMissing(va) || isMissing(vb)) return isMissing(va) - isMissing(vb)
    if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir
    return String(va).localeCompare(String(vb), undefined, { numeric: true, sensitivity: 'base' }) * dir
  })
}

// The accessible name for a sortable header — there's no visible text for
// the caret's state, so it goes in the title/aria-label.
export function sortTitle(sort, key, label) {
  const dir = sort.key === key ? sort.direction : null
  return `Sort by ${label} (${dir === 'asc' ? 'ascending' : dir === 'desc' ? 'descending' : 'not sorted'})`
}

function loadHidden({ storageKey, columns, defaultHidden = [] }) {
  try {
    const raw = localStorage.getItem(storageKey)
    if (!raw) return defaultHidden.filter(k => columns.includes(k))
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter(k => columns.includes(k)) : []
  } catch {
    return []
  }
}

// ---------------------------------------------------------------- the mixin

export const raceTable = {
  data() {
    return {
      hiddenColumns: loadHidden(this.$options.raceTable),
      // Excluded values per filter (not selected ones): [] is no filter.
      columnFilters: this.emptyFilters(),
      sort: { key: null, direction: null }
    }
  },
  computed: {
    // Each column's options come from the races every *other* filter lets
    // through — real cross-filtering, like Excel's AutoFilter — so a column's
    // own unchecked values never vanish from its own list.
    filterOptions() {
      const { filters } = this.$options.raceTable
      return Object.fromEntries(Object.keys(filters).map(key => [
        key,
        filterOptions(this.races.filter(race => this.matchesFilters(race, key)), filters[key], this)
      ]))
    },
    filteredRaces() {
      return this.races.filter(race => this.matchesFilters(race))
    },
    sortedRaces() {
      return sortRows(this.filteredRaces, this.sort, this.$options.raceTable.sortValues[this.sort.key], this)
    }
  },
  watch: {
    hiddenColumns: {
      deep: true,
      handler(value) {
        try {
          localStorage.setItem(this.$options.raceTable.storageKey, JSON.stringify(value))
        } catch {
          // Storage may be unavailable in private browsing.
        }
      }
    }
  },
  methods: {
    isVisible(key) {
      return !this.hiddenColumns.includes(key)
    },
    emptyFilters() {
      return Object.fromEntries(Object.keys(this.$options.raceTable.filters).map(key => [key, []]))
    },
    resetColumnFilters() {
      this.columnFilters = this.emptyFilters()
    },
    // Whether a race passes every column filter except `exceptKey`.
    matchesFilters(race, exceptKey) {
      const { filters } = this.$options.raceTable
      return Object.keys(filters).every(key => key === exceptKey || !this.columnFilters[key].includes(filters[key].value(race, this)))
    },
    // Unsorted → ascending → descending → unsorted.
    toggleSort(key) {
      if (this.sort.key !== key) this.sort = { key, direction: 'asc' }
      else if (this.sort.direction === 'asc') this.sort = { key, direction: 'desc' }
      else this.clearSort()
    },
    clearSort() {
      this.sort = { key: null, direction: null }
    }
  }
}
