<template>
  <DriverScope :user-id="userId" class="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
    <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-12">
      <div>
        <h1 class="font-heading font-normal tracking-normal leading-none text-display-lg text-brand-text dark:text-brand-text-dark">
          Tracks
        </h1>
        <p class="font-body text-[15px] leading-relaxed text-brand-muted dark:text-brand-muted-dark mt-3.5 max-w-lg">
          <template v-if="isOwnView">
            Every track you have logged a lap on. Pick one to open its variations, its trend and its notes.
            Press <b class="text-brand-text dark:text-brand-text-dark">T</b> to search from anywhere.
          </template>
          <template v-else-if="isCommunity">
            Every track in the game. Pick one to see everyone's races and the best laps there —
            only races logged by the <router-link to="/plugin" class="text-brand-accent dark:text-brand-accent-dark hover:underline">Telemetry plugin</router-link> count.
          </template>
          <template v-else>
            Every track in the game. Pick one to see their races and lap times there.
          </template>
        </p>
      </div>
      <div class="flex items-center gap-2.5 shrink-0">
        <input
          v-model="search"
          type="text"
          placeholder="Search tracks"
          class="min-h-[44px] w-full sm:w-60 border border-brand-border dark:border-brand-border-dark bg-brand-bg dark:bg-brand-bg-dark px-3.5 text-sm text-brand-text dark:text-brand-text-dark focus:outline-none focus:border-brand-accent dark:focus:border-brand-accent-dark"
        />
        <button
          v-if="isOwnView"
          type="button"
          class="ov min-h-[44px] px-4 border border-brand-border dark:border-brand-border-dark text-brand-text dark:text-brand-text-dark hover:border-brand-accent dark:hover:border-brand-accent-dark"
          @click="exportRaces(userId)"
        >Export</button>
        <label v-if="isOwnView" class="ov min-h-[44px] px-4 flex items-center border border-brand-border dark:border-brand-border-dark text-brand-text dark:text-brand-text-dark hover:border-brand-accent dark:hover:border-brand-accent-dark cursor-pointer">
          Import
          <input type="file" accept="application/json" class="hidden" @change="importRaces($event, userId)" />
        </label>
      </div>
    </div>

    <p v-if="loading" class="font-body text-[15px] text-brand-muted dark:text-brand-muted-dark">Loading…</p>
    <p v-else-if="!filteredTracks.length" class="font-body text-[15px] text-brand-muted dark:text-brand-muted-dark">
      No tracks found.
    </p>
    <div
      v-else
      class="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-12"
    >
      <TrackCard v-for="track in filteredTracks" :key="track.id" :track="track" :base-path="basePath" />
    </div>
  </DriverScope>
</template>

<script>
import TrackCard from '../components/TrackCard.vue'
import DriverScope from '../components/DriverScope.vue'
import { getTracks } from '../api.js'
import { pushToast } from '../stores.js'
import { exportRaces, importRaces } from '../utils/exportImport.js'
import { scopedPage } from '../utils/scope.js'

// Every driver sees the same catalogue; the scope only decides where the
// cards link.
export default {
  name: 'TrackListPage',
  components: { DriverScope, TrackCard },
  mixins: [scopedPage],
  data() {
    return {
      tracks: [],
      loading: true,
      search: ''
    }
  },
  computed: {
    filteredTracks() {
      const q = this.search.trim().toLowerCase()
      if (!q) return this.tracks
      return this.tracks.filter(t => t.name.toLowerCase().includes(q))
    }
  },
  async mounted() {
    try {
      this.tracks = await getTracks()
    } catch (err) {
      pushToast(err.message || 'Failed to load tracks', 'error')
    } finally {
      this.loading = false
    }
  },
  methods: { exportRaces, importRaces }
}
</script>
