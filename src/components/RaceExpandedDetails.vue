<template>
  <template v-if="showNotesSection">
    <div :class="headingClass">Notes</div>
    <div class="mt-2 text-sm leading-relaxed whitespace-pre-wrap break-words text-brand-text dark:text-brand-text-dark">{{ notes || notesFallback }}</div>
  </template>

  <div v-if="divider && (serverName || hasLapTimes || hasRoster)" class="mt-3 border-t border-brand-border dark:border-brand-border-dark"></div>

  <template v-if="serverName">
    <div :class="['mt-3', headingClass]">Server</div>
    <!-- Long names scroll sideways rather than wrapping. -->
    <div class="mt-2 overflow-x-auto">
      <ServerName :name="serverName" class="!max-w-none whitespace-nowrap" />
    </div>
  </template>

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
import ServerName from './ServerName.vue'

// The "Notes / Server / Lap times / Roster" block shown when a race row is expanded.
// Desktop tables use bigger accent-colored labels (`accent`); the mobile
// card layouts (RacesPage.vue and RaceRow.vue) pass `cardLabels` so the
// section labels match the card's own field labels. Both show a divider
// under the notes and a "No notes" fallback.
export default {
  name: 'RaceExpandedDetails',
  components: { LapSplitsChart, RaceResultsRoster, ServerName },
  props: {
    notes: { type: String, default: '' },
    // Shown instead of `notes` when empty. Leave '' (the default) to hide
    // the notes section entirely when there's nothing to show.
    notesFallback: { type: String, default: '' },
    lapTimes: { type: Array, default: () => [] },
    roster: { type: Array, default: () => [] },
    // Raw server name, with Wreckfest ^N color codes still in it.
    serverName: { type: String, default: '' },
    // Bigger, accent-colored section labels instead of the plain muted ones.
    accent: { type: Boolean, default: false },
    // Small accent-colored labels matching a mobile card's field labels
    // ("Vehicle", "Place", ...). Takes precedence over `accent`.
    cardLabels: { type: Boolean, default: false },
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
      if (this.cardLabels) return 'ov text-brand-accent dark:text-brand-accent-dark'
      return this.accent
        ? 'ov ov-lg text-brand-accent dark:text-brand-accent-dark'
        : 'ov text-brand-muted dark:text-brand-muted-dark'
    }
  }
}
</script>
