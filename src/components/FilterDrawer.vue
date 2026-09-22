<template>
  <Teleport to="body">
    <!-- Only meaningful on mobile — desktop already has these filters in the
         table's column headers. -->
    <button
      type="button"
      class="sm:hidden fixed right-0 top-20 z-30 min-w-[44px] flex flex-col items-center gap-1.5 px-2.5 py-3 rounded-l-md bg-brand-accent dark:bg-brand-accent-dark text-white shadow-lg"
      aria-haspopup="true"
      :aria-expanded="open"
      aria-label="Open filters"
      @click="open = true"
    >
      <span class="w-4 h-4 inline-block shrink-0" v-html="filterIcon"></span>
      <span class="text-xs font-semibold uppercase tracking-wide [writing-mode:vertical-rl]">Filters</span>
    </button>

    <div
      v-if="open"
      class="sm:hidden fixed inset-0 z-40 flex justify-end bg-black/70 backdrop-blur-sm"
      @mousedown.self="close"
    >
      <div
        class="w-[85vw] max-w-xs h-full bg-brand-bg dark:bg-brand-bg-dark border-l border-brand-border dark:border-brand-border-dark flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-label="Filters"
      >
        <div class="flex items-center justify-between px-3 py-3 border-b border-brand-border dark:border-brand-border-dark shrink-0">
          <h2 class="font-display font-bold text-base text-brand-text dark:text-brand-text-dark">Filters</h2>
          <button
            type="button"
            class="min-h-[44px] min-w-[44px] flex items-center justify-center text-brand-muted dark:text-brand-muted-dark hover:text-brand-accent dark:hover:text-brand-accent-dark"
            aria-label="Close filters"
            @click="close"
          >
            <span class="w-5 h-5 inline-block" v-html="closeIcon"></span>
          </button>
        </div>
        <div class="flex-1 overflow-y-auto divide-y divide-brand-border dark:divide-brand-border-dark">
          <slot />
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref } from 'vue'
import { useEventListener } from '../composables/useEventListener.js'
import filterIcon from '../assets/icons/filter.svg?raw'
import closeIcon from '../assets/icons/close-filled.svg?raw'

const open = ref(false)

function close() {
  open.value = false
}

useEventListener(document, 'keydown', (e) => {
  if (open.value && e.key === 'Escape') close()
})
</script>
