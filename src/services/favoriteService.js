import { supabase } from './supabase.js'

// race_favorites is RLS-scoped to the signed-in user, so this is always
// *your* starred races — on any page, whoever's races are showing.
export async function getFavoriteRaceIds() {
  const { data, error } = await supabase
    .from('race_favorites')
    .select('race_id')
  if (error) throw error
  return (data || []).map(r => r.race_id)
}

export async function addFavorite(raceId, userId) {
  // An upsert, so starring a race already starred in another tab is a no-op
  // rather than a primary-key error.
  const { error } = await supabase
    .from('race_favorites')
    .upsert({ user_id: userId, race_id: raceId }, { onConflict: 'user_id,race_id', ignoreDuplicates: true })
  if (error) throw error
}

export async function removeFavorite(raceId, userId) {
  const { error } = await supabase
    .from('race_favorites')
    .delete()
    .eq('user_id', userId)
    .eq('race_id', raceId)
  if (error) throw error
}
