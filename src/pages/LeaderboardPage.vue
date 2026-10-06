<template>
  <div class="max-w-7xl mx-auto px-6 py-10">
    <ScopeKicker />
    <h1 class="font-heading font-normal tracking-normal leading-none text-display-lg text-brand-text dark:text-brand-text-dark mb-1">
      Leader<em class="signal">boards</em>
    </h1>
    <p class="font-body text-[15px] leading-relaxed text-brand-secondary dark:text-brand-secondary-dark mb-10 max-w-2xl">
      Who's logged the most racing, and the fastest lap anyone has set on every track.
    </p>

    <p v-if="loading" class="font-body text-[15px] text-brand-muted dark:text-brand-muted-dark">Loading…</p>
    <p v-else-if="error" class="text-sm text-brand-accent dark:text-brand-accent-dark">{{ error }}</p>

    <div v-else class="space-y-14">
      <!-- Most races -->
      <section>
        <h2 class="font-heading font-normal tracking-normal leading-none text-display-sm text-brand-text dark:text-brand-text-dark mb-4">
          Most <em class="signal">races</em>
        </h2>
        <p v-if="!mostRaces.length" class="font-body text-[15px] text-brand-muted dark:text-brand-muted-dark">No races logged yet.</p>
        <table v-else class="w-full text-sm">
          <thead>
            <tr class="text-left ov ov-lg text-brand-accent dark:text-brand-accent-dark border-b-2 border-brand-strong dark:border-brand-strong-dark">
              <th class="pr-6 pb-2.5 font-medium w-1">Driver</th>
              <th class="pb-2.5 font-medium">Races logged</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-brand-border dark:divide-brand-border-dark border-b border-brand-border dark:border-brand-border-dark">
            <tr v-for="row in mostRaces" :key="row.user_id">
              <td class="pr-6 py-2 whitespace-nowrap">
                <router-link
                  :to="`/${row.user_id}/races`"
                  class="font-semibold text-brand-text dark:text-brand-text-dark hover:text-brand-accent dark:hover:text-brand-accent-dark"
                >{{ row.display_name || '—' }}</router-link>
              </td>
              <td class="py-2">
                <!-- Bar length is relative to the leader, who fills the row;
                     the minimum width keeps the count readable on short bars. -->
                <div
                  class="min-w-[3rem] px-2 py-1 bg-brand-accent dark:bg-brand-accent-dark text-white text-xs font-semibold tabular"
                  :style="{ width: barWidth(row.race_count) }"
                >{{ row.race_count.toLocaleString() }}</div>
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <!-- Fastest laps -->
      <section>
        <h2 class="font-heading font-normal tracking-normal leading-none text-display-sm text-brand-text dark:text-brand-text-dark mb-1">
          Fastest <em class="signal">laps</em>
        </h2>
        <p class="font-body text-[15px] text-brand-muted dark:text-brand-muted-dark mb-4">
          The quickest lap logged on every track and variation{{ filterSuffix }}.
        </p>
        <div class="flex flex-wrap items-center gap-4 mb-5">
          <PiClassSlider v-model="piClass" label="Car class" />
          <!-- The native arrow hugs the right border, so it's swapped for the
               nav's chevron with room around it. -->
          <div class="relative">
            <select
              v-model="vehicleId"
              aria-label="Vehicle"
              class="appearance-none min-h-[54px] min-w-[14rem] border border-brand-border dark:border-brand-border-dark bg-brand-bg dark:bg-brand-surface-dark pl-4 pr-11 py-2 text-sm focus:outline-none focus:border-brand-accent dark:focus:border-brand-accent-dark"
              :class="vehicleId ? 'text-brand-text dark:text-brand-text-dark font-semibold' : 'text-brand-muted dark:text-brand-muted-dark'"
            >
              <option :value="null">All vehicles</option>
              <option v-for="v in vehicles" :key="v.id" :value="v.id">{{ v.name }}</option>
            </select>
            <span
              aria-hidden="true"
              class="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-brand-muted dark:text-brand-muted-dark"
              v-html="chevronDownIcon"
            ></span>
          </div>
        </div>

        <p v-if="lapsLoading" class="font-body text-[15px] text-brand-muted dark:text-brand-muted-dark">Loading…</p>
        <p v-else-if="lapsFailed[lapsKey]" class="text-sm text-brand-accent dark:text-brand-accent-dark">Couldn't load these laps — change a filter and back to retry.</p>
        <p v-else-if="!fastestLaps.length" class="font-body text-[15px] text-brand-muted dark:text-brand-muted-dark">
          No laps logged{{ filterSuffix }} yet.
        </p>

        <template v-else>
          <!-- Card layout (mobile) -->
          <div class="sm:hidden divide-y divide-brand-border dark:divide-brand-border-dark border-y border-brand-border dark:border-brand-border-dark">
            <div v-for="lap in fastestLaps" :key="lap.race_id" class="py-3">
              <div class="flex items-baseline justify-between gap-3">
                <router-link
                  :to="trackPath(lap)"
                  class="font-bold text-brand-text dark:text-brand-text-dark hover:text-brand-accent dark:hover:text-brand-accent-dark min-w-0"
                >
                  {{ lap.track_name }}
                  <span class="text-brand-muted dark:text-brand-muted-dark font-normal">— {{ lap.variation_name }}</span>
                </router-link>
                <span class="tabular font-semibold text-brand-accent dark:text-brand-accent-dark shrink-0">{{ formatMs(lap.lap_time_ms) }}</span>
              </div>
              <div class="grid grid-cols-2 gap-x-3 gap-y-1.5 mt-2 text-sm">
                <div>
                  <div class="ov text-brand-accent dark:text-brand-accent-dark">Driver</div>
                  <router-link :to="driverTrackPath(lap)" class="text-brand-secondary dark:text-brand-secondary-dark hover:text-brand-accent dark:hover:text-brand-accent-dark">{{ lap.display_name || '—' }}</router-link>
                </div>
                <div>
                  <div class="ov text-brand-accent dark:text-brand-accent-dark">Vehicle</div>
                  <div class="text-brand-secondary dark:text-brand-secondary-dark">{{ lap.vehicle_name || '—' }}</div>
                </div>
                <div>
                  <div class="ov text-brand-accent dark:text-brand-accent-dark">Class (PI)</div>
                  <div><PerformanceIndexBadge :value="lap.performance_index" /></div>
                </div>
                <div>
                  <div class="ov text-brand-accent dark:text-brand-accent-dark">Tune</div>
                  <div class="text-brand-secondary dark:text-brand-secondary-dark">{{ lap.tuning ?? '—' }}</div>
                </div>
                <div>
                  <div class="ov text-brand-accent dark:text-brand-accent-dark">Assists</div>
                  <div class="text-brand-secondary dark:text-brand-secondary-dark">{{ formatAssists(lap.assists) }}</div>
                </div>
                <div>
                  <div class="ov text-brand-accent dark:text-brand-accent-dark">Date</div>
                  <div class="text-brand-secondary dark:text-brand-secondary-dark">{{ formatDate(lap.datetime) }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Table layout (desktop) -->
          <div class="hidden sm:block overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="text-left ov ov-lg text-brand-accent dark:text-brand-accent-dark border-b-2 border-brand-strong dark:border-brand-strong-dark whitespace-nowrap">
                  <th class="px-3.5 pl-0 pb-2.5 font-medium">Track / Variation</th>
                  <th class="px-3.5 pb-2.5 font-medium text-right">Lap time</th>
                  <th class="px-3.5 pb-2.5 font-medium">Driver</th>
                  <th class="px-3.5 pb-2.5 font-medium">Vehicle</th>
                  <th class="px-3.5 pb-2.5 font-medium">Class (PI)</th>
                  <th class="px-3.5 pb-2.5 font-medium text-center">Tune</th>
                  <th class="px-3.5 pb-2.5 font-medium text-center">Assists</th>
                  <th class="px-3.5 pr-0 pb-2.5 font-medium">Date</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-brand-border dark:divide-brand-border-dark border-b border-brand-border dark:border-brand-border-dark">
                <tr v-for="lap in fastestLaps" :key="lap.race_id" class="hover:bg-brand-surface dark:hover:bg-brand-surface-dark">
                  <td class="px-3.5 pl-0 py-2">
                    <router-link
                      :to="trackPath(lap)"
                      class="font-semibold text-brand-text dark:text-brand-text-dark hover:text-brand-accent dark:hover:text-brand-accent-dark"
                    >
                      {{ lap.track_name }}
                      <span class="text-brand-muted dark:text-brand-muted-dark font-normal">— {{ lap.variation_name }}</span>
                    </router-link>
                  </td>
                  <td class="px-3.5 py-2 text-right tabular font-semibold text-brand-accent dark:text-brand-accent-dark">{{ formatMs(lap.lap_time_ms) }}</td>
                  <td class="px-3.5 py-2 whitespace-nowrap">
                    <router-link :to="driverTrackPath(lap)" class="text-brand-secondary dark:text-brand-secondary-dark hover:text-brand-accent dark:hover:text-brand-accent-dark">{{ lap.display_name || '—' }}</router-link>
                  </td>
                  <td class="px-3.5 py-2 whitespace-nowrap text-brand-secondary dark:text-brand-secondary-dark">{{ lap.vehicle_name || '—' }}</td>
                  <td class="px-3.5 py-2 whitespace-nowrap"><PerformanceIndexBadge :value="lap.performance_index" /></td>
                  <td class="px-3.5 py-2 text-center text-brand-secondary dark:text-brand-secondary-dark">{{ lap.tuning ?? '—' }}</td>
                  <td class="px-3.5 py-2 text-center text-brand-secondary dark:text-brand-secondary-dark">{{ formatAssists(lap.assists) }}</td>
                  <td class="px-3.5 pr-0 py-2 whitespace-nowrap tabular text-xs text-brand-muted dark:text-brand-muted-dark">{{ formatDate(lap.datetime) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>
      </section>
    </div>
  </div>
</template>

<script>
import PerformanceIndexBadge from '../components/PerformanceIndexBadge.vue'
import PiClassSlider from '../components/PiClassSlider.vue'
import ScopeKicker from '../components/ScopeKicker.vue'
import { getMostRacesLeaderboard, getFastestLaps } from '../services/leaderboardService.js'
import { getVehicles } from '../services/vehicleService.js'
import { formatMsToTime } from '../utils/timeFormat.js'
import { formatDate } from '../utils/dateFormat.js'
import { formatAssists } from '../utils/assistsFormat.js'
import { pushToast } from '../stores/toastStore.js'
import chevronDownIcon from '../assets/icons/chevron-down-outline.svg?raw'

export default {
  name: 'LeaderboardPage',
  components: { PerformanceIndexBadge, PiClassSlider, ScopeKicker },
  data() {
    return {
      loading: true,
      error: null,
      mostRaces: [],
      // Fastest laps per filter combination (class slider stop × vehicle),
      // fetched the first time each is picked and kept, so going back is instant.
      piClass: null,
      vehicleId: null,
      vehicles: [],
      lapsByFilter: {},
      lapsFailed: {},
      chevronDownIcon
    }
  },
  computed: {
    lapsKey() {
      return `${this.piClass || 'all'}|${this.vehicleId || 'all'}`
    },
    fastestLaps() {
      return this.lapsByFilter[this.lapsKey] || []
    },
    // Derived rather than toggled, so a quick second pick can't strand the
    // spinner: it's loading exactly while the selected filters have no result.
    lapsLoading() {
      return !(this.lapsKey in this.lapsByFilter) && !this.lapsFailed[this.lapsKey]
    },
    // " in class C in the Nexus RX", or whichever part applies.
    filterSuffix() {
      const vehicle = this.vehicles.find(v => v.id === this.vehicleId)
      return (this.piClass ? ` in class ${this.piClass}` : '') + (vehicle ? ` in the ${vehicle.name}` : '')
    },
    topRaceCount() {
      return this.mostRaces[0]?.race_count || 1
    }
  },
  async mounted() {
    try {
      const [mostRaces, fastestLaps] = await Promise.all([
        getMostRacesLeaderboard(25),
        getFastestLaps(),
        // The dropdown is a nice-to-have; without it the boards still work.
        getVehicles().then(vehicles => { this.vehicles = vehicles }, () => {})
      ])
      this.mostRaces = mostRaces
      this.lapsByFilter = { ...this.lapsByFilter, 'all|all': fastestLaps }
    } catch (err) {
      this.error = err.message || 'Failed to load leaderboards'
    } finally {
      this.loading = false
    }
  },
  watch: {
    async lapsKey(key) {
      if (key in this.lapsByFilter) return
      this.lapsFailed = { ...this.lapsFailed, [key]: false }
      try {
        const laps = await getFastestLaps(this.piClass, this.vehicleId)
        this.lapsByFilter = { ...this.lapsByFilter, [key]: laps }
      } catch (err) {
        this.lapsFailed = { ...this.lapsFailed, [key]: true }
        pushToast(err.message || 'Failed to load fastest laps', 'error')
      }
    }
  },
  methods: {
    formatDate,
    formatAssists,
    formatMs(ms) {
      return formatMsToTime(ms)
    },
    barWidth(count) {
      return `${(count / this.topRaceCount) * 100}%`
    },
    // Every driver's laps at this variation.
    trackPath(lap) {
      return `/community/track/${lap.track_slug}/${lap.variation_slug}`
    },
    // The record holder's own page for this variation.
    driverTrackPath(lap) {
      return `/${lap.user_id}/track/${lap.track_slug}/${lap.variation_slug}`
    }
  }
}
</script>
