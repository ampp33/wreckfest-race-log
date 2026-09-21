// Shared by ColumnFilterMenu call sites: turns a raw list into the
// deduplicated { value, label, count } options it renders, sorted with the
// "—" (unresolved/missing) bucket always last regardless of sort mode —
// numeric sorting would otherwise place it unpredictably since Number('—')
// is NaN.
export function buildOptions(items, keyFn, labelFn) {
  const map = new Map()
  for (const item of items) {
    const value = keyFn(item)
    const entry = map.get(value)
    if (entry) entry.count++
    else map.set(value, { value, label: labelFn(item), count: 1 })
  }
  return Array.from(map.values())
}

export function sortOptions(options, { numeric = false } = {}) {
  const real = options.filter(o => o.label !== '—')
  const none = options.filter(o => o.label === '—')
  real.sort(numeric
    ? (a, b) => Number(a.value) - Number(b.value)
    // String(...) guards against a non-string label (e.g. a numeric field
    // whose labelFn didn't stringify it) breaking localeCompare.
    : (a, b) => String(a.label).localeCompare(String(b.label)))
  return [...real, ...none]
}
