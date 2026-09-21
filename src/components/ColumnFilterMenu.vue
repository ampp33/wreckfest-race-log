<template>
  <span class="relative inline-flex items-center">
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
        class="fixed z-30 w-56 h-80 min-w-[10rem] min-h-[6rem] max-w-[90vw] max-h-[80vh] resize overflow-hidden flex flex-col bg-brand-bg dark:bg-brand-bg-dark border border-brand-border dark:border-brand-border-dark shadow-lg"
        :style="panelStyle"
      >
        <div class="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-brand-muted dark:text-brand-muted-dark border-b border-brand-border dark:border-brand-border-dark shrink-0">
          {{ panelHeading }}
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
        <div class="flex-1 min-h-0 overflow-y-auto py-1">
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
    </Teleport>
  </span>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import { useEventListener } from '../composables/useEventListener.js'
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
  highlightWhenActive: { type: Boolean, default: true }
})

const panelHeading = computed(() => props.heading || `Filter: ${props.label}`)
const buttonTitle = computed(() => props.title || `Filter by ${props.label}`)
const emit = defineEmits(['update:modelValue'])

const open = ref(false)
const triggerEl = ref(null)
const panelEl = ref(null)
const panelStyle = ref({})
const searchInput = ref(null)
const searchText = ref('')

const isActive = computed(() => props.modelValue.length > 0)

const visibleOptions = computed(() => {
  const q = searchText.value.trim().toLowerCase()
  if (!q) return props.options
  return props.options.filter(o => String(o.label).toLowerCase().includes(q))
})

function isChecked(value) {
  return !props.modelValue.includes(value)
}

function toggleOption(value) {
  const next = props.modelValue.includes(value)
    ? props.modelValue.filter(v => v !== value)
    : [...props.modelValue, value]
  emit('update:modelValue', next)
}

function clearFilter() {
  emit('update:modelValue', [])
}

// Clicking a value's name isolates the filter to just that value; clicking
// the name again when it's already the only one shown reverts to no filter.
function isolateOption(value) {
  const others = props.options.map(o => o.value).filter(v => v !== value)
  const alreadyIsolated = isChecked(value) && others.every(v => props.modelValue.includes(v))
  emit('update:modelValue', alreadyIsolated ? [] : others)
}

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
      searchInput.value?.focus()
    })
  }
}

function close() {
  open.value = false
  searchText.value = ''
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
