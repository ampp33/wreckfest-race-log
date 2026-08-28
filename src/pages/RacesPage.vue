<template>
  <div class="max-w-7xl mx-auto px-6 py-6 pb-24">
    <h1 class="font-display font-black tracking-tighter leading-none text-display-lg text-brand-text dark:text-brand-text-dark mb-1">
      Your <em class="signal">races</em>
    </h1>
    <p class="font-body text-[15px] leading-relaxed text-brand-secondary dark:text-brand-secondary-dark mb-6">All of your logged races, newest first.</p>

    <p v-if="loading" class="font-body text-[15px] text-brand-muted dark:text-brand-muted-dark">Loading…</p>
    <p v-else-if="error" class="text-sm text-red-500">{{ error }}</p>

    <div v-else>
      <!-- Controls row -->
      <div class="flex items-center justify-between mb-3 gap-4 flex-wrap">
        <div class="font-body text-[15px] text-brand-muted dark:text-brand-muted-dark">
          {{ total }} race{{ total === 1 ? '' : 's' }}
        </div>
        <div class="flex items-center gap-2 text-sm font-body">
          <label class="text-brand-muted dark:text-brand-muted-dark">Per page</label>
          <select
            v-model="pageSize"
            class="border border-brand-border dark:border-brand-border-dark rounded px-2 py-1 bg-brand-bg dark:bg-brand-surface-dark text-sm"
            @change="currentPage = 1"
          >
            <option :value="25">25</option>
            <option :value="50">50</option>
            <option :value="100">100</option>
          </select>
        </div>
      </div>

      <p v-if="total === 0" class="font-body text-[15px] text-brand-muted dark:text-brand-muted-dark">No races logged yet.</p>

      <div v-else class="bg-brand-surface dark:bg-brand-surface-dark rounded border border-brand-border dark:border-brand-border-dark">
        <!-- Card layout (mobile) -->
        <div class="sm:hidden divide-y divide-brand-border dark:divide-brand-border-dark">
          <div v-for="race in pageRows" :key="race.id" class="p-3">
            <template v-if="!editing[race.id]">
              <div class="flex items-start justify-between gap-2">
                <div class="min-w-0">
                  <router-link
                    v-if="race.trackSlug && race.variationSlug"
                    :to="`/track/${race.trackSlug}/${race.variationSlug}`"
                    class="font-bold text-brand-accent hover:underline truncate block"
                  >
                    {{ race.trackName }}
                    <span class="text-brand-muted dark:text-brand-muted-dark font-normal">— {{ race.variationName }}</span>
                  </router-link>
                  <span v-else class="font-bold text-brand-text dark:text-brand-text-dark">—</span>
                  <div class="text-xs text-brand-muted dark:text-brand-muted-dark">{{ formatDate(race.datetime) }}</div>
                </div>
                <div class="inline-flex items-center gap-1 shrink-0">
                  <button
                    v-if="race.notes || hasLapTimes(race) || hasRoster(race)"
                    class="p-1 rounded text-brand-muted dark:text-brand-muted-dark hover:text-brand-accent hover:bg-brand-surface dark:hover:bg-brand-surface-dark"
                    :title="expanded[race.id] ? 'Collapse' : 'Expand'"
                    @click="toggleExpanded(race.id)"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="w-4 h-4"
                      viewBox="0 0 20 20"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      aria-hidden="true"
                    >
                      <path d="M4 10h12" />
                      <path v-if="!expanded[race.id]" d="M10 4v12" />
                    </svg>
                  </button>
                  <button
                    class="p-1 rounded text-brand-muted dark:text-brand-muted-dark hover:text-brand-accent hover:bg-brand-surface dark:hover:bg-brand-surface-dark"
                    title="Edit"
                    @click="editing[race.id] = true"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                  </button>
                  <button
                    class="p-1 rounded text-brand-muted dark:text-brand-muted-dark hover:text-red-600 hover:bg-brand-surface dark:hover:bg-brand-surface-dark"
                    title="Delete"
                    @click="onDelete(race)"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-x-3 gap-y-1.5 mt-3 text-sm">
                <div>
                  <div class="text-[10px] uppercase tracking-widest text-brand-muted dark:text-brand-muted-dark">Vehicle</div>
                  <div class="text-brand-secondary dark:text-brand-secondary-dark">{{ race.vehicleName }}</div>
                </div>
                <div>
                  <div class="text-[10px] uppercase tracking-widest text-brand-muted dark:text-brand-muted-dark">Class (PI)</div>
                  <div>
                    <template v-if="race.performance_index != null">
                      <span class="font-bold" :style="{ color: piInfo(race.performance_index).color }">{{ piInfo(race.performance_index).cls }}</span>
                      {{ race.performance_index }}
                    </template>
                    <span v-else class="text-brand-muted dark:text-brand-muted-dark">—</span>
                  </div>
                </div>
                <div>
                  <div class="text-[10px] uppercase tracking-widest text-brand-muted dark:text-brand-muted-dark">Place</div>
                  <div class="tabular-nums">{{ race.place != null ? race.place : '—' }}</div>
                </div>
                <div>
                  <div class="text-[10px] uppercase tracking-widest text-brand-muted dark:text-brand-muted-dark">Laps</div>
                  <div class="tabular-nums">{{ lapCount(race) }}</div>
                </div>
                <div>
                  <div class="text-[10px] uppercase tracking-widest text-brand-muted dark:text-brand-muted-dark">Lap time</div>
                  <div class="font-mono tabular-nums">{{ race.lap_time_ms != null ? formatMs(race.lap_time_ms) : '—' }}</div>
                </div>
                <div>
                  <div class="text-[10px] uppercase tracking-widest text-brand-muted dark:text-brand-muted-dark">Total time</div>
                  <div class="font-mono tabular-nums text-brand-muted dark:text-brand-muted-dark">{{ race.total_time_ms != null ? formatMs(race.total_time_ms) : '—' }}</div>
                </div>
              </div>

              <div v-if="expanded[race.id]" class="mt-3 -mx-3 px-3 py-2 bg-brand-bg dark:bg-brand-bg-dark">
                <template v-if="race.notes">
                  <div class="text-[10px] uppercase tracking-widest text-brand-muted dark:text-brand-muted-dark">Notes</div>
                  <div class="mt-1 font-mono text-sm whitespace-pre-wrap break-words text-brand-text dark:text-brand-text-dark">{{ race.notes }}</div>
                </template>

                <template v-if="hasLapTimes(race)">
                  <div class="mt-3 text-[10px] uppercase tracking-widest text-brand-muted dark:text-brand-muted-dark">Lap times</div>
                  <LapSplitsChart :lap-times="race.lap_times_ms" class="mt-1" />
                </template>

                <template v-if="hasRoster(race)">
                  <div class="mt-3 text-[10px] uppercase tracking-widest text-brand-muted dark:text-brand-muted-dark">Roster</div>
                  <RaceResultsRoster :roster="race.results_roster" class="mt-1" />
                </template>
              </div>
            </template>

            <RaceForm
              v-else
              :vehicles="vehicles"
              :defaults="editDefaultsFor(race)"
              :saving="!!saving[race.id]"
              :autofocus="false"
              @submit="payload => onSave(race, payload)"
              @cancel="editing[race.id] = false"
            />
          </div>
        </div>

        <!-- Table layout (desktop) -->
        <div class="hidden sm:block overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="text-left font-body font-medium uppercase tracking-widest text-[11px] text-brand-muted dark:text-brand-muted-dark border-b border-brand-border dark:border-brand-border-dark">
                <th class="px-4 py-2 font-medium">Date</th>
                <th class="px-4 py-2 font-medium">Track / Variation</th>
                <th class="px-4 py-2 font-medium">Vehicle</th>
                <th class="px-4 py-2 font-medium">Class (PI)</th>
                <th class="px-4 py-2 font-medium text-right">Place</th>
                <th class="px-4 py-2 font-medium text-right">Laps</th>
                <th class="px-4 py-2 font-medium text-right">Lap time</th>
                <th class="px-4 py-2 font-medium text-right">Total time</th>
                <th class="px-4 py-2 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-brand-border dark:divide-brand-border-dark">
              <template v-for="race in pageRows" :key="race.id">
                <tr v-if="!editing[race.id]" class="hover:bg-brand-bg dark:hover:bg-brand-bg-dark/30">
                  <td class="px-4 py-2 whitespace-nowrap text-brand-muted dark:text-brand-muted-dark">
                    {{ formatDate(race.datetime) }}
                  </td>
                  <td class="px-4 py-2">
                    <router-link
                      v-if="race.trackSlug && race.variationSlug"
                      :to="`/track/${race.trackSlug}/${race.variationSlug}`"
                      class="text-brand-accent hover:underline"
                    >
                      {{ race.trackName }}
                      <span class="text-brand-muted dark:text-brand-muted-dark font-normal">— {{ race.variationName }}</span>
                    </router-link>
                    <span v-else class="text-brand-muted dark:text-brand-muted-dark">—</span>
                  </td>
                  <td class="px-4 py-2 text-brand-secondary dark:text-brand-secondary-dark">
                    {{ race.vehicleName }}
                  </td>
                  <td class="px-4 py-2 whitespace-nowrap">
                    <template v-if="race.performance_index != null">
                      <span class="font-bold" :style="{ color: piInfo(race.performance_index).color }">{{ piInfo(race.performance_index).cls }}</span>
                      {{ race.performance_index }}
                    </template>
                    <span v-else class="text-brand-muted dark:text-brand-muted-dark">—</span>
                  </td>
                  <td class="px-4 py-2 text-right tabular-nums">
                    {{ race.place != null ? race.place : '—' }}
                  </td>
                  <td class="px-4 py-2 text-right tabular-nums text-brand-secondary dark:text-brand-secondary-dark">
                    {{ lapCount(race) }}
                  </td>
                  <td class="px-4 py-2 text-right font-mono tabular-nums">
                    {{ race.lap_time_ms != null ? formatMs(race.lap_time_ms) : '—' }}
                  </td>
                  <td class="px-4 py-2 text-right font-mono tabular-nums text-brand-muted dark:text-brand-muted-dark">
                    {{ race.total_time_ms != null ? formatMs(race.total_time_ms) : '—' }}
                  </td>
                  <td class="px-4 py-2 text-right whitespace-nowrap">
                    <div class="inline-flex items-center gap-1">
                      <button
                        v-if="race.notes || hasLapTimes(race) || hasRoster(race)"
                        class="p-1 rounded text-brand-muted dark:text-brand-muted-dark hover:text-brand-accent hover:bg-brand-surface dark:hover:bg-brand-surface-dark"
                        :title="expanded[race.id] ? 'Collapse' : 'Expand'"
                        @click="toggleExpanded(race.id)"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          class="w-4 h-4"
                          viewBox="0 0 20 20"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                          stroke-linecap="round"
                          aria-hidden="true"
                        >
                          <path d="M4 10h12" />
                          <path v-if="!expanded[race.id]" d="M10 4v12" />
                        </svg>
                      </button>
                      <button
                        class="p-1 rounded text-brand-muted dark:text-brand-muted-dark hover:text-brand-accent hover:bg-brand-surface dark:hover:bg-brand-surface-dark"
                        title="Edit"
                        @click="editing[race.id] = true"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                      </button>
                      <button
                        class="p-1 rounded text-brand-muted dark:text-brand-muted-dark hover:text-red-600 hover:bg-brand-surface dark:hover:bg-brand-surface-dark"
                        title="Delete"
                        @click="onDelete(race)"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
                <tr v-else>
                  <td colspan="9" class="p-5 bg-brand-surface dark:bg-brand-surface-dark">
                    <RaceForm
                      :vehicles="vehicles"
                      :defaults="editDefaultsFor(race)"
                      :saving="!!saving[race.id]"
                      :autofocus="false"
                      @submit="payload => onSave(race, payload)"
                      @cancel="editing[race.id] = false"
                    />
                  </td>
                </tr>
                <tr v-if="!editing[race.id] && expanded[race.id]">
                  <td colspan="9" class="px-4 py-2 bg-brand-bg dark:bg-brand-bg-dark">
                    <template v-if="race.notes">
                      <div class="text-[10px] uppercase tracking-widest text-brand-muted dark:text-brand-muted-dark">Notes</div>
                      <div class="mt-1 font-mono text-sm whitespace-pre-wrap break-words text-brand-text dark:text-brand-text-dark">{{ race.notes }}</div>
                    </template>

                    <template v-if="hasLapTimes(race)">
                      <div class="mt-3 text-[10px] uppercase tracking-widest text-brand-muted dark:text-brand-muted-dark">Lap times</div>
                      <LapSplitsChart :lap-times="race.lap_times_ms" class="mt-1" />
                    </template>

                    <template v-if="hasRoster(race)">
                      <div class="mt-3 text-[10px] uppercase tracking-widest text-brand-muted dark:text-brand-muted-dark">Roster</div>
                      <RaceResultsRoster :roster="race.results_roster" class="mt-1" />
                    </template>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="flex items-center justify-center gap-6 mt-4 text-sm">
        <button
          :disabled="currentPage === 1"
          class="px-3 py-1 rounded border border-brand-border dark:border-brand-border-dark disabled:opacity-40 hover:bg-brand-surface dark:hover:bg-brand-surface-dark"
          @click="currentPage--"
        >
          ← Prev
        </button>
        <span class="text-brand-muted dark:text-brand-muted-dark">Page {{ currentPage }} of {{ totalPages }}</span>
        <button
          :disabled="currentPage === totalPages"
          class="px-3 py-1 rounded border border-brand-border dark:border-brand-border-dark disabled:opacity-40 hover:bg-brand-surface dark:hover:bg-brand-surface-dark"
          @click="currentPage++"
        >
          Next →
        </button>
      </div>
    </div>

    <ConfirmDialog
      :open="!!confirmDeleteRace"
      title="Delete this race?"
      message="This can't be undone."
      confirm-label="Delete"
      @confirm="onConfirmDelete"
      @cancel="confirmDeleteRace = null"
    />
  </div>
</template>

<script>
import { getAllRaces, updateRace, deleteRace } from '../services/raceService.js'
import { getTracks } from '../services/trackService.js'
import { getVehicles } from '../services/vehicleService.js'
import { formatMsToTime } from '../utils/timeFormat.js'
import { piInfo } from '../utils/piInfo.js'
import { pushToast } from '../stores/toastStore.js'
import LapSplitsChart from '../components/LapSplitsChart.vue'
import RaceResultsRoster from '../components/RaceResultsRoster.vue'
import RaceForm from '../components/RaceForm.vue'
import ConfirmDialog from '../components/ConfirmDialog.vue'

function toLocalIsoMinute(isoString) {
  const d = new Date(isoString)
  const tzOffset = d.getTimezoneOffset() * 60_000
  return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16)
}

export default {
  name: 'RacesPage',
  components: { LapSplitsChart, RaceResultsRoster, RaceForm, ConfirmDialog },
  data() {
    return {
      loading: true,
      error: null,
      rows: [],
      vehicles: [],
      currentPage: 1,
      pageSize: 50,
      expanded: {},
      editing: {},
      saving: {},
      confirmDeleteRace: null
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

      this.vehicles = vehicles

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
    piInfo,
    formatMs(ms) {
      return formatMsToTime(ms)
    },
    lapCount(race) {
      if (race.lap_count != null) return race.lap_count
      // Older races may only carry the splits array.
      if (Array.isArray(race.lap_times_ms)) return race.lap_times_ms.length
      return '—'
    },
    hasLapTimes(race) {
      return Array.isArray(race.lap_times_ms) && race.lap_times_ms.some(ms => ms != null)
    },
    hasRoster(race) {
      return Array.isArray(race.results_roster) && race.results_roster.length > 0
    },
    toggleExpanded(id) {
      this.expanded[id] = !this.expanded[id]
    },
    formatDate(iso) {
      return new Date(iso).toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    },
    editDefaultsFor(race) {
      return {
        datetime: toLocalIsoMinute(race.datetime),
        vehicleId: race.vehicle_id,
        tuning: race.tuning,
        place: race.place || '',
        lapTimeMs: race.lap_time_ms,
        totalTimeMs: race.total_time_ms,
        performanceIndex: race.performance_index != null ? String(race.performance_index) : '0',
        notes: race.notes || ''
      }
    },
    async onSave(race, payload) {
      this.saving[race.id] = true
      try {
        const updated = await updateRace(race.id, payload)
        const idx = this.rows.findIndex(r => r.id === race.id)
        if (idx !== -1) {
          this.rows.splice(idx, 1, {
            ...updated,
            vehicleName: this.vehicles.find(v => v.id === updated.vehicle_id)?.name ?? '—',
            trackName: race.trackName,
            trackSlug: race.trackSlug,
            variationName: race.variationName,
            variationSlug: race.variationSlug
          })
        }
        this.editing[race.id] = false
        pushToast('Race updated', 'success', 1500)
      } catch (err) {
        pushToast(err.message || 'Failed to update race', 'error')
      } finally {
        this.saving[race.id] = false
      }
    },
    onDelete(race) {
      this.confirmDeleteRace = race
    },
    async onConfirmDelete() {
      const race = this.confirmDeleteRace
      if (!race) return
      this.confirmDeleteRace = null
      try {
        await deleteRace(race.id)
        this.rows = this.rows.filter(r => r.id !== race.id)
        pushToast('Race deleted', 'success', 1500)
      } catch (err) {
        pushToast(err.message || 'Failed to delete race', 'error')
      }
    }
  }
}
</script>
