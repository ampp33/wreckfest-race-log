<template>
  <span
    class="inline-flex items-center justify-center w-4 h-4 shrink-0 transition-transform"
    :class="[
      direction ? 'text-brand-accent dark:text-brand-accent-dark' : 'text-brand-muted dark:text-brand-muted-dark opacity-70 group-hover:opacity-100',
      { 'rotate-180': direction === 'asc' }
    ]"
    v-html="direction ? caretFillIcon : caretIcon"
  ></span>
</template>

<script>
import caretIcon from '../assets/icons/caret-down.svg?raw'
import caretFillIcon from '../assets/icons/caret-down-fill.svg?raw'

// Purely presentational — the click handler and accessible label live on
// the `<button>` a caller wraps this in (their own header-cell button,
// alongside the column label). Rendering our own nested `<button>` here
// would put a button inside a button, which browsers silently un-nest.
export default {
  name: 'SortCaret',
  props: {
    direction: { type: String, default: null } // 'asc' | 'desc' | null
  },
  data() {
    return { caretIcon, caretFillIcon }
  }
}
</script>
