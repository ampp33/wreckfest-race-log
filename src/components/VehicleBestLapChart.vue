<template>
  <div
    v-if="rows.length"
    class="rule-top pt-5 mb-10"
  >
    <div class="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 mb-4">
      <div class="ov text-brand-muted dark:text-brand-muted-dark">
        Best lap by vehicle
      </div>
      <div class="flex items-center gap-4 text-xs text-brand-muted dark:text-brand-muted-dark">
        <span class="flex items-center gap-1.5">
          <span class="inline-block w-2.5 h-2.5 rounded-full border-2" :style="{ borderColor: firstColor }"></span>
          First lap
        </span>
        <span class="flex items-center gap-1.5">
          <span class="inline-block w-2.5 h-2.5 rounded-full" :style="{ backgroundColor: bestColor }"></span>
          Best lap
        </span>
      </div>
    </div>
    <!-- contain-inline-size: the canvas's px width mustn't count toward the
         page's min-content width (.wide-table-page), or it could never shrink. -->
    <div class="relative [contain:inline-size]" :style="{ height: `${rows.length * ROW_HEIGHT + 40}px` }">
      <canvas ref="canvas"></canvas>
    </div>
  </div>
</template>

<script>
import { chartMixin, getChartTheme } from '../utils/chart.js'
import { formatMsCompact, formatDelta } from '../utils/format.js'

const ROW_HEIGHT = 26

export default {
  name: 'VehicleBestLapChart',
  mixins: [chartMixin],
  props: {
    races: { type: Array, default: () => [] },
    vehicles: { type: Array, default: () => [] }
  },
  data() {
    return { ROW_HEIGHT }
  },
  computed: {
    bestColor() {
      return this.isDark ? '#E5332F' : '#C41E1E'
    },
    firstColor() {
      return this.isDark ? '#93918A' : '#8A8A87'
    },
    // One row per vehicle: the lap time from its earliest race and its best
    // lap, fastest first. The gap between the two dots is how much you've
    // improved in that car.
    rows() {
      const byVehicle = {}
      for (const race of this.races) {
        if (!race.lap_time_ms || !race.vehicle_id) continue
        const row = byVehicle[race.vehicle_id] ??= { first: null, firstAt: null, best: null, count: 0 }
        row.count++
        if (row.firstAt == null || race.datetime < row.firstAt) {
          row.firstAt = race.datetime
          row.first = race.lap_time_ms
        }
        if (row.best == null || race.lap_time_ms < row.best) row.best = race.lap_time_ms
      }
      const vehicleById = Object.fromEntries(this.vehicles.map(v => [v.id, v]))
      return Object.entries(byVehicle)
        .map(([vid, row]) => ({ name: vehicleById[vid]?.name ?? 'Unknown', ...row }))
        .sort((a, b) => a.best - b.best)
    }
  },
  watch: {
    rows() { this.$nextTick(this.renderChart) },
    isDark() { this.$nextTick(this.renderChart) }
  },
  mounted() {
    this.renderChart()
  },
  methods: {
    renderChart() {
      if (!this.rows.length) return
      const theme = getChartTheme(this.isDark)
      const surfaceColor = this.isDark ? '#222220' : '#EFEFED'
      const firstColor = this.firstColor
      const list = this.rows

      // Draws the first→best connector under the dots for each row.
      const connectors = {
        id: 'connectors',
        beforeDatasetsDraw(chart) {
          const { ctx, scales: { x, y } } = chart
          ctx.save()
          ctx.strokeStyle = firstColor
          ctx.globalAlpha = 0.5
          ctx.lineWidth = 2
          list.forEach((row, i) => {
            if (row.first === row.best) return
            ctx.beginPath()
            ctx.moveTo(x.getPixelForValue(row.first), y.getPixelForValue(i))
            ctx.lineTo(x.getPixelForValue(row.best), y.getPixelForValue(i))
            ctx.stroke()
          })
          ctx.restore()
        }
      }

      const pointsDataset = (label, key, color, filled) => ({
        label,
        data: list.map((row, i) => ({ x: row[key], y: i })),
        showLine: false,
        pointRadius: 5,
        pointHoverRadius: 7,
        pointHitRadius: 8,
        pointBackgroundColor: filled ? color : surfaceColor,
        pointBorderColor: filled ? surfaceColor : color,
        pointBorderWidth: 2,
        borderColor: color,
        backgroundColor: color
      })

      this.drawChart('canvas', {
        type: 'line',
        data: {
          datasets: [
            pointsDataset('First lap', 'first', firstColor, false),
            pointsDataset('Best lap', 'best', this.bestColor, true)
          ]
        },
        plugins: [connectors],
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: false,
          interaction: { mode: 'index', axis: 'y', intersect: false },
          plugins: {
            legend: { display: false },
            tooltip: {
              ...theme.tooltip,
              filter: item => item.datasetIndex === 1,
              callbacks: {
                title: items => list[items[0].parsed.y].name,
                label: ctx => {
                  const row = list[ctx.parsed.y]
                  const lines = [`  Best: ${formatMsCompact(row.best)}`]
                  if (row.first !== row.best) lines.push(`  First: ${formatMsCompact(row.first)} (${formatDelta(row.best - row.first)})`)
                  lines.push(`  ${row.count} race${row.count === 1 ? '' : 's'}`)
                  return lines
                }
              }
            }
          },
          scales: {
            x: {
              type: 'linear',
              position: 'top',
              grid: { color: theme.gridColor },
              border: { display: false },
              ticks: { color: theme.tickColor, font: { size: 11 }, callback: ms => formatMsCompact(ms) }
            },
            y: {
              type: 'linear',
              reverse: true,
              min: -0.5,
              max: list.length - 0.5,
              grid: { display: false },
              border: { display: false },
              afterBuildTicks: axis => { axis.ticks = list.map((_, i) => ({ value: i })) },
              ticks: { color: theme.tickColor, font: { size: 11 }, autoSkip: false, callback: value => list[value]?.name ?? '' }
            }
          }
        }
      })
    }
  }
}
</script>
