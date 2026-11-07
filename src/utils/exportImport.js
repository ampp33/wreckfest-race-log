// JSON export/import of your races, from the Tracks page and the footer.
// Deliberately minimal: just the races, with the ids they reference (track
// variation, vehicle) — importing into another Supabase project would need
// those ids to exist there.
import { getAllRaces, bulkInsertRaces } from '../api.js'
import { pushToast } from '../stores.js'

export async function exportRaces(userId) {
  try {
    const races = await getAllRaces({ userId })
    const blob = new Blob([JSON.stringify({ races }, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `wreckfest-races-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    pushToast('Exported races', 'success')
  } catch (err) {
    pushToast(err.message || 'Export failed', 'error')
  }
}

// `event` is the change event of an <input type="file">.
export async function importRaces(event, userId) {
  const file = event.target.files && event.target.files[0]
  if (!file) return
  try {
    const parsed = JSON.parse(await file.text())
    const races = parsed && Array.isArray(parsed.races) ? parsed.races : null
    if (!races || !races.length) {
      pushToast('No races found in file', 'error')
      return
    }
    const cleaned = races.map(r => ({
      datetime: r.datetime,
      track_variation_id: r.track_variation_id,
      vehicle_id: r.vehicle_id || null,
      tuning: r.tuning ?? null,
      place: r.place || null,
      lap_time_ms: r.lap_time_ms ?? null,
      total_time_ms: r.total_time_ms ?? null,
      notes: r.notes || null
    }))
    await bulkInsertRaces(cleaned, userId)
    pushToast(`Imported ${cleaned.length} races`, 'success')
  } catch (err) {
    pushToast(err.message || 'Import failed', 'error')
  } finally {
    event.target.value = ''
  }
}
