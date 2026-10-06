<template>
  <DriverScope :user-id="userId" class="max-w-7xl mx-auto px-6 py-10">
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
            Every track in the game. Pick one to see everyone's races and the best laps there.
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
          @click="onExport"
        >Export</button>
        <label v-if="isOwnView" class="ov min-h-[44px] px-4 flex items-center border border-brand-border dark:border-brand-border-dark text-brand-text dark:text-brand-text-dark hover:border-brand-accent dark:hover:border-brand-accent-dark cursor-pointer">
          Import
          <input type="file" accept="application/json" class="hidden" @change="onImport" />
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
import { getTracks } from '../services/trackService.js'
import { getAllRaces, bulkInsertRaces } from '../services/raceService.js'
import { authStore } from '../stores/authStore.js'
import { downloadJson, readJsonFile } from '../utils/exportImport.js'
import { pushToast } from '../stores/toastStore.js'

export default {
  name: 'TrackListPage',
  components: { DriverScope, TrackCard },
  data() {
    return {
      tracks: [],
      loading: true,
      search: ''
    }
  },
  computed: {
    // Whose tracks these are — from the /<userId>/tracks URL. Every driver
    // sees the same catalogue; this only decides where the cards link.
    userId() {
      return this.$route.params.userId
    },
    isOwnView() {
      return !!this.userId && authStore.user?.id === this.userId
    },
    // /community/tracks: cards open each track's all-drivers page instead.
    isCommunity() {
      return this.$route.meta.scope === 'community'
    },
    basePath() {
      return this.isCommunity ? '/community' : `/${this.userId}`
    },
    filteredTracks() {
      const q = this.search.trim().toLowerCase()
      if (!q) return this.tracks
      return this.tracks.filter(t => t.name.toLowerCase().includes(q))
    }
  },
  async mounted() {
    await this.loadTracks()
  },
  methods: {
    async loadTracks() {
      this.loading = true
      try {
        this.tracks = await getTracks()
      } catch (err) {
        pushToast(err.message || 'Failed to load tracks', 'error')
      } finally {
        this.loading = false
      }
    },
    async onExport() {
      try {
        const races = await getAllRaces({ userId: authStore.user.id })
        downloadJson(`wreckfest-races-${Date.now()}.json`, { races })
        pushToast('Exported races', 'success')
      } catch (err) {
        pushToast(err.message || 'Export failed', 'error')
      }
    },
    async onImport(event) {
      const file = event.target.files && event.target.files[0]
      if (!file) return
      try {
        const parsed = await readJsonFile(file)
        const races = parsed && Array.isArray(parsed.races) ? parsed.races : null
        if (!races || !races.length) {
          pushToast('No races found in file', 'error')
          return
        }
        const userId = authStore.user && authStore.user.id
        const cleaned = races.map(r => ({
          datetime: r.datetime,
          track_variation_id: r.track_variation_id,
          vehicle_id: r.vehicle_id || null,
          tuning: r.tuning ?? null,
          place: r.place || null,
          lap_time_ms: r.lap_time_ms ?? null,
          total_time_ms: r.total_time_ms ?? null,
          notes: r.notes || null
        }))
        await bulkInsertRaces(cleaned, userId)
        pushToast(`Imported ${cleaned.length} races`, 'success')
      } catch (err) {
        pushToast(err.message || 'Import failed', 'error')
      } finally {
        event.target.value = ''
      }
    }
  }
}
</script>
