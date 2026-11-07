<template>
  <div class="flex flex-col">
    <div class="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-brand-muted dark:text-brand-muted-dark border-b border-brand-border dark:border-brand-border-dark shrink-0">
      Sort by
    </div>
    <div class="flex-1 min-h-0 max-h-56 overflow-y-auto py-1">
      <button
        v-for="col in columns"
        :key="col.key"
        type="button"
        class="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-left hover:bg-brand-surface dark:hover:bg-brand-surface-dark"
        :title="sortTitle(sort, col.key, col.label)"
        @click="$emit('toggle', col.key)"
      >
        <span
          class="flex-1 min-w-0 truncate"
          :class="direction(col.key) ? 'text-brand-accent dark:text-brand-accent-dark font-semibold' : 'text-brand-text dark:text-brand-text-dark'"
        >{{ col.label }}</span>
        <SortCaret :direction="direction(col.key)" />
      </button>
    </div>
    <div class="border-t border-brand-border dark:border-brand-border-dark px-3 py-2 shrink-0">
      <button
        type="button"
        class="text-xs font-semibold text-brand-accent dark:text-brand-accent-dark hover:underline disabled:opacity-40 disabled:no-underline disabled:cursor-default"
        :disabled="!sort.key"
        @click="$emit('clear')"
      >Clear sort</button>
    </div>
  </div>
</template>

<script>
import SortCaret from './SortCaret.vue'
import { sortTitle } from '../utils/raceTable.js'

// The mobile filter drawer's counterpart to the table's sortable headers —
// there's no header row once the table becomes cards.
export default {
  name: 'SortMenu',
  components: { SortCaret },
  props: {
    columns: { type: Array, required: true }, // [{ key, label }] — sortable columns only
    sort: { type: Object, required: true } // the raceTable mixin's { key, direction }
  },
  emits: ['toggle', 'clear'],
  methods: {
    sortTitle,
    direction(key) {
      return this.sort.key === key ? this.sort.direction : null
    }
  }
}
</script>
