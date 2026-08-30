import { supabase } from './supabase.js'

// Unlike statsService.js (per-user, RLS-scoped, requires auth), these calls
// are safe for anonymous visitors — used by the public home page.
export async function getTotalRaceCount() {
  const { data, error } = await supabase.rpc('get_total_race_count')
  if (error) throw error
  return Number(data) || 0
}
