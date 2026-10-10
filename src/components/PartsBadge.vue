<template>
  <span v-if="!hasParts(parts)" class="text-brand-muted dark:text-brand-muted-dark">—</span>
  <span v-else class="inline-flex align-middle">
    <!-- Shorthand: one square per engine part on the top row (colored by
         tier), one per armor slot below (red, darker the heavier it is). Hover
         previews the full list on a mouse; a click/tap pins it open. -->
    <button
      ref="triggerEl"
      type="button"
      class="parts-palette inline-grid gap-[2px] p-0.5 -m-0.5 rounded-sm hover:bg-brand-surface dark:hover:bg-brand-surface-dark"
      :aria-label="`Parts: ${summary}`"
      aria-haspopup="dialog"
      :aria-expanded="open"
      @click="togglePinned"
      @mouseenter="onHoverStart"
      @mouseleave="onHoverEnd"
    >
      <span class="flex gap-[2px]">
        <i v-for="p in performance" :key="p.key" class="sq" :class="tierClass(p.tier)"></i>
      </span>
      <span class="flex gap-[2px]">
        <i v-for="a in armor" :key="a.key" class="sq" :class="armorClass(a)" :style="armorStyle(a)"></i>
      </span>
    </button>

    <Teleport to="body">
      <div
        v-if="open"
        ref="panelEl"
        role="dialog"
        aria-label="Parts"
        class="parts-palette fixed z-30 w-80 max-w-[calc(100vw-32px)] max-h-[calc(100vh-16px)] overflow-y-auto p-3.5 grid gap-2.5 text-sm text-left bg-brand-bg dark:bg-brand-bg-dark text-brand-text dark:text-brand-text-dark border border-brand-border dark:border-brand-border-dark shadow-lg"
        :style="panelStyle"
        @mouseenter="onHoverStart"
        @mouseleave="onHoverEnd"
      >
        <div class="font-body font-bold text-base leading-none">Parts</div>

        <div class="ov text-brand-muted dark:text-brand-muted-dark border-b border-brand-border dark:border-brand-border-dark pb-1">Performance</div>
        <div class="grid grid-cols-[1fr_auto] gap-x-3 gap-y-1 items-center">
          <template v-for="p in performance" :key="p.key">
            <span>{{ p.label }}</span>
            <span v-if="p.tier" class="pill" :class="tierClass(p.tier)">{{ p.tierLabel }}</span>
            <span v-else class="text-brand-muted dark:text-brand-muted-dark">—</span>
          </template>
        </div>

        <div class="ov text-brand-muted dark:text-brand-muted-dark border-b border-brand-border dark:border-brand-border-dark pb-1">Armor</div>
        <div class="grid grid-cols-[1fr_auto_auto_auto] gap-x-2 gap-y-1 items-center">
          <template v-for="a in armor" :key="a.key">
            <span class="pr-1">{{ a.label }}</span>
            <span class="text-right text-brand-secondary dark:text-brand-secondary-dark">{{ a.name }}</span>
            <span class="text-right tabular text-brand-muted dark:text-brand-muted-dark">{{ a.weightKg != null ? `${a.weightKg} kg` : '—' }}</span>
            <i class="sq" :class="armorClass(a)" :style="armorStyle(a)"></i>
          </template>
        </div>
      </div>
    </Teleport>
  </span>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import { useEventListener } from '../composables/useEventListener.js'
import { hasParts, performanceParts, armorParts } from '../utils/partsInfo.js'

const props = defineProps({
  // A race's or roster entry's `parts` object (see docs/external-api.md);
  // null/absent for races logged before parts existed.
  parts: { type: Object, default: null }
})

const performance = computed(() => performanceParts(props.parts))
const armor = computed(() => armorParts(props.parts))
const summary = computed(() => {
  const engine = performance.value[0]
  const fitted = armor.value.filter(a => a.weightKg > 0)
  const kg = fitted.reduce((sum, a) => sum + a.weightKg, 0)
  return `${engine.tierLabel} engine, ${fitted.length} of ${armor.value.length} armor parts fitted (${kg} kg)`
})

function tierClass(tier) {
  return tier ? `t-${tier}` : 'sq-empty'
}
function armorClass(a) {
  return a.fill == null ? 'sq-empty' : ''
}
// Light red at 0 kg through dark red at MAX_ARMOR_WEIGHT_KG, mixed in CSS
// so the two ends follow the light/dark palette below.
function armorStyle(a) {
  if (a.fill == null) return null
  return { background: `color-mix(in oklab, var(--a-light), var(--a-heavy) ${Math.round(a.fill * 100)}%)` }
}

const open = ref(false)
// Opened by a click/tap rather than a hover: stays open until clicked
// again, clicked outside, or Escape.
const pinned = ref(false)
const triggerEl = ref(null)
const panelEl = ref(null)
const panelStyle = ref({})
let hoverCloseTimer = null

const canHover = typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches

function position() {
  if (!triggerEl.value || !panelEl.value) return
  const rect = triggerEl.value.getBoundingClientRect()
  const w = panelEl.value.offsetWidth
  const h = panelEl.value.offsetHeight
  const left = Math.max(16, Math.min(rect.left, window.innerWidth - w - 16))
  // Below the squares, or above them when there isn't room below — and when
  // neither fits, pulled up just far enough to stay on screen.
  const below = rect.bottom + 6
  const above = rect.top - h - 6
  let top = below
  if (below + h > window.innerHeight - 8) {
    top = above > 8 ? above : Math.max(8, window.innerHeight - h - 8)
  }
  panelStyle.value = { top: `${top}px`, left: `${left}px` }
}

function show() {
  open.value = true
  nextTick(position)
}
function close() {
  open.value = false
  pinned.value = false
}

function togglePinned() {
  clearTimeout(hoverCloseTimer)
  if (pinned.value) {
    close()
  } else {
    pinned.value = true
    show()
  }
}

// A short grace period on leave, so the pointer can cross the gap from the
// squares into the popup without it closing.
function onHoverStart() {
  if (!canHover) return
  clearTimeout(hoverCloseTimer)
  if (!open.value) show()
}
function onHoverEnd() {
  if (!canHover || pinned.value) return
  hoverCloseTimer = setTimeout(() => { open.value = false }, 120)
}

function onDocPointerDown(e) {
  if (!open.value) return
  if (triggerEl.value?.contains(e.target) || panelEl.value?.contains(e.target)) return
  close()
}
function onKeydown(e) {
  if (open.value && e.key === 'Escape') close()
}
function onReposition() {
  if (open.value) position()
}

useEventListener(document, 'pointerdown', onDocPointerDown)
useEventListener(document, 'keydown', onKeydown)
useEventListener(window, 'scroll', onReposition, true)
useEventListener(window, 'resize', onReposition)
</script>

<style>
/* Tier colors (stock gray, street green, sport orange, race red, anything
 * else purple) and the two ends of the armor ramp (light red for the
 * lightest part → dark red at 150 kg). Unscoped, and set on both the trigger and the teleported popup
 * since the popup isn't inside the trigger in the DOM — a scoped
 * `:global(.dark) .x` compiles down to a bare `.dark`, so the dark
 * overrides can't live in the scoped block below. */
.parts-palette {
  --t-stock: #A3A39F;
  --t-street: #2E9E4F;
  --t-sport: #E8821E;
  --t-race: #D42A2A;
  --t-other: #8B4FD8;
  --a-light: #F3B4B0;
  --a-heavy: #8E1B1B;
  --sq-border: theme('colors.brand.border.DEFAULT');
}
.dark .parts-palette {
  --t-stock: #5E5E5A;
  --t-street: #34B85B;
  --t-sport: #F08D2A;
  --t-race: #E5332F;
  --t-other: #A06BEA;
  /* Heavier still reads as "more red" on a dark ground. */
  --a-light: #6B2A27;
  --a-heavy: #F0574F;
  --sq-border: theme('colors.brand.border.dark');
}
</style>

<style scoped>
.sq {
  display: block;
  width: 8px;
  height: 8px;
}
.sq-empty {
  box-shadow: inset 0 0 0 1px var(--sq-border);
}
.t-stock { background: var(--t-stock); }
.t-street { background: var(--t-street); }
.t-sport { background: var(--t-sport); }
.t-race { background: var(--t-race); }
.t-other { background: var(--t-other); }

.pill {
  display: inline-block;
  padding: 3px 6px 2px;
  border-radius: 2px;
  font-size: 10px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #fff;
}
.pill.t-stock {
  color: inherit;
}
</style>
