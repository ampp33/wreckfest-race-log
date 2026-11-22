// Stale-while-revalidate for the small, rarely-changing catalogue (tracks,
// vehicles): resolves at once with the copy saved by the previous visit and
// refreshes that copy in the background, so a fresh page load skips a round
// trip. With nothing saved yet (first visit, private window) it waits on the
// fetch. A catalogue change reaches the page one visit late.
export function cachedCatalog(key, fetchFresh) {
  const fresh = fetchFresh().then(data => {
    try { localStorage.setItem(key, JSON.stringify(data)) } catch { /* storage full or blocked */ }
    return data
  })
  let saved = null
  try { saved = JSON.parse(localStorage.getItem(key)) } catch { /* blocked or corrupt */ }
  if (!saved) return fresh
  fresh.catch(() => {}) // the saved copy already answered
  return Promise.resolve(saved)
}
