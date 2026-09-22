// A "lone race" is one logged with a results roster of exactly one racer —
// nobody else was actually racing, so it has nothing to rank against and is
// excluded from finish-rate stats.
export function isLoneRace(race) {
  return Array.isArray(race.results_roster) && race.results_roster.length === 1
}

// Share of `races` (excluding lone races and races with no place logged)
// that finished in `place` <= maxPlace.
export function placementRate(races, maxPlace) {
  const eligible = races.filter(r => !isLoneRace(r) && r.place != null)
  const total = eligible.length
  const count = eligible.filter(r => Number(r.place) <= maxPlace).length
  return { count, total, pct: total ? `${Math.round((count / total) * 100)}%` : '—' }
}
