<!-- The homepage's "Explore your stats" preview. Markup ported verbatim from
     the real StatsPage.vue (the tile grid, the real RaceActivityChart
     component, and the Biggest Improvements card) minus the Goal Progress
     card, which the homepage already shows elsewhere via HomeGapTiles.
     Fed a real snapshot of this account's actual stats (see HomePage.vue) —
     including real daily/hourly activity that reconciles with itself: the
     hourly breakdown is one real day's actual hours (not an all-time sum
     dressed up as a single day), and every daily count is a real day from
     the same account. -->
<template>
  <div class="space-y-6">
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div class="bg-brand-surface dark:bg-brand-surface-dark rounded border border-brand-border dark:border-brand-border-dark p-4">
        <div class="font-body font-medium uppercase tracking-widest text-[11px] text-brand-muted dark:text-brand-muted-dark">Most used vehicle</div>
        <div class="mt-1 font-display font-black tracking-tight text-2xl text-brand-text dark:text-brand-text-dark">{{ stats.mostUsedVehicle.name }}</div>
        <div class="font-body text-[15px] text-brand-muted dark:text-brand-muted-dark">{{ stats.mostUsedVehicle.count }} races</div>
      </div>

      <div class="bg-brand-surface dark:bg-brand-surface-dark rounded border border-brand-border dark:border-brand-border-dark p-4">
        <div class="font-body font-medium uppercase tracking-widest text-[11px] text-brand-muted dark:text-brand-muted-dark">Most raced variation</div>
        <router-link
          :to="`/track/${stats.mostRacedVariation.trackSlug}/${stats.mostRacedVariation.variationSlug}`"
          class="block mt-1 font-display font-black tracking-tight text-2xl text-brand-accent hover:underline"
        >
          {{ stats.mostRacedVariation.trackName }}
          <span class="font-body font-normal text-base text-brand-muted dark:text-brand-muted-dark">— {{ stats.mostRacedVariation.variationName }}</span>
        </router-link>
        <div class="font-body text-[15px] text-brand-muted dark:text-brand-muted-dark">{{ stats.mostRacedVariation.count }} races</div>
      </div>

      <div class="bg-brand-surface dark:bg-brand-surface-dark rounded border border-brand-border dark:border-brand-border-dark p-4">
        <div class="font-body font-medium uppercase tracking-widest text-[11px] text-brand-muted dark:text-brand-muted-dark">Total races</div>
        <div class="mt-1 font-display font-black tracking-tight text-2xl text-brand-text dark:text-brand-text-dark">{{ stats.totalRaces }}</div>
      </div>
    </div>

    <RaceActivityChart :hourly-counts="stats.hourlyCounts" :daily-counts="stats.dailyCounts" />

    <div class="bg-brand-surface dark:bg-brand-surface-dark rounded border border-brand-border dark:border-brand-border-dark p-4">
      <h2 class="font-display font-black tracking-tighter leading-none text-display-sm text-brand-text dark:text-brand-text-dark mb-3">
        Biggest <em class="signal">improvements</em> (oldest -> newest lap)
      </h2>
      <!-- Same technique as HomeRacesTable's fade-after-index: measure the
           real bottom edge of the cutoff row and clip there, rather than a
           guessed pixel height. The gradient here fades to brand-surface
           (this card's own background), not brand-bg like the races table —
           it's sitting on a grey card, not the page background, so fading
           to the wrong color would show as a mismatched patch instead of a
           seamless dissolve. -->
      <div class="relative" :style="improvementsFadeHeight ? { maxHeight: improvementsFadeHeight + 'px', overflow: 'hidden' } : null">
        <ul class="space-y-2 text-sm">
          <li
            v-for="(row, i) in stats.biggestImprovements"
            :key="row.variationSlug + row.trackSlug"
            :data-fade-item="i"
            class="flex items-center justify-between"
          >
            <router-link :to="`/track/${row.trackSlug}/${row.variationSlug}`" class="text-brand-accent hover:underline font-body">
              {{ row.trackName }} — {{ row.variationName }}
            </router-link>
            <span class="font-mono text-green-600">-{{ formatMsToTime(row.deltaMs) }}</span>
          </li>
        </ul>
        <div
          v-if="improvementsFadeHeight"
          aria-hidden="true"
          class="absolute bottom-0 left-0 right-0 pointer-events-none bg-gradient-to-b from-transparent to-brand-surface dark:to-brand-surface-dark"
          :style="{ height: improvementsGradientHeight + 'px' }"
        ></div>
      </div>
    </div>
  </div>
</template>

<script>
import RaceActivityChart from './RaceActivityChart.vue'
import { formatMsToTime } from '../utils/timeFormat.js'

export default {
  name: 'HomeStatsPreview',
  components: { RaceActivityChart },
  props: {
    stats: { type: Object, required: true },
    // Fade the Biggest Improvements list just past this item index (real
    // rows still render past it — clipped, not removed). null = show all.
    improvementsFadeAfterIndex: { type: Number, default: null }
  },
  data() {
    return { improvementsFadeHeight: null, improvementsGradientHeight: null }
  },
  mounted() {
    this.measureImprovementsFade()
    window.addEventListener('resize', this.measureImprovementsFade)
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.measureImprovementsFade)
  },
  methods: {
    formatMsToTime,
    measureImprovementsFade() {
      if (this.improvementsFadeAfterIndex == null) return
      const list = this.$el.querySelector('ul')
      const wrapper = list && list.parentElement
      const targetItem = this.$el.querySelector(`[data-fade-item="${this.improvementsFadeAfterIndex}"]`)
      if (!wrapper || !targetItem) return
      const wrapperTop = wrapper.getBoundingClientRect().top
      const itemRect = targetItem.getBoundingClientRect()
      // The gradient was landing right on the hard clip edge with barely
      // any room to resolve, which reads as a sharp cut rather than a
      // fade — extend a bit past the target row (revealing a sliver of the
      // next one) so the fade has the item's own height plus that buffer to
      // work with, and finishes with margin to spare before the hard clip.
      const buffer = Math.round(itemRect.height * 0.85)
      this.improvementsFadeHeight = Math.ceil(itemRect.bottom - wrapperTop + buffer)
      this.improvementsGradientHeight = Math.ceil(itemRect.height + buffer)
    }
  }
}
</script>
