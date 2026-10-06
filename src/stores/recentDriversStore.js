import { reactive } from 'vue'

// Other drivers whose logs you've opened lately, newest first — offered as
// one-tap picks in the nav's scope menu. A per-browser convenience, so plain
// localStorage; losing it just empties the list.
const STORAGE_KEY = 'wreckfest:recentDrivers'
const MAX = 5

function load() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    return Array.isArray(parsed) ? parsed.filter(d => d && d.id && d.name).slice(0, MAX) : []
  } catch {
    return []
  }
}

export const recentDriversStore = reactive({
  drivers: load()
})

export function rememberDriver(id, name) {
  const rest = recentDriversStore.drivers.filter(d => d.id !== id)
  recentDriversStore.drivers = [{ id, name }, ...rest].slice(0, MAX)
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(recentDriversStore.drivers))
  } catch {
    // Storage may be unavailable in private browsing — the list just won't stick.
  }
}
