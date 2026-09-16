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

<script setup>
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import {
  Chart,
  BarController,
  BarElement,
  LinearScale,
  CategoryScale,
  Tooltip
} from 'chart.js'
import { prefsStore } from '../stores/prefsStore.js'
import { useChart } from '../composables/useChart.js'
import { getChartTheme } from '../utils/chartTheme.js'

Chart.register(BarController, BarElement, LinearScale, CategoryScale, Tooltip)

function localDateStr(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function addDays(date, n) {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

const props = defineProps({
  hourlyCounts: { type: Array, default: () => new Array(24).fill(0) },
  dailyCounts: { type: Object, default: () => ({}) },
  // Which tab is selected on mount — e.g. the homepage demo opens on
  // 'year' so it reads as races-per-month without requiring a click.
  initialTab: { type: String, default: 'week' }
})

const tabs = [
  { key: 'day', label: 'Day' },
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
  { key: 'year', label: 'Year' }
]

const canvas = ref(null)
const { chart, render } = useChart(canvas)
const activeTab = ref(props.initialTab)

const isDark = computed(() => prefsStore.darkMode)

const chartData = computed(() => {
  const now = new Date()
  if (activeTab.value === 'day') {
    const labels = Array.from({ length: 24 }, (_, h) => {
      const ampm = h < 12 ? 'am' : 'pm'
      const hour = h % 12 || 12
      return `${hour}${ampm}`
    })
    return { labels, data: [...props.hourlyCounts] }
  }

  if (activeTab.value === 'week') {
    const days = Array.from({ length: 7 }, (_, i) => addDays(now, i - 6))
    const labels = days.map(d => d.toLocaleDateString(undefined, { weekday: 'short', month: 'numeric', day: 'numeric' }))
    const data = days.map(d => props.dailyCounts[localDateStr(d)] || 0)
    return { labels, data }
  }

  if (activeTab.value === 'month') {
    const days = Array.from({ length: 30 }, (_, i) => addDays(now, i - 29))
    const labels = days.map(d => d.toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' }))
    const data = days.map(d => props.dailyCounts[localDateStr(d)] || 0)
    return { labels, data }
  }

  // year: past 12 months
  const months = []
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push(d)
  }
  const labels = months.map(d => d.toLocaleDateString(undefined, { month: 'short' }))
  const data = months.map(d => {
    const y = d.getFullYear()
    const m = d.getMonth()
    let total = 0
    for (const [dateStr, count] of Object.entries(props.dailyCounts)) {
      const pd = new Date(dateStr + 'T00:00:00')
      if (pd.getFullYear() === y && pd.getMonth() === m) total += count
    }
    return total
  })
  return { labels, data }
})

function renderChart() {
  if (!canvas.value) return

  const theme = getChartTheme(isDark.value)
  const barColor = '#C41E1E'
  const { labels, data } = chartData.value

  render({
    type: 'bar',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: barColor + 'cc',
        borderColor: barColor,
        borderWidth: 1,
        borderRadius: 3
      }]
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
          ticks: {
            color: theme.tickColor,
            font: { size: 10 },
            maxRotation: 45,
            autoSkip: true,
            maxTicksLimit: activeTab.value === 'month' ? 10 : 24
          }
        },
        y: {
          grid: { color: theme.gridColor, drawBorder: false },
          border: { display: false },
          beginAtZero: true,
          ticks: {
            color: theme.tickColor,
            font: { size: 11 },
            stepSize: 1,
            precision: 0
          }
        }
      }
    }
  })
}

watch(chartData, () => {
  nextTick(() => {
    if (chart.value) {
      const { labels, data } = chartData.value
      chart.value.data.labels = labels
      chart.value.data.datasets[0].data = data
      chart.value.update()
    } else {
      renderChart()
    }
  })
})
watch(isDark, () => nextTick(renderChart))
onMounted(renderChart)
</script>
