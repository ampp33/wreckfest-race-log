import { getAllRaces } from './raceService.js'
import { getVehicles } from './vehicleService.js'
import { getTracks } from './trackService.js'
import { placementRate } from '../utils/raceStats.js'

// Aggregate stats for the Stats page, computed client-side from the driver's
// full race history in one fetch rather than a round trip per metric.
//
// `piClass` ('A'..'D') narrows every stat to races in that car class.
export async function getStats(userId, { piClass = null } = {}) {
  const [races, vehicles, tracks] = await Promise.all([
    getAllRaces({ userId, piClass }),
    getVehicles(),
    getTracks()
  ])

  const vehicleCounts = computeVehicleCounts(races, vehicles)

  return {
    mostUsedVehicle: vehicleCounts[0] ?? null,
    mostRacedVariation: computeMostRacedVariation(races, tracks),
    vehicleCounts,
    totalRaces: races.length,
    raceCounts: computeRaceCounts(races),
    recentRaces: computeRecentRaces(races, tracks, vehicles),
    top3Rate: placementRate(races, 3),
    top5Rate: placementRate(races, 5),
    top10Rate: placementRate(races, 10)
  }
}

// Every vehicle the driver has raced, most races first: [{ id, name, count }].
// Ties go alphabetically so the order doesn't shuffle between loads.
function computeVehicleCounts(races, vehicles) {
  const counts = countBy(races, r => r.vehicle_id)
  return Object.keys(counts)
    .map(id => ({ id, name: vehicles.find(v => v.id === id)?.name, count: counts[id] }))
    .filter(row => row.name)
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
}

function computeMostRacedVariation(races, tracks) {
  const counts = countBy(races, r => r.track_variation_id)
  const winnerId = topKey(counts)
  if (!winnerId) return null
  const found = findVariationName(tracks, winnerId)
  if (!found) return null
  return { ...found, count: counts[winnerId] }
}

function computeRaceCounts(races) {
  const now = new Date()
  const todayStr = localDateStr(now)

  const hourlyCounts = new Array(24).fill(0)
  const dailyCounts = {}

  for (const race of races) {
    const d = new Date(race.datetime)
    const dateStr = localDateStr(d)
    dailyCounts[dateStr] = (dailyCounts[dateStr] || 0) + 1
    if (dateStr === todayStr) {
      hourlyCounts[d.getHours()]++
    }
  }

  return { hourlyCounts, dailyCounts }
}

function computeRecentRaces(races, tracks, vehicles) {
  const cutoff = Date.now() - 24 * 60 * 60 * 1000
  return races
    .filter(r => new Date(r.datetime).getTime() >= cutoff)
    .map(r => {
      const found = findVariationName(tracks, r.track_variation_id)
      const vehicle = vehicles.find(v => v.id === r.vehicle_id)
      return {
        id: r.id,
        datetime: r.datetime,
        trackName: found?.trackName ?? '—',
        trackSlug: found?.trackSlug ?? null,
        variationName: found?.variationName ?? '—',
        variationSlug: found?.variationSlug ?? null,
        vehicleName: vehicle?.name ?? '—',
        lapTimeMs: r.lap_time_ms,
        place: r.place
      }
    })
}

function localDateStr(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function countBy(items, keyFn) {
  const counts = {}
  for (const item of items) {
    const key = keyFn(item)
    if (key == null) continue
    counts[key] = (counts[key] || 0) + 1
  }
  return counts
}

function topKey(counts) {
  let winner = null
  let best = -1
  for (const key of Object.keys(counts)) {
    if (counts[key] > best) {
      best = counts[key]
      winner = key
    }
  }
  return winner
}

function findVariationName(tracks, variationId) {
  for (const track of tracks) {
    const v = (track.track_variations || []).find(x => x.id === variationId)
    if (v) {
      return {
        trackName: track.name,
        trackSlug: track.slug,
        variationName: v.name,
        variationSlug: v.slug
      }
    }
  }
  return null
}
