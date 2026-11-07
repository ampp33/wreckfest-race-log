<template>
  <div class="flex flex-col">
    <div class="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-brand-muted dark:text-brand-muted-dark border-b border-brand-border dark:border-brand-border-dark shrink-0">
      {{ heading }}
    </div>
    <div v-if="searchable" class="px-2 py-2 border-b border-brand-border dark:border-brand-border-dark shrink-0">
      <input
        ref="searchInput"
        v-model="searchText"
        type="text"
        placeholder="Search…"
        class="w-full text-sm px-2 py-1 border border-brand-border dark:border-brand-border-dark bg-brand-bg dark:bg-brand-bg-dark text-brand-text dark:text-brand-text-dark focus:outline-none focus:ring-1 focus:ring-brand-accent"
      />
    </div>
    <div class="flex-1 min-h-0 max-h-56 overflow-y-auto py-1">
      <p v-if="!visibleOptions.length" class="px-3 py-1.5 text-sm text-brand-muted dark:text-brand-muted-dark">No matches</p>
      <div
        v-for="option in visibleOptions"
        :key="String(option.value)"
        class="flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-brand-surface dark:hover:bg-brand-surface-dark"
      >
        <input
          type="checkbox"
          class="accent-brand-accent dark:accent-brand-accent-dark w-4 h-4 shrink-0 cursor-pointer"
          :checked="isChecked(option.value)"
          @change="toggleOption(option.value)"
        />
        <button
          type="button"
          class="flex-1 min-w-0 flex items-center gap-2 text-left cursor-pointer"
          :title="`Show only this`"
          @click="isolateOption(option.value)"
        >
          <span class="flex-1 min-w-0 truncate text-brand-text dark:text-brand-text-dark">
            <slot name="option" :option="option">{{ option.label }}</slot>
          </span>
          <span v-if="option.count != null" class="text-xs tabular text-brand-muted dark:text-brand-muted-dark shrink-0">{{ option.count }}</span>
        </button>
      </div>
    </div>
    <div class="border-t border-brand-border dark:border-brand-border-dark px-3 py-2 shrink-0">
      <button
        type="button"
        class="text-xs font-semibold text-brand-accent dark:text-brand-accent-dark hover:underline disabled:opacity-40 disabled:no-underline disabled:cursor-default"
        :disabled="!isActive"
        @click="clearFilter"
      >Clear filter</button>
    </div>
  </div>
</template>

<script>
// The filter UI itself — search box, checkbox list, clear button — shared by
// ColumnFilterMenu's popup (desktop table headers) and its inline form (the
// mobile filter drawer).
export default {
  name: 'ColumnFilterPanel',
  props: {
    heading: { type: String, required: true },
    // Excluded values (not selected ones) — see ColumnFilterMenu.vue for why.
    modelValue: { type: Array, default: () => [] },
    options: { type: Array, required: true }, // [{ value, label, count? }]
    searchable: { type: Boolean, default: true }
  },
  emits: ['update:modelValue'],
  data() {
    return { searchText: '' }
  },
  computed: {
    isActive() {
      return this.modelValue.length > 0
    },
    visibleOptions() {
      const q = this.searchText.trim().toLowerCase()
      if (!q) return this.options
      return this.options.filter(o => String(o.label).toLowerCase().includes(q))
    }
  },
  methods: {
    isChecked(value) {
      return !this.modelValue.includes(value)
    },
    toggleOption(value) {
      this.$emit('update:modelValue', this.modelValue.includes(value)
        ? this.modelValue.filter(v => v !== value)
        : [...this.modelValue, value])
    },
    clearFilter() {
      this.$emit('update:modelValue', [])
    },
    // Clicking a value's name shows only that value; clicking it again while
    // it's the only one shown reverts to no filter.
    isolateOption(value) {
      const others = this.options.map(o => o.value).filter(v => v !== value)
      const alreadyIsolated = this.isChecked(value) && others.every(v => this.modelValue.includes(v))
      this.$emit('update:modelValue', alreadyIsolated ? [] : others)
    },
    // Called by ColumnFilterMenu when its popup opens.
    focusSearch() {
      this.$refs.searchInput?.focus()
    }
  }
}
</script>
