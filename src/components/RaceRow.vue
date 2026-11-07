<template>
  <!-- Card layout (mobile) -->
  <div v-if="layout === 'card'" class="py-3 border-b border-brand-border dark:border-brand-border-dark last:border-b-0">
    <div class="flex items-start gap-2">
      <div class="min-w-0 flex-1">
        <router-link
          v-if="isColVisible('driver')"
          :to="driverPath"
          class="ov text-brand-accent dark:text-brand-accent-dark hover:underline"
        >{{ race.driverName }}</router-link>
        <div v-if="isColVisible('vehicle')" class="font-bold text-brand-text dark:text-brand-text-dark truncate">{{ vehicleName }}</div>
        <div v-if="isColVisible('when')" class="text-xs text-brand-muted dark:text-brand-muted-dark inline-flex items-center gap-1">
          {{ formattedDate }}
          <span
            v-if="race.source === 'api'"
            class="w-3 h-3 shrink-0 text-brand-accent dark:text-brand-accent-dark"
            :title="apiSourceTitle(race)"
            v-html="apiIcon"
          ></span>
          <OnlineRaceIcon v-if="race.server_name" :server-name="race.server_name" />
        </div>

        <!-- Same fields, in the same order, as the desktop table columns —
             each gated by the same column-visibility picker so a card shows
             only what the table would, instead of always showing everything. -->
        <div class="grid grid-cols-3 gap-x-3 gap-y-3 mt-3 text-sm">
          <CardField v-if="isColVisible('pi')" label="Class (PI)"><PerformanceIndexBadge :value="race.performance_index" /></CardField>
          <CardField v-if="isColVisible('weight')" label="Weight" value-class="tabular text-brand-secondary dark:text-brand-secondary-dark">{{ formatWeight(race.vehicle_weight_kg) }}</CardField>
          <CardField v-if="isColVisible('tune')" label="Tune" value-class="text-brand-secondary dark:text-brand-secondary-dark">{{ race.tuning ?? '—' }}</CardField>
          <CardField v-if="isColVisible('assists')" label="Assists" value-class="text-brand-secondary dark:text-brand-secondary-dark">{{ formatAssists(race.assists) }}</CardField>
          <CardField v-if="isColVisible('parts')" label="Parts"><PartsBadge :parts="race.parts" /></CardField>
          <CardField v-if="isColVisible('place')" label="Place">{{ race.place || '—' }}</CardField>
          <CardField v-if="isColVisible('laps')" label="Laps">{{ lapCount }}</CardField>
          <CardField v-if="isColVisible('lap')" label="Lap time" :value-class="['tabular', lapClass]">{{ formatLap }}</CardField>
          <CardField v-if="isColVisible('gap')" label="Δ goal" :value-class="['tabular', deltaColor]">{{ deltaLabel || '—' }}</CardField>
          <CardField v-if="isColVisible('total')" label="Total time" value-class="tabular text-brand-muted dark:text-brand-muted-dark">{{ formatTotal }}</CardField>
        </div>
      </div>

      <RaceRowActions
        vertical
        :show-expand="hasDetails(race)"
        :expanded="expanded"
        @toggle-expand="expanded = !expanded"
        :editable="!readOnly"
        @edit="editing = true"
        @delete="confirmingDelete = true"
      >
        <FavoriteStar v-if="favoritable" :race-id="race.id" />
      </RaceRowActions>
    </div>

    <div v-if="expanded && !editing" class="mt-3 px-3 py-3 bg-brand-surface dark:bg-brand-surface-dark">
      <RaceExpandedDetails
        :notes="race.notes || ''"
        :notes-fallback="readOnly ? '' : 'No notes'"
        card-labels
        divider
        :lap-times="race.lap_times_ms"
        :roster="race.results_roster"
        :server-name="race.server_name || ''"
      />
    </div>

    <RaceForm
      v-if="editing"
      :notes-only="notesOnly"
      class="mt-3"
      :vehicles="vehicles"
      :defaults="editDefaults"
      :autofocus="false"
      @submit="onSave"
      @cancel="editing = false"
    />
  </div>

  <!-- Table row layout (desktop) -->
  <tr
    v-else
    class="border-t border-brand-border dark:border-brand-border-dark hover:bg-brand-surface dark:hover:bg-brand-surface-dark"
  >
    <td v-if="favoritable" class="w-px py-2 pl-0 pr-2">
      <FavoriteStar compact :race-id="race.id" />
    </td>
    <td v-if="isColVisible('when')" class="py-2 pl-0 pr-3 whitespace-nowrap tabular text-xs text-brand-muted dark:text-brand-muted-dark">
      <span class="inline-flex items-center gap-1">
        {{ formattedDate }}
        <span
          v-if="race.source === 'api'"
          class="w-3 h-3 shrink-0 text-brand-accent dark:text-brand-accent-dark"
          :title="apiSourceTitle(race)"
          v-html="apiIcon"
        ></span>
        <OnlineRaceIcon v-if="race.server_name" :server-name="race.server_name" />
      </span>
    </td>
    <td v-if="isColVisible('driver')" class="py-2 pr-3 whitespace-nowrap">
      <router-link
        :to="driverPath"
        class="text-brand-secondary dark:text-brand-secondary-dark hover:text-brand-accent dark:hover:text-brand-accent-dark"
      >{{ race.driverName }}</router-link>
    </td>
    <td v-if="isColVisible('vehicle')" class="py-2 pr-3 text-brand-secondary dark:text-brand-secondary-dark">{{ vehicleName }}</td>
    <td v-if="isColVisible('pi')" class="py-2 pr-3 whitespace-nowrap">
      <PerformanceIndexBadge :value="race.performance_index" />
    </td>
    <td v-if="isColVisible('weight')" class="py-2 pr-3 text-right tabular text-brand-secondary dark:text-brand-secondary-dark">{{ formatWeight(race.vehicle_weight_kg) }}</td>
    <td v-if="isColVisible('tune')" class="py-2 pr-3 text-center text-brand-secondary dark:text-brand-secondary-dark">{{ race.tuning ?? '—' }}</td>
    <td v-if="isColVisible('assists')" class="py-2 pr-3 text-center text-brand-secondary dark:text-brand-secondary-dark">{{ formatAssists(race.assists) }}</td>
    <td v-if="isColVisible('parts')" class="w-px py-2 pr-3 text-center whitespace-nowrap">
      <PartsBadge :parts="race.parts" />
    </td>
    <td v-if="isColVisible('place')" class="py-2 pr-3 text-center tabular">{{ race.place || '—' }}</td>
    <td v-if="isColVisible('laps')" class="py-2 pr-3 text-center tabular text-brand-secondary dark:text-brand-secondary-dark">{{ lapCount }}</td>
    <td v-if="isColVisible('lap')" class="py-2 pr-3 tabular" :class="lapClass">{{ formatLap }}</td>
    <td v-if="isColVisible('gap')" class="py-2 pr-3 tabular" :class="deltaColor">{{ deltaLabel }}</td>
    <td v-if="isColVisible('total')" class="py-2 pr-3 tabular text-brand-muted dark:text-brand-muted-dark">{{ formatTotal }}</td>
    <td class="py-2 pr-3 text-right whitespace-nowrap">
      <RaceRowActions
        :show-expand="hasDetails(race)"
        :expanded="expanded"
        @toggle-expand="expanded = !expanded"
        :editable="!readOnly"
        @edit="editing = true"
        @delete="confirmingDelete = true"
      />
    </td>
  </tr>

  <tr v-if="layout === 'table' && editing">
    <td :colspan="rowColspan" class="p-5 bg-brand-surface dark:bg-brand-surface-dark">
      <RaceForm
        :notes-only="notesOnly"
        :vehicles="vehicles"
        :defaults="editDefaults"
        :autofocus="false"
        @submit="onSave"
        @cancel="editing = false"
      />
    </td>
  </tr>

  <tr v-if="layout === 'table' && !editing && expanded">
    <td :colspan="rowColspan" class="p-3 bg-brand-surface dark:bg-brand-surface-dark">
      <RaceExpandedDetails
        :notes="race.notes || ''"
        :notes-fallback="readOnly ? '' : 'No notes'"
        accent
        divider
        :lap-times="race.lap_times_ms"
        :roster="race.results_roster"
        :server-name="race.server_name || ''"
      />
    </td>
  </tr>

  <ConfirmDialog
    :open="confirmingDelete"
    title="Delete this race?"
    message="This can't be undone."
    confirm-label="Delete"
    @confirm="onConfirmDelete"
    @cancel="confirmingDelete = false"
  />
</template>

<script>
import RaceForm from './RaceForm.vue'
import ConfirmDialog from './ConfirmDialog.vue'
import PerformanceIndexBadge from './PerformanceIndexBadge.vue'
import RaceRowActions from './RaceRowActions.vue'
import RaceExpandedDetails from './RaceExpandedDetails.vue'
import OnlineRaceIcon from './OnlineRaceIcon.vue'
import PartsBadge from './PartsBadge.vue'
import FavoriteStar from './FavoriteStar.vue'
import CardField from './CardField.vue'
import { formatMsToTime, formatDelta, formatAssists, formatWeight } from '../utils/format.js'
import { lapCount, hasDetails, apiSourceTitle, editDefaults } from '../utils/raceTable.js'
import apiIcon from '../assets/icons/api.svg?raw'

// One race on TrackDetailPage, as a table row (plus its edit/expanded rows)
// or a mobile card.
export default {
  name: 'RaceRow',
  components: { RaceForm, ConfirmDialog, PerformanceIndexBadge, RaceRowActions, RaceExpandedDetails, OnlineRaceIcon, PartsBadge, FavoriteStar, CardField },
  props: {
    race: { type: Object, required: true },
    vehicles: { type: Array, required: true },
    goalLapTimeMs: { type: Number, default: null },
    personalBestMs: { type: Number, default: null },
    layout: { type: String, default: 'table' },
    // The set of toggleable column keys currently visible, per
    // TrackDetailPage's column-visibility picker — used by both the table
    // and card layouts. 'actions' isn't included since it's always shown.
    visibleColumns: { type: Array, required: true },
    // Someone else's race: no edit/delete, and no notes (they're private).
    readOnly: { type: Boolean, default: false },
    // Community track page: where a driver's name links, under their prefix —
    // e.g. '/track/<t>/<v>' to open that driver's page for this variation.
    // Only used when the 'driver' column is visible.
    driverPathSuffix: { type: String, default: '/races' },
    // Signed in: shows the favorite star, in its own always-on first column
    // (and just above the expand button on cards).
    favoritable: { type: Boolean, default: false }
  },
  emits: ['update', 'delete'],
  data() {
    return {
      editing: false,
      expanded: false,
      confirmingDelete: false,
      apiIcon
    }
  },
  computed: {
    driverPath() {
      return `/${this.race.user_id}${this.driverPathSuffix}`
    },
    rowColspan() {
      // +1 for the always-shown Actions column, +1 more for the favorite star's
      return this.visibleColumns.length + 1 + (this.favoritable ? 1 : 0)
    },
    vehicleName() {
      const v = this.vehicles.find(x => x.id === this.race.vehicle_id)
      return v ? v.name : '—'
    },
    formattedDate() {
      const d = new Date(this.race.datetime)
      return d.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    },
    lapCount() {
      return lapCount(this.race) ?? '—'
    },
    isPersonalBest() {
      return this.race.lap_time_ms != null
        && this.personalBestMs != null
        && this.race.lap_time_ms === this.personalBestMs
    },
    lapClass() {
      return this.isPersonalBest ? 'text-brand-accent dark:text-brand-accent-dark' : 'text-brand-text dark:text-brand-text-dark'
    },
    formatLap() {
      if (this.race.lap_time_ms == null) return '—'
      return this.isPersonalBest ? `★ ${formatMsToTime(this.race.lap_time_ms)}` : formatMsToTime(this.race.lap_time_ms)
    },
    formatTotal() {
      return this.race.total_time_ms != null
        ? formatMsToTime(this.race.total_time_ms)
        : '—'
    },
    deltaLabel() {
      if (this.race.lap_time_ms == null || this.goalLapTimeMs == null) return ''
      return formatDelta(this.race.lap_time_ms - this.goalLapTimeMs)
    },
    deltaColor() {
      if (!this.deltaLabel) return ''
      const diff = this.race.lap_time_ms - this.goalLapTimeMs
      if (diff < 0) return 'text-brand-good dark:text-brand-good-dark'
      if (diff > 0) return 'text-brand-accent dark:text-brand-accent-dark'
      return 'text-brand-muted dark:text-brand-muted-dark'
    },
    notesOnly() {
      return this.race.source === 'api'
    },
    editDefaults() {
      return editDefaults(this.race)
    }
  },
  methods: {
    formatAssists,
    formatWeight,
    hasDetails,
    apiSourceTitle,
    isColVisible(key) {
      return this.visibleColumns.includes(key)
    },
    // The page saves and reports by toast; the form closes either way.
    onSave(payload) {
      this.$emit('update', { id: this.race.id, patch: payload })
      this.editing = false
    },
    onConfirmDelete() {
      this.confirmingDelete = false
      this.$emit('delete', this.race.id)
    }
  }
}
</script>
