<template>
  <router-link
    :to="firstVariationLink"
    class="block group text-brand-text dark:text-brand-text-dark"
  >
    <div class="aspect-video bg-brand-surface dark:bg-brand-surface-dark overflow-hidden">
      <img
        :src="resolvedImage"
        :alt="track.name"
        class="w-full h-full object-cover grayscale"
        loading="lazy"
      />
    </div>

    <div class="flex items-baseline justify-between gap-3 mt-3.5 min-w-0">
      <h3 class="font-heading font-normal tracking-normal leading-[0.95] text-[26px] group-hover:text-brand-accent dark:group-hover:text-brand-accent-dark">
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
  </router-link>
</template>

<script>
import { trackImageUrl } from '../utils/imageUrl.js'

export default {
  name: 'TrackCard',
  props: {
    track: { type: Object, required: true },
    // Prefix for the card's link: '/<userId>' on a driver's track list,
    // '/community' on the site-wide one.
    basePath: { type: String, required: true }
  },
  computed: {
    variationCount() {
      return (this.track.track_variations || []).length
    },
    firstVariationLink() {
      const first = (this.track.track_variations || [])[0]
      if (!first) return `${this.basePath}/tracks`
      return `${this.basePath}/track/${this.track.slug}/${first.slug}`
    },
    resolvedImage() {
      return trackImageUrl(this.track.slug)
    }
  }
}
</script>
