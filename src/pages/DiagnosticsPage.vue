<template>
  <div class="max-w-4xl mx-auto px-4 py-6">
    <h1 class="text-2xl font-bold mb-1">Diagnostics</h1>
    <p class="text-sm text-slate-500 mb-6">Site-wide activity overview.</p>

    <p v-if="loading" class="text-sm text-slate-500">Loading…</p>

    <p v-else-if="error" class="text-sm text-red-500">{{ error }}</p>

    <div v-else class="space-y-6">
      <div class="bg-white dark:bg-gray-800 rounded border border-slate-200 dark:border-slate-700 p-4 inline-block">
        <div class="text-xs uppercase text-slate-500">Registered users</div>
        <div class="mt-1 text-3xl font-bold">{{ data.total_users }}</div>
      </div>

      <!-- User growth chart -->
      <div class="bg-white dark:bg-gray-800 rounded border border-slate-200 dark:border-slate-700 p-4">
        <h2 class="text-sm font-semibold uppercase tracking-wider text-slate-800 dark:text-slate-200 mb-3">
          User growth — last 30 days
        </h2>
        <div class="relative h-56">
          <canvas ref="growthCanvas"></canvas>
        </div>
      </div>

      <!-- Top users table -->
      <div class="bg-white dark:bg-gray-800 rounded border border-slate-200 dark:border-slate-700 p-4">
        <h2 class="text-sm font-semibold uppercase tracking-wider text-slate-800 dark:text-slate-200 mb-3">
          Top 5 users by activity
        </h2>
        <p v-if="!data.top_users || !data.top_users.length" class="text-sm text-slate-500">
          No activity yet.
        </p>
        <table v-else class="w-full text-sm">
          <thead>
            <tr class="text-left text-xs uppercase text-slate-500 border-b border-slate-200 dark:border-slate-700">
              <th class="pb-2 font-medium">User</th>
              <th class="pb-2 font-medium text-right">Races</th>
              <th class="pb-2 font-medium text-right">Goals</th>
              <th class="pb-2 font-medium text-right">Annotations</th>
              <th class="pb-2 font-medium text-right">Total</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-slate-700">
            <tr v-for="(user, i) in data.top_users" :key="user.email" class="hover:bg-slate-50 dark:hover:bg-slate-700/40">
              <td class="py-2 pr-4">
                <span class="text-slate-400 mr-2">{{ i + 1 }}.</span>
                {{ user.email }}
              </td>
              <td class="py-2 text-right tabular-nums">{{ user.race_count }}</td>
              <td class="py-2 text-right tabular-nums">{{ user.goal_count }}</td>
              <td class="py-2 text-right tabular-nums">{{ user.annotation_count }}</td>
              <td class="py-2 text-right tabular-nums font-semibold">{{ user.total_activity }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Filler
} from 'chart.js'
import { markRaw } from 'vue'
import { prefsStore } from '../stores/prefsStore.js'
import { getDiagnostics, getUserGrowth } from '../services/adminService.js'

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Filler)

export default {
  name: 'DiagnosticsPage',
  data() {
    return {
      loading: true,
      error: null,
      data: { total_users: 0, top_users: [] },
      growthData: [],
      chart: null
    }
  },
  computed: {
    isDark() {
      return prefsStore.darkMode
    }
  },
  watch: {
    isDark() {
      this.$nextTick(() => this.renderChart())
    }
  },
  async created() {
    try {
      ;[this.data, this.growthData] = await Promise.all([getDiagnostics(), getUserGrowth()])
    } catch (err) {
      this.error = err.message || 'Failed to load diagnostics'
    } finally {
      this.loading = false
    }
  },
  mounted() {
    if (!this.loading) this.renderChart()
  },
  updated() {
    if (!this.loading && !this.chart) this.renderChart()
  },
  beforeUnmount() {
    this.chart?.destroy()
  },
  methods: {
    renderChart() {
      if (!this.$refs.growthCanvas || !this.growthData.length) return
      this.chart?.destroy()

      const dark = this.isDark
      const color = '#0ea5e9'
      const gridColor = dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)'
      const tickColor = dark ? '#94a3b8' : '#64748b'

      const labels = this.growthData.map(row =>
        new Date(row.day).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
      )
      const counts = this.growthData.map(row => Number(row.user_count))

      this.chart = markRaw(new Chart(this.$refs.growthCanvas, {
        type: 'line',
        data: {
          labels,
          datasets: [{
            label: 'Total users',
            data: counts,
            borderColor: color,
            backgroundColor: color + '22',
            borderWidth: 2.5,
            pointRadius: 3,
            pointHoverRadius: 6,
            pointBackgroundColor: color,
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            tension: 0.35,
            fill: true
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: 'index', intersect: false },
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: dark ? '#1e293b' : '#fff',
              borderColor: dark ? '#334155' : '#e2e8f0',
              borderWidth: 1,
              titleColor: dark ? '#e2e8f0' : '#1e293b',
              bodyColor: dark ? '#94a3b8' : '#475569',
              padding: 10,
              cornerRadius: 8,
              callbacks: {
                label: ctx => `  ${ctx.parsed.y} users`
              }
            }
          },
          scales: {
            x: {
              grid: { color: gridColor },
              border: { display: false },
              ticks: { color: tickColor, font: { size: 11 }, maxRotation: 45, maxTicksLimit: 10 }
            },
            y: {
              grid: { color: gridColor },
              border: { display: false },
              beginAtZero: true,
              ticks: {
                color: tickColor,
                font: { size: 11 },
                precision: 0
              }
            }
          }
        }
      }))
    }
  }
}
</script>
