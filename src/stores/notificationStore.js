import { reactive, watch } from 'vue'
import { authStore } from './authStore.js'
import { getUnreadNotifications, markNotificationsRead } from '../services/notificationService.js'

// Refreshes triggered by navigation/focus are throttled to this — notifications
// are rare, so there's no need for a realtime subscription or tight polling.
const REFRESH_INTERVAL_MS = 60 * 1000

// Bumped whenever the unread list is changed locally, so a fetch that was
// already in flight (e.g. kicked off by the navigation to /notifications) can't
// land afterwards and put just-read notifications back on the badge.
let generation = 0

export const notificationStore = reactive({
  unread: [],
  loaded: false,
  lastFetchedAt: 0,

  get unreadCount() {
    return this.unread.length
  }
})

export async function refreshNotifications({ force = false } = {}) {
  if (!authStore.isAuthenticated) return
  if (!force && Date.now() - notificationStore.lastFetchedAt < REFRESH_INTERVAL_MS) return
  notificationStore.lastFetchedAt = Date.now()
  const startedAt = generation
  try {
    const unread = await getUnreadNotifications()
    if (startedAt !== generation) return
    notificationStore.unread = unread
    notificationStore.loaded = true
  } catch (err) {
    // The badge is non-critical — a failed refresh just leaves the last
    // known count in place until the next attempt.
    console.error('Failed to load notifications', err)
  }
}

// Drops the notifications from the unread list right away so the badge updates
// instantly, then persists. On failure they're restored so the user still
// sees them next time.
export async function markRead(notificationIds) {
  if (!notificationIds.length || !authStore.user) return
  generation += 1
  const previous = notificationStore.unread
  notificationStore.unread = previous.filter(a => !notificationIds.includes(a.id))
  try {
    await markNotificationsRead(authStore.user.id, notificationIds)
  } catch (err) {
    generation += 1
    notificationStore.unread = previous
    console.error('Failed to mark notifications read', err)
  }
}

export function markAllRead() {
  return markRead(notificationStore.unread.map(a => a.id))
}

watch(
  () => authStore.user && authStore.user.id,
  userId => {
    generation += 1
    notificationStore.unread = []
    notificationStore.loaded = false
    notificationStore.lastFetchedAt = 0
    if (userId) refreshNotifications({ force: true })
  },
  { immediate: true }
)

if (typeof window !== 'undefined') {
  window.addEventListener('focus', () => refreshNotifications())
}
