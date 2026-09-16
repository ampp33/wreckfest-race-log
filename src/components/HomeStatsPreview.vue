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

<script setup>
import { ref } from 'vue'
import RaceActivityChart from './RaceActivityChart.vue'
import StatsSummaryTiles from './StatsSummaryTiles.vue'
import BiggestImprovementsList from './BiggestImprovementsList.vue'
import { useMeasuredFade } from '../composables/useMeasuredFade.js'

const props = defineProps({
  stats: { type: Object, required: true },
  // Fade the Biggest Improvements list just past this item index (real
  // rows still render past it — clipped, not removed). null = show all.
  improvementsFadeAfterIndex: { type: Number, default: null }
})

const wrapper = ref(null)

// Same technique as HomeRacesTable's fade-after-index: measure the real
// bottom edge of the cutoff row and clip there, rather than a guessed pixel
// height. bufferRatio extends a bit past the target row (revealing a sliver
// of the next one) so the fade has room to resolve instead of landing right
// on the hard clip edge.
const { fadeHeight, gradientHeight } = useMeasuredFade(
  () => wrapper.value?.querySelector('ul'),
  () => props.improvementsFadeAfterIndex == null ? null : wrapper.value?.querySelector(`[data-fade-item="${props.improvementsFadeAfterIndex}"]`),
  { bufferRatio: 0.85 }
)
</script>
