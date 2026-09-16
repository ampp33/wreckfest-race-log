<template>
  <div v-if="hasData" class="relative h-48">
    <canvas ref="canvas"></canvas>
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

const LINE_COLOR = '#C41E1E' // brand red

const props = defineProps({
  // Per-lap times in milliseconds, in lap order (index 0 = lap 1).
  lapTimes: { type: Array, default: () => [] }
})

const canvas = ref(null)
const { render } = useChart(canvas)

const isDark = computed(() => prefsStore.darkMode)

const chartData = computed(() => {
  const laps = Array.isArray(props.lapTimes) ? props.lapTimes : []
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
})

const hasData = computed(() => chartData.value !== null)

function renderChart() {
  if (!chartData.value || !canvas.value) return

  const theme = getChartTheme(isDark.value)

  render({
    type: 'line',
    data: chartData.value,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'nearest', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          ...theme.tooltip,
          callbacks: {
            label: ctx => {
              const ms = ctx.parsed.y
              if (ms == null) return ''
              return `  ${formatMsCompact(ms)}`
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
