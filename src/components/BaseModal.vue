<template>
  <div
    v-if="open"
    class="fixed inset-0 z-40 flex items-start sm:items-center justify-center bg-black/70 backdrop-blur-sm p-2 sm:p-4 overflow-hidden"
    @mousedown.self="$emit('close')"
  >
    <div
      class="bg-brand-bg dark:bg-brand-surface-dark rounded-lg shadow-xl w-full max-w-lg p-4 sm:p-6 max-h-[92svh] sm:max-h-[95vh] overflow-y-auto overscroll-contain border border-brand-border dark:border-brand-border-dark"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="titleId"
    >
      <div class="flex items-center justify-between mb-4">
        <h2 :id="titleId" class="font-display font-black tracking-tighter leading-none text-display-sm text-brand-text dark:text-brand-text-dark">
          <slot name="title" />
        </h2>
        <button
          type="button"
          class="text-brand-muted dark:text-brand-muted-dark hover:text-brand-text dark:hover:text-brand-text-dark"
          aria-label="Close"
          @click="$emit('close')"
        >
          ✕
        </button>
      </div>

      <slot />
    </div>
  </div>
</template>

<script>
// Shared chrome for the site's "form modal" popups (quick add, feedback,
// track search): backdrop, panel, title + close button, body-scroll lock,
// and Escape-to-close — all previously copy-pasted identically into each
// one. Owns the lifecycle-bound bits (scroll lock, the document-level
// Escape listener) so it works reliably even when focus isn't inside the
// panel, not just while an input has it.
let idSeq = 0

export default {
  name: 'BaseModal',
  props: {
    open: { type: Boolean, default: false }
  },
  emits: ['close'],
  data() {
    idSeq += 1
    return { instanceId: idSeq }
  },
  computed: {
    titleId() {
      return `base-modal-title-${this.instanceId}`
    }
  },
  watch: {
    open(isOpen) {
      if (isOpen) {
        document.body.style.overflow = 'hidden'
        document.addEventListener('keydown', this.onKeydown)
      } else {
        document.body.style.overflow = ''
        document.removeEventListener('keydown', this.onKeydown)
      }
    }
  },
  beforeUnmount() {
    document.body.style.overflow = ''
    document.removeEventListener('keydown', this.onKeydown)
  },
  methods: {
    onKeydown(event) {
      if (event.key === 'Escape') {
        event.stopPropagation()
        this.$emit('close')
      }
    }
  }
}
</script>
