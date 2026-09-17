<template>
  <div class="max-w-7xl mx-auto px-6 py-10">
    <h1 class="font-heading font-normal tracking-normal leading-none text-display-lg text-brand-text dark:text-brand-text-dark">
      Races
    </h1>
    <p class="font-body text-[15px] leading-relaxed text-brand-muted dark:text-brand-muted-dark mt-3.5 mb-10">
      <span class="tabular font-semibold text-brand-text dark:text-brand-text-dark">{{ total }}</span> logged, newest first.
    </p>

    <p v-if="loading" class="font-body text-[15px] text-brand-muted dark:text-brand-muted-dark">Loading…</p>
    <!-- The controls row (and the refresh button in it) only renders once a
         load has succeeded, so the error state repeats it as a retry. -->
    <div v-else-if="error" class="flex items-center gap-3 flex-wrap">
      <p class="text-sm text-brand-accent dark:text-brand-accent-dark">{{ error }}</p>
      <button
        type="button"
        class="min-h-[44px] min-w-[44px] flex items-center justify-center text-brand-muted dark:text-brand-muted-dark hover:text-brand-accent dark:hover:text-brand-accent-dark disabled:opacity-40"
        :disabled="refreshing"
        :aria-busy="refreshing"
        title="Retry"
        aria-label="Retry loading races"
        @click="load({ refresh: true })"
      >
        <span class="w-6 h-6 inline-block" :class="{ 'animate-spin': refreshing }" v-html="refreshIcon"></span>
      </button>
    </div>

    <div v-else>
      <!-- Controls row -->
      <div class="flex items-end justify-between mb-6 gap-4 flex-wrap">
        <div class="ov text-brand-muted dark:text-brand-muted-dark">
          {{ total }} race{{ total === 1 ? '' : 's' }}
        </div>
        <div class="flex items-center gap-3">
          <button
            type="button"
            class="min-h-[44px] min-w-[44px] flex items-center justify-center text-brand-muted dark:text-brand-muted-dark hover:text-brand-accent dark:hover:text-brand-accent-dark disabled:opacity-40"
            :disabled="refreshing"
            :aria-busy="refreshing"
            title="Refresh"
            aria-label="Refresh races"
            @click="load({ refresh: true })"
          >
            <span class="w-6 h-6 inline-block" :class="{ 'animate-spin': refreshing }" v-html="refreshIcon"></span>
          </button>
          <span class="ov text-brand-muted dark:text-brand-muted-dark">Per page</span>
          <div class="flex">
            <button
              v-for="size in [25, 50, 100]"
              :key="size"
              type="button"
              class="tabular min-h-[44px] min-w-[52px] border text-sm font-semibold -ml-px first:ml-0"
              :class="pageSize === size
                ? 'bg-brand-strong dark:bg-brand-strong-dark border-brand-strong dark:border-brand-strong-dark text-brand-bg dark:text-brand-bg-dark'
                : 'border-brand-border dark:border-brand-border-dark text-brand-muted dark:text-brand-muted-dark hover:border-brand-accent'"
              @click="pageSize = size; currentPage = 1"
            >{{ size }}</button>
          </div>
        </div>
      </div>

      <p v-if="total === 0" class="font-body text-[15px] text-brand-muted dark:text-brand-muted-dark">No races logged yet.</p>

      <div v-else>
        <!-- Card layout (mobile) -->
        <div class="sm:hidden divide-y divide-brand-border dark:divide-brand-border-dark">
          <div v-for="race in pageRows" :key="race.id" class="p-3">
            <template v-if="!editing[race.id]">
              <div class="flex items-start justify-between gap-2">
                <div class="min-w-0">
                  <router-link
                    v-if="race.trackSlug && race.variationSlug"
                    :to="`/track/${race.trackSlug}/${race.variationSlug}`"
                    class="font-bold text-brand-text dark:text-brand-text-dark hover:text-brand-accent dark:hover:text-brand-accent-dark truncate block"
                  >
                    {{ race.trackName }}
                    <span class="text-brand-muted dark:text-brand-muted-dark font-normal">— {{ race.variationName }}</span>
                  </router-link>
                  <span v-else class="font-bold text-brand-text dark:text-brand-text-dark">—</span>
                  <div class="text-xs text-brand-muted dark:text-brand-muted-dark inline-flex items-center gap-1">
                    {{ formatDateTime(race.datetime) }}
                    <span
                      v-if="race.source === 'api'"
                      class="w-3 h-3 shrink-0 text-brand-accent dark:text-brand-accent-dark"
                      :title="apiSourceTitle(race)"
                      v-html="apiIcon"
                    ></span>
                  </div>
                </div>
                <RaceRowActions
                  :show-expand="!!(race.notes || hasLapTimes(race) || hasRoster(race))"
                  :expanded="!!expanded[race.id]"
                  @toggle-expand="toggleExpanded(race.id)"
                  @edit="editing[race.id] = true"
                  @delete="onDelete(race)"
                />
              </div>

              <div class="grid grid-cols-2 gap-x-3 gap-y-1.5 mt-3 text-sm">
                <div>
                  <div class="ov text-brand-muted dark:text-brand-muted-dark">Vehicle</div>
                  <div class="text-brand-secondary dark:text-brand-secondary-dark">{{ race.vehicleName }}</div>
                </div>
                <div>
                  <div class="ov text-brand-muted dark:text-brand-muted-dark">Class (PI)</div>
                  <div><PerformanceIndexBadge :value="race.performance_index" /></div>
                </div>
                <div>
                  <div class="ov text-brand-muted dark:text-brand-muted-dark">Place</div>
                  <div class="tabular-nums">{{ race.place != null ? race.place : '—' }}</div>
                </div>
                <div>
                  <div class="ov text-brand-muted dark:text-brand-muted-dark">Laps</div>
                  <div class="tabular-nums">{{ lapCount(race) }}</div>
                </div>
                <div>
                  <div class="ov text-brand-muted dark:text-brand-muted-dark">Lap time</div>
                  <div class="tabular">{{ race.lap_time_ms != null ? formatMs(race.lap_time_ms) : '—' }}</div>
                </div>
                <div>
                  <div class="ov text-brand-muted dark:text-brand-muted-dark">Total time</div>
                  <div class="tabular text-brand-muted dark:text-brand-muted-dark">{{ race.total_time_ms != null ? formatMs(race.total_time_ms) : '—' }}</div>
                </div>
              </div>

              <div v-if="expanded[race.id]" class="mt-3 -mx-3 px-3 py-3 bg-brand-surface dark:bg-brand-surface-dark">
                <RaceExpandedDetails :notes="race.notes || ''" :lap-times="race.lap_times_ms" :roster="race.results_roster" />
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
              <tr class="text-left ov text-brand-muted dark:text-brand-muted-dark border-b-2 border-brand-strong dark:border-brand-strong-dark">
                <th class="px-3.5 pb-2.5 font-medium">Date</th>
                <th class="px-3.5 pb-2.5 font-medium">Track / Variation</th>
                <th class="px-3.5 pb-2.5 font-medium">Vehicle</th>
                <th class="px-3.5 pb-2.5 font-medium">Class (PI)</th>
                <th class="px-3.5 pb-2.5 font-medium text-right">Place</th>
                <th class="px-3.5 pb-2.5 font-medium text-right">Laps</th>
                <th class="px-3.5 pb-2.5 font-medium text-right">Lap time</th>
                <th class="px-3.5 pb-2.5 font-medium text-right">Total time</th>
                <th class="px-3.5 pb-2.5 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-brand-border dark:divide-brand-border-dark border-b border-brand-border dark:border-brand-border-dark">
              <template v-for="race in pageRows" :key="race.id">
                <tr v-if="!editing[race.id]" class="hover:bg-brand-surface dark:hover:bg-brand-surface-dark">
                  <td class="px-3.5 py-2 whitespace-nowrap tabular text-xs text-brand-muted dark:text-brand-muted-dark">
                    <span class="inline-flex items-center gap-1">
                      {{ formatDateTime(race.datetime) }}
                      <span
                        v-if="race.source === 'api'"
                        class="w-3 h-3 shrink-0 text-brand-accent dark:text-brand-accent-dark"
                        :title="apiSourceTitle(race)"
                        v-html="apiIcon"
                      ></span>
                    </span>
                  </td>
                  <td class="px-3.5 py-2">
                    <router-link
                      v-if="race.trackSlug && race.variationSlug"
                      :to="`/track/${race.trackSlug}/${race.variationSlug}`"
                      class="font-semibold text-brand-text dark:text-brand-text-dark hover:text-brand-accent dark:hover:text-brand-accent-dark"
                    >
                      {{ race.trackName }}
                      <span class="text-brand-muted dark:text-brand-muted-dark font-normal">— {{ race.variationName }}</span>
                    </router-link>
                    <span v-else class="text-brand-muted dark:text-brand-muted-dark">—</span>
                  </td>
                  <td class="px-3.5 py-2 text-brand-secondary dark:text-brand-secondary-dark">
                    {{ race.vehicleName }}
                  </td>
                  <td class="px-3.5 py-2 whitespace-nowrap">
                    <PerformanceIndexBadge :value="race.performance_index" />
                  </td>
                  <td class="px-3.5 py-2 text-right tabular-nums">
                    {{ race.place != null ? race.place : '—' }}
                  </td>
                  <td class="px-3.5 py-2 text-right tabular-nums text-brand-secondary dark:text-brand-secondary-dark">
                    {{ lapCount(race) }}
                  </td>
                  <td class="px-3.5 py-2 text-right tabular">
                    {{ race.lap_time_ms != null ? formatMs(race.lap_time_ms) : '—' }}
                  </td>
                  <td class="px-3.5 py-2 text-right tabular text-brand-muted dark:text-brand-muted-dark">
                    {{ race.total_time_ms != null ? formatMs(race.total_time_ms) : '—' }}
                  </td>
                  <td class="px-3.5 py-2 text-right whitespace-nowrap">
                    <RaceRowActions
                      :show-expand="!!(race.notes || hasLapTimes(race) || hasRoster(race))"
                      :expanded="!!expanded[race.id]"
                      @toggle-expand="toggleExpanded(race.id)"
                      @edit="editing[race.id] = true"
                      @delete="onDelete(race)"
                    />
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
                  <td colspan="9" class="px-3.5 py-3 bg-brand-surface dark:bg-brand-surface-dark">
                    <RaceExpandedDetails :notes="race.notes || ''" :lap-times="race.lap_times_ms" :roster="race.results_roster" />
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Pagination -->
      <div class="flex items-center justify-between gap-4 mt-5 flex-wrap">
        <span class="ov tabular text-brand-muted dark:text-brand-muted-dark">
          Showing {{ rangeStart }}–{{ rangeEnd }} of {{ total }}
        </span>
        <div v-if="totalPages > 1" class="flex flex-wrap items-center justify-end gap-1.5">
          <button
            :disabled="currentPage === 1"
            class="min-h-[44px] px-4 border border-brand-border dark:border-brand-border-dark text-[13px] text-brand-muted dark:text-brand-muted-dark disabled:opacity-40 hover:border-brand-accent"
            @click="currentPage--"
          >Prev</button>
          <button
            v-for="p in pageWindow"
            :key="p"
            type="button"
            class="tabular min-h-[44px] min-w-[44px] border text-[13px] font-semibold"
            :class="p === currentPage
              ? 'bg-brand-strong dark:bg-brand-strong-dark border-brand-strong dark:border-brand-strong-dark text-brand-bg dark:text-brand-bg-dark'
              : 'border-brand-border dark:border-brand-border-dark text-brand-muted dark:text-brand-muted-dark hover:border-brand-accent'"
            @click="currentPage = p"
          >{{ p }}</button>
          <button
            :disabled="currentPage === totalPages"
            class="min-h-[44px] px-4 border border-brand-border dark:border-brand-border-dark text-[13px] text-brand-muted dark:text-brand-muted-dark disabled:opacity-40 hover:border-brand-accent"
            @click="currentPage++"
          >Next</button>
        </div>
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
import { formatDateTime } from '../utils/dateFormat.js'
import { pushToast } from '../stores/toastStore.js'
import LapSplitsChart from '../components/LapSplitsChart.vue'
import RaceResultsRoster from '../components/RaceResultsRoster.vue'
import RaceForm from '../components/RaceForm.vue'
import ConfirmDialog from '../components/ConfirmDialog.vue'
import PerformanceIndexBadge from '../components/PerformanceIndexBadge.vue'
import RaceRowActions from '../components/RaceRowActions.vue'
import RaceExpandedDetails from '../components/RaceExpandedDetails.vue'
import apiIcon from '../assets/icons/api.svg?raw'
import refreshIcon from '../assets/icons/refresh.svg?raw'

function toLocalIsoMinute(isoString) {
  const d = new Date(isoString)
  const tzOffset = d.getTimezoneOffset() * 60_000
  return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16)
}

export default {
  name: 'RacesPage',
  components: { LapSplitsChart, RaceResultsRoster, RaceForm, ConfirmDialog, PerformanceIndexBadge, RaceRowActions, RaceExpandedDetails },
  data() {
    return {
      loading: true,
      refreshing: false,
      error: null,
      rows: [],
      vehicles: [],
      currentPage: 1,
      pageSize: 50,
      expanded: {},
      editing: {},
      saving: {},
      confirmDeleteRace: null,
      apiIcon,
      refreshIcon
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
    },
    rangeStart() {
      return this.total === 0 ? 0 : (this.currentPage - 1) * this.pageSize + 1
    },
    rangeEnd() {
      return Math.min(this.total, this.currentPage * this.pageSize)
    },
    // At most five numbered buttons, kept centred on the current page and
    // clamped so the window never runs off either end of the range.
    pageWindow() {
      const span = 5
      let first = Math.max(1, this.currentPage - Math.floor(span / 2))
      const last = Math.min(this.totalPages, first + span - 1)
      first = Math.max(1, last - span + 1)
      const out = []
      for (let p = first; p <= last; p++) out.push(p)
      return out
    }
  },
  async mounted() {
    await this.load()
  },
  methods: {
    // Shared by the initial mount and the header's refresh button. A refresh
    // only raises `refreshing`, never `loading`/`error` — the table stays on
    // screen (keeping expanded rows, page and page size), and a refresh that
    // fails leaves the rows already shown in place and reports by toast
    // rather than replacing the whole page with an error line.
    async load({ refresh = false } = {}) {
      if (refresh) this.refreshing = true
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

        // Races deleted elsewhere can shrink the list past the page being
        // viewed, which would otherwise leave an empty table.
        if (this.currentPage > this.totalPages) this.currentPage = this.totalPages

        // Clearing this is what swaps the error state's Retry button out for
        // the table, so a refresh doubles as the recovery path.
        this.error = null
        if (refresh) pushToast('Races refreshed', 'success', 1500)
      } catch (err) {
        const message = err.message || 'Failed to load races'
        if (!refresh) this.error = message
        pushToast(message, 'error')
      } finally {
        this.loading = false
        this.refreshing = false
      }
    },
    formatDateTime,
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
    apiSourceTitle(race) {
      return race.api_key?.name
        ? `Logged via API — key: ${race.api_key.name}`
        : 'Logged via API'
    },
    toggleExpanded(id) {
      this.expanded[id] = !this.expanded[id]
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
