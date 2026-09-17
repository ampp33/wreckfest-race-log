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
        <span class="w-4 h-4 inline-block" v-html="closeIcon"></span>
      </button>
    </div>
  </div>
</template>

<script>
import closeIcon from '../assets/icons/close-filled.svg?raw'

const STORAGE_KEY = 'wf2-banner-dismissed'

export default {
  name: 'WF2Banner',
  data() {
    return {
      visible: localStorage.getItem(STORAGE_KEY) !== 'true',
      closeIcon
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
