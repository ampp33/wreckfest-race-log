<!-- The homepage's "target and the gap" tile row. Matches the real
     TrackDetailPage.vue tile layout (4 tiles, including a live LapTimeInput
     for "Goal lap time" — editable here too, just not wired to save since
     there's no signed-in variation behind it on the homepage).

     Deliberately kept at a constant 2 columns (the real page goes
     `lg:grid-cols-4`) rather than porting that breakpoint verbatim: the
     real page's tiles live in a max-w-7xl row with room to spare, but this
     component sits inside the homepage's much narrower max-w-3xl column,
     where 4-across left "text-display-sm" tabular numbers (e.g.
     "+0:00.055") wider than their own grid cell — they'd overflow into the
     next tile at any viewport past that breakpoint. 2 columns always gives
     each tile enough width for that type size, verified in a screenshot. -->
<template>
  <div class="grid grid-cols-2 gap-6">
    <div class="rule-top pt-3">
      <div class="ov text-brand-muted dark:text-brand-muted-dark">Personal best</div>
      <div class="font-display font-black tracking-tightest text-display-sm tabular text-brand-text dark:text-brand-text-dark mt-2">{{ formatMsToTime(goal.bestMs) }}</div>
    </div>
    <div class="rule-top pt-3">
      <div class="ov text-brand-muted dark:text-brand-muted-dark">Goal lap time</div>
      <div class="mt-2">
        <LapTimeInput v-model="goalMsLocal" />
      </div>
    </div>
    <div class="pt-3 border-t-2 border-brand-accent dark:border-brand-accent-dark">
      <div class="ov text-brand-accent dark:text-brand-accent-dark">Gap to goal</div>
      <div
        class="font-display font-black tracking-tightest text-display-sm tabular mt-2"
        :class="goal.beat ? 'text-brand-good dark:text-brand-good-dark' : 'text-brand-accent dark:text-brand-accent-dark'"
      >{{ formatDelta(goal.deltaMs) }}</div>
    </div>
    <div class="rule-top pt-3">
      <div class="ov text-brand-muted dark:text-brand-muted-dark">Races here</div>
      <div class="font-display font-black tracking-tightest text-display-sm tabular text-brand-text dark:text-brand-text-dark mt-2">{{ goal.racesHere }}</div>
    </div>
  </div>
</template>

<script>
import LapTimeInput from './LapTimeInput.vue'
import { formatMsToTime, formatDelta } from '../utils/timeFormat.js'

export default {
  name: 'HomeGapTiles',
  components: { LapTimeInput },
  props: {
    goal: { type: Object, required: true }
  },
  data() {
    // Local only — the real page saves this on blur; the homepage doesn't
    // persist anything, so it just starts at the real goal and is free to
    // play with without it going anywhere.
    return { goalMsLocal: this.goal.goalMs }
  },
  methods: { formatMsToTime, formatDelta }
}
</script>
