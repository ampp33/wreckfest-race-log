// Shared reactive state. Small enough that a store library would be more
// ceremony than help: plain reactive() objects and a few mutators.
import { reactive, watch } from 'vue'
import { getSession, onAuthChange, getAccount, getFavoriteRaceIds, addFavorite, removeFavorite } from './api.js'

// localStorage may be unavailable (private browsing) — every read and write
// degrades to "nothing stored".
function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // The value just won't stick.
  }
}

// ---------------------------------------------------------------- toasts

export const toastStore = reactive({ items: [] })

let nextToastId = 1

export function pushToast(message, type = 'info', timeoutMs = 3000) {
  const id = nextToastId++
  toastStore.items.push({ id, message, type })
  setTimeout(() => {
    const idx = toastStore.items.findIndex(t => t.id === id)
    if (idx !== -1) toastStore.items.splice(idx, 1)
  }, timeoutMs)
}

// ---------------------------------------------------------------- auth

export const authStore = reactive({
  session: null,
  ready: false,
  userRoles: [],
  banned: false,
  // { display_name, is_public } — null while signed out or before it loads.
  profile: null,

  get user() {
    return this.session ? this.session.user : null
  },
  get isAuthenticated() {
    return Boolean(this.session)
  },
  get isAdmin() {
    return this.userRoles.some(ur => ur.roles?.name === 'admin')
  },
  get isBanned() {
    return this.banned
  }
})

// Supabase fires SIGNED_OUT asynchronously, so `await signOut()` can return
// while this still holds the old session. Callers that navigate right after
// signing out drop it synchronously, or the router guard would still see an
// authenticated visitor. The auth-change listener repeats this harmlessly.
export function clearAuthSession() {
  authStore.session = null
  authStore.userRoles = []
  authStore.banned = false
  authStore.profile = null
}

async function loadAccount() {
  if (!authStore.user) {
    authStore.userRoles = []
    authStore.banned = false
    authStore.profile = null
    return
  }
  const { roles, banned, profile } = await getAccount(authStore.user.id)
  authStore.userRoles = roles
  authStore.banned = banned
  authStore.profile = profile
}

let authInitialized = false

export async function initAuthStore() {
  if (authInitialized) return
  authInitialized = true

  try {
    authStore.session = await getSession()
    await loadAccount()
  } catch (err) {
    console.error('Failed to load session', err)
    authStore.session = null
  } finally {
    authStore.ready = true
  }

  onAuthChange(async session => {
    authStore.session = session
    await loadAccount()
  })
}

// ---------------------------------------------------------------- prefs

const PREFS_KEY = 'wreckfest:prefs'

export const prefsStore = reactive({
  lastVehicleId: null,
  lastTuning: null,
  lastTrackVariationId: null,
  darkMode: false,
  // The nav's car-class filter: 'A'..'D', or null for every class. Applies
  // to every page's races, whoever's log is open.
  piClass: null,
  ...load(PREFS_KEY, {})
})

watch(() => ({ ...prefsStore }), value => save(PREFS_KEY, value), { deep: true })

export function applyDarkModeClass() {
  document.documentElement.classList.toggle('dark', !!prefsStore.darkMode)
}

watch(() => prefsStore.darkMode, applyDarkModeClass)

// ---------------------------------------------------------------- recently viewed drivers

// Other drivers whose logs you've opened lately, newest first — one-tap picks
// in the nav's scope menu. Per browser, so plain localStorage.
const RECENT_KEY = 'wreckfest:recentDrivers'
const MAX_RECENT = 5

function loadRecent() {
  const parsed = load(RECENT_KEY, [])
  return Array.isArray(parsed) ? parsed.filter(d => d && d.id && d.name).slice(0, MAX_RECENT) : []
}

export const recentDriversStore = reactive({ drivers: loadRecent() })

export function rememberDriver(id, name) {
  recentDriversStore.drivers = [{ id, name }, ...recentDriversStore.drivers.filter(d => d.id !== id)].slice(0, MAX_RECENT)
  save(RECENT_KEY, recentDriversStore.drivers)
}

// ---------------------------------------------------------------- modals

// Which global dialog is open, so the nav, the floating button and keyboard
// shortcuts can open them without prop chains.
export const modals = reactive({
  quickAdd: false,
  trackSearch: false,
  prepRace: false,
  feedback: false,
  // The variation quick add opens on, when opened from a track page.
  quickAddVariationId: null
})

export function openQuickAdd(variationId = null) {
  modals.quickAddVariationId = variationId
  modals.quickAdd = true
}

export function closeQuickAdd() {
  modals.quickAdd = false
  modals.quickAddVariationId = null
}

// Set by TrackDetailPage while mounted, to reload its races after a quick add.
let onRaceSaved = null

export function setOnRaceSaved(callback) {
  onRaceSaved = callback
}

export function notifyRaceSaved(variationId) {
  onRaceSaved?.(variationId)
}

// ---------------------------------------------------------------- favorites

// The signed-in user's starred race ids — shared by every race table, and
// loaded once per sign-in since favorites are yours whoever's races show.
export const favoritesStore = reactive({ ids: new Set() })

export function isFavorite(raceId) {
  return favoritesStore.ids.has(raceId)
}

// Races with a write in flight — further clicks wait for it to land.
const pendingFavorites = new Set()

// Optimistic: the star flips at once, and flips back with a toast on failure.
export async function toggleFavorite(raceId) {
  const userId = authStore.user?.id
  if (!userId || pendingFavorites.has(raceId)) return
  pendingFavorites.add(raceId)
  const wasFavorite = favoritesStore.ids.has(raceId)
  const setStar = on => on ? favoritesStore.ids.add(raceId) : favoritesStore.ids.delete(raceId)
  setStar(!wasFavorite)
  try {
    if (wasFavorite) await removeFavorite(raceId, userId)
    else await addFavorite(raceId, userId)
  } catch (err) {
    setStar(wasFavorite)
    pushToast(err.message || 'Failed to update favorite', 'error')
  } finally {
    pendingFavorites.delete(raceId)
  }
}

// Signing in, out, or as someone else swaps the whole set; a response for an
// account that's no longer signed in is dropped.
watch(() => authStore.user?.id, async userId => {
  favoritesStore.ids = new Set()
  if (!userId) return
  try {
    const ids = await getFavoriteRaceIds()
    if (authStore.user?.id === userId) favoritesStore.ids = new Set(ids)
  } catch (err) {
    pushToast(err.message || 'Failed to load favorites', 'error')
  }
}, { immediate: true })
