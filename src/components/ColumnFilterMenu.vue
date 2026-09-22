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

<script setup>
import { ref, computed, nextTick } from 'vue'
import { useEventListener } from '../composables/useEventListener.js'
import ColumnFilterPanel from './ColumnFilterPanel.vue'
import filterIcon from '../assets/icons/filter.svg?raw'

const props = defineProps({
  label: { type: String, required: true },
  // Excluded values (not selected ones) — [] means nothing is excluded, i.e.
  // no filter, everything shown/checked. Storing exclusions rather than a
  // "selected" set means unchecking every box is just "everything excluded",
  // a perfectly ordinary state (the table correctly shows zero rows) with no
  // special-casing, and a value that appears later is automatically shown
  // since it starts out not excluded.
  modelValue: { type: Array, default: () => [] },
  options: { type: Array, required: true }, // [{ value, label, count? }]
  // Lets non-value-filter reuses (e.g. a column-visibility picker) swap in a
  // different glyph than the default funnel.
  icon: { type: String, default: () => filterIcon },
  // Overrides the panel's heading text; defaults to "Filter: <label>".
  heading: { type: String, default: '' },
  // Hides the search box for short lists (e.g. a column-visibility picker)
  // where it's unnecessary.
  searchable: { type: Boolean, default: true },
  // Tailwind width/height classes for the trigger button and its icon.
  iconSize: { type: String, default: 'w-3.5 h-3.5' },
  // Overrides the trigger button's tooltip/aria-label text; defaults to "Filter by <label>".
  title: { type: String, default: '' },
  // A value-filter turning accent-colored when active is a "results are
  // narrowed" signal; a column-visibility picker is just a layout
  // preference, so it can opt out and stay the same neutral color as
  // every other icon regardless of how many columns are hidden.
  highlightWhenActive: { type: Boolean, default: true },
  // Renders the filter directly in the page flow instead of behind a
  // trigger button + popup — for a mobile filter drawer.
  inline: { type: Boolean, default: false }
})

const panelHeading = computed(() => props.heading || `Filter: ${props.label}`)
const buttonTitle = computed(() => props.title || `Filter by ${props.label}`)
const emit = defineEmits(['update:modelValue'])

const open = ref(false)
const triggerEl = ref(null)
const panelEl = ref(null)
const panelContent = ref(null)
const panelStyle = ref({})

const isActive = computed(() => props.modelValue.length > 0)

function position() {
  const rect = triggerEl.value.getBoundingClientRect()
  const panelWidth = 224
  panelStyle.value = {
    top: `${rect.bottom + 4}px`,
    left: `${Math.max(8, Math.min(rect.left, window.innerWidth - panelWidth - 8))}px`
  }
}

function toggleOpen() {
  if (open.value) {
    close()
  } else {
    open.value = true
    nextTick(() => {
      position()
      panelContent.value?.focusSearch()
    })
  }
}

function close() {
  open.value = false
}

function onDocPointerDown(e) {
  if (!open.value) return
  if (triggerEl.value?.contains(e.target)) return
  if (panelEl.value?.contains(e.target)) return
  close()
}

function onKeydown(e) {
  if (open.value && e.key === 'Escape') close()
}

// Re-anchor to the trigger button rather than closing on scroll/resize.
// Closing used to seem simpler, but any scroll event closed the panel —
// including ones scrolling the panel's own option list, and even an
// incidental page-scroll clamp caused by the table shrinking when a filter
// is applied (removing rows can leave less to scroll, so the browser
// snaps the scroll position back, firing a real `scroll` event). Since the
// trigger hasn't actually moved in either of those cases, recomputing the
// position is a harmless no-op there and a correct re-anchor when the page
// genuinely scrolls or the window resizes.
function onReposition() {
  if (open.value) position()
}

useEventListener(document, 'mousedown', onDocPointerDown)
useEventListener(document, 'keydown', onKeydown)
useEventListener(window, 'scroll', onReposition, true)
useEventListener(window, 'resize', onReposition)
</script>
