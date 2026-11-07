<!-- The homepage's "Explore your stats" preview. Reuses the same
     StatsSummaryTiles / BiggestImprovementsList components as the real
     StatsPage.vue (minus its Goal Progress card, which the homepage already
     shows elsewhere via HomeGapTiles). Fed a real snapshot of this account's
     actual stats (see HomePage.vue) — including real daily/hourly activity
     that reconciles with itself: the hourly breakdown is one real day's
     actual hours (not an all-time sum dressed up as a single day), and every
     daily count is a real day from the same account. -->
<template>
  <div ref="wrapper" class="space-y-6">
    <StatsSummaryTiles :stats="stats" />

    <RaceActivityChart :hourly-counts="stats.hourlyCounts" :daily-counts="stats.dailyCounts" />

    <BiggestImprovementsList
      :items="stats.biggestImprovements"
      :fade-height="fadeHeight"
      :gradient-height="gradientHeight"
    />
  </div>
</template>

<script>
import RaceActivityChart from './RaceActivityChart.vue'
import StatsSummaryTiles from './StatsSummaryTiles.vue'
import BiggestImprovementsList from './BiggestImprovementsList.vue'
import { measuredFade } from '../utils/measuredFade.js'

export default {
  name: 'HomeStatsPreview',
  components: { RaceActivityChart, StatsSummaryTiles, BiggestImprovementsList },
  mixins: [measuredFade],
  // Reveal a sliver of the next item, so the fade has room to resolve.
  fadeBuffer: 0.85,
  props: {
    stats: { type: Object, required: true },
    // Fade the Biggest Improvements list just past this item index (real
    // rows still render past it — clipped, not removed). null = show all.
    improvementsFadeAfterIndex: { type: Number, default: null }
  },
  methods: {
    fadeElements() {
      const { wrapper } = this.$refs
      return [
        wrapper?.querySelector('ul'),
        this.improvementsFadeAfterIndex == null ? null : wrapper?.querySelector(`[data-fade-item="${this.improvementsFadeAfterIndex}"]`)
      ]
    }
  }
}
</script>
