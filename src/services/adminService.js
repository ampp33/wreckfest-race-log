import { supabase } from './supabase.js'

export async function getDiagnostics() {
  const { data, error } = await supabase.rpc('get_diagnostics')
  if (error) throw error
  return data
}

export async function getAllUsers() {
  const { data, error } = await supabase.rpc('get_all_users_with_roles')
  if (error) throw error
  return data ?? []
}

export async function getUserGrowth() {
  const { data, error } = await supabase.rpc('get_user_growth')
  if (error) throw error
  return data ?? []
}

export async function setUserRole(userId, role) {
  const { error } = await supabase.rpc('set_user_role', {
    target_user_id: userId,
    new_role: role
  })
  if (error) throw error
}

export async function getAllApiKeys() {
  const { data, error } = await supabase.rpc('get_all_api_keys')
  if (error) throw error
  return data ?? []
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
