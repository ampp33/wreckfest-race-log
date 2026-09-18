import { supabase } from './supabase.js'

async function sha256Hex(text) {
  const encoder = new TextEncoder()
  const data = encoder.encode(text)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

function generateRawKey() {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function getApiKeys() {
  const { data, error } = await supabase.rpc('get_api_keys_with_counts')
  if (error) throw error
  return (data || []).map(key => ({ ...key, race_count: Number(key.race_count) || 0 }))
}

export async function createApiKey(name) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const rawKey = generateRawKey()
  const keyHash = await sha256Hex(rawKey)

  const { error } = await supabase
    .from('api_keys')
    .insert({ user_id: user.id, name, key_hash: keyHash })
  if (error) throw error

  return rawKey
}

// Soft-revoke rather than hard-delete, so races logged with this key keep
// resolving back to it (see races.api_key_id / races.source).
export async function deleteApiKey(id) {
  const { error } = await supabase
    .from('api_keys')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}
