// Driving-assist settings are stored as a jsonb object
// {shifting, abs, traction_control, stability_control}, each a full word
// ("manual", "half", ...) matching the companion tool's API payload. The
// table columns show a compact comma-separated code instead, in the fixed
// order shifting/abs/traction_control/stability_control.

const SHIFTING_ABBR = { automatic: 'A', manual: 'M', manual_clutch: 'MC' }
const LEVEL_ABBR = { off: 'O', half: 'H', full: 'F' }  // shared by abs/traction_control/stability_control

const ASSIST_FIELDS = [
  ['shifting', SHIFTING_ABBR],
  ['abs', LEVEL_ABBR],
  ['traction_control', LEVEL_ABBR],
  ['stability_control', LEVEL_ABBR],
]

// "-" if assists is missing/empty, otherwise e.g. "M,O,H,O". A field whose
// value doesn't map to a known abbreviation renders as "?" rather than
// silently dropping a column position.
export function formatAssists(assists) {
  if (!assists || typeof assists !== 'object' || Object.keys(assists).length === 0) return '—'
  return ASSIST_FIELDS.map(([key, abbr]) => abbr[assists[key]] ?? '?').join(',')
}
