import { supabase } from './supabase.js'

export async function getAllUsers() {
  const { data, error } = await supabase.rpc('get_all_users_with_roles')
  if (error) throw error
  return data ?? []
}

// Race counts per 15-minute UTC bin, as [{ at, count }] with `at` in epoch
// ms — the caller regroups them by the viewer's local hour or day (see
// src/utils/chartBuckets.js and get_race_log_bins() in supabase/schema.sql).
export async function getRaceLogBins(range = '30d') {
  const { data, error } = await supabase.rpc('get_race_log_bins', { p_range: range })
  if (error) throw error
  return (data ?? []).map(([at, count]) => ({ at, count: Number(count) }))
}

export async function setUserRole(userId, role) {
  const { error } = await supabase.rpc('set_user_role', {
    target_user_id: userId,
    new_role: role
  })
  if (error) throw error
}

export async function setUserBanned(userId, banned) {
  const { error } = await supabase.rpc('set_user_banned', {
    target_user_id: userId,
    banned
  })
  if (error) throw error
}

export async function getAllApiKeys() {
  const { data, error } = await supabase.rpc('get_all_api_keys')
  if (error) throw error
  return (data ?? []).map(key => ({ ...key, race_count: Number(key.race_count) || 0 }))
}

export async function adminDeleteApiKey(id) {
  const { error } = await supabase.rpc('admin_delete_api_key', { key_id: id })
  if (error) throw error
}

export async function getAllFeedback() {
  const { data, error } = await supabase.rpc('get_all_feedback')
  if (error) throw error
  return data ?? []
}
