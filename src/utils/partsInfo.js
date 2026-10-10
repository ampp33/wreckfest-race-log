// Display helpers for a race's (or roster entry's) `parts` object — the
// engine/armor upgrades the companion plugin reports. See
// docs/external-api.md for the stored shape; every key in it is optional.

// The game's upgrade order, as the garage's Performance carousel lists it.
// The shorthand's squares and the popup's rows both follow this.
export const PERFORMANCE_PARTS = [
  { key: 'engine', label: 'Engine' },
  { key: 'air_filter', label: 'Air filter' },
  { key: 'cooling', label: 'Cooling' },
  { key: 'intake_manifold', label: 'Intake manifold' },
  { key: 'fuel_system', label: 'Fuel system' },
  { key: 'ignition', label: 'Ignition' },
  { key: 'exhaust', label: 'Exhaust' },
  { key: 'exhaust_manifold', label: 'Exhaust manifold' },
  { key: 'valves', label: 'Valves' },
  { key: 'camshaft', label: 'Camshaft' },
  { key: 'pistons', label: 'Pistons' }
]

// The game's order, as the garage's Armor carousel lists it.
export const ARMOR_PARTS = [
  { key: 'front_bumper', label: 'Front bumper' },
  { key: 'rear_bumper', label: 'Rear bumper' },
  { key: 'roll_cage', label: 'Roll cage' },
  { key: 'side_protector', label: 'Side protector' },
  { key: 'window_bars', label: 'Window bars' }
]

const TIER_LABELS = { stock: 'Stock', street: 'Street', sport: 'Sport', race: 'Race' }

// The plugin sends the game's raw preset names ("racing", not "race"), and
// the engine can be a raw part name that fits no tier (e.g. "bigrig").
// Anything unrecognised — tournament parts included — is 'other'.
function tierOf(raw) {
  const v = String(raw).toLowerCase()
  if (v === 'racing') return 'race'
  return v in TIER_LABELS ? v : 'other'
}

function titleCase(s) {
  return String(s).replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase())
}

// Heaviest a single armor part gets — the darkest end of the red ramp.
export const MAX_ARMOR_WEIGHT_KG = 150

export function hasParts(parts) {
  return !!parts && typeof parts === 'object' && !Array.isArray(parts) && Object.keys(parts).length > 0
}

// [{ key, label, tier: 'stock'|'street'|'sport'|'race'|'other'|null, tierLabel }]
// tier is null for a part the plugin didn't report.
export function performanceParts(parts) {
  const engineParts = parts?.engine_parts || {}
  return PERFORMANCE_PARTS.map(({ key, label }) => {
    const raw = key === 'engine' ? parts?.engine : engineParts[key]
    if (raw == null || raw === '') return { key, label, tier: null, tierLabel: '—' }
    const tier = tierOf(raw)
    return { key, label, tier, tierLabel: TIER_LABELS[tier] || titleCase(raw) }
  })
}

// [{ key, label, name, weightKg, fill }] — `fill` is the part's weight as a
// 0–1 share of MAX_ARMOR_WEIGHT_KG, for the red ramp; null when there's no
// armor in the slot (0 kg) or its weight wasn't reported. A slot the plugin
// didn't report at all has name '—' and weightKg null.
export function armorParts(parts) {
  const armor = parts?.armor || {}
  return ARMOR_PARTS.map(({ key, label }) => {
    const a = armor[key]
    if (!a) return { key, label, name: '—', weightKg: null, fill: null }
    const weightKg = typeof a.weight_kg === 'number' ? a.weight_kg : null
    const fill = weightKg > 0 ? weightKg / MAX_ARMOR_WEIGHT_KG : null
    return { key, label, name: a.name || (weightKg === 0 ? 'None' : '—'), weightKg, fill }
  })
}
