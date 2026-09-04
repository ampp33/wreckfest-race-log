<template>
  <router-link
    :to="firstVariationLink"
    class="block group border-t-2 border-brand-strong dark:border-brand-strong-dark pt-3.5 text-brand-text dark:text-brand-text-dark"
  >
    <div class="aspect-video bg-brand-surface dark:bg-brand-surface-dark overflow-hidden flex items-center justify-center">
      <img
        :src="resolvedImage"
        :alt="track.name"
        class="w-[78%] h-auto object-contain map-art"
        loading="lazy"
      />
    </div>

    <div class="flex items-baseline justify-between gap-3 mt-3.5 min-w-0">
      <h3 class="font-display font-black tracking-tightest leading-[0.95] text-[26px] group-hover:text-brand-accent dark:group-hover:text-brand-accent-dark">
        {{ track.name }}
      </h3>
      <span class="ov tabular text-brand-muted dark:text-brand-muted-dark whitespace-nowrap shrink-0">
        {{ variationCount }} var.
      </span>
    </div>

    <div v-if="track.track_variations && track.track_variations.length" class="mt-3 flex flex-wrap gap-1.5">
      <span
        v-for="v in track.track_variations.slice(0, 4)"
        :key="v.id"
        class="ov px-2 py-1.5 border border-brand-border dark:border-brand-border-dark text-brand-muted dark:text-brand-muted-dark whitespace-nowrap"
      >{{ v.name }}</span>
    </div>

    <div
      v-if="bestLap"
      class="flex items-baseline justify-between mt-3.5 border-t border-brand-border dark:border-brand-border-dark pt-2.5"
    >
      <span class="ov text-brand-muted dark:text-brand-muted-dark">Best lap</span>
      <span class="tabular font-bold text-[17px]">{{ bestLap }}</span>
    </div>
  </router-link>
</template>

<script>
import { trackImageUrl } from '../utils/imageUrl.js'
import { formatMsToTime } from '../utils/timeFormat.js'

export default {
  name: 'TrackCard',
  props: {
    track: { type: Object, required: true }
  },
  computed: {
    variationCount() {
      return (this.track.track_variations || []).length
    },
    bestLap() {
      const ms = this.track.bestLapMs
      return ms != null ? formatMsToTime(ms) : ''
    },
    firstVariationLink() {
      const first = (this.track.track_variations || [])[0]
      if (!first) return '/tracks'
      return `/track/${this.track.slug}/${first.slug}`
    },
    resolvedImage() {
      const first = (this.track.track_variations || [])[0]
      if (first) return `/track-variation-images/${this.track.slug}--${first.slug}.png`
      return trackImageUrl(this.track.slug)
    }
  }
}
</script>
