<template>
  <div class="max-w-6xl mx-auto px-6 py-10">
    <h1 class="font-display font-black tracking-tightest leading-none text-display-lg text-brand-text dark:text-brand-text-dark">
      Races
    </h1>
    <p class="font-body text-[15px] leading-relaxed text-brand-muted dark:text-brand-muted-dark mt-3.5 mb-10">
      <span class="tabular font-semibold text-brand-text dark:text-brand-text-dark">{{ total }}</span> logged, newest first.
    </p>

    <p v-if="loading" class="font-body text-[15px] text-brand-muted dark:text-brand-muted-dark">Loading…</p>
    <p v-else-if="error" class="text-sm text-red-500">{{ error }}</p>

    <div v-else>
      <!-- Controls row -->
      <div class="flex items-end justify-between mb-6 gap-4 flex-wrap">
        <div class="ov text-brand-muted dark:text-brand-muted-dark">
          {{ total }} race{{ total === 1 ? '' : 's' }}
        </div>
        <div class="flex items-center gap-3">
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
                <div class="text-xs text-brand-muted dark:text-brand-muted-dark">{{ formatDate(race.datetime) }}</div>
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
              </tr>
            </thead>
            <tbody class="divide-y divide-brand-border dark:divide-brand-border-dark border-b border-brand-border dark:border-brand-border-dark">
              <tr
                v-for="race in pageRows"
                :key="race.id"
                class="hover:bg-brand-surface dark:hover:bg-brand-surface-dark"
              >
                <td class="px-3.5 py-2 whitespace-nowrap text-brand-muted dark:text-brand-muted-dark text-xs">
                  {{ formatDate(race.datetime) }}
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
                  <template v-if="race.performance_index != null">
                    <span class="font-bold" :style="{ color: piInfo(race.performance_index).color }">{{ piInfo(race.performance_index).cls }}</span>
                    {{ race.performance_index }}
                  </template>
                  <span v-else class="text-brand-muted dark:text-brand-muted-dark">—</span>
                </td>
                <td class="px-3.5 py-2 text-right tabular-nums">
                  {{ race.place != null ? race.place : '—' }}
                </td>
                <td class="px-3.5 py-2 text-right tabular-nums text-brand-secondary dark:text-brand-secondary-dark">
                  {{ lapCount(race) }}
                </td>
                <td class="px-3.5 py-2 text-right font-mono tabular-nums">
                  {{ race.lap_time_ms != null ? formatMs(race.lap_time_ms) : '—' }}
                </td>
                <td class="px-3.5 py-2 text-right font-mono tabular-nums text-brand-muted dark:text-brand-muted-dark">
                  {{ race.total_time_ms != null ? formatMs(race.total_time_ms) : '—' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Pagination -->
      <div class="flex items-center justify-between gap-4 mt-5 flex-wrap">
        <span class="ov tabular text-brand-muted dark:text-brand-muted-dark">
          Showing {{ rangeStart }}–{{ rangeEnd }} of {{ total }}
        </span>
        <div v-if="totalPages > 1" class="flex items-center gap-1.5">
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
  </div>
</template>

<script>
import { getAllRaces } from '../services/raceService.js'
import { getTracks } from '../services/trackService.js'
import { getVehicles } from '../services/vehicleService.js'
import { formatMsToTime } from '../utils/timeFormat.js'
import { piInfo } from '../utils/piInfo.js'
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
    },
    rangeStart() {
      return this.total === 0 ? 0 : (this.currentPage - 1) * this.pageSize + 1
    },
    rangeEnd() {
      return Math.min(this.total, this.currentPage * this.pageSize)
    },
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
