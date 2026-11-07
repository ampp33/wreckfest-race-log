<template>
  <button
    type="button"
    class="group inline-flex items-center gap-1 hover:text-brand-text dark:hover:text-brand-text-dark"
    :title="title"
    :aria-label="title"
    @click="$emit('toggle', sortKey)"
  >
    {{ label }}
    <SortCaret :direction="sort.key === sortKey ? sort.direction : null" />
  </button>
</template>

<script>
import SortCaret from './SortCaret.vue'
import { sortTitle } from '../utils/raceTable.js'

// A race table's sortable column label; the caret shows the direction.
// (No template comment: it would make the root a fragment and stop the
// caller's alignment classes falling through to the button.)
export default {
  name: 'SortHeader',
  components: { SortCaret },
  props: {
    label: { type: String, required: true },
    sortKey: { type: String, required: true },
    // The raceTable mixin's { key, direction }.
    sort: { type: Object, required: true }
  },
  emits: ['toggle'],
  computed: {
    title() {
      return sortTitle(this.sort, this.sortKey, this.label)
    }
  }
}
</script>
