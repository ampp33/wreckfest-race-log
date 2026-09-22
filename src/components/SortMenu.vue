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
        :title="sort.titleFor(col.key, col.label)"
        @click="sort.toggle(col.key)"
      >
        <span
          class="flex-1 min-w-0 truncate"
          :class="sort.directionFor(col.key) ? 'text-brand-accent dark:text-brand-accent-dark font-semibold' : 'text-brand-text dark:text-brand-text-dark'"
        >{{ col.label }}</span>
        <SortCaret :direction="sort.directionFor(col.key)" />
      </button>
    </div>
    <div class="border-t border-brand-border dark:border-brand-border-dark px-3 py-2 shrink-0">
      <button
        type="button"
        class="text-xs font-semibold text-brand-accent dark:text-brand-accent-dark hover:underline disabled:opacity-40 disabled:no-underline disabled:cursor-default"
        :disabled="!sort.state.key"
        @click="sort.clear()"
      >Clear sort</button>
    </div>
  </div>
</template>

<script>
import SortCaret from './SortCaret.vue'

// The mobile-drawer counterpart to the desktop table's per-header sort
// carets (RacesPage.vue / TrackDetailPage.vue) — there's no header row once
// the table becomes cards, so this reproduces the same click-to-cycle
// sorting as a plain list instead.
export default {
  name: 'SortMenu',
  components: { SortCaret },
  props: {
    columns: { type: Array, required: true }, // [{ key, label }] — sortable columns only
    sort: { type: Object, required: true } // createSortState() return value
  }
}
</script>
