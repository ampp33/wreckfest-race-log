<template>
  <BaseModal :open="ts.open" @close="onClose">
    <template #title>Go to <em class="signal">track</em></template>

    <p v-if="loadingTracks" class="font-body text-[15px] text-brand-muted dark:text-brand-muted-dark">Loading tracks…</p>
    <TrackVariationPicker v-else :tracks="tracks" @select="onTrackSelected" />
  </BaseModal>
</template>

<script>
import BaseModal from './BaseModal.vue'
import TrackVariationPicker from './TrackVariationPicker.vue'
import { trackSearchStore, closeTrackSearch } from '../stores/trackSearchStore.js'
import { getTracks } from '../services/trackService.js'
import { pushToast } from '../stores/toastStore.js'

export default {
  name: 'TrackSearchModal',
  components: { BaseModal, TrackVariationPicker },
  data() {
    return {
      ts: trackSearchStore,
      tracks: [],
      loadingTracks: false
    }
  },
  watch: {
    'ts.open'(isOpen) {
      if (isOpen) this.onOpened()
    }
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
