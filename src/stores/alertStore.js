import { reactive, watch } from 'vue'
import { authStore } from './authStore.js'
import { getUnreadAlerts, markAlertsRead } from '../services/alertService.js'

// Refreshes triggered by navigation/focus are throttled to this — alerts
// are rare, so there's no need for a realtime subscription or tight polling.
const REFRESH_INTERVAL_MS = 60 * 1000

// Bumped whenever the unread list is changed locally, so a fetch that was
// already in flight (e.g. kicked off by the navigation to /alerts) can't
// land afterwards and put just-read alerts back on the badge.
let generation = 0

export const alertStore = reactive({
  unread: [],
  loaded: false,
  lastFetchedAt: 0,

  get unreadCount() {
    return this.unread.length
  }
})

export async function refreshAlerts({ force = false } = {}) {
  if (!authStore.isAuthenticated) return
  if (!force && Date.now() - alertStore.lastFetchedAt < REFRESH_INTERVAL_MS) return
  alertStore.lastFetchedAt = Date.now()
  const startedAt = generation
  try {
    const unread = await getUnreadAlerts()
    if (startedAt !== generation) return
    alertStore.unread = unread
    alertStore.loaded = true
  } catch (err) {
    // The badge is non-critical — a failed refresh just leaves the last
    // known count in place until the next attempt.
    console.error('Failed to load alerts', err)
  }
}

// Drops the alerts from the unread list right away so the badge updates
// instantly, then persists. On failure they're restored so the user still
// sees them next time.
export async function markRead(alertIds) {
  if (!alertIds.length || !authStore.user) return
  generation += 1
  const previous = alertStore.unread
  alertStore.unread = previous.filter(a => !alertIds.includes(a.id))
  try {
    await markAlertsRead(authStore.user.id, alertIds)
  } catch (err) {
    generation += 1
    alertStore.unread = previous
    console.error('Failed to mark alerts read', err)
  }
}

export function markAllRead() {
  return markRead(alertStore.unread.map(a => a.id))
}

watch(
  () => authStore.user && authStore.user.id,
  userId => {
    generation += 1
    alertStore.unread = []
    alertStore.loaded = false
    alertStore.lastFetchedAt = 0
    if (userId) refreshAlerts({ force: true })
  },
  { immediate: true }
)

if (typeof window !== 'undefined') {
  window.addEventListener('focus', () => refreshAlerts())
}
