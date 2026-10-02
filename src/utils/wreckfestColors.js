// Wreckfest server names (and lobby chat) embed color codes: '^' followed
// by one character switches the color of the text after it. ^0 resets to
// the default; unrecognized codes are dropped without changing color.
// Hex values approximate what the game renders.
const COLORS = {
  '1': '#e53935', // red
  '2': '#43a047', // green
  '3': '#fb8c00', // orange
  '4': '#1e5bd8', // dark blue
  '5': '#4fc3f7', // light blue
  '6': '#9c4dcc', // purple
  '7': '#ffffff', // white
  '8': '#9e9e9e', // gray
  '9': '#000000', // black
  ':': '#fdd835', // yellow
}

// Splits a raw name into [{ text, color }] runs; color is null for the
// default color.
export function parseWreckfestColors(raw) {
  const segments = []
  let color = null
  let text = ''
  const flush = () => {
    if (text) segments.push({ text, color })
    text = ''
  }
  for (let i = 0; i < (raw || '').length; i++) {
    if (raw[i] === '^' && i + 1 < raw.length) {
      flush()
      const code = raw[++i]
      if (code === '0') color = null
      else if (code in COLORS) color = COLORS[code]
      continue
    }
    text += raw[i]
  }
  flush()
  return segments
}

// The name with every color code removed.
export function stripWreckfestColors(raw) {
  return parseWreckfestColors(raw).map(s => s.text).join('')
}
