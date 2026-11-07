<template>
  <span v-if="!inline" class="relative inline-flex items-center">
    <button
      ref="triggerEl"
      type="button"
      :class="[iconSize, 'inline-flex items-center justify-center shrink-0', highlightWhenActive && isActive
        ? 'text-brand-accent dark:text-brand-accent-dark'
        : 'text-brand-muted dark:text-brand-muted-dark hover:text-brand-accent dark:hover:text-brand-accent-dark']"
      :title="buttonTitle"
      :aria-label="buttonTitle"
      aria-haspopup="true"
      :aria-expanded="open"
      @click="toggleOpen"
    >
      <span class="w-full h-full inline-block" v-html="icon"></span>
    </button>

    <Teleport to="body">
      <div
        v-if="open"
        ref="panelEl"
        class="fixed z-30 w-56 h-80 min-w-[10rem] min-h-[6rem] max-w-[90vw] max-h-[80vh] resize overflow-hidden bg-brand-bg dark:bg-brand-bg-dark border border-brand-border dark:border-brand-border-dark shadow-lg"
        :style="panelStyle"
      >
        <ColumnFilterPanel
          ref="panelContent"
          class="h-full"
          :heading="panelHeading"
          :model-value="modelValue"
          :options="options"
          :searchable="searchable"
          @update:model-value="$emit('update:modelValue', $event)"
        >
          <template #option="slotProps"><slot name="option" v-bind="slotProps" /></template>
        </ColumnFilterPanel>
      </div>
    </Teleport>
  </span>

  <!-- Inline mode drops the trigger button and popup chrome entirely and
       renders the same filter content directly in the page flow, for a
       mobile filter drawer where there's no room for a popup anyway. -->
  <ColumnFilterPanel
    v-else
    :heading="panelHeading"
    :model-value="modelValue"
    :options="options"
    :searchable="searchable"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <template #option="slotProps"><slot name="option" v-bind="slotProps" /></template>
  </ColumnFilterPanel>
</template>

<script>
import ColumnFilterPanel from './ColumnFilterPanel.vue'
import filterIcon from '../assets/icons/filter.svg?raw'

const PANEL_WIDTH = 224

export default {
  name: 'ColumnFilterMenu',
  components: { ColumnFilterPanel },
  props: {
    label: { type: String, required: true },
    // Excluded values (not selected ones) — [] means no filter. With
    // exclusions, unchecking every box is an ordinary state (zero rows), and
    // a value that appears later is shown, since it starts out not excluded.
    modelValue: { type: Array, default: () => [] },
    options: { type: Array, required: true }, // [{ value, label, count? }]
    // A different glyph than the funnel, e.g. for the column picker.
    icon: { type: String, default: () => filterIcon },
    // The panel's heading; "Filter: <label>" by default.
    heading: { type: String, default: '' },
    // Off for short lists, like the column picker.
    searchable: { type: Boolean, default: true },
    // Tailwind width/height classes for the trigger button and its icon.
    iconSize: { type: String, default: 'w-3.5 h-3.5' },
    // The trigger's tooltip/aria-label; "Filter by <label>" by default.
    title: { type: String, default: '' },
    // An active value filter turns accent-coloured ("results narrowed"); the
    // column picker is just layout, so it opts out.
    highlightWhenActive: { type: Boolean, default: true },
    // Renders the panel in the page flow instead of behind a trigger + popup,
    // for the mobile filter drawer.
    inline: { type: Boolean, default: false }
  },
  emits: ['update:modelValue'],
  data() {
    return { open: false, panelStyle: {} }
  },
  computed: {
    panelHeading() {
      return this.heading || `Filter: ${this.label}`
    },
    buttonTitle() {
      return this.title || `Filter by ${this.label}`
    },
    isActive() {
      return this.modelValue.length > 0
    }
  },
  mounted() {
    document.addEventListener('mousedown', this.onDocPointerDown)
    document.addEventListener('keydown', this.onKeydown)
    // Scroll and resize re-anchor the panel rather than close it: a scroll
    // event also fires for the panel's own list, or when a filter shortens
    // the table and the browser clamps the page — the trigger hasn't moved.
    window.addEventListener('scroll', this.onReposition, true)
    window.addEventListener('resize', this.onReposition)
  },
  beforeUnmount() {
    document.removeEventListener('mousedown', this.onDocPointerDown)
    document.removeEventListener('keydown', this.onKeydown)
    window.removeEventListener('scroll', this.onReposition, true)
    window.removeEventListener('resize', this.onReposition)
  },
  methods: {
    position() {
      const rect = this.$refs.triggerEl.getBoundingClientRect()
      this.panelStyle = {
        top: `${rect.bottom + 4}px`,
        left: `${Math.max(8, Math.min(rect.left, window.innerWidth - PANEL_WIDTH - 8))}px`
      }
    },
    toggleOpen() {
      this.open = !this.open
      if (this.open) {
        this.$nextTick(() => {
          this.position()
          this.$refs.panelContent?.focusSearch()
        })
      }
    },
    onDocPointerDown(event) {
      if (!this.open || this.$refs.triggerEl?.contains(event.target) || this.$refs.panelEl?.contains(event.target)) return
      this.open = false
    },
    onKeydown(event) {
      if (event.key === 'Escape') this.open = false
    },
    onReposition() {
      if (this.open) this.position()
    }
  }
}
</script>
