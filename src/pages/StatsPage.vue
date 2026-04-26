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

      <div class="bg-white dark:bg-gray-800 rounded border border-slate-200 dark:border-slate-700 p-4">
        <h2 class="font-semibold mb-3">Biggest improvements (oldest → newest lap)</h2>
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

export default {
  name: 'StatsPage',
  data() {
    return {
      loading: true,
      stats: {
        mostUsedVehicle: null,
        mostRacedVariation: null,
        biggestImprovements: [],
        totalRaces: 0
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
    }
  }
}
</script>
