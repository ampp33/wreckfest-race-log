// "Scope" is whose races a page shows: everyone's (the /community pages),
// yours (/<your id>/... and your profile settings), or one other driver's
// (/<their id>/...). The nav's scope picker and the line above page titles
// both work from these helpers, so the routing rules live in one place.
//
// A scope is a plain object: { kind: 'everyone' } | { kind: 'you' } |
// { kind: 'driver', userId }.

// The scope the route belongs to, or null for pages outside any scope
// (News, Help, admin, ...).
export function scopeOfRoute(route, myId) {
  if (route.meta.scope === 'community') return { kind: 'everyone' }
  if (route.name === 'profile') return { kind: 'you' }
  const userId = route.params.userId
  if (!userId) return null
  return userId === myId ? { kind: 'you' } : { kind: 'driver', userId }
}

export function sameScope(a, b) {
  return !!a && !!b && a.kind === b.kind && a.userId === b.userId
}

function scopePrefix(scope, myId) {
  if (scope.kind === 'everyone') return '/community'
  return `/${scope.kind === 'you' ? myId : scope.userId}`
}

// The pages a scope has, in nav order. Leaderboard is always everyone's, so
// it shows in every scope and following it resets the scope to everyone.
export function scopeViews(scope, myId) {
  const prefix = scopePrefix(scope, myId)
  return [
    { key: 'leaderboard', label: 'Leaderboard', to: '/community/leaderboard' },
    { key: 'tracks', label: 'Tracks', to: `${prefix}/tracks` },
    { key: 'races', label: 'Races', to: `${prefix}/races` },
    { key: 'stats', label: 'Stats', to: `${prefix}/stats` }
  ]
}

// Which of those views the route is showing — a track's own page counts as
// Tracks.
export function viewOfRoute(route) {
  const name = typeof route.name === 'string' ? route.name : ''
  if (name === 'community-leaderboard') return 'leaderboard'
  if (name.endsWith('-track-detail') || name.endsWith('-tracks')) return 'tracks'
  if (name.endsWith('-races')) return 'races'
  if (name.endsWith('-stats')) return 'stats'
  return null
}

// Where picking `scope` should go from `route`: the same view in the new
// scope — even the same track — when it has one, else its races.
export function pathForScope(route, scope, myId) {
  const prefix = scopePrefix(scope, myId)
  const view = viewOfRoute(route)
  if (view === 'tracks' && route.params.trackSlug) {
    return `${prefix}/track/${route.params.trackSlug}/${route.params.variationSlug}`
  }
  if (view === 'tracks' || view === 'races' || view === 'stats') return `${prefix}/${view}`
  if (view === 'leaderboard' && scope.kind === 'everyone') return '/community/leaderboard'
  return `${prefix}/races`
}
