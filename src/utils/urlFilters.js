import { watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

// Mirrors a page's column filters (a ref of { columnKey: [checked string
// values] }) into the URL as one param per column, repeated per value —
// ?vehicle=Nexus+RX&place=1&place=2 Works off whatever keys the ref has;
// other query params are left alone. Call from setup().
export function useUrlFilters(filters) {
  const route = useRoute()
  const router = useRouter()
  const keys = Object.keys(filters.value)

  // Reads the filters out of the URL. vue-router gives a repeated param as an
  // array, a single one as a string, and a bare `?key` as null (dropped).
  const fromQuery = () => Object.fromEntries(keys.map(k => [k, [route.query[k] ?? []].flat().filter(v => typeof v === 'string')]))
  // check to skip no-op updates.
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)

  function fromUrl() {
    const next = fromQuery()
    if (!same(next, filters.value)) filters.value = next
  }

  function toUrl() {
    if (same(fromQuery(), filters.value)) return
    const params = Object.fromEntries(keys.map(k => [k, filters.value[k].length ? filters.value[k] : undefined]))
    router.replace({ query: { ...route.query, ...params } })
  }

  fromUrl()
  watch(() => JSON.stringify(keys.map(k => route.query[k])), fromUrl)
  watch(filters, toUrl, { deep: true })
}

// Mirrors createSortState()'s { key, direction } into ?sort=<key>&dir=desc
// (dir omitted for ascending). An unknown key is harmless: sortRows() skips
// keys with no value-getter. Call from setup().
export function useUrlSort(state) {
  const route = useRoute()
  const router = useRouter()

  const fromQuery = () => {
    const key = typeof route.query.sort === 'string' && route.query.sort ? route.query.sort : null
    return { key, direction: key ? (route.query.dir === 'desc' ? 'desc' : 'asc') : null }
  }

  function fromUrl() {
    const next = fromQuery()
    if (next.key !== state.key || next.direction !== state.direction) Object.assign(state, next)
  }

  function toUrl() {
    const current = fromQuery()
    if (current.key === state.key && current.direction === state.direction) return
    router.replace({ query: { ...route.query, sort: state.key ?? undefined, dir: state.direction === 'desc' ? 'desc' : undefined } })
  }

  fromUrl()
  watch(() => [route.query.sort, route.query.dir], fromUrl)
  watch(() => [state.key, state.direction], toUrl)
}
