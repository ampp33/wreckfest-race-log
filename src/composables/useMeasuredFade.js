import { ref, onMounted } from 'vue'
import { useEventListener } from './useEventListener.js'

// Clips a scrolling container just past a target row/item's real rendered
// bottom edge and reports how tall the clip (and, with a bufferRatio, a
// trailing fade) should be — measured from the actual DOM, not a guessed
// pixel height, so it holds regardless of font metrics or an expanded panel
// shifting things taller.
//
// getContainerEl - () => HTMLElement | null — the element whose top edge
//                  the clip height is measured from (getter, not a plain
//                  ref, since it may need to reach into a child component's
//                  DOM via querySelector rather than a local template ref)
// getTargetEl    - () => HTMLElement | null — the element to clip just past;
//                  returning null (e.g. "no cutoff configured") skips measuring
// bufferRatio    - extra room past the target's own height to reveal, as a
//                  fraction of that height, so the fade has room to resolve
//                  instead of landing right on the hard clip edge
export function useMeasuredFade(getContainerEl, getTargetEl, { bufferRatio = 0 } = {}) {
  const fadeHeight = ref(null)
  const gradientHeight = ref(null)

  function measure() {
    const container = getContainerEl()
    const target = getTargetEl()
    if (!container || !target) return
    const containerTop = container.getBoundingClientRect().top
    const rect = target.getBoundingClientRect()
    const buffer = Math.round(rect.height * bufferRatio)
    fadeHeight.value = Math.ceil(rect.bottom - containerTop + buffer)
    gradientHeight.value = Math.ceil(rect.height + buffer)
  }

  onMounted(measure)
  useEventListener(window, 'resize', measure)

  return { fadeHeight, gradientHeight, measure }
}
