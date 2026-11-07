<template>
  <DriverScope :user-id="userId" class="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
    <h1 class="font-heading font-normal tracking-normal leading-none text-display-lg text-brand-text dark:text-brand-text-dark mb-1">
      Stats
    </h1>
    <p class="font-body text-[15px] leading-relaxed text-brand-secondary dark:text-brand-secondary-dark mb-6">
      Aggregated from all of {{ isOwnView ? 'your' : 'their' }} saved {{ prefs.piClass ? `class ${prefs.piClass} ` : '' }}races.
    </p>

    <p v-if="loading" class="font-body text-[15px] text-brand-muted dark:text-brand-muted-dark">Loading…</p>

    <div v-else class="space-y-6">
      <StatsSummaryTiles :stats="stats" :base-path="`/${userId}`" />

      <PlacementRateTiles :rates="{ 3: stats.top3Rate, 5: stats.top5Rate, 10: stats.top10Rate }" />
      <p class="text-xs text-brand-muted dark:text-brand-muted-dark italic mt-2">
        Excludes lone races (a race with a roster, but only one racer) and races with no place logged.
      </p>

      <RaceActivityChart
        :hourly-counts="stats.raceCounts.hourlyCounts"
        :daily-counts="stats.raceCounts.dailyCounts"
      />

      <div class="bg-brand-surface dark:bg-brand-surface-dark rounded border border-brand-border dark:border-brand-border-dark p-4">
        <h2 class="font-heading font-normal tracking-normal leading-none text-display-sm text-brand-text dark:text-brand-text-dark mb-3">
          Number of races per <em class="signal">vehicle</em>
        </h2>
        <p v-if="!stats.vehicleCounts.length" class="font-body text-[15px] text-brand-muted dark:text-brand-muted-dark">
          No races logged yet.
        </p>
        <table v-else class="w-full text-sm">
          <tbody class="divide-y divide-brand-border dark:divide-brand-border-dark">
            <tr v-for="row in stats.vehicleCounts" :key="row.id">
              <td class="pr-6 py-2 w-1 whitespace-nowrap">
                <router-link
                  :to="{ path: `/${userId}/races`, query: { vehicle_id: row.id } }"
                  class="font-semibold text-brand-text dark:text-brand-text-dark hover:text-brand-accent dark:hover:text-brand-accent-dark"
                >{{ row.name }}</router-link>
              </td>
              <td class="py-2">
                <!-- Same bars as the leaderboard: relative to the most-used
                     vehicle, with a minimum width so the count stays readable. -->
                <div
                  class="min-w-[3rem] px-2 py-1 bg-brand-accent dark:bg-brand-accent-dark text-white text-xs font-semibold tabular"
                  :style="{ width: `${(row.count / stats.vehicleCounts[0].count) * 100}%` }"
                >{{ row.count.toLocaleString() }}</div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </DriverScope>
</template>

<script>
import { getStats } from '../utils/stats.js'
import { pushToast, prefsStore } from '../stores.js'
import { scopedPage } from '../utils/scope.js'
import RaceActivityChart from '../components/RaceActivityChart.vue'
import StatsSummaryTiles from '../components/StatsSummaryTiles.vue'
import PlacementRateTiles from '../components/PlacementRateTiles.vue'
import DriverScope from '../components/DriverScope.vue'

export default {
  name: 'StatsPage',
  components: { DriverScope, RaceActivityChart, StatsSummaryTiles, PlacementRateTiles },
  mixins: [scopedPage],
  data() {
    return {
      prefs: prefsStore,
      loading: true,
      stats: {
        mostUsedVehicle: null,
        mostRacedVariation: null,
        vehicleCounts: [],
        totalRaces: 0,
        raceCounts: { hourlyCounts: new Array(24).fill(0), dailyCounts: {} },
        recentRaces: [],
        top3Rate: { count: 0, total: 0, pct: '—' },
        top5Rate: { count: 0, total: 0, pct: '—' },
        top10Rate: { count: 0, total: 0, pct: '—' }
      }
    }
  },
  watch: {
    userId() {
      if (this.$route.name === 'driver-stats') this.load()
    },
    // The nav's car-class filter.
    'prefs.piClass'() {
      if (this.$route.name === 'driver-stats') this.load()
    }
  },
  mounted() {
    this.load()
  },
  methods: {
    async load() {
      this.loading = true
      // Switching driver or class mid-load starts another; only the newest lands.
      const token = (this.loadToken = (this.loadToken || 0) + 1)
      try {
        const stats = await getStats(this.userId, { piClass: this.prefs.piClass })
        if (token === this.loadToken) this.stats = stats
      } catch (err) {
        if (token === this.loadToken) pushToast(err.message || 'Failed to load stats', 'error')
      } finally {
        if (token === this.loadToken) this.loading = false
      }
    }
  }
}
</script>
