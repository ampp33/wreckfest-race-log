<!-- The homepage's races preview table. Matches the real expanded-row
     behavior on RacesPage.vue / RaceRow.vue exactly (Notes, then Lap times,
     then Roster, stacked full width — not a side-by-side split). Fed a
     small set of real races (see HomePage.vue) rather than the live
     per-user API, since this renders for signed-out visitors.

     `fade-after-index` clips the table just past that row and overlays a
     gradient into the page background — real rows still sit in the DOM
     past the cutoff (this really is a preview of a longer real list, not a
     hardcoded illusion), just visually implied rather than shown. Height is
     measured from the actual rendered row, not a guessed pixel value, so it
     holds even if a row's content (font, expanded panel) makes it taller
     or shorter than expected. -->
<template>
  <div class="relative overflow-x-auto" :style="fadeHeight ? { maxHeight: fadeHeight + 'px', overflowY: 'hidden' } : null">
    <table class="w-full min-w-[720px] border-collapse">
      <thead>
        <tr class="text-left ov text-brand-muted dark:text-brand-muted-dark border-b-2 border-brand-strong dark:border-brand-strong-dark">
          <th class="px-3.5 pb-2.5 font-medium">Date</th>
          <th class="px-3.5 pb-2.5 font-medium">Track / Variation</th>
          <th class="px-3.5 pb-2.5 font-medium">Vehicle</th>
          <th class="px-3.5 pb-2.5 font-medium">Class (PI)</th>
          <th class="px-3.5 pb-2.5 font-medium text-right">Place</th>
          <th class="px-3.5 pb-2.5 font-medium text-right">Laps</th>
          <th class="px-3.5 pb-2.5 font-medium text-right">Lap time</th>
          <th class="px-3.5 pb-2.5 font-medium text-right">Total time</th>
          <th class="pl-3.5 pb-2.5 font-medium w-10"></th>
        </tr>
      </thead>
      <tbody class="border-b border-brand-border dark:border-brand-border-dark">
        <template v-for="(row, i) in rows" :key="row.id">
          <tr class="border-t border-brand-border dark:border-brand-border-dark" :data-row-index="i">
            <td class="px-3.5 py-2 tabular text-xs text-brand-muted dark:text-brand-muted-dark whitespace-nowrap">{{ formatDate(row.datetime) }}</td>
            <td class="px-3.5 py-2 text-[13px] whitespace-nowrap">
              <span class="font-semibold text-brand-text dark:text-brand-text-dark">{{ row.track }}</span>
              <span class="text-brand-muted dark:text-brand-muted-dark"> — {{ row.variation }}</span>
            </td>
            <td class="px-3.5 py-2 text-[13px] text-brand-muted dark:text-brand-muted-dark whitespace-nowrap">{{ row.vehicle }}</td>
            <td class="px-3.5 py-2 text-[13px] whitespace-nowrap">
              <span class="font-extrabold" :style="{ color: piInfo(row.performance_index).color }">{{ piInfo(row.performance_index).cls }}</span>
              <span class="ml-1 tabular text-brand-muted dark:text-brand-muted-dark">{{ row.performance_index }}</span>
            </td>
            <td class="px-3.5 py-2 text-right text-[13px] tabular" :class="Number(row.place) <= 3 ? 'font-bold' : ''">{{ row.place }}</td>
            <td class="px-3.5 py-2 text-right text-[13px] tabular text-brand-muted dark:text-brand-muted-dark">{{ row.lap_count }}</td>
            <td class="px-3.5 py-2 text-right text-[13px] tabular font-semibold text-brand-text dark:text-brand-text-dark">{{ formatMsToTime(row.lap_time_ms) }}</td>
            <td class="px-3.5 py-2 text-right text-[13px] tabular text-brand-muted dark:text-brand-muted-dark">{{ formatMsToTime(row.total_time_ms) }}</td>
            <td class="pl-3.5 py-2 text-right whitespace-nowrap">
              <button
                v-if="row.lap_times_ms || row.results_roster"
                type="button"
                class="min-h-[36px] min-w-[36px] inline-flex items-center justify-center text-brand-muted dark:text-brand-muted-dark hover:text-brand-accent dark:hover:text-brand-accent-dark"
                :aria-label="expanded === i ? 'Collapse row' : 'Expand row'"
                @click="expanded = expanded === i ? null : i"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
                  <path d="M4 10h12" />
                  <path v-if="expanded !== i" d="M10 4v12" />
                </svg>
              </button>
            </td>
          </tr>
          <tr v-if="expanded === i">
            <td colspan="9" class="p-4 sm:p-5 bg-brand-surface dark:bg-brand-surface-dark">
              <div class="ov text-brand-accent dark:text-brand-accent-dark mb-1.5">Notes</div>
              <p class="font-body text-[13px] italic text-brand-muted dark:text-brand-muted-dark">Private — visible only to you, never shown here.</p>
              <template v-if="row.lap_times_ms">
                <div class="mt-3 ov text-brand-accent dark:text-brand-accent-dark mb-1.5">Lap times</div>
                <LapSplitsChart :lap-times="row.lap_times_ms" class="mt-1" />
              </template>
              <template v-if="row.results_roster">
                <div class="mt-3 ov text-brand-accent dark:text-brand-accent-dark mb-1.5">Roster</div>
                <RaceResultsRoster :roster="row.results_roster" class="mt-1" />
              </template>
            </td>
          </tr>
        </template>
      </tbody>
    </table>

    <!-- Fades the tail of the visible area into the page background, right
         where fade-after-index says to stop — see measureFade(). Purely
         decorative (aria-hidden, pointer-events-none): the rows underneath
         are still real rows, just clipped by the wrapper's max-height. -->
    <div
      v-if="fadeHeight"
      aria-hidden="true"
      class="absolute bottom-0 left-0 right-0 h-24 pointer-events-none bg-gradient-to-b from-transparent to-brand-bg dark:to-brand-bg-dark"
    ></div>
  </div>
</template>

<script>
import LapSplitsChart from './LapSplitsChart.vue'
import RaceResultsRoster from './RaceResultsRoster.vue'
import { formatMsToTime } from '../utils/timeFormat.js'
import { piInfo } from '../utils/piInfo.js'

export default {
  name: 'HomeRacesTable',
  components: { LapSplitsChart, RaceResultsRoster },
  props: {
    rows: { type: Array, required: true },
    // Row index expanded by default (null = all collapsed).
    initialExpanded: { type: Number, default: null },
    // Clip the table just past this row index and fade into the page
    // background — implies more rows below without a fixed guessed pixel
    // height (see measureFade). null = show everything, no fade.
    fadeAfterIndex: { type: Number, default: null }
  },
  data() {
    return { expanded: this.initialExpanded, fadeHeight: null }
  },
  watch: {
    // Expanding/collapsing a row above the fade line shifts everything
    // below it — remeasure so the cutoff still lands after the right row.
    expanded() {
      this.$nextTick(this.measureFade)
    }
  },
  mounted() {
    this.measureFade()
    window.addEventListener('resize', this.measureFade)
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.measureFade)
  },
  methods: {
    piInfo,
    formatMsToTime,
    formatDate(iso) {
      return new Date(iso).toLocaleDateString(undefined, { month: '2-digit', day: '2-digit', year: '2-digit' })
    },
    measureFade() {
      if (this.fadeAfterIndex == null) return
      const wrapper = this.$el
      const targetRow = wrapper.querySelector(`[data-row-index="${this.fadeAfterIndex}"]`)
      if (!targetRow) return
      // Both rects are viewport-relative and read at the same instant, so
      // their difference is the real content height from the wrapper's top
      // to the target row's bottom — tracks actual rendered layout
      // (font metrics, an expanded panel shifting rows down, etc.) instead
      // of a guessed fixed pixel value that could clip mid-row.
      const wrapperTop = wrapper.getBoundingClientRect().top
      const rowBottom = targetRow.getBoundingClientRect().bottom
      this.fadeHeight = Math.ceil(rowBottom - wrapperTop)
    }
  }
}
</script>
