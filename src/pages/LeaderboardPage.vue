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
          The quickest lap logged on every track and variation{{ piClass ? ` in class ${piClass}` : '' }}.
        </p>
        <PiClassSlider v-model="piClass" label="Car class" class="mb-5" />

        <p v-if="lapsLoading" class="font-body text-[15px] text-brand-muted dark:text-brand-muted-dark">Loading…</p>
        <p v-else-if="lapsFailed[lapsKey]" class="text-sm text-brand-accent dark:text-brand-accent-dark">Couldn't load these laps — pick the class again to retry.</p>
        <p v-else-if="!fastestLaps.length" class="font-body text-[15px] text-brand-muted dark:text-brand-muted-dark">
          {{ piClass ? `No class ${piClass} laps logged yet.` : 'No laps logged yet.' }}
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
import { formatMsToTime } from '../utils/timeFormat.js'
import { formatDate } from '../utils/dateFormat.js'
import { formatAssists } from '../utils/assistsFormat.js'
import { pushToast } from '../stores/toastStore.js'

export default {
  name: 'LeaderboardPage',
  components: { PerformanceIndexBadge, PiClassSlider, ScopeKicker },
  data() {
    return {
      loading: true,
      error: null,
      mostRaces: [],
      // Fastest laps per class slider stop ('all', 'D'..'A'), fetched the
      // first time each is picked and kept, so sliding back is instant.
      piClass: null,
      lapsByClass: {},
      lapsFailed: {}
    }
  },
  computed: {
    lapsKey() {
      return this.piClass || 'all'
    },
    fastestLaps() {
      return this.lapsByClass[this.lapsKey] || []
    },
    // Derived rather than toggled, so a quick second pick can't strand the
    // spinner: it's loading exactly while the selected class has no result.
    lapsLoading() {
      return !(this.lapsKey in this.lapsByClass) && !this.lapsFailed[this.lapsKey]
    },
    topRaceCount() {
      return this.mostRaces[0]?.race_count || 1
    }
  },
  async mounted() {
    try {
      const [mostRaces, fastestLaps] = await Promise.all([
        getMostRacesLeaderboard(25),
        getFastestLaps()
      ])
      this.mostRaces = mostRaces
      this.lapsByClass = { all: fastestLaps }
    } catch (err) {
      this.error = err.message || 'Failed to load leaderboards'
    } finally {
      this.loading = false
    }
  },
  watch: {
    async piClass(piClass) {
      const key = this.lapsKey
      if (key in this.lapsByClass) return
      this.lapsFailed = { ...this.lapsFailed, [key]: false }
      try {
        const laps = await getFastestLaps(piClass)
        this.lapsByClass = { ...this.lapsByClass, [key]: laps }
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
