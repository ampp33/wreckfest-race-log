<template>
  <div class="max-w-6xl mx-auto px-4 py-6">
    <h1 class="text-2xl font-bold mb-1">Races</h1>
    <p class="text-sm text-slate-500 mb-6">All of your logged races, newest first.</p>

    <p v-if="loading" class="text-sm text-slate-500">Loading…</p>
    <p v-else-if="error" class="text-sm text-red-500">{{ error }}</p>

    <div v-else>
      <!-- Controls row -->
      <div class="flex items-center justify-between mb-3 gap-4 flex-wrap">
        <div class="text-sm text-slate-500">
          {{ total }} race{{ total === 1 ? '' : 's' }}
        </div>
        <div class="flex items-center gap-2 text-sm">
          <label class="text-slate-500">Per page</label>
          <select
            v-model="pageSize"
            class="border border-slate-300 dark:border-slate-600 rounded px-2 py-1 bg-white dark:bg-gray-800 text-sm"
            @change="currentPage = 1"
          >
            <option :value="25">25</option>
            <option :value="50">50</option>
            <option :value="100">100</option>
          </select>
        </div>
      </div>

      <p v-if="total === 0" class="text-sm text-slate-500">No races logged yet.</p>

      <div v-else class="bg-white dark:bg-gray-800 rounded border border-slate-200 dark:border-slate-700 overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="text-left text-xs uppercase text-slate-500 border-b border-slate-200 dark:border-slate-700">
              <th class="px-4 py-2 font-medium">Date</th>
              <th class="px-4 py-2 font-medium">Track / Variation</th>
              <th class="px-4 py-2 font-medium">Vehicle</th>
              <th class="px-4 py-2 font-medium text-right">Place</th>
              <th class="px-4 py-2 font-medium text-right">Lap time</th>
              <th class="px-4 py-2 font-medium text-right">Total time</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-slate-700">
            <tr
              v-for="race in pageRows"
              :key="race.id"
              class="hover:bg-slate-50 dark:hover:bg-slate-700/40"
            >
              <td class="px-4 py-2 whitespace-nowrap text-slate-500 text-xs">
                {{ formatDate(race.datetime) }}
              </td>
              <td class="px-4 py-2">
                <router-link
                  v-if="race.trackSlug && race.variationSlug"
                  :to="`/track/${race.trackSlug}/${race.variationSlug}`"
                  class="text-brand hover:underline"
                >
                  {{ race.trackName }}
                  <span class="text-slate-500 font-normal">— {{ race.variationName }}</span>
                </router-link>
                <span v-else class="text-slate-400">—</span>
              </td>
              <td class="px-4 py-2 text-slate-700 dark:text-slate-300">
                {{ race.vehicleName }}
              </td>
              <td class="px-4 py-2 text-right tabular-nums">
                {{ race.place != null ? race.place : '—' }}
              </td>
              <td class="px-4 py-2 text-right font-mono tabular-nums">
                {{ race.lap_time_ms != null ? formatMs(race.lap_time_ms) : '—' }}
              </td>
              <td class="px-4 py-2 text-right font-mono tabular-nums text-slate-500">
                {{ race.total_time_ms != null ? formatMs(race.total_time_ms) : '—' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="flex items-center justify-center gap-6 mt-4 text-sm">
        <button
          :disabled="currentPage === 1"
          class="px-3 py-1 rounded border border-slate-300 dark:border-slate-600 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-700"
          @click="currentPage--"
        >
          ← Prev
        </button>
        <span class="text-slate-500">Page {{ currentPage }} of {{ totalPages }}</span>
        <button
          :disabled="currentPage === totalPages"
          class="px-3 py-1 rounded border border-slate-300 dark:border-slate-600 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-700"
          @click="currentPage++"
        >
          Next →
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { getAllRaces } from '../services/raceService.js'
import { getTracks } from '../services/trackService.js'
import { getVehicles } from '../services/vehicleService.js'
import { formatMsToTime } from '../utils/timeFormat.js'
import { pushToast } from '../stores/toastStore.js'

export default {
  name: 'RacesPage',
  data() {
    return {
      loading: true,
      error: null,
      rows: [],
      currentPage: 1,
      pageSize: 50
    }
  },
  computed: {
    total() {
      return this.rows.length
    },
    totalPages() {
      return Math.max(1, Math.ceil(this.total / this.pageSize))
    },
    pageRows() {
      const start = (this.currentPage - 1) * this.pageSize
      return this.rows.slice(start, start + this.pageSize)
    }
  },
  async mounted() {
    try {
      const [races, tracks, vehicles] = await Promise.all([
        getAllRaces(),
        getTracks(),
        getVehicles()
      ])

      const vehicleMap = Object.fromEntries(vehicles.map(v => [v.id, v.name]))

      const variationMap = {}
      for (const track of tracks) {
        for (const v of track.track_variations || []) {
          variationMap[v.id] = {
            trackName: track.name,
            trackSlug: track.slug,
            variationName: v.name,
            variationSlug: v.slug
          }
        }
      }

      this.rows = races.map(r => ({
        ...r,
        vehicleName: vehicleMap[r.vehicle_id] ?? '—',
        ...(variationMap[r.track_variation_id] ?? {
          trackName: '—',
          trackSlug: null,
          variationName: '—',
          variationSlug: null
        })
      }))
    } catch (err) {
      this.error = err.message || 'Failed to load races'
      pushToast(this.error, 'error')
    } finally {
      this.loading = false
    }
  },
  methods: {
    formatMs(ms) {
      return formatMsToTime(ms)
    },
    formatDate(iso) {
      return new Date(iso).toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }
}
</script>
