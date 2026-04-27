<template>
  <div
    v-if="ts.open"
    class="fixed inset-0 z-40 flex items-start sm:items-center justify-center bg-black/50 p-2 sm:p-4 overflow-hidden"
    @mousedown.self="onClose"
    @keydown.esc.stop="onClose"
  >
    <div
      class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg p-4 sm:p-6 max-h-[92svh] sm:max-h-[95vh] overflow-y-auto overscroll-contain"
      role="dialog"
      aria-modal="true"
      aria-labelledby="track-search-title"
    >
      <div class="flex items-center justify-between mb-4">
        <h2 id="track-search-title" class="text-lg font-semibold">
          Go to track
        </h2>
        <button
          type="button"
          class="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          aria-label="Close"
          @click="onClose"
        >
          ✕
        </button>
      </div>

      <p v-if="loadingTracks" class="text-sm text-slate-500">Loading tracks…</p>
      <TrackVariationPicker v-else :tracks="tracks" @select="onTrackSelected" />
    </div>
  </div>
</template>

<script>
import TrackVariationPicker from './TrackVariationPicker.vue'
import { trackSearchStore, closeTrackSearch } from '../stores/trackSearchStore.js'
import { getTracks } from '../services/trackService.js'
import { pushToast } from '../stores/toastStore.js'

export default {
  name: 'TrackSearchModal',
  components: { TrackVariationPicker },
  data() {
    return {
      ts: trackSearchStore,
      tracks: [],
      loadingTracks: false
    }
  },
  watch: {
    'ts.open'(isOpen) {
      if (isOpen) {
        document.body.style.overflow = 'hidden'
        this.onOpened()
      } else {
        document.body.style.overflow = ''
      }
    }
  },
  unmounted() {
    document.body.style.overflow = ''
  },
  methods: {
    async onOpened() {
      if (this.tracks.length) return
      this.loadingTracks = true
      try {
        this.tracks = await getTracks()
      } catch (err) {
        pushToast(err.message || 'Failed to load tracks', 'error')
      } finally {
        this.loadingTracks = false
      }
    },
    onTrackSelected({ track, variation }) {
      closeTrackSearch()
      this.$router.push(`/track/${track.slug}/${variation.slug}`)
    },
    onClose() {
      closeTrackSearch()
    }
  }
}
</script>
