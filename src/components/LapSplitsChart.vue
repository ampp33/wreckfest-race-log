<template>
  <div v-if="hasData" class="relative h-48">
    <canvas ref="canvas"></canvas>
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
  Legend,
  Filler
} from 'chart.js'
import { markRaw } from 'vue'
import { prefsStore } from '../stores/prefsStore.js'

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend, Filler)

const LINE_COLOR = '#C41E1E' // brand red

function formatMs(ms) {
  if (ms == null) return ''
  const totalSec = ms / 1000
  const minutes = Math.floor(totalSec / 60)
  const secs = (totalSec % 60).toFixed(3).padStart(6, '0')
  return minutes > 0 ? `${minutes}:${secs}` : secs
}

export default {
  name: 'LapSplitsChart',
  props: {
    // Per-lap times in milliseconds, in lap order (index 0 = lap 1).
    lapTimes: { type: Array, default: () => [] }
  },
  data() {
    return { chart: null }
  },
  computed: {
    isDark() {
      return prefsStore.darkMode
    },
    chartData() {
      const laps = Array.isArray(this.lapTimes) ? this.lapTimes : []
      if (!laps.some(ms => ms != null)) return null

      return {
        labels: laps.map((_, i) => `Lap ${i + 1}`),
        datasets: [{
          label: 'Lap time',
          data: laps.map(ms => (ms == null ? null : Number(ms))),
          borderColor: LINE_COLOR,
          backgroundColor: LINE_COLOR + '18',
          borderWidth: 2.5,
          pointRadius: 4,
          pointHoverRadius: 7,
          pointBackgroundColor: LINE_COLOR,
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          tension: 0.35,
          fill: false,
          spanGaps: true
        }]
      }
    },
    hasData() {
      return this.chartData !== null
    }
  },
  watch: {
    chartData: {
      handler() {
        this.$nextTick(() => this.renderChart())
      }
    },
    isDark() {
      this.$nextTick(() => this.renderChart())
    }
  },
  mounted() {
    this.renderChart()
  },
  beforeUnmount() {
    this.destroyChart()
  },
  methods: {
    destroyChart() {
      if (this.chart) {
        this.chart.destroy()
        this.chart = null
      }
    },
    renderChart() {
      this.destroyChart()
      if (!this.chartData || !this.$refs.canvas) return

      const dark = this.isDark
      const gridColor = dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)'
      const tickColor = dark ? '#B4B2A9' : '#5F5E5A'

      this.chart = markRaw(new Chart(this.$refs.canvas, {
        type: 'line',
        data: this.chartData,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: 'nearest', intersect: false },
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: dark ? '#222220' : '#fff',
              borderColor: dark ? '#383836' : '#C8C6BF',
              borderWidth: 1,
              titleColor: dark ? '#F5F4F0' : '#1C1C1A',
              bodyColor: dark ? '#B4B2A9' : '#5F5E5A',
              padding: 10,
              cornerRadius: 8,
              callbacks: {
                label: ctx => {
                  const ms = ctx.parsed.y
                  if (ms == null) return ''
                  return `  ${formatMs(ms)}`
                }
              }
            }
          },
          scales: {
            x: {
              grid: { color: gridColor, drawBorder: false },
              border: { display: false },
              ticks: { color: tickColor, font: { size: 11 }, maxRotation: 45 }
            },
            y: {
              grid: { color: gridColor, drawBorder: false },
              border: { display: false },
              ticks: {
                color: tickColor,
                font: { size: 11 },
                callback: ms => formatMs(ms)
              }
            }
          }
        }
      }))
    }
  }
}
</script>
