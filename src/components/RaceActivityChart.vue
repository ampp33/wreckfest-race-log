<template>
  <div class="rule-top pt-5">
    <div class="flex items-center justify-between mb-4">
      <div class="ov text-brand-muted dark:text-brand-muted-dark">Race activity</div>
      <div class="flex gap-1">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          type="button"
          class="px-2.5 py-1 text-xs rounded font-medium transition-colors"
          :class="activeTab === tab.key
            ? 'bg-brand-accent text-white'
            : 'text-brand-muted dark:text-brand-muted-dark hover:text-brand-text dark:hover:text-brand-text-dark'"
          @click="activeTab = tab.key"
        >{{ tab.label }}</button>
      </div>
    </div>
    <div class="relative h-48">
      <canvas ref="canvas"></canvas>
    </div>
  </div>
</template>

<script>
import { chartMixin, getChartTheme } from '../utils/chart.js'

const BAR_COLOR = '#C41E1E'

function localDateStr(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

// The `count` days ending today, oldest first.
function lastDays(count) {
  const now = new Date()
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(now)
    d.setDate(d.getDate() + i - (count - 1))
    return d
  })
}

export default {
  name: 'RaceActivityChart',
  mixins: [chartMixin],
  props: {
    hourlyCounts: { type: Array, default: () => new Array(24).fill(0) },
    dailyCounts: { type: Object, default: () => ({}) },
    // The tab selected on mount — the homepage demo opens on 'year'.
    initialTab: { type: String, default: 'week' }
  },
  data() {
    return {
      activeTab: this.initialTab,
      tabs: [
        { key: 'day', label: 'Day' },
        { key: 'week', label: 'Week' },
        { key: 'month', label: 'Month' },
        { key: 'year', label: 'Year' }
      ]
    }
  },
  computed: {
    chartData() {
      if (this.activeTab === 'day') {
        const labels = Array.from({ length: 24 }, (_, h) => `${h % 12 || 12}${h < 12 ? 'am' : 'pm'}`)
        return { labels, data: [...this.hourlyCounts] }
      }

      if (this.activeTab === 'week' || this.activeTab === 'month') {
        const days = lastDays(this.activeTab === 'week' ? 7 : 30)
        const format = this.activeTab === 'week' ? { weekday: 'short', month: 'numeric', day: 'numeric' } : { month: 'numeric', day: 'numeric' }
        return {
          labels: days.map(d => d.toLocaleDateString(undefined, format)),
          data: days.map(d => this.dailyCounts[localDateStr(d)] || 0)
        }
      }

      // year: the past 12 months
      const now = new Date()
      const months = Array.from({ length: 12 }, (_, i) => new Date(now.getFullYear(), now.getMonth() - 11 + i, 1))
      return {
        labels: months.map(d => d.toLocaleDateString(undefined, { month: 'short' })),
        data: months.map(d => {
          let total = 0
          for (const [dateStr, count] of Object.entries(this.dailyCounts)) {
            const pd = new Date(dateStr + 'T00:00:00')
            if (pd.getFullYear() === d.getFullYear() && pd.getMonth() === d.getMonth()) total += count
          }
          return total
        })
      }
    }
  },
  watch: {
    // A cheaper in-place update while the chart exists.
    chartData() {
      this.$nextTick(() => {
        const chart = this.charts.canvas
        if (!chart) return this.renderChart()
        chart.data.labels = this.chartData.labels
        chart.data.datasets[0].data = this.chartData.data
        chart.update()
      })
    },
    isDark() { this.$nextTick(this.renderChart) }
  },
  mounted() {
    this.renderChart()
  },
  methods: {
    renderChart() {
      const theme = getChartTheme(this.isDark)
      const { labels, data } = this.chartData
      this.drawChart('canvas', {
        type: 'bar',
        data: {
          labels,
          datasets: [{ data, backgroundColor: BAR_COLOR + 'cc', borderColor: BAR_COLOR, borderWidth: 1, borderRadius: 3 }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: { duration: 400, easing: 'easeInOutQuart' },
          plugins: {
            legend: { display: false },
            tooltip: {
              ...theme.tooltip,
              callbacks: {
                label: ctx => `  ${ctx.parsed.y} race${ctx.parsed.y !== 1 ? 's' : ''}`
              }
            }
          },
          scales: {
            x: {
              grid: { display: false },
              border: { display: false },
              ticks: { color: theme.tickColor, font: { size: 10 }, maxRotation: 45, autoSkip: true, maxTicksLimit: this.activeTab === 'month' ? 10 : 24 }
            },
            y: {
              grid: { color: theme.gridColor, drawBorder: false },
              border: { display: false },
              beginAtZero: true,
              ticks: { color: theme.tickColor, font: { size: 11 }, stepSize: 1, precision: 0 }
            }
          }
        }
      })
    }
  }
}
</script>
