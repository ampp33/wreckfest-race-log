import { supabase } from './supabase.js'

// Every notification, newest first, each with the caller's `is_read` flag.
export async function getNotifications() {
  const { data, error } = await supabase.rpc('get_notifications')
  if (error) throw error
  return data ?? []
}

export async function getUnreadNotifications() {
  const { data, error } = await supabase.rpc('get_notifications', { p_unread_only: true })
  if (error) throw error
  return data ?? []
}

// Idempotent — the read_at filter leaves notifications already read (e.g. in
// another tab) with their original timestamp.
export async function markNotificationsRead(userId, notificationIds) {
  if (!notificationIds.length) return
  const { error } = await supabase
    .from('notification_recipients')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', userId)
    .in('notification_id', notificationIds)
    .is('read_at', null)
  if (error) throw error
}

// Admin-only, all three (checked inside the RPCs).
// userIds: null sends to every current user.
export async function createNotification({ title, body, link, linkText, userIds = null }) {
  const { error } = await supabase.rpc('create_notification', {
    p_title: title,
    p_body: body,
    p_link: link || null,
    p_user_ids: userIds,
    p_link_text: linkText || null
  })
  if (error) throw error
}

export async function getAdminNotifications() {
  const { data, error } = await supabase.rpc('get_admin_notifications')
  if (error) throw error
  return data ?? []
}

// [{ user_id, display_name, read_at }], unseen (read_at null) first.
export async function getNotificationRecipients(notificationId) {
  const { data, error } = await supabase.rpc('get_notification_recipients', { p_notification_id: notificationId })
  if (error) throw error
  return data ?? []
}

export async function updateNotification(id, { title, body, link, linkText }) {
  const { error } = await supabase
    .from('notifications')
    .update({ title, body, link: link || null, link_text: linkText || null })
    .eq('id', id)
  if (error) throw error
}

export async function deleteNotification(id) {
  const { error } = await supabase.from('notifications').delete().eq('id', id)
  if (error) throw error
}
