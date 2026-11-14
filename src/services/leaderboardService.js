import { supabase } from './supabase.js'

// Community leaderboards — see the leaderboard functions in
// supabase/schema.sql. Both run as the caller, so drivers who opted out of
// public visibility are left out (except, for you, yourself).

// [{ user_id, display_name, race_count }], most races first — across every
// class, or just one ('A'..'D').
export async function getMostRacesLeaderboard(limit = 25, piClass = null) {
  const { data, error } = await supabase.rpc('get_most_races_leaderboard', { p_limit: limit, p_pi_class: piClass })
  if (error) throw error
  return (data ?? []).map(row => ({ ...row, race_count: Number(row.race_count) }))
}

// Drivers with a plugin race in the last 15 minutes, most recent first, with
// their latest race: [{ user_id, display_name, vehicle_name, track_name,
// variation_name, server_name, datetime }].
export async function getOnlineDrivers() {
  const { data, error } = await supabase.rpc('get_online_drivers')
  if (error) throw error
  return data ?? []
}

// The fastest lap on each track variation, ordered by track then variation
// name — across every class, or just one ('A'..'D'), and every vehicle, or
// just one, optionally leaving out excludeVehicleIds:
// [{ race_id, track_name, track_slug, variation_name, variation_slug,
// user_id, display_name, lap_time_ms, vehicle_name, performance_index,
// tuning, assists, datetime, ... }].
export async function getFastestLaps(piClass = null, vehicleId = null, excludeVehicleIds = null) {
  const { data, error } = await supabase.rpc('get_fastest_laps', { p_pi_class: piClass, p_vehicle_id: vehicleId, p_exclude_vehicle_ids: excludeVehicleIds })
  if (error) throw error
  return data ?? []
}
