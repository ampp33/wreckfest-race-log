<template>
  <div
    v-if="visible"
    class="w-full bg-brand-surface dark:bg-brand-surface-dark border-b border-brand-border dark:border-brand-border-dark"
  >
    <div class="max-w-6xl mx-auto px-4 py-2 flex items-center justify-between gap-4 text-sm text-brand-text dark:text-brand-text-dark">
      <span>
        Looking for the <strong>Wreckfest 2</strong> version of this site?&nbsp;
        <a
          href="https://wf2racelog.com"
          target="_blank"
          rel="noopener noreferrer"
          class="underline text-brand-accent hover:opacity-75"
        >Click here to visit wf2racelog.com</a>
      </span>
      <button
        type="button"
        class="shrink-0 text-brand-muted dark:text-brand-muted-dark hover:text-brand-text dark:hover:text-brand-text-dark"
        aria-label="Dismiss"
        @click="dismiss"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script>
const STORAGE_KEY = 'wf2-banner-dismissed'

export default {
  name: 'WF2Banner',
  data() {
    return {
      visible: localStorage.getItem(STORAGE_KEY) !== 'true'
    }
  },
  methods: {
    dismiss() {
      localStorage.setItem(STORAGE_KEY, 'true')
      this.visible = false
    }
  }
}
</script>
