<template>
  <div class="inline-flex items-center gap-1 shrink-0">
    <button
      v-if="showExpand"
      type="button"
      class="min-h-[44px] min-w-[44px] flex items-center justify-center text-brand-muted dark:text-brand-muted-dark hover:text-brand-accent dark:hover:text-brand-accent-dark"
      :title="expanded ? 'Collapse' : 'Expand'"
      @click.stop="$emit('toggle-expand')"
    >
      <span class="w-4 h-4 inline-block" v-html="expanded ? collapseIcon : expandIcon"></span>
    </button>
    <button
      type="button"
      class="min-h-[44px] min-w-[44px] flex items-center justify-center text-brand-muted dark:text-brand-muted-dark hover:text-brand-accent dark:hover:text-brand-accent-dark"
      title="Edit"
      @click.stop="$emit('edit')"
    >
      <span class="w-4 h-4 inline-block" v-html="editIcon"></span>
    </button>
    <button
      type="button"
      class="min-h-[44px] min-w-[44px] flex items-center justify-center text-brand-muted dark:text-brand-muted-dark hover:text-brand-accent dark:hover:text-brand-accent-dark"
      title="Delete"
      @click.stop="$emit('delete')"
    >
      <span class="w-4 h-4 inline-block" v-html="trashIcon"></span>
    </button>
  </div>
</template>

<script>
import editIcon from '../assets/icons/edit.svg?raw'
import trashIcon from '../assets/icons/trash.svg?raw'
import expandIcon from '../assets/icons/expand.svg?raw'
import collapseIcon from '../assets/icons/collapse.svg?raw'

export default {
  name: 'RaceRowActions',
  props: {
    showExpand: { type: Boolean, default: false },
    expanded: { type: Boolean, default: false }
  },
  emits: ['toggle-expand', 'edit', 'delete'],
  data() {
    return { editIcon, trashIcon, expandIcon, collapseIcon }
  }
}
</script>
