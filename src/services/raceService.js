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

// PostgREST caps every response at 1000 rows (Supabase's max-rows) and
// silently drops the rest, so a driver's full history is read a page at a
// time until one comes back short. buildQuery() makes a fresh query per page,
// since a query can only run once; it must have a total order so the pages
// don't overlap or skip rows.
const PAGE_SIZE = 1000

async function fetchAllPages(buildQuery) {
  const rows = []
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await buildQuery().range(from, from + PAGE_SIZE - 1)
    if (error) throw error
    rows.push(...data)
    if (data.length < PAGE_SIZE) return rows
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

// `piClass` ('A'..'D') keeps just that car class, as in getAllRaces().
export async function getRacesByVariation(variationId, userId, { piClass } = {}) {
  const rows = await fetchAllPages(() => {
    let query = supabase
      .from('races')
      .select(SELECT)
      .eq('user_id', userId)
      .eq('track_variation_id', variationId)
      .order('datetime', { ascending: false }).order('created_at', { ascending: false }).order('id')
    if (piClass) query = query.eq('pi_class', piClass)
    return query
  })
  return rows.map(flattenRace)
}

// `piClass` ('A'..'D') keeps just that car class — a race with no PI has
// none, so it drops out.
export async function getAllRaces({ userId, source, apiKeyId, vehicleId, piClass } = {}) {
  // Filtering on a key means filtering on the embedded table, which needs
  // an inner join — otherwise PostgREST keeps every race and just nulls the
  // embed on the ones that don't match.
  const rows = await fetchAllPages(() => {
    let query = supabase
      .from('races')
      .select(apiKeyId ? SELECT.replace('races_private(', 'races_private!inner(') : SELECT)
      .eq('user_id', userId)
      .order('datetime', { ascending: false }).order('created_at', { ascending: false }).order('id')
    if (source) query = query.eq('source', source)
    if (apiKeyId) query = query.eq('races_private.api_key_id', apiKeyId)
    if (vehicleId) query = query.eq('vehicle_id', vehicleId)
    if (piClass) query = query.eq('pi_class', piClass)
    return query
  })
  return rows.map(flattenRace)
}

// Community feeds come in pages this size — "load older races" fetches the next.
export const COMMUNITY_PAGE_SIZE = 500

// Every public driver's races, newest first, one page at a time — optionally
// for a single variation or car class. Only races the Telemetry plugin logged
// (source = 'api'), like the leaderboards: hand-entered races only ever show on
// their driver's own pages. The races_private embed is there so your own races
// can be edited here without losing their notes — RLS keeps it null on everyone
// else's. RLS also leaves out drivers who've opted out (other than you). The
// driver's display name comes along via the races → profiles foreign key.
export async function getCommunityRaces({ variationId, piClass, offset = 0, limit = COMMUNITY_PAGE_SIZE } = {}) {
  let query = supabase
    .from('races')
    .select(`${SELECT}, driver:profiles(display_name)`)
    .eq('source', 'api')
    .order('datetime', { ascending: false }).order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)
  if (variationId) query = query.eq('track_variation_id', variationId)
  if (piClass) query = query.eq('pi_class', piClass)
  const { data, error } = await query
  if (error) throw error
  return (data || []).map(({ driver, ...race }) => ({ ...flattenRace(race), driverName: driver?.display_name ?? '—' }))
}

// The quickest lap per PI class + vehicle on a variation, quickest first,
// from the races and everyone in their results rosters — see
// get_fastest_laps_per_vehicle_on_variation in supabase/schema.sql.
// Plugin-logged races only, like getCommunityRaces().
export async function getFastestLapsPerVehicleOnVariation(variationId) {
  const { data, error } = await supabase.rpc('get_fastest_laps_per_vehicle_on_variation', { p_variation_id: variationId })
  if (error) throw error
  return data || []
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
