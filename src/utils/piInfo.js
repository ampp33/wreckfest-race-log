const PI_CLASSES = [
  { cls: 'A', color: '#C41E1E', min: 235 },
  { cls: 'B', color: '#f97316', min: 165 },
  { cls: 'C', color: '#22c55e', min: 100 },
  { cls: 'D', color: '#2563eb', min: 0 }
]

export function piInfo(value) {
  const n = parseInt(value, 10)
  const entry = isNaN(n) ? null : PI_CLASSES.find(p => n >= p.min)
  return entry ?? PI_CLASSES[3]
}

// Color for a class letter on its own (e.g. the "A" in a roster entry's
// "A 450" class string), independent of the numeric PI thresholds above.
export function classLetterColor(letter) {
  const entry = PI_CLASSES.find(p => p.cls === String(letter).trim().toUpperCase())
  return entry ? entry.color : PI_CLASSES[3].color
}

// Slowest to fastest, the way the game orders them.
export const CLASS_LETTERS = ['D', 'C', 'B', 'A']

// The PI span a class covers, e.g. "PI 100–164", or "PI 235+" for the top one.
export function classRangeLabel(letter) {
  const i = PI_CLASSES.findIndex(p => p.cls === letter)
  if (i === -1) return ''
  if (i === 0) return `PI ${PI_CLASSES[0].min}+`
  return `PI ${PI_CLASSES[i].min}–${PI_CLASSES[i - 1].min - 1}`
}
