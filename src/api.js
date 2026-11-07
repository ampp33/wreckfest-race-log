// Every Supabase call in the app. All authorization lives in Postgres (RLS
// and security-definer RPCs, see supabase/schema.sql); this file only shapes
// requests and responses.
import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  // Surface misconfiguration loudly during dev rather than failing later
  // with a confusing 401 from the network tab.
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY')
}

export const supabase = createClient(url, anonKey, {
  // All app tables/RPCs live in wf1, not public — see supabase/schema.sql.
  db: { schema: 'wf1' },
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    // PKCE returns the OAuth code as a `?code=` query param instead of a
    // `#access_token=` hash fragment, so it can't collide with vue-router's
    // hash-based routes on the redirect back from Google/Discord.
    flowType: 'pkce'
  }
})

// Not .throwOnError(): that rethrows network failures with a different
// message than the { error } the UI has always shown in its toasts.
async function run(query) {
  const { data, error } = await query
  if (error) throw error
  return data
}

const rpc = (name, args) => run(supabase.rpc(name, args))

// ---------------------------------------------------------------- auth

export async function signInWithPassword(email, password) {
  return (await run(supabase.auth.signInWithPassword({ email, password }))).session
}

// With "Confirm email" on, signUp returns a user but no session — the caller
// shows a "check your inbox" hint then.
export async function signUpWithPassword(email, password) {
  const { session, user } = await run(supabase.auth.signUp({ email, password }))
  return { session, user }
}

// On success the browser navigates away to the provider's consent screen;
// the session is picked up on the redirect back.
export async function signInWithOAuth(provider, redirectTo) {
  const { error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo } })
  if (error) throw error
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getSession() {
  return (await run(supabase.auth.getSession())).session
}

export function onAuthChange(callback) {
  return supabase.auth.onAuthStateChange((_event, session) => callback(session)).data.subscription
}

// Roles, ban status and profile for the signed-in user. Errors are ignored:
// a failed lookup just reads as "no roles, not banned, no profile".
export async function getAccount(userId) {
  const [{ data: roles }, { data: details }, { data: profile }] = await Promise.all([
    supabase.from('user_roles').select('role_id, roles(name)').eq('user_id', userId),
    supabase.from('user_details').select('status').eq('user_id', userId).maybeSingle(),
    supabase.from('profiles').select('display_name, is_public').eq('user_id', userId).maybeSingle()
  ])
  return { roles: roles ?? [], banned: details?.status === 'banned', profile: profile ?? null }
}

// ---------------------------------------------------------------- catalogue

let tracksRequest = null
let vehiclesRequest = null

// The catalogue never changes under a session, so it's fetched once.
export async function getTracks() {
  if (!tracksRequest) {
    tracksRequest = run(supabase.from('tracks').select('id, name, slug, track_variations(id, name, slug)').order('name', { ascending: true }))
      .then(data => data || [])
    tracksRequest.catch(() => { tracksRequest = null })
  }
  return tracksRequest
}

export async function getTrackBySlug(slug) {
  return (await getTracks()).find(t => t.slug === slug) ?? null
}

export async function getVehicles() {
  if (!vehiclesRequest) {
    vehiclesRequest = run(supabase.from('vehicles').select('id, name, class').order('name', { ascending: true }))
      .then(data => data || [])
    vehiclesRequest.catch(() => { vehiclesRequest = null })
  }
  return vehiclesRequest
}

// ---------------------------------------------------------------- races

// races is publicly readable, so none of these queries is scoped to the
// signed-in user by RLS alone — every per-driver read filters on user_id
// explicitly. The owner-only fields (notes, API key) live in races_private
// and come back through the embed, which is null for anyone else's race;
// flattenRace() lifts them onto the race as race.notes / race.api_key.
const RACE_COLUMNS =
  'id, user_id, datetime, track_variation_id, vehicle_id, tuning, assists, place, lap_time_ms, total_time_ms, performance_index, vehicle_weight_kg, server_name, parts, lap_count, lap_times_ms, results_roster, created_at, source'
const RACE_SELECT = `${RACE_COLUMNS}, races_private(notes, api_key_id, api_key:api_keys(name))`

function flattenRace({ races_private: priv, ...race }) {
  return { ...race, notes: priv?.notes ?? null, api_key_id: priv?.api_key_id ?? null, api_key: priv?.api_key ?? null }
}

// Newest first, with a total order so pages never overlap or skip rows.
const newestFirst = query => query.order('datetime', { ascending: false }).order('created_at', { ascending: false })

// PostgREST caps every response at 1000 rows and silently drops the rest, so
// a driver's full history is read a page at a time until one comes back
// short. buildQuery() makes a fresh query per page, since one can only run once.
const PAGE_SIZE = 1000

async function fetchAllPages(buildQuery) {
  const rows = []
  for (let from = 0; ; from += PAGE_SIZE) {
    const data = await run(buildQuery().range(from, from + PAGE_SIZE - 1))
    rows.push(...data)
    if (data.length < PAGE_SIZE) return rows
  }
}

// The owner-only half of a race. An upsert, so a plugin-logged race keeps its
// api_key_id when its notes are edited later.
async function saveRaceNotes(raceId, userId, notes) {
  await run(supabase.from('races_private').upsert({ race_id: raceId, user_id: userId, notes: notes || null }, { onConflict: 'race_id' }))
}

// `piClass` ('A'..'D') keeps just that car class; a race with no PI has none.
export async function getRacesByVariation(variationId, userId, { piClass } = {}) {
  const rows = await fetchAllPages(() => {
    let query = newestFirst(supabase.from('races').select(RACE_SELECT).eq('user_id', userId).eq('track_variation_id', variationId)).order('id')
    if (piClass) query = query.eq('pi_class', piClass)
    return query
  })
  return rows.map(flattenRace)
}

export async function getAllRaces({ userId, source, apiKeyId, vehicleId, piClass } = {}) {
  // Filtering on a key filters on the embedded table, which needs an inner
  // join — otherwise PostgREST keeps every race and just nulls the embed.
  const select = apiKeyId ? RACE_SELECT.replace('races_private(', 'races_private!inner(') : RACE_SELECT
  const rows = await fetchAllPages(() => {
    let query = newestFirst(supabase.from('races').select(select).eq('user_id', userId)).order('id')
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

// Every public driver's plugin-logged races (hand-entered ones only show on
// their driver's own pages), newest first, a page at a time — optionally for
// one variation or car class. The private embed lets your own races be edited
// here; RLS keeps it null on everyone else's, and leaves out drivers who've
// opted out. The driver's name comes along via the races → profiles key.
export async function getCommunityRaces({ variationId, piClass, offset = 0, limit = COMMUNITY_PAGE_SIZE } = {}) {
  let query = newestFirst(supabase.from('races').select(`${RACE_SELECT}, driver:profiles(display_name)`).eq('source', 'api'))
    .range(offset, offset + limit - 1)
  if (variationId) query = query.eq('track_variation_id', variationId)
  if (piClass) query = query.eq('pi_class', piClass)
  const data = await run(query)
  return (data || []).map(({ driver, ...race }) => ({ ...flattenRace(race), driverName: driver?.display_name ?? '—' }))
}

// The quickest lap per PI class + vehicle on a variation, from the races and
// everyone in their results rosters. Plugin-logged races only.
export async function getFastestLapsPerVehicleOnVariation(variationId) {
  return (await rpc('get_fastest_laps_per_vehicle_on_variation', { p_variation_id: variationId })) || []
}

export async function createRace(race, userId) {
  const { notes, ...publicFields } = race
  const data = await run(supabase.from('races').insert({ ...publicFields, user_id: userId }).select(RACE_SELECT).single())
  if (notes) {
    // Two requests, so not atomic: if the notes don't save, take the race
    // back out rather than leave it half-saved to be retried into a duplicate.
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
    ? supabase.from('races').update(publicFields).eq('id', id).select(RACE_SELECT)
    : supabase.from('races').select(RACE_SELECT).eq('id', id)
  const race = flattenRace(await run(query.single()))
  if (notes !== undefined) {
    await saveRaceNotes(id, race.user_id, notes)
    race.notes = notes || null
  }
  return race
}

// races_private goes with it via on delete cascade.
export async function deleteRace(id) {
  await run(supabase.from('races').delete().eq('id', id))
}

// Each vehicle's most recent PI, to prefill the quick-add form.
export async function getVehiclePiMap(userId) {
  const data = await run(supabase.from('races').select('vehicle_id, performance_index').eq('user_id', userId)
    .not('vehicle_id', 'is', null).not('performance_index', 'is', null).order('datetime', { ascending: false }))
  const map = {}
  for (const { vehicle_id, performance_index } of data || []) {
    if (!(vehicle_id in map)) map[vehicle_id] = performance_index
  }
  return map
}

export async function bulkInsertRaces(races, userId) {
  // Ids are generated here so each race's notes can be matched to it without
  // relying on the order rows come back in.
  const withIds = races.map(r => ({ ...r, id: crypto.randomUUID() }))
  const data = await run(supabase.from('races').insert(withIds.map(({ notes, ...r }) => ({ ...r, user_id: userId }))).select(RACE_SELECT))

  const privateRows = withIds.filter(r => r.notes).map(r => ({ race_id: r.id, user_id: userId, notes: r.notes }))
  if (privateRows.length) {
    const { error } = await supabase.from('races_private').insert(privateRows)
    if (error) {
      // As in createRace: undo the races so a retried import doesn't double them.
      await supabase.from('races').delete().in('id', withIds.map(r => r.id))
      throw error
    }
  }

  const notesById = Object.fromEntries(withIds.map(r => [r.id, r.notes || null]))
  return (data || []).map(r => ({ ...flattenRace(r), notes: notesById[r.id] }))
}

// ---------------------------------------------------------------- per-variation (RLS: always yours)

const GOAL_COLUMNS = 'id, track_variation_id, goal_lap_time_ms, notes, updated_at'

export async function getGoalForVariation(variationId) {
  return run(supabase.from('goals').select(GOAL_COLUMNS).eq('track_variation_id', variationId).maybeSingle())
}

export async function upsertGoal({ variationId, goalLapTimeMs, notes, userId }) {
  const payload = {
    user_id: userId,
    track_variation_id: variationId,
    goal_lap_time_ms: goalLapTimeMs ?? null,
    notes: notes ?? null,
    updated_at: new Date().toISOString()
  }
  return run(supabase.from('goals').upsert(payload, { onConflict: 'user_id,track_variation_id' }).select(GOAL_COLUMNS).single())
}

const ANNOTATION_COLUMNS = 'id, x, y, number, note'

export async function getAnnotationsForVariation(variationId) {
  return (await run(supabase.from('variation_annotations').select(ANNOTATION_COLUMNS).eq('track_variation_id', variationId).order('created_at'))) || []
}

// Replaces the whole set for the variation.
export async function saveAnnotations({ variationId, annotations, userId }) {
  await run(supabase.from('variation_annotations').delete().eq('track_variation_id', variationId).eq('user_id', userId))
  if (!annotations.length) return []
  const rows = annotations.map(({ x, y, number, note }) => ({ user_id: userId, track_variation_id: variationId, x, y, number, note: note || null }))
  return (await run(supabase.from('variation_annotations').insert(rows).select(ANNOTATION_COLUMNS))) || []
}

// ---------------------------------------------------------------- favorites (RLS: always yours)

export async function getFavoriteRaceIds() {
  return ((await run(supabase.from('race_favorites').select('race_id'))) || []).map(r => r.race_id)
}

// An upsert, so starring a race already starred in another tab is a no-op.
export async function addFavorite(raceId, userId) {
  await run(supabase.from('race_favorites').upsert({ user_id: userId, race_id: raceId }, { onConflict: 'user_id,race_id', ignoreDuplicates: true }))
}

export async function removeFavorite(raceId, userId) {
  await run(supabase.from('race_favorites').delete().eq('user_id', userId).eq('race_id', raceId))
}

// ---------------------------------------------------------------- profiles

// Another driver's profile, or null when there's no such driver or they've
// gone private — RLS hides both the same way, deliberately. Memoized for the
// session: the nav, the kicker and DriverScope all ask for it.
const profileRequests = new Map()

export function getProfile(userId) {
  if (!profileRequests.has(userId)) {
    const request = run(supabase.from('profiles').select('user_id, display_name, is_public, created_at').eq('user_id', userId).maybeSingle())
    // A failed lookup shouldn't stick — let the next ask retry.
    request.catch(() => profileRequests.delete(userId))
    profileRequests.set(userId, request)
  }
  return profileRequests.get(userId)
}

// Public drivers whose name contains `query`, for "Find a driver".
export async function searchProfiles(query, limit = 6) {
  const pattern = `%${query.trim().replace(/[\\%_]/g, '\\$&')}%`
  return (await run(supabase.from('profiles').select('user_id, display_name').ilike('display_name', pattern).order('display_name').limit(limit))) ?? []
}

// RLS limits this to your own row, and column grants to these two fields.
export async function updateMyProfile(userId, { displayName, isPublic }) {
  const patch = {}
  if (displayName !== undefined) patch.display_name = displayName.trim()
  if (isPublic !== undefined) patch.is_public = isPublic
  const { data, error } = await supabase.from('profiles').update(patch).eq('user_id', userId).select('display_name, is_public').single()
  if (!error) return data
  // The database enforces the name rules; these turn its codes into words.
  if (error.code === '23505') throw new Error('That name is already taken.')
  if (error.code === '23514') throw new Error('Names are 3–24 characters, with no spaces at the start or end.')
  throw new Error(error.message || 'Failed to save profile')
}

// ---------------------------------------------------------------- leaderboards & public stats

// [{ user_id, display_name, race_count }], most races first.
export async function getMostRacesLeaderboard(limit = 25, piClass = null) {
  return ((await rpc('get_most_races_leaderboard', { p_limit: limit, p_pi_class: piClass })) ?? [])
    .map(row => ({ ...row, race_count: Number(row.race_count) }))
}

// The fastest lap on each variation, optionally for one class/vehicle or
// leaving out excludeVehicleIds.
export async function getFastestLaps(piClass = null, vehicleId = null, excludeVehicleIds = null) {
  return (await rpc('get_fastest_laps', { p_pi_class: piClass, p_vehicle_id: vehicleId, p_exclude_vehicle_ids: excludeVehicleIds })) ?? []
}

// The one stats RPC anonymous visitors may call.
export async function getTotalRaceCount() {
  return Number(await rpc('get_total_race_count')) || 0
}

// ---------------------------------------------------------------- API keys

const toHex = bytes => Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('')

export async function getApiKeys() {
  return ((await rpc('get_api_keys_with_counts')) || []).map(key => ({ ...key, race_count: Number(key.race_count) || 0 }))
}

// The raw key is generated here, shown once, and never stored — only its hash.
export async function createApiKey(name) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  const rawKey = toHex(crypto.getRandomValues(new Uint8Array(32)))
  const keyHash = toHex(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(rawKey))))
  await run(supabase.from('api_keys').insert({ user_id: user.id, name, key_hash: keyHash }))
  return rawKey
}

// Soft-revoke, so races logged with this key keep resolving back to it.
export async function deleteApiKey(id) {
  await run(supabase.from('api_keys').update({ revoked_at: new Date().toISOString() }).eq('id', id))
}

// ---------------------------------------------------------------- feedback & admin

export async function submitFeedback({ userId, url, feedbackText }) {
  await run(supabase.from('feedback').insert({ user_id: userId, url, feedback_text: feedbackText }))
}

export async function getAllUsers() {
  return (await rpc('get_all_users_with_roles')) ?? []
}

// Race counts per 15-minute UTC bin as [{ at, count }], `at` in epoch ms —
// regrouped by the viewer's local hour/day in src/utils/chartBuckets.js.
export async function getRaceLogBins(range = '30d') {
  return ((await rpc('get_race_log_bins', { p_range: range })) ?? []).map(([at, count]) => ({ at, count: Number(count) }))
}

// Distinct (user, 15-minute UTC bin) race pairs as [{ userId, at }], reaching
// 60 days before the range.
export async function getUserActivityBins(range = '30d') {
  return ((await rpc('get_user_activity_bins', { p_range: range })) ?? []).map(([userId, at]) => ({ userId, at }))
}

export async function setUserRole(userId, role) {
  await rpc('set_user_role', { target_user_id: userId, new_role: role })
}

export async function setUserBanned(userId, banned) {
  await rpc('set_user_banned', { target_user_id: userId, banned })
}

export async function getAllApiKeys() {
  return ((await rpc('get_all_api_keys')) ?? []).map(key => ({ ...key, race_count: Number(key.race_count) || 0 }))
}

export async function adminDeleteApiKey(id) {
  await rpc('admin_delete_api_key', { key_id: id })
}

export async function getAllFeedback() {
  return (await rpc('get_all_feedback')) ?? []
}
