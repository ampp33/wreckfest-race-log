import { supabase } from './supabase.js'
import { cachedCatalog } from '../utils/catalogCache.js'

const VEHICLES_SELECT = 'id, name, class'

// Same memoizing as getTracks().
let _vehicles = null

export function getVehicles() {
  _vehicles ??= cachedCatalog(`wf.vehicles:${VEHICLES_SELECT}`, async () => {
    const { data, error } = await supabase
      .from('vehicles')
      .select(VEHICLES_SELECT)
      .order('name', { ascending: true })
    if (error) throw error
    return data || []
  }).catch(err => { _vehicles = null; throw err })
  return _vehicles
}
