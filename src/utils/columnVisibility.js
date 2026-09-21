import { reactive, watch } from 'vue'

// Per-page column visibility for a desktop table, persisted to localStorage
// under a page-specific key (so hiding "Vehicle" on one table doesn't hide
// it on another). Uses `reactive`/`watch` rather than lifecycle hooks, so —
// like the app's other stores (prefsStore.js, quickAddStore.js) — it works
// from a plain Options API `data()`/`setup()` just as well as `<script setup>`.
export function createColumnVisibility(storageKey, columnKeys, defaultHidden = []) {
  const state = reactive({ hidden: loadHidden() })

  function loadHidden() {
    try {
      const raw = localStorage.getItem(storageKey)
      if (!raw) return defaultHidden.filter(k => columnKeys.includes(k))
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed.filter(k => columnKeys.includes(k)) : []
    } catch {
      return []
    }
  }

  watch(() => state.hidden, value => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(value))
    } catch {
      // Storage may be unavailable in private browsing — fail silently.
    }
  }, { deep: true })

  function isVisible(key) {
    return !state.hidden.includes(key)
  }

  return { state, isVisible }
}
