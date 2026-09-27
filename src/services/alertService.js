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

// Idempotent — re-marking an already-read alert is a no-op, so callers
// don't need to filter out ones that were read in another tab.
export async function markAlertsRead(userId, alertIds) {
  if (!alertIds.length) return
  const { error } = await supabase
    .from('alert_reads')
    .upsert(
      alertIds.map(alertId => ({ user_id: userId, alert_id: alertId })),
      { onConflict: 'user_id,alert_id', ignoreDuplicates: true }
    )
  if (error) throw error
}

// Admin-only (enforced by RLS on wf1.alerts).
export async function createAlert({ title, body, link, createdBy }) {
  const { error } = await supabase
    .from('alerts')
    .insert({ title, body, link: link || null, created_by: createdBy })
  if (error) throw error
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
