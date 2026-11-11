import { createApiKey } from './apiKeyService.js'

const REPO = 'ampp33/wreckfest-telemetry-asi'
export const PLUGIN_RELEASES_URL = `https://github.com/${REPO}/releases/latest`

// The release zip's name carries the version, so there's no stable
// releases/latest/download/<name> link — ask the API which file is current.
// Falls back to the releases page if GitHub rate-limits or is down.
export async function downloadLatestPlugin() {
  let url = PLUGIN_RELEASES_URL
  let version = null
  try {
    const res = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`)
    if (res.ok) {
      const release = await res.json()
      const zip = release.assets?.find(a => /^wreckfest-telemetry.*\.zip$/.test(a.name))
      if (zip) {
        url = zip.browser_download_url
        version = release.tag_name
      }
    }
  } catch { /* fall through to the releases page */ }
  window.location.href = url
  return version
}

const ADJECTIVES = ['rusty', 'dented', 'loud', 'feral', 'smoky', 'scrappy', 'grumpy', 'wobbly', 'sideways', 'muddy', 'battered', 'turbo']
const NOUNS = ['banger', 'bumper', 'muffler', 'piston', 'gearbox', 'hubcap', 'wreck', 'derby', 'chassis', 'exhaust', 'fender', 'axle']

function pick(list) {
  return list[crypto.getRandomValues(new Uint32Array(1))[0] % list.length]
}

// One click: a new key with a throwaway name, saved straight to api-key.txt —
// the file the plugin reads from its scripts/ folder.
export async function downloadNewApiKey() {
  const name = `${pick(ADJECTIVES)}-${pick(NOUNS)}-${crypto.getRandomValues(new Uint16Array(1))[0] % 100}`
  const key = await createApiKey(name)
  const url = URL.createObjectURL(new Blob([key], { type: 'text/plain' }))
  const a = document.createElement('a')
  a.href = url
  a.download = 'api-key.txt'
  a.click()
  URL.revokeObjectURL(url)
  return name
}
