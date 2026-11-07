// Chart.js setup shared by every chart on the site.
import {
  Chart, LineController, BarController, LineElement, BarElement, PointElement,
  LinearScale, CategoryScale, Tooltip, Legend, Filler
} from 'chart.js'
import { prefsStore } from '../stores.js'

Chart.register(LineController, BarController, LineElement, BarElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend, Filler)

// Grid lines, tick labels and the tooltip box, so every chart looks alike.
export function getChartTheme(isDark) {
  const tickColor = isDark ? '#B4B2A9' : '#5F5E5A'
  return {
    gridColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)',
    tickColor,
    tooltip: {
      backgroundColor: isDark ? '#222220' : '#fff',
      borderColor: isDark ? '#383836' : '#C8C6BF',
      borderWidth: 1,
      titleColor: isDark ? '#F5F4F0' : '#1C1C1A',
      bodyColor: tickColor,
      padding: 10,
      cornerRadius: 8
    }
  }
}

// Owns a component's Chart.js instances: drawChart(ref, config) builds or
// replaces the chart on the <canvas ref="…">, and they're torn down on unmount.
export const chartMixin = {
  computed: {
    isDark() {
      return prefsStore.darkMode
    }
  },
  created() {
    // Not reactive on purpose: Chart.js instances mustn't be proxied.
    this.charts = {}
  },
  beforeUnmount() {
    Object.keys(this.charts).forEach(this.destroyChart)
  },
  methods: {
    drawChart(ref, config) {
      this.destroyChart(ref)
      if (this.$refs[ref]) this.charts[ref] = new Chart(this.$refs[ref], config)
    },
    destroyChart(ref) {
      this.charts[ref]?.stop()
      this.charts[ref]?.destroy()
      delete this.charts[ref]
    }
  }
}
