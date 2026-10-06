import { supabase } from './supabase.js'

const PROFILE_COLUMNS = 'display_name, is_public'

// Another driver's public profile, or null when there's no such driver or
// they've set their races to private — RLS hides both the same way, so the
// two cases are deliberately indistinguishable. Memoized for the session:
// the nav's section row and the page's DriverScope both ask for it, and
// other drivers' names don't change under you often enough to matter.
const profileRequests = new Map()

export function getProfile(userId) {
  if (!profileRequests.has(userId)) {
    const request = supabase
      .from('profiles')
      .select('user_id, display_name, is_public, created_at')
      .eq('user_id', userId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) throw error
        return data
      })
    // A failed lookup shouldn't stick — let the next ask retry.
    request.catch(() => profileRequests.delete(userId))
    profileRequests.set(userId, request)
  }
  return profileRequests.get(userId)
}

// Public drivers whose display name contains `query` (ignoring case), for
// the nav's "Find a driver" box. RLS leaves out anyone who opted out.
export async function searchProfiles(query, limit = 6) {
  const pattern = `%${query.trim().replace(/[\\%_]/g, '\\$&')}%`
  const { data, error } = await supabase
    .from('profiles')
    .select('user_id, display_name')
    .ilike('display_name', pattern)
    .order('display_name')
    .limit(limit)
  if (error) throw error
  return data ?? []
}

// Updates the signed-in user's own profile. RLS restricts the update to
// their own row and column grants to just these two fields, so this can't
// touch anyone else's profile or anything else on it.
export async function updateMyProfile(userId, { displayName, isPublic }) {
  const patch = {}
  if (displayName !== undefined) patch.display_name = displayName.trim()
  if (isPublic !== undefined) patch.is_public = isPublic
  const { data, error } = await supabase
    .from('profiles')
    .update(patch)
    .eq('user_id', userId)
    .select(PROFILE_COLUMNS)
    .single()
  if (error) throw new Error(profileErrorMessage(error))
  return data
}

// The database enforces the name rules (see wf1.profiles in schema.sql);
// this just turns its error codes into something worth showing a person.
function profileErrorMessage(error) {
  if (error.code === '23505') return 'That name is already taken.'
  if (error.code === '23514') return 'Names are 3–24 characters, with no spaces at the start or end.'
  return error.message || 'Failed to save profile'
}
