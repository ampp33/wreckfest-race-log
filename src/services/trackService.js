import { supabase } from './supabase.js'
import { cachedCatalog } from '../utils/catalogCache.js'

const TRACKS_SELECT = 'id, name, slug, track_variations(id, name, slug)'

// Memoized as a promise so callers on the same page share one request; a
// failed one is forgotten so the next call retries.
let _tracks = null

export function getTracks() {
  _tracks ??= cachedCatalog(`wf.tracks:${TRACKS_SELECT}`, async () => {
    const { data, error } = await supabase
      .from('tracks')
      .select(TRACKS_SELECT)
      .order('name', { ascending: true })
    if (error) throw error
    return data || []
  }).catch(err => { _tracks = null; throw err })
  return _tracks
}

export async function getTrackBySlug(slug) {
  const tracks = await getTracks()
  return tracks.find(t => t.slug === slug) ?? null
}

export function findVariation(track, variationSlug) {
  if (!track || !track.track_variations) return null
  return track.track_variations.find(v => v.slug === variationSlug) || null
}
