<template>
  <div class="max-w-6xl mx-auto px-4 py-6">
    <p v-if="loading" class="text-sm text-slate-500">Loading…</p>

    <div v-else-if="!track">
      <p class="text-sm text-slate-500">Track not found.</p>
      <router-link to="/" class="text-brand text-sm hover:underline">← Back to tracks</router-link>
    </div>

    <div v-else>
      <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
        <div class="flex gap-4 min-w-0 flex-1">
          <img
            v-if="track"
            :src="trackImage"
            :alt="track.name"
            class="w-32 h-24 sm:w-40 sm:h-32 object-contain bg-white dark:bg-gray-800 rounded border border-slate-200 dark:border-slate-700 shrink-0"
          />
          <div class="min-w-0">
            <router-link to="/" class="text-xs text-slate-500 hover:text-brand">← All tracks</router-link>
            <h1 class="text-2xl font-bold mt-1 truncate">{{ track.name }}</h1>
            <p class="text-sm text-slate-500">{{ currentVariation && currentVariation.name }}</p>
            <div class="flex flex-wrap gap-2 mt-2">
              <router-link
                v-for="v in track.track_variations"
                :key="v.id"
                :to="`/track/${track.slug}/${v.slug}`"
                class="flex items-center gap-2 pl-1 pr-3 py-1 text-xs rounded border"
                :class="v.id === currentVariation.id
                  ? 'bg-brand text-white border-brand'
                  : 'border-slate-300 dark:border-slate-600 hover:border-brand'"
              >
                <img
                  :src="variationImageUrl(track.slug, v.slug)"
                  alt=""
                  aria-hidden="true"
                  class="w-8 h-6 object-contain bg-black rounded"
                  loading="lazy"
                />
                <span>{{ v.name }}</span>
              </router-link>
            </div>
          </div>
        </div>

        <button
          type="button"
          class="self-start px-4 py-2 bg-brand hover:bg-brand-dark text-white rounded text-sm font-semibold shrink-0"
          @click="onAddRow"
        >
          + Add Race
        </button>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div class="bg-white dark:bg-gray-800 rounded border border-slate-200 dark:border-slate-700 p-3">
          <div class="text-xs uppercase text-slate-500">Goal lap time</div>
          <div class="flex items-center gap-2 mt-1">
            <LapTimeInput v-model="goalInputMs" @blur="onSaveGoal" />
          </div>
        </div>
        <div class="bg-white dark:bg-gray-800 rounded border border-slate-200 dark:border-slate-700 p-3">
          <div class="text-xs uppercase text-slate-500">Personal best</div>
          <div class="font-mono text-lg mt-1">{{ pbDisplay }}</div>
        </div>
        <div class="bg-white dark:bg-gray-800 rounded border border-slate-200 dark:border-slate-700 p-3">
          <div class="text-xs uppercase text-slate-500">Total races</div>
          <div class="font-mono text-lg mt-1">{{ races.length }}</div>
        </div>
      </div>

      <LapTimeChart :races="races" :vehicles="vehicles" />

      <div class="overflow-x-auto bg-white dark:bg-gray-800 rounded border border-slate-200 dark:border-slate-700">
        <table class="min-w-full text-sm">
          <thead class="bg-slate-50 dark:bg-gray-900 text-left text-xs uppercase text-slate-500">
            <tr>
              <th class="py-2 pl-3 pr-3">When</th>
              <th class="py-2 pr-3">Vehicle</th>
              <th class="py-2 pr-3 text-center">Tune</th>
              <th class="py-2 pr-3 text-center">Place</th>
              <th class="py-2 pr-3">Lap</th>
              <th class="py-2 pr-3">Δ goal</th>
              <th class="py-2 pr-3">Total</th>
              <th class="py-2 pr-3">Notes</th>
              <th class="py-2 pr-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <InlineAddRaceRow
              v-if="addingRow"
              :vehicles="vehicles"
              :defaults="addRowDefaults"
              :saving="saving"
              @submit="onCreateRace"
              @cancel="addingRow = false"
            />
            <RaceRow
              v-for="race in races"
              :key="race.id"
              :race="race"
              :vehicles="vehicles"
              :goal-lap-time-ms="goalLapTimeMs"
              :personal-best-ms="personalBestMs"
              @update="onUpdateRace"
              @delete="onDeleteRace"
            />
            <tr v-if="!races.length && !addingRow">
              <td colspan="9" class="py-6 text-center text-sm text-slate-500">
                No races yet — click <span class="font-semibold">+ Add Race</span> to log one.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
import RaceRow from '../components/RaceRow.vue'
import InlineAddRaceRow from '../components/InlineAddRaceRow.vue'
import LapTimeChart from '../components/LapTimeChart.vue'
import { getTrackBySlug, findVariation } from '../services/trackService.js'
import { getVehicles } from '../services/vehicleService.js'
import {
  getRacesByVariation,
  createRace,
  updateRace,
  deleteRace
} from '../services/raceService.js'
import { getGoalForVariation, upsertGoal } from '../services/goalService.js'
import { authStore } from '../stores/authStore.js'
import { prefsStore } from '../stores/prefsStore.js'
import { pushToast } from '../stores/toastStore.js'
import { formatMsToTime } from '../utils/timeFormat.js'
import LapTimeInput from '../components/LapTimeInput.vue'
import { trackImageUrl, variationImageUrl } from '../utils/imageUrl.js'

export default {
  name: 'TrackDetailPage',
  components: { RaceRow, InlineAddRaceRow, LapTimeChart, LapTimeInput },
  data() {
    return {
      loading: true,
      saving: false,
      track: null,
      currentVariation: null,
      vehicles: [],
      races: [],
      goal: null,
      goalInputMs: null,
      addingRow: false
    }
  },
  computed: {
    trackImage() {
      return this.track ? trackImageUrl(this.track.slug) : ''
    },
    goalLapTimeMs() {
      return this.goal ? this.goal.goal_lap_time_ms : null
    },
    personalBestMs() {
      const valid = this.races
        .map(r => r.lap_time_ms)
        .filter(v => v != null)
      if (!valid.length) return null
      return Math.min(...valid)
    },
    pbDisplay() {
      return this.personalBestMs != null ? formatMsToTime(this.personalBestMs) : '—'
    },
    addRowDefaults() {
      return {
        vehicleId: prefsStore.lastVehicleId,
        tuning: prefsStore.lastTuning
      }
    }
  },
  watch: {
    '$route.params': {
      handler() {
        this.loadAll()
      },
      immediate: false
    }
  },
  async mounted() {
    await this.loadAll()
  },
  methods: {
    variationImageUrl,
    async loadAll() {
      this.loading = true
      const slug = this.$route.params.trackSlug
      const variationSlug = this.$route.params.variationSlug
      try {
        const [track, vehicles] = await Promise.all([
          getTrackBySlug(slug),
          getVehicles()
        ])
        this.track = track
        this.vehicles = vehicles
        this.currentVariation = findVariation(track, variationSlug)
        if (!this.currentVariation) {
          pushToast('Variation not found', 'error')
          return
        }
        await Promise.all([this.loadRaces(), this.loadGoal()])
      } catch (err) {
        pushToast(err.message || 'Failed to load track', 'error')
      } finally {
        this.loading = false
      }
    },
    async loadRaces() {
      this.races = await getRacesByVariation(this.currentVariation.id)
    },
    async loadGoal() {
      this.goal = await getGoalForVariation(this.currentVariation.id)
      this.goalInputMs = this.goal ? this.goal.goal_lap_time_ms : null
    },
    onAddRow() {
      this.addingRow = true
    },
    async onCreateRace(payload) {
      const userId = authStore.user && authStore.user.id
      this.saving = true
      try {
        const created = await createRace(
          { ...payload, track_variation_id: this.currentVariation.id },
          userId
        )
        this.races.unshift(created)
        prefsStore.lastVehicleId = created.vehicle_id
        prefsStore.lastTuning = created.tuning
        prefsStore.lastTrackVariationId = created.track_variation_id
        this.addingRow = false
        pushToast('Race added', 'success', 1500)
      } catch (err) {
        pushToast(err.message || 'Failed to add race', 'error')
      } finally {
        this.saving = false
      }
    },
    async onUpdateRace({ id, patch }) {
      try {
        const updated = await updateRace(id, patch)
        const idx = this.races.findIndex(r => r.id === id)
        if (idx !== -1) this.races.splice(idx, 1, updated)
        pushToast('Race updated', 'success', 1500)
      } catch (err) {
        pushToast(err.message || 'Failed to update race', 'error')
      }
    },
    async onDeleteRace(id) {
      try {
        await deleteRace(id)
        this.races = this.races.filter(r => r.id !== id)
        pushToast('Race deleted', 'success', 1500)
      } catch (err) {
        pushToast(err.message || 'Failed to delete race', 'error')
      }
    },
    async onSaveGoal() {
      const ms = this.goalInputMs
      if (!ms) return
      if (this.goal && this.goal.goal_lap_time_ms === ms) return
      try {
        const userId = authStore.user && authStore.user.id
        this.goal = await upsertGoal({
          variationId: this.currentVariation.id,
          goalLapTimeMs: ms,
          userId
        })
        pushToast('Goal saved', 'success', 1500)
      } catch (err) {
        pushToast(err.message || 'Failed to save goal', 'error')
      }
    }
  }
}
</script>
