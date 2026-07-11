import { reactive } from 'vue'

// Centralised flag so any component (router views, NavBar, floating button,
// global keyboard shortcut) can open the QuickAdd modal without prop chains.
export const quickAddStore = reactive({
  open: false,
  prefillVariationId: null,
  // Set by TrackDetailPage while it's active so openQuickAdd() auto-prefills it.
  currentPageVariationId: null,
  // Set when opened from OcrImportModal — merged into RaceForm's defaults.
  ocrDefaults: null
})

// Non-reactive callback — set by TrackDetailPage to receive race-saved notifications.
let _onRaceSaved = null

export function openQuickAdd(prefillVariationId = null, ocrDefaults = null) {
  // uncomment the end of this line if you want quick add on a race
  // page to autofill the track
  quickAddStore.prefillVariationId = prefillVariationId// ?? quickAddStore.currentPageVariationId
  quickAddStore.ocrDefaults = ocrDefaults
  quickAddStore.open = true
}

export function closeQuickAdd() {
  quickAddStore.open = false
  quickAddStore.prefillVariationId = null
  quickAddStore.ocrDefaults = null
}

export function setOnRaceSaved(cb) {
  _onRaceSaved = cb
}

export function clearOnRaceSaved() {
  _onRaceSaved = null
}

export function notifyRaceSaved(variationId) {
  _onRaceSaved?.(variationId)
}
