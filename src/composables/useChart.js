import { shallowRef, onBeforeUnmount, markRaw } from 'vue'
import { Chart } from 'chart.js'

// Owns a Chart.js instance's lifecycle: build/replace it via render(config),
// and always tear it down on unmount. Each chart component still builds its
// own Chart.js config (data/options genuinely differ per chart) and calls
// render(config); the returned `chart` ref is exposed so a caller can also
// mutate it directly and call chart.value.update() for a cheaper in-place
// refresh instead of a full rebuild.
export function useChart(canvasRef) {
  const chart = shallowRef(null)

  function destroy() {
    if (chart.value) {
      chart.value.stop()
      chart.value.destroy()
      chart.value = null
    }
  }

  function render(config) {
    destroy()
    if (!canvasRef.value) return
    chart.value = markRaw(new Chart(canvasRef.value, config))
  }

  onBeforeUnmount(destroy)

  return { chart, render, destroy }
}
