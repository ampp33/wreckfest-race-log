import { supabase } from './supabase.js'

// Every alert, newest first, each with the caller's `is_read` flag.
export async function getAlerts() {
  const { data, error } = await supabase.rpc('get_alerts')
  if (error) throw error
  return data ?? []
}

export async function getUnreadAlerts() {
  const { data, error } = await supabase.rpc('get_alerts', { p_unread_only: true })
  if (error) throw error
  return data ?? []
}

// Idempotent — the read_at filter leaves alerts already read (e.g. in
// another tab) with their original timestamp.
export async function markAlertsRead(userId, alertIds) {
  if (!alertIds.length) return
  const { error } = await supabase
    .from('alert_recipients')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', userId)
    .in('alert_id', alertIds)
    .is('read_at', null)
  if (error) throw error
}

// Admin-only, all three (checked inside the RPCs).
// userIds: null sends to every current user.
export async function createAlert({ title, body, link, userIds = null }) {
  const { error } = await supabase.rpc('create_alert', {
    p_title: title,
    p_body: body,
    p_link: link || null,
    p_user_ids: userIds
  })
  if (error) throw error
}

export async function getAdminAlerts() {
  const { data, error } = await supabase.rpc('get_admin_alerts')
  if (error) throw error
  return data ?? []
}

// [{ user_id, display_name, read_at }], unseen (read_at null) first.
export async function getAlertRecipients(alertId) {
  const { data, error } = await supabase.rpc('get_alert_recipients', { p_alert_id: alertId })
  if (error) throw error
  return data ?? []
}

export async function updateAlert(id, { title, body, link }) {
  const { error } = await supabase
    .from('alerts')
    .update({ title, body, link: link || null })
    .eq('id', id)
  if (error) throw error
}

export async function deleteAlert(id) {
  const { error } = await supabase.from('alerts').delete().eq('id', id)
  if (error) throw error
}
