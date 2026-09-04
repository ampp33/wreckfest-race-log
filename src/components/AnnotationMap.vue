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
      <!-- A layout with junctions has no single loop to write along, so it
           arrives as several strokes — each open or closed, each carrying the
           name on its own. -->
      <template v-for="{ seg, i } in drawOrder" :key="i">
        <path
          :d="seg.d"
          fill="none"
          class="stroke-brand-border dark:stroke-brand-border-dark"
          stroke-width="30"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <path :id="`${pathId}-${i}`" :ref="el => setSegRef(el, i)" :d="seg.d" fill="none" stroke="none" />
        <text
          :ref="el => setTextRef(el, i)"
          font-family="Switzer, Helvetica, Arial, sans-serif"
          font-size="18"
          font-weight="800"
          :letter-spacing="tracking[i] ?? BASE_TRACKING"
          dominant-baseline="middle"
          class="fill-brand-text dark:fill-brand-text-dark"
        >
          <textPath :href="`#${pathId}-${i}`" startOffset="0">{{ ringText(i) }}</textPath>
        </text>
      </template>

      <!-- Race direction, read off the arrow in the source artwork. -->
      <polygon
        v-if="ringPath.arrow"
        :points="ARROW_SHAPE"
        :transform="`translate(${ringPath.arrow.x} ${ringPath.arrow.y}) rotate(${ringPath.arrow.angle})`"
        class="fill-brand-accent dark:fill-brand-accent-dark"
      />
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

// The ring is set in an 18px face; tracking is quoted in the same user units.
const BASE_FONT = 18
const BASE_TRACKING = 0.18
// A stroke too short for even one pass of the name gets a smaller face rather
// than crushed letter-spacing. Below this it would be unreadable anyway, so the
// tail is allowed to run off the end instead.
// Direction marker, drawn pointing along +x and rotated into place.
const ARROW_SHAPE = '20,0 -10,13 -10,-13'

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
      // One entry per stroke — a junction layout carries several.
      reps: [],
      tracking: [],
      units: [],
      segEls: [],
      textEls: [],
      pathId: `ring-${++uid}`,
      BASE_TRACKING,
      ARROW_SHAPE
    }
  },
  computed: {
    ringUnit() {
      const label = (this.ringLabel || this.alt || 'Track').toUpperCase()
      return `${label} · `
    },
    // Painted back to front: SVG draws in document order, so emitting the last
    // stroke first leaves line 1 on top of line 2, and so on down.
    drawOrder() {
      if (!this.ringPath) return []
      return this.ringPath.paths
        .map((seg, i) => ({ seg, i }))
        .reverse()
    },
    // Shorter things to write when a stroke has no room for the full label.
    // A spur off the main loop does not need to repeat the track name — the
    // loop beside it already carries it — so the variation alone reads fine.
    unitLadder() {
      const full = (this.ringLabel || this.alt || 'Track').toUpperCase()
      const parts = full.split('—').map(t => t.trim()).filter(Boolean)
      const out = [full]
      if (parts.length > 1) {
        out.push(parts[parts.length - 1])
        out.push(parts[0])
      }
      return out.filter((v, i, a) => v && a.indexOf(v) === i).map(v => `${v} · `)
    }
  },
  watch: {
    // the detail page swaps variation without remounting
    variationSlug() { this.resolvePath() },
    ringUnit() { this.$nextTick(this.fitRing) }
  },
  beforeUpdate() {
    this.segEls = []
    this.textEls = []
  },
  async mounted() {
    await loadTrackPaths()
    this.resolvePath()
  },
  methods: {
    setSegRef(el, i) { if (el) this.segEls[i] = el },
    setTextRef(el, i) { if (el) this.textEls[i] = el },
    // One repeat count per stroke; the template asks for these before fitRing
    // has measured anything, so a missing entry means "one pass".
    unitFor(i) {
      return this.units[i] ?? this.ringUnit
    },
    ringText(i) {
      return this.unitFor(i).repeat(this.reps[i] ?? 1)
    },
    resolvePath() {
      const found = getTrackPath(this.trackSlug, this.variationSlug)
      // Older data carries a single `d`; newer carries `paths`. Normalise here
      // so the template only ever deals with a list.
      this.ringPath = found
        ? { ...found, paths: found.paths?.length ? found.paths : (found.d ? [{ d: found.d, closed: true }] : []) }
        : null
      if (this.ringPath && !this.ringPath.paths.length) this.ringPath = null
      const n = this.ringPath ? this.ringPath.paths.length : 0
      this.reps = new Array(n).fill(1)
      this.tracking = new Array(n).fill(BASE_TRACKING)
      this.units = new Array(n).fill(this.ringUnit)
      this.segEls = []
      this.textEls = []
      if (this.ringPath) this.$nextTick(this.fitRing)
    },
    // Fit the name to each stroke.
    //
    // Runs as explicit passes because getComputedTextLength() reports the text
    // WITH its current size and spacing — measuring while a previous fit is
    // applied reads back the wrong width. Pass 0 resets to the base face and
    // full label; the middle passes pick a label and size that fit; the last
    // settles the repeat count and letter-spacing. The pass counter is what
    // stops the reset and the re-measure chasing each other.
    fitRing() {
      if (!this.ringPath) return
      const n = this.ringPath.paths.length
      this.reps = new Array(n).fill(1)
      this.tracking = new Array(n).fill(BASE_TRACKING)
      this.units = new Array(n).fill(this.ringUnit)
      this.$nextTick(() => this.fitPass(0))
    },
    fitPass(pass) {
      if (!this.ringPath) return
      const reps = this.reps.slice()
      const units = this.units.slice()
      let shrank = false

      this.ringPath.paths.forEach((seg, i) => {
        const path = this.segEls[i]
        const text = this.textEls[i]
        if (!path || !text || typeof path.getTotalLength !== 'function') return
        const total = path.getTotalLength()
        const drawn = text.getComputedTextLength()
        if (!total || !drawn) return
        const perRep = drawn / (this.reps[i] || 1)
        if (perRep <= 0) return

        if (perRep > total && pass < 2) {
          // A spur too short for the full label gets a shorter one. The face
          // never changes size — mixed type sizes across one map read as a
          // mistake — so a line with no room for even the shortest label
          // carries no text at all. The ribbon and the arrow still show it.
          const perChar = perRep / this.unitFor(i).length
          const fits = this.unitLadder.find(u => u.length * perChar <= total)
          if (fits && fits !== this.unitFor(i)) {
            units[i] = fits
            reps[i] = 1
            shrank = true
            return
          }
          if (this.unitFor(i) !== '') { units[i] = ''; shrank = true }
          reps[i] = 1
          return
        }

        // Whichever repeat count needs the least distortion to close the line.
        const low = Math.max(1, Math.floor(total / perRep))
        const chars = this.unitFor(i).length
        const cost = k => Math.abs((total - k * perRep) / Math.max(1, k * chars - 1))
        reps[i] = cost(low + 1) < cost(low) ? low + 1 : low
      })

      this.reps = reps
      this.units = units
      // A shorter label may now fit several times, so measure again before
      // settling; otherwise go straight to spacing.
      this.$nextTick(() => (shrank ? this.fitPass(pass + 1) : this.applyTracking()))
    },
    applyTracking() {
      if (!this.ringPath) return
      const tracking = this.tracking.slice()
      this.ringPath.paths.forEach((seg, i) => {
        const path = this.segEls[i]
        const text = this.textEls[i]
        if (!path || !text || typeof path.getTotalLength !== 'function') return
        const total = path.getTotalLength()
        const filled = text.getComputedTextLength()
        const chars = this.ringText(i).length
        if (!filled || chars < 2) return
        const want = BASE_TRACKING + (total - filled) / (chars - 1)
        // Never crush below a readable minimum; a slight overrun clips instead.
        tracking[i] = Math.max(want, -0.08 * BASE_FONT)
      })
      this.tracking = tracking
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
