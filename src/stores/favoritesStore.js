import { reactive, watch } from 'vue'
import { authStore } from './authStore.js'
import { getFavoriteRaceIds, addFavorite, removeFavorite } from '../services/favoriteService.js'
import { pushToast } from './toastStore.js'

// The signed-in user's starred races, as a set of race ids — shared by every
// race table, so a star toggled on one page is already lit on the next.
// Loaded once per sign-in rather than per page: it's one small query, and
// favorites are yours whoever's races you're looking at.
export const favoritesStore = reactive({
  ids: new Set()
})

export function isFavorite(raceId) {
  return favoritesStore.ids.has(raceId)
}

// Races with a write still in flight — clicks on one are ignored until it
// lands, rather than racing the first request.
const pending = new Set()

// Optimistic: the star flips immediately, and flips back with a toast if the
// write fails.
export async function toggleFavorite(raceId) {
  const userId = authStore.user?.id
  if (!userId || pending.has(raceId)) return
  pending.add(raceId)
  const wasFavorite = favoritesStore.ids.has(raceId)
  if (wasFavorite) favoritesStore.ids.delete(raceId)
  else favoritesStore.ids.add(raceId)
  try {
    if (wasFavorite) await removeFavorite(raceId, userId)
    else await addFavorite(raceId, userId)
  } catch (err) {
    if (wasFavorite) favoritesStore.ids.add(raceId)
    else favoritesStore.ids.delete(raceId)
    pushToast(err.message || 'Failed to update favorite', 'error')
  } finally {
    pending.delete(raceId)
  }
}

// Signing in, out, or as someone else swaps the whole set. A response for an
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
