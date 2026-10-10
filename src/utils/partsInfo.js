// Display helpers for a race's (or roster entry's) `parts` object — the
// engine/armor upgrades the companion plugin reports. See
// docs/external-api.md for the stored shape; every key in it is optional.

// Engine first, then its sub-parts in the order air flows through the
// engine (filter → intake → fuel and spark → valvetrain → cooling →
// exhaust). The shorthand's squares and the popup's rows both follow this.
export const PERFORMANCE_PARTS = [
  { key: 'engine', label: 'Engine' },
  { key: 'air_filter', label: 'Air filter' },
  { key: 'intake_manifold', label: 'Intake manifold' },
  { key: 'fuel_system', label: 'Fuel system' },
  { key: 'ignition', label: 'Ignition' },
  { key: 'camshaft', label: 'Camshaft' },
  { key: 'valves', label: 'Valves' },
  { key: 'pistons', label: 'Pistons' },
  { key: 'cooling', label: 'Cooling' },
  { key: 'exhaust_manifold', label: 'Exhaust manifold' },
  { key: 'exhaust', label: 'Exhaust' }
]

// Front of the car to the back.
export const ARMOR_PARTS = [
  { key: 'front_bumper', label: 'Front bumper' },
  { key: 'side_protector', label: 'Side protector' },
  { key: 'window_bars', label: 'Window bars' },
  { key: 'roll_cage', label: 'Roll cage' },
  { key: 'rear_bumper', label: 'Rear bumper' }
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

// Armor weight class from the part file name's trailing number
// (`bumper_front0` = none, `dlc_side_protector03` = 3). Capped at 3, the
// darkest step of the shorthand's red ramp — real per-part weights aren't
// known yet, so this is the closest stand-in for "heavier".
function armorLevel(code) {
  const m = /(\d+)$/.exec(code || '')
  return m ? Math.min(3, Number(m[1])) : 0
}

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

// [{ key, label, level: 0-3 | null, name }] — level null when the slot
// wasn't reported. `name` is the game's display name, which the plugin
// sends as null when it can't resolve one, so fall back to the file name.
export function armorParts(parts) {
  const armor = parts?.armor || {}
  return ARMOR_PARTS.map(({ key, label }) => {
    const a = armor[key]
    if (!a) return { key, label, level: null, name: '—' }
    const level = armorLevel(a.code)
    return { key, label, level, name: a.name || (level === 0 ? 'None' : a.code || '—') }
  })
}
