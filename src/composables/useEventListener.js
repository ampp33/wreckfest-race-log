import { onMounted, onBeforeUnmount } from 'vue'

// Adds `event` to `target` (e.g. `window` or `document`) on mount and
// removes it on unmount — the add/remove pair that used to be hand-rolled
// in every component that needed a document/window-level listener.
export function useEventListener(target, event, handler, options) {
  onMounted(() => target.addEventListener(event, handler, options))
  onBeforeUnmount(() => target.removeEventListener(event, handler, options))
}
