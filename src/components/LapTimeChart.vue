<template>
  <div
    v-if="hasData"
    class="rule-top pt-5 mb-10"
  >
    <div class="ov text-brand-muted dark:text-brand-muted-dark mb-4">
      Lap times over time
    </div>
    <div class="relative h-64">
      <canvas ref="canvas"></canvas>
    </div>
  </div>
</template>

<script setup>
import { computed, watch, nextTick, ref, onMounted } from 'vue'
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
import { prefsStore } from '../stores/prefsStore.js'
import { useChart } from '../composables/useChart.js'
import { getChartTheme } from '../utils/chartTheme.js'
import { formatMsCompact } from '../utils/timeFormat.js'

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend, Filler)

const PALETTE = [
  '#C41E1E', // brand red
  '#E55555', // light red
  '#8B1212', // dark crimson
  '#F97316', // vivid orange
  '#FB923C', // light orange
  '#C05308', // burnt orange
  '#999999', // light gray
  '#666666', // dark gray
]

const props = defineProps({
  races: { type: Array, default: () => [] },
  vehicles: { type: Array, default: () => [] }
})

const canvas = ref(null)
const { render } = useChart(canvas)

const isDark = computed(() => prefsStore.darkMode)

const chartData = computed(() => {
  const byVehicle = {}
  const byDate = {}
  for (const race of props.races) {
    if (!race.lap_time_ms || !race.vehicle_id) continue
    const day = race.datetime.substring(0, 10)
    if (!byVehicle[race.vehicle_id]) byVehicle[race.vehicle_id] = {}
    const cur = byVehicle[race.vehicle_id][day]
    if (cur == null || race.lap_time_ms < cur) {
      byVehicle[race.vehicle_id][day] = race.lap_time_ms
    }
    if (byDate[day] == null || race.lap_time_ms < byDate[day]) {
      byDate[day] = race.lap_time_ms
    }
  }

  const vehicleIds = Object.keys(byVehicle)
  if (!vehicleIds.length) return null

  const dateSet = new Set()
  for (const vid of vehicleIds) {
    for (const d of Object.keys(byVehicle[vid])) dateSet.add(d)
  }
  const sortedDates = [...dateSet].sort()
  const labels = sortedDates.map(d => {
    const [year, month, day] = d.split('-').map(Number)
    return new Date(year, month - 1, day).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric'
    })
  })

  const vehicleById = Object.fromEntries(props.vehicles.map(v => [v.id, v]))
  const datasets = vehicleIds.map((vid, i) => {
    const color = PALETTE[i % PALETTE.length]
    return {
      label: vehicleById[vid]?.name ?? 'Unknown',
      data: sortedDates.map(d => byVehicle[vid][d] ?? null),
      borderColor: color,
      backgroundColor: color + '18',
      borderWidth: 2.5,
      pointRadius: 4,
      pointHoverRadius: 7,
      pointBackgroundColor: color,
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      tension: 0.35,
      fill: false,
      spanGaps: true
    }
  })

  datasets.push({
    label: 'Fastest Lap',
    data: sortedDates.map(d => byDate[d] ?? null),
    borderColor: '#000000',
    backgroundColor: '#00000018',
    borderWidth: 2.5,
    pointRadius: 4,
    pointHoverRadius: 7,
    pointBackgroundColor: '#000000',
    pointBorderColor: '#fff',
    pointBorderWidth: 2,
    tension: 0.35,
    fill: false,
    spanGaps: true
  })

  return { labels, datasets }
})

const hasData = computed(() => chartData.value !== null)

function renderChart() {
  if (!chartData.value || !canvas.value) return

  const dark = isDark.value
  const theme = getChartTheme(dark)
  const surfaceColor = dark ? '#222220' : '#EFEFED'

  const inlineLabels = {
    id: 'inlineLabels',
    afterDatasetsDraw(chart) {
      const { ctx, chartArea } = chart
      ctx.save()
      ctx.font = '500 11px system-ui, sans-serif'
      ctx.textAlign = 'left'
      ctx.textBaseline = 'middle'
      ctx.lineJoin = 'round'
      ctx.strokeStyle = surfaceColor
      ctx.lineWidth = 3

      const entries = []
      chart.data.datasets.forEach((dataset, i) => {
        const meta = chart.getDatasetMeta(i)
        if (meta.hidden) return
        let lastPoint = null
        for (let j = meta.data.length - 1; j >= 0; j--) {
          if (meta.data[j] && !meta.data[j].skip) { lastPoint = meta.data[j]; break }
        }
        if (!lastPoint) return
        entries.push({ label: dataset.label, color: dataset.borderColor, x: lastPoint.x, y: lastPoint.y })
      })

      // Push overlapping labels apart vertically so they stay readable.
      entries.sort((a, b) => a.y - b.y)
      const minGap = 14
      for (let i = 1; i < entries.length; i++) {
        if (entries[i].y - entries[i - 1].y < minGap) {
          entries[i].y = entries[i - 1].y + minGap
        }
      }
      const overflow = entries.length ? entries[entries.length - 1].y - chartArea.bottom : 0
      if (overflow > 0) {
        for (const entry of entries) entry.y -= overflow
      }

      entries.forEach(entry => {
        ctx.strokeText(entry.label, entry.x + 8, entry.y)
        ctx.fillStyle = entry.color
        ctx.fillText(entry.label, entry.x + 8, entry.y)
      })

      ctx.restore()
    }
  }

  render({
    type: 'line',
    data: chartData.value,
    plugins: [inlineLabels],
    options: {
      responsive: true,
      maintainAspectRatio: false,
      layout: { padding: { right: 90 } },
      interaction: { mode: 'nearest', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          ...theme.tooltip,
          callbacks: {
            label: ctx => {
              const ms = ctx.parsed.y
              if (ms == null) return ''
              return `  ${ctx.dataset.label}: ${formatMsCompact(ms)}`
            }
          }
        }
      },
      scales: {
        x: {
          grid: { color: theme.gridColor, drawBorder: false },
          border: { display: false },
          ticks: { color: theme.tickColor, font: { size: 11 }, maxRotation: 45 }
        },
        y: {
          grid: { color: theme.gridColor, drawBorder: false },
          border: { display: false },
          ticks: {
            color: theme.tickColor,
            font: { size: 11 },
            callback: ms => formatMsCompact(ms)
          }
        }
      }
    }
  })
}

watch(chartData, () => nextTick(renderChart))
watch(isDark, () => nextTick(renderChart))
onMounted(renderChart)
</script>
