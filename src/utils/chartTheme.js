// Shared Chart.js dark/light styling — grid lines, tick labels, and the
// tooltip box — so every chart on the site looks consistent instead of each
// one re-declaring the same color literals.

export function getChartTheme(isDark) {
  const gridColor = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)'
  const tickColor = isDark ? '#B4B2A9' : '#5F5E5A'

  return {
    gridColor,
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
