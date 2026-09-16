<template>
  <template v-if="showNotesSection">
    <div v-if="showNotesHeading" :class="headingClass">Notes</div>
    <div :class="['text-sm leading-relaxed whitespace-pre-wrap break-words text-brand-text dark:text-brand-text-dark', showNotesHeading ? 'mt-2' : '']">{{ notes || notesFallback }}</div>
  </template>

  <div v-if="divider && (hasLapTimes || hasRoster)" class="mt-3 border-t border-brand-border dark:border-brand-border-dark"></div>

  <template v-if="hasLapTimes">
    <div :class="['mt-3', headingClass]">Lap times</div>
    <LapSplitsChart :lap-times="lapTimes" class="mt-1" />
  </template>

  <template v-if="hasRoster">
    <div :class="['mt-3', headingClass]">Roster</div>
    <RaceResultsRoster :roster="roster" class="mt-1" />
  </template>
</template>

<script>
import LapSplitsChart from './LapSplitsChart.vue'
import RaceResultsRoster from './RaceResultsRoster.vue'

// The "Notes / Lap times / Roster" block shown when a race row is expanded.
// Two cosmetic flavors exist in the app today: a plain muted-label one
// (RacesPage.vue, where the notes block only appears when there are notes)
// and a bigger accent-labeled one with a divider (RaceRow.vue's table
// layout, which always shows a "No notes" fallback); RaceRow.vue's card
// layout shows the fallback text with no heading at all, since its own
// always-visible notes preview above already carries the "Notes" label.
export default {
  name: 'RaceExpandedDetails',
  components: { LapSplitsChart, RaceResultsRoster },
  props: {
    notes: { type: String, default: '' },
    // Shown instead of `notes` when empty. Leave '' (the default) to hide
    // the notes section entirely when there's nothing to show.
    notesFallback: { type: String, default: '' },
    lapTimes: { type: Array, default: () => [] },
    roster: { type: Array, default: () => [] },
    showNotesHeading: { type: Boolean, default: true },
    // Bigger, accent-colored section labels instead of the plain muted ones.
    accent: { type: Boolean, default: false },
    // Divider between the notes section and lap times/roster.
    divider: { type: Boolean, default: false }
  },
  computed: {
    showNotesSection() {
      return Boolean(this.notes || this.notesFallback)
    },
    hasLapTimes() {
      return Array.isArray(this.lapTimes) && this.lapTimes.some(ms => ms != null)
    },
    hasRoster() {
      return Array.isArray(this.roster) && this.roster.length > 0
    },
    headingClass() {
      return this.accent
        ? 'ov ov-lg text-brand-accent dark:text-brand-accent-dark'
        : 'ov text-brand-muted dark:text-brand-muted-dark'
    }
  }
}
</script>
