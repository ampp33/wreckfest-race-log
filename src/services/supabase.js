import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  // Surface misconfiguration loudly during dev rather than failing later
  // with a confusing 401 from the network tab.
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY')
}

// Re-exported for pages that need to display these (e.g. the telemetry tool
// setup guide) — the anon key is a public identifier, not a secret, per
// docs/external-api.md.
export const supabaseUrl = url
export const supabaseAnonKey = anonKey

export const supabase = createClient(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    // PKCE returns the OAuth code as a `?code=` query param instead of a
    // `#access_token=` hash fragment, so it can't collide with vue-router's
    // hash-based routes (see router/index.js) on the redirect back from Google.
    flowType: 'pkce'
  }
})
