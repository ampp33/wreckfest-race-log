<template>
  <!-- contain-inline-size: keeps the canvas's px width out of the races
       table's min-content width (.wide-table-page), so it can still shrink. -->
  <div v-if="chartData" class="relative h-48 [contain:inline-size]">
    <canvas ref="canvas"></canvas>
  </div>
</template>

<script>
import { chartMixin, getChartTheme } from '../utils/chart.js'
import { formatMsCompact } from '../utils/format.js'

const LINE_COLOR = '#C41E1E' // brand red

export default {
  name: 'LapSplitsChart',
  mixins: [chartMixin],
  props: {
    // Per-lap times in milliseconds, in lap order (index 0 = lap 1).
    lapTimes: { type: Array, default: () => [] }
  },
  computed: {
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
    }
  },
  watch: {
    chartData() { this.$nextTick(this.renderChart) },
    isDark() { this.$nextTick(this.renderChart) }
  },
  mounted() {
    this.renderChart()
  },
  methods: {
    renderChart() {
      if (!this.chartData) return
      const theme = getChartTheme(this.isDark)
      const axis = { grid: { color: theme.gridColor, drawBorder: false }, border: { display: false } }
      this.drawChart('canvas', {
        type: 'line',
        data: this.chartData,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: 'nearest', intersect: false },
          plugins: {
            legend: { display: false },
            tooltip: {
              ...theme.tooltip,
              callbacks: {
                label: ctx => ctx.parsed.y == null ? '' : `  ${formatMsCompact(ctx.parsed.y)}`
              }
            }
          },
          scales: {
            x: { ...axis, ticks: { color: theme.tickColor, font: { size: 11 }, maxRotation: 45 } },
            y: { ...axis, ticks: { color: theme.tickColor, font: { size: 11 }, callback: ms => formatMsCompact(ms) } }
          }
        }
      })
    }
  }
}
</script>
