<template>
  <div
    ref="container"
    class="relative select-none overflow-hidden bg-brand-surface dark:bg-brand-surface-dark"
    :class="editMode ? 'cursor-crosshair' : ''"
    @click="onContainerClick"
  >
    <!-- The layout drawn as its own name, set round the racing line. Only
         layouts that enclose one region are traced; everything else falls
         back to the artwork below. -->
    <svg
      v-if="ringPath"
      ref="mapImg"
      :viewBox="`0 0 ${ringPath.w} ${ringPath.h}`"
      class="block w-full h-auto"
      role="img"
      :aria-label="`${alt} layout`"
    >
      <path
        :d="ringPath.d"
        fill="none"
        class="stroke-brand-border dark:stroke-brand-border-dark"
        stroke-width="30"
      />
      <path :id="pathId" ref="ringPathEl" :d="ringPath.d" fill="none" stroke="none" />
      <text
        ref="ringTextEl"
        font-family="Switzer, Helvetica, Arial, sans-serif"
        font-size="18"
        font-weight="800"
        letter-spacing="0.01em"
        class="fill-brand-text dark:fill-brand-text-dark"
      >
        <textPath :href="`#${pathId}`" startOffset="0">{{ ringText }}</textPath>
      </text>
    </svg>

    <img
      v-else
      ref="mapImg"
      :src="imageUrl"
      :alt="alt"
      class="w-full h-auto block pointer-events-none map-art"
      draggable="false"
    />

    <!-- Edit mode hint -->
    <div
      v-if="editMode"
      class="ov absolute top-2 left-2 bg-brand-accent text-white px-2 py-1.5 pointer-events-none"
    >
      Click map to add turn
    </div>

    <!-- Controls: pencil in view mode, discard+save in edit mode -->
    <div class="absolute top-2 right-2 flex gap-1 z-10">
      <template v-if="!editMode">
        <button
          type="button"
          class="min-h-[44px] min-w-[44px] flex items-center justify-center border border-brand-border dark:border-brand-border-dark bg-brand-bg dark:bg-brand-bg-dark text-brand-muted dark:text-brand-muted-dark hover:text-brand-accent dark:hover:text-brand-accent-dark transition-colors"
          title="Edit annotations"
          @click.stop="$emit('toggle-edit')"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
          </svg>
        </button>
      </template>
      <template v-else>
        <button
          type="button"
          class="min-h-[44px] min-w-[44px] flex items-center justify-center border border-brand-border dark:border-brand-border-dark bg-brand-bg dark:bg-brand-bg-dark text-brand-muted dark:text-brand-muted-dark hover:text-brand-accent transition-colors"
          title="Discard changes"
          @click.stop="$emit('discard')"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
        <button
          type="button"
          class="min-h-[44px] min-w-[44px] flex items-center justify-center bg-brand-accent text-white hover:opacity-85 transition-opacity"
          title="Save annotations"
          @click.stop="$emit('save')"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
          </svg>
        </button>
      </template>
    </div>

    <!-- Turn markers, positioned by normalized percentage coordinates -->
    <div
      v-for="ann in annotations"
      :key="ann.id"
      class="absolute -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white cursor-pointer tabular"
      :class="ann.id === selectedId
        ? 'bg-brand-text dark:bg-brand-text-dark text-brand-bg dark:text-brand-bg-dark scale-110'
        : 'bg-brand-accent dark:bg-brand-accent-dark hover:scale-105'"
      :style="{ left: ann.x + '%', top: ann.y + '%' }"
      @click.stop="$emit('select', ann.id)"
    >
      {{ ann.number }}
    </div>
  </div>
</template>

<script>
import { loadTrackPaths, getTrackPath } from '../utils/trackPath.js'

let uid = 0

export default {
  name: 'AnnotationMap',
  props: {
    imageUrl: { type: String, required: true },
    alt: { type: String, default: 'Track map' },
    annotations: { type: Array, default: () => [] },
    editMode: { type: Boolean, default: false },
    selectedId: { type: String, default: null },
    trackSlug: { type: String, default: '' },
    variationSlug: { type: String, default: '' },
    // What gets written round the line. Defaults to the variation's own name.
    ringLabel: { type: String, default: '' }
  },
  emits: ['toggle-edit', 'add-annotation', 'select', 'save', 'discard'],
  data() {
    return {
      ringPath: null,
      reps: 1,
      pathId: `ring-${++uid}`
    }
  },
  computed: {
    ringUnit() {
      const label = (this.ringLabel || this.alt || 'Track').toUpperCase()
      return `${label} · `
    },
    ringText() {
      return this.ringUnit.repeat(this.reps)
    }
  },
  watch: {
    // the detail page swaps variation without remounting
    variationSlug() { this.resolvePath() },
    ringUnit() { this.$nextTick(this.fitRing) }
  },
  async mounted() {
    await loadTrackPaths()
    this.resolvePath()
  },
  methods: {
    resolvePath() {
      this.ringPath = getTrackPath(this.trackSlug, this.variationSlug)
      this.reps = 1
      if (this.ringPath) this.$nextTick(this.fitRing)
    },
    // Repeat the name until it closes the loop without lapping over its own
    // start: measure one pass against the real path length rather than guessing
    // from character count, which is wrong by a factor of several.
    fitRing() {
      const path = this.$refs.ringPathEl
      const text = this.$refs.ringTextEl
      if (!path || !text || typeof path.getTotalLength !== 'function') return
      const total = path.getTotalLength()
      const drawn = text.getComputedTextLength()
      if (!total || !drawn) return
      const perRep = drawn / this.reps
      if (perRep <= 0) return
      this.reps = Math.max(1, Math.floor(total / perRep))
    },
    onContainerClick(event) {
      if (!this.editMode) return
      const el = this.$refs.mapImg
      if (!el) return
      const rect = el.getBoundingClientRect()
      if (
        event.clientX < rect.left || event.clientX > rect.right ||
        event.clientY < rect.top || event.clientY > rect.bottom
      ) return
      const x = ((event.clientX - rect.left) / rect.width) * 100
      const y = ((event.clientY - rect.top) / rect.height) * 100
      this.$emit('add-annotation', { x, y })
    }
  }
}
</script>
