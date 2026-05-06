<template>
  <div class="max-w-4xl mx-auto px-4 py-6">
    <h1 class="text-2xl font-bold mb-1">Your stats</h1>
    <p class="text-sm text-slate-500 mb-6">
      Aggregated from all of your saved races.
    </p>

    <p v-if="loading" class="text-sm text-slate-500">Loading…</p>

    <div v-else class="space-y-6">
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="bg-white dark:bg-gray-800 rounded border border-slate-200 dark:border-slate-700 p-4">
          <div class="text-xs uppercase text-slate-500">Most used vehicle</div>
          <div class="mt-1 text-lg font-semibold">
            {{ stats.mostUsedVehicle ? stats.mostUsedVehicle.name : '—' }}
          </div>
          <div v-if="stats.mostUsedVehicle" class="text-xs text-slate-500">
            {{ stats.mostUsedVehicle.count }} races
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded border border-slate-200 dark:border-slate-700 p-4">
          <div class="text-xs uppercase text-slate-500">Most raced variation</div>
          <router-link
            v-if="stats.mostRacedVariation"
            :to="`/track/${stats.mostRacedVariation.trackSlug}/${stats.mostRacedVariation.variationSlug}`"
            class="block mt-1 font-semibold text-brand hover:underline"
          >
            {{ stats.mostRacedVariation.trackName }}
            <span class="text-slate-500 font-normal">
              — {{ stats.mostRacedVariation.variationName }}
            </span>
          </router-link>
          <div v-else class="mt-1 text-lg font-semibold">—</div>
          <div v-if="stats.mostRacedVariation" class="text-xs text-slate-500">
            {{ stats.mostRacedVariation.count }} races
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded border border-slate-200 dark:border-slate-700 p-4">
          <div class="text-xs uppercase text-slate-500">Total races</div>
          <div class="mt-1 text-lg font-semibold">{{ stats.totalRaces }}</div>
        </div>
      </div>

      <!-- <div class="bg-white dark:bg-gray-800 rounded border border-slate-200 dark:border-slate-700 p-4">
        <h2 class="text-sm font-semibold uppercase tracking-wider text-slate-800 dark:text-slate-200">Recent Races - last 24 hours ({{ stats.recentRaces.length }})</h2>
        <p v-if="!stats.recentRaces.length" class="text-sm text-slate-500 mt-1">
          No races in the past 24 hours.
        </p>
        <ul v-else class="divide-y divide-slate-100 dark:divide-slate-700">
          <li
            v-for="race in stats.recentRaces"
            :key="race.id"
            class="flex items-center justify-between py-2.5 text-sm"
          >
            <div>
              <router-link
                v-if="race.trackSlug && race.variationSlug"
                :to="`/track/${race.trackSlug}/${race.variationSlug}`"
                class="text-brand hover:underline"
              >
                {{ race.trackName }}
                <span class="text-slate-500 font-normal">— {{ race.variationName }}</span>
              </router-link>
              <span v-else class="text-slate-700 dark:text-slate-300">{{ race.trackName }}</span>
              <div class="text-xs text-slate-400 mt-0.5">{{ formatDate(race.datetime) }}</div>
            </div>
            <div class="flex items-center gap-4 shrink-0 ml-4">
              <div class="text-right">
                <div class="text-xs uppercase text-slate-500 leading-none mb-0.5">vehicle</div>
                <div class="text-sm">{{ race.vehicleName }}</div>
              </div>
              <div v-if="race.place != null" class="text-right">
                <div class="text-xs uppercase text-slate-500 leading-none mb-0.5">place</div>
                <div class="text-sm font-semibold">{{ race.place }}</div>
              </div>
              <div class="text-right">
                <div class="text-xs uppercase text-slate-500 leading-none mb-0.5">lap</div>
                <div class="font-mono text-sm">{{ race.lapTimeMs != null ? format(race.lapTimeMs) : '—' }}</div>
              </div>
            </div>
          </li>
        </ul>
      </div> -->

      <RaceActivityChart
        :hourly-counts="stats.raceCounts.hourlyCounts"
        :daily-counts="stats.raceCounts.dailyCounts"
      />

      <div class="bg-white dark:bg-gray-800 rounded border border-slate-200 dark:border-slate-700 p-4">
        <h2 class="text-sm font-semibold uppercase tracking-wider text-slate-800 dark:text-slate-200">Goal progress</h2>
        <p v-if="!stats.goalProgress.length" class="text-sm text-slate-500">
          No goals set — open a track and set a goal lap time to track your progress here.
        </p>
        <ul v-else class="divide-y divide-slate-100 dark:divide-slate-700">
          <li
            v-for="row in stats.goalProgress"
            :key="row.trackSlug + row.variationSlug"
            class="flex items-center justify-between py-2.5 text-sm"
          >
            <router-link
              :to="`/track/${row.trackSlug}/${row.variationSlug}`"
              class="text-brand hover:underline"
            >
              {{ row.trackName }}
              <span class="text-slate-500 font-normal">— {{ row.variationName }}</span>
            </router-link>
            <div class="flex items-center gap-4 shrink-0 ml-4">
              <div class="text-right">
                <div class="text-xs uppercase text-slate-500 leading-none mb-0.5">goal</div>
                <div class="font-mono text-sm">{{ format(row.goalMs) }}</div>
              </div>
              <div class="text-right">
                <div class="text-xs uppercase text-slate-500 leading-none mb-0.5">best</div>
                <div class="font-mono text-sm">{{ row.pbMs != null ? format(row.pbMs) : '—' }}</div>
              </div>
              <div class="text-right min-w-[3.5rem]">
                <div class="text-xs uppercase text-slate-500 leading-none mb-0.5">delta</div>
                <div
                  v-if="row.deltaMs != null"
                  class="font-mono text-sm font-semibold"
                  :class="row.deltaMs <= 0 ? 'text-green-600' : 'text-red-500'"
                >
                  {{ row.deltaMs <= 0 ? '-' : '+' }}{{ format(Math.abs(row.deltaMs)) }}
                </div>
                <div v-else class="font-mono text-sm text-slate-400">—</div>
              </div>
            </div>
          </li>
        </ul>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded border border-slate-200 dark:border-slate-700 p-4">
        <h2 class="text-sm font-semibold uppercase tracking-wider text-slate-800 dark:text-slate-200 mb-3">Biggest improvements (oldest → newest lap)</h2>
        <p v-if="!stats.biggestImprovements.length" class="text-sm text-slate-500">
          No improvement data yet — log more laps on the same variation.
        </p>
        <ul v-else class="space-y-2 text-sm">
          <li
            v-for="row in stats.biggestImprovements"
            :key="row.variationSlug + row.trackSlug"
            class="flex items-center justify-between"
          >
            <router-link
              :to="`/track/${row.trackSlug}/${row.variationSlug}`"
              class="text-brand hover:underline"
            >
              {{ row.trackName }} — {{ row.variationName }}
            </router-link>
            <span class="font-mono text-green-600">
              -{{ format(row.deltaMs) }}
            </span>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
import { getStats } from '../services/statsService.js'
import { formatMsToTime } from '../utils/timeFormat.js'
import { pushToast } from '../stores/toastStore.js'
import RaceActivityChart from '../components/RaceActivityChart.vue'

export default {
  name: 'StatsPage',
  components: { RaceActivityChart },
  data() {
    return {
      loading: true,
      stats: {
        mostUsedVehicle: null,
        mostRacedVariation: null,
        biggestImprovements: [],
        totalRaces: 0,
        goalProgress: [],
        raceCounts: { hourlyCounts: new Array(24).fill(0), dailyCounts: {} },
        recentRaces: []
      }
    }
  },
  async mounted() {
    try {
      this.stats = await getStats()
    } catch (err) {
      pushToast(err.message || 'Failed to load stats', 'error')
    } finally {
      this.loading = false
    }
  },
  methods: {
    format(ms) {
      return formatMsToTime(ms)
    },
    formatDate(isoString) {
      const d = new Date(isoString)
      return d.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }
}
</script>
