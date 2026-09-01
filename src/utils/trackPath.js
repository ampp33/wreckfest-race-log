// Racing lines traced out of the variation artwork by tools/trace-track-paths.mjs.
//
// Only layouts that enclose exactly one region are traced: an oval or a circuit
// does, a figure-8 or a self-crossing route does not, and for those the outer
// contour would cut straight across the middle and describe the wrong track. So
// the lookup is deliberately partial — callers fall back to the artwork when a
// slug is missing, which is why this returns null rather than throwing.

const URL = '/track-paths.json'

let cache = null
let inflight = null

export function loadTrackPaths() {
  if (cache) return Promise.resolve(cache)
  if (inflight) return inflight
  inflight = fetch(URL)
    .then(res => (res.ok ? res.json() : {}))
    .catch(() => ({}))
    .then(data => {
      cache = data
      inflight = null
      return cache
    })
  return inflight
}

export function variationPathKey(trackSlug, variationSlug) {
  if (!trackSlug || !variationSlug) return null
  return `${trackSlug}--${variationSlug}`
}

// Synchronous read, for components that have already awaited loadTrackPaths().
export function getTrackPath(trackSlug, variationSlug) {
  const key = variationPathKey(trackSlug, variationSlug)
  if (!key || !cache) return null
  return cache[key] || null
}
