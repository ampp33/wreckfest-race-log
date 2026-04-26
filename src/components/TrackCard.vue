<template>
  <router-link
    :to="firstVariationLink"
    class="block rounded-lg overflow-hidden bg-white dark:bg-gray-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-brand transition"
  >
    <div class="aspect-video bg-slate-200 dark:bg-gray-700 overflow-hidden">
      <img
        :src="resolvedImage"
        :alt="track.name"
        class="w-full h-full object-cover"
        loading="lazy"
      />
    </div>
    <div class="p-3">
      <h3 class="font-semibold truncate">{{ track.name }}</h3>
      <p class="text-xs text-slate-500 mt-1">
        {{ variationCount }} variation{{ variationCount === 1 ? '' : 's' }}
      </p>
      <div v-if="track.track_variations && track.track_variations.length" class="mt-2 flex flex-wrap gap-1">
        <span
          v-for="v in track.track_variations.slice(0, 4)"
          :key="v.id"
          class="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded bg-slate-100 dark:bg-gray-700 text-slate-600 dark:text-slate-300"
        >
          {{ v.name }}
        </span>
      </div>
    </div>
  </router-link>
</template>

<script>
import { trackImageUrl } from '../utils/imageUrl.js'

export default {
  name: 'TrackCard',
  props: {
    track: { type: Object, required: true }
  },
  computed: {
    variationCount() {
      return (this.track.track_variations || []).length
    },
    firstVariationLink() {
      const first = (this.track.track_variations || [])[0]
      if (!first) return '/'
      return `/track/${this.track.slug}/${first.slug}`
    },
    resolvedImage() {
      return trackImageUrl(this.track.slug)
    }
  }
}
</script>
