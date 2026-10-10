import { supabase } from './supabase.js'

// races is publicly readable (see supabase/schema.sql), so none of these
// queries is scoped to the signed-in user by RLS alone — every read here
// filters on user_id explicitly. The owner-only fields (notes, API key)
// live in races_private and come back through the embed below, which is
// null for anyone else's race; flattenRace() lifts them back onto the race
// so callers keep reading race.notes / race.api_key like before.
const RACE_COLUMNS =
  'id, user_id, datetime, track_variation_id, vehicle_id, tuning, assists, place, lap_time_ms, total_time_ms, performance_index, vehicle_weight_kg, server_name, parts, lap_count, lap_times_ms, results_roster, created_at, source'
const PRIVATE_EMBED = 'races_private(notes, api_key_id, api_key:api_keys(name))'
const SELECT = `${RACE_COLUMNS}, ${PRIVATE_EMBED}`

function flattenRace({ races_private: priv, ...race }) {
  return {
    ...race,
    notes: priv?.notes ?? null,
    api_key_id: priv?.api_key_id ?? null,
    api_key: priv?.api_key ?? null
  }
}

// Writes the owner-only half of a race. An upsert, so a race logged through
// the API keeps its api_key_id when its notes are edited later — only the
// columns sent here are touched on conflict.
async function saveRaceNotes(raceId, userId, notes) {
  const { error } = await supabase
    .from('races_private')
    .upsert({ race_id: raceId, user_id: userId, notes: notes || null }, { onConflict: 'race_id' })
  if (error) throw error
}

export async function getRacesByVariation(variationId, userId) {
  const { data, error } = await supabase
    .from('races')
    .select(SELECT)
    .eq('user_id', userId)
    .eq('track_variation_id', variationId)
    .order('datetime', { ascending: false }).order('created_at', { ascending: false })
  if (error) throw error
  return (data || []).map(flattenRace)
}

export async function getAllRaces({ userId, source, apiKeyId } = {}) {
  // Filtering on a key means filtering on the embedded table, which needs
  // an inner join — otherwise PostgREST keeps every race and just nulls the
  // embed on the ones that don't match.
  let query = supabase
    .from('races')
    .select(apiKeyId ? SELECT.replace('races_private(', 'races_private!inner(') : SELECT)
    .eq('user_id', userId)
    .order('datetime', { ascending: false }).order('created_at', { ascending: false })
  if (source) query = query.eq('source', source)
  if (apiKeyId) query = query.eq('races_private.api_key_id', apiKeyId)
  const { data, error } = await query
  if (error) throw error
  return (data || []).map(flattenRace)
}

// Community feeds come in pages this size — "load older races" fetches the next.
export const COMMUNITY_PAGE_SIZE = 500

// Every public driver's races, newest first, one page at a time — optionally
// for a single variation. No races_private embed: owner-only fields never
// appear on community pages, not even on your own races. RLS already leaves out
// drivers who've opted out (other than you). The driver's display name comes
// along via the races → profiles foreign key.
export async function getCommunityRaces({ variationId, offset = 0, limit = COMMUNITY_PAGE_SIZE } = {}) {
  let query = supabase
    .from('races')
    .select(`${RACE_COLUMNS}, driver:profiles(display_name)`)
    .order('datetime', { ascending: false }).order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)
  if (variationId) query = query.eq('track_variation_id', variationId)
  const { data, error } = await query
  if (error) throw error
  return (data || []).map(({ driver, ...race }) => ({ ...race, driverName: driver?.display_name ?? '—' }))
}

export async function createRace(race, userId) {
  const { notes, ...publicFields } = race
  const { data, error } = await supabase
    .from('races')
    .insert({ ...publicFields, user_id: userId })
    .select(SELECT)
    .single()
  if (error) throw error
  if (notes) {
    // Two requests, so not atomic: if the notes don't save, take the race
    // back out rather than leave it half-saved for the user to retry into
    // a duplicate.
    try {
      await saveRaceNotes(data.id, userId, notes)
    } catch (err) {
      await deleteRace(data.id).catch(() => {})
      throw err
    }
  }
  return { ...flattenRace(data), notes: notes || null }
}

export async function updateRace(id, patch) {
  const { notes, ...publicFields } = patch
  const query = Object.keys(publicFields).length
    ? supabase.from('races').update(publicFields).eq('id', id).select(SELECT)
    : supabase.from('races').select(SELECT).eq('id', id)
  const { data, error } = await query.single()
  if (error) throw error
  const race = flattenRace(data)
  if (notes !== undefined) {
    await saveRaceNotes(id, race.user_id, notes)
    race.notes = notes || null
  }
  return race
}

export async function deleteRace(id) {
  // races_private goes with it via on delete cascade.
  const { error } = await supabase.from('races').delete().eq('id', id)
  if (error) throw error
}

export async function getVehiclePiMap(userId) {
  const { data, error } = await supabase
    .from('races')
    .select('vehicle_id, performance_index')
    .eq('user_id', userId)
    .not('vehicle_id', 'is', null)
    .not('performance_index', 'is', null)
    .order('datetime', { ascending: false })
  if (error) throw error
  const map = {}
  for (const { vehicle_id, performance_index } of data || []) {
    if (!(vehicle_id in map)) map[vehicle_id] = performance_index
  }
  return map
}

export async function bulkInsertRaces(races, userId) {
  // Ids are generated here rather than by the database so each race's notes
  // can be matched to it without relying on the order rows come back in.
  const withIds = races.map(r => ({ ...r, id: crypto.randomUUID() }))
  const payload = withIds.map(({ notes, ...r }) => ({ ...r, user_id: userId }))
  const { data, error } = await supabase
    .from('races')
    .insert(payload)
    .select(SELECT)
  if (error) throw error

  const privateRows = withIds
    .filter(r => r.notes)
    .map(r => ({ race_id: r.id, user_id: userId, notes: r.notes }))
  if (privateRows.length) {
    const { error: notesError } = await supabase.from('races_private').insert(privateRows)
    if (notesError) {
      // Same reasoning as createRace: undo the races so a retried import
      // doesn't double them up.
      await supabase.from('races').delete().in('id', withIds.map(r => r.id))
      throw notesError
    }
  }

  const notesById = Object.fromEntries(withIds.map(r => [r.id, r.notes || null]))
  return (data || []).map(r => ({ ...flattenRace(r), notes: notesById[r.id] }))
}
