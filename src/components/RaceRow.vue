<template>
  <!-- Card layout (mobile) -->
  <div v-if="layout === 'card'" class="p-3 border-b border-brand-border dark:border-brand-border-dark last:border-b-0">
    <template v-if="!editing">
      <div class="flex items-start justify-between gap-2">
        <div class="min-w-0">
          <div class="font-bold text-brand-text dark:text-brand-text-dark truncate">{{ vehicleName }}</div>
          <div class="text-xs text-brand-muted dark:text-brand-muted-dark inline-flex items-center gap-1">
            {{ formattedDate }}
            <span
              v-if="race.source === 'api'"
              class="w-3 h-3 shrink-0 text-brand-accent dark:text-brand-accent-dark"
              :title="apiSourceTitle"
              v-html="apiIcon"
            ></span>
          </div>
        </div>
        <RaceRowActions
          :show-expand="!!(race.notes || hasLapTimes || hasRoster)"
          :expanded="expanded"
          @toggle-expand="toggleExpanded"
          @edit="editing = true"
          @delete="onDelete"
        />
      </div>

      <!-- Same fields, in the same order, as the desktop table columns. -->
      <div class="grid grid-cols-2 gap-x-3 gap-y-1.5 mt-3 text-sm">
        <div>
          <div class="ov text-brand-muted dark:text-brand-muted-dark">Class (PI)</div>
          <div><PerformanceIndexBadge :value="race.performance_index" /></div>
        </div>
        <div>
          <div class="ov text-brand-muted dark:text-brand-muted-dark">Weight</div>
          <div class="tabular text-brand-secondary dark:text-brand-secondary-dark">{{ race.vehicle_weight_kg != null ? race.vehicle_weight_kg + ' kg' : '—' }}</div>
        </div>
        <div>
          <div class="ov text-brand-muted dark:text-brand-muted-dark">Tune</div>
          <div class="text-brand-secondary dark:text-brand-secondary-dark">{{ race.tuning ?? '—' }}</div>
        </div>
        <div>
          <div class="ov text-brand-muted dark:text-brand-muted-dark">Assists</div>
          <div class="text-brand-secondary dark:text-brand-secondary-dark">{{ formatAssists(race.assists) }}</div>
        </div>
        <div>
          <div class="ov text-brand-muted dark:text-brand-muted-dark">Place</div>
          <div class="text-brand-secondary dark:text-brand-secondary-dark">{{ race.place || '—' }}</div>
        </div>
        <div>
          <div class="ov text-brand-muted dark:text-brand-muted-dark">Laps</div>
          <div class="text-brand-secondary dark:text-brand-secondary-dark">{{ lapCount }}</div>
        </div>
        <div>
          <div class="ov text-brand-muted dark:text-brand-muted-dark">Lap</div>
          <div
            class="tabular font-semibold"
            :class="isPersonalBest ? 'text-brand-accent dark:text-brand-accent-dark' : 'text-brand-text dark:text-brand-text-dark'"
          >{{ formatLap }}</div>
        </div>
        <div>
          <div class="ov text-brand-muted dark:text-brand-muted-dark">Δ goal</div>
          <div class="tabular" :class="deltaColor">{{ deltaLabel || '—' }}</div>
        </div>
        <div>
          <div class="ov text-brand-muted dark:text-brand-muted-dark">Total</div>
          <div class="tabular text-brand-muted dark:text-brand-muted-dark">{{ formatTotal }}</div>
        </div>
      </div>

      <!-- Notes preview, expanded/collapsed via the icon in the button cluster above. -->
      <div v-if="race.notes || hasLapTimes || hasRoster" class="mt-3">
        <div class="ov text-brand-muted dark:text-brand-muted-dark">Notes</div>
        <div class="text-sm truncate text-brand-muted dark:text-brand-muted-dark">{{ race.notes || 'No notes' }}</div>
      </div>

      <div v-if="expanded" class="mt-3 -mx-3 px-3 py-3 bg-brand-surface dark:bg-brand-surface-dark">
        <RaceExpandedDetails
          :notes="race.notes || ''"
          notes-fallback="No notes"
          :show-notes-heading="false"
          :lap-times="race.lap_times_ms"
          :roster="race.results_roster"
        />
      </div>
    </template>

    <RaceForm
      v-else
      :vehicles="vehicles"
      :defaults="editDefaults"
      :saving="saving"
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
    <template v-if="!editing">
      <td class="py-2 pl-0 pr-3 whitespace-nowrap tabular text-xs text-brand-muted dark:text-brand-muted-dark">
        <span class="inline-flex items-center gap-1">
          {{ formattedDate }}
          <span
            v-if="race.source === 'api'"
            class="w-3 h-3 shrink-0 text-brand-accent dark:text-brand-accent-dark"
            :title="apiSourceTitle"
            v-html="apiIcon"
          ></span>
        </span>
      </td>
      <td class="py-2 pr-3 text-brand-muted dark:text-brand-muted-dark">{{ vehicleName }}</td>
      <td class="py-2 pr-3 whitespace-nowrap">
        <PerformanceIndexBadge :value="race.performance_index" />
      </td>
      <td class="py-2 pr-3 text-right tabular text-brand-secondary dark:text-brand-secondary-dark">{{ race.vehicle_weight_kg != null ? race.vehicle_weight_kg + ' kg' : '—' }}</td>
      <td class="py-2 pr-3 text-center text-brand-secondary dark:text-brand-secondary-dark">{{ race.tuning ?? '—' }}</td>
      <td class="py-2 pr-3 text-center text-brand-secondary dark:text-brand-secondary-dark">{{ formatAssists(race.assists) }}</td>
      <td class="py-2 pr-3 text-center tabular font-semibold">{{ race.place || '—' }}</td>
      <td class="py-2 pr-3 text-center tabular text-brand-muted dark:text-brand-muted-dark">{{ lapCount }}</td>
      <td
        class="py-2 pr-3 tabular font-semibold"
        :class="isPersonalBest ? 'text-brand-accent dark:text-brand-accent-dark' : 'text-brand-text dark:text-brand-text-dark'"
      >{{ formatLap }}</td>
      <td class="py-2 pr-3 tabular" :class="deltaColor">{{ deltaLabel }}</td>
      <td class="py-2 pr-3 tabular text-brand-muted dark:text-brand-muted-dark">{{ formatTotal }}</td>
      <td class="py-2 pr-3 max-w-[18ch]" :title="race.notes">
        <span class="block truncate text-brand-muted dark:text-brand-muted-dark">{{ race.notes || '—' }}</span>
      </td>
      <td class="py-2 pr-3 text-right whitespace-nowrap">
        <RaceRowActions
          :show-expand="!!(race.notes || hasLapTimes || hasRoster)"
          :expanded="expanded"
          @toggle-expand="toggleExpanded"
          @edit="editing = true"
          @delete="onDelete"
        />
      </td>
    </template>

    <td v-else colspan="13" class="p-5 bg-brand-surface dark:bg-brand-surface-dark">
      <RaceForm
        :vehicles="vehicles"
        :defaults="editDefaults"
        :saving="saving"
        :autofocus="false"
        @submit="onSave"
        @cancel="editing = false"
      />
    </td>
  </tr>

  <tr v-if="layout === 'table' && !editing && expanded">
    <td colspan="13" class="p-3 bg-brand-surface dark:bg-brand-surface-dark">
      <RaceExpandedDetails
        :notes="race.notes || ''"
        notes-fallback="No notes"
        accent
        divider
        :lap-times="race.lap_times_ms"
        :roster="race.results_roster"
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
import { formatMsToTime, formatDelta } from '../utils/timeFormat.js'
import { formatAssists } from '../utils/assistsFormat.js'
import apiIcon from '../assets/icons/api.svg?raw'

function toLocalIsoMinute(isoString) {
  const d = new Date(isoString)
  const tzOffset = d.getTimezoneOffset() * 60_000
  return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16)
}

export default {
  name: 'RaceRow',
  components: { RaceForm, ConfirmDialog, PerformanceIndexBadge, RaceRowActions, RaceExpandedDetails },
  props: {
    race: { type: Object, required: true },
    vehicles: { type: Array, required: true },
    goalLapTimeMs: { type: Number, default: null },
    personalBestMs: { type: Number, default: null },
    layout: { type: String, default: 'table' }
  },
  emits: ['update', 'delete'],
  data() {
    return {
      editing: false,
      saving: false,
      expanded: false,
      confirmingDelete: false,
      apiIcon
    }
  },
  computed: {
    apiSourceTitle() {
      return this.race.api_key?.name
        ? `Logged via API — key: ${this.race.api_key.name}`
        : 'Logged via API'
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
    hasLapTimes() {
      return Array.isArray(this.race.lap_times_ms)
        && this.race.lap_times_ms.some(ms => ms != null)
    },
    hasRoster() {
      return Array.isArray(this.race.results_roster) && this.race.results_roster.length > 0
    },
    lapCount() {
      if (this.race.lap_count != null) return this.race.lap_count
      // Older races may only carry the splits array.
      if (Array.isArray(this.race.lap_times_ms)) return this.race.lap_times_ms.length
      return '—'
    },
    isPersonalBest() {
      return this.race.lap_time_ms != null
        && this.personalBestMs != null
        && this.race.lap_time_ms === this.personalBestMs
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
    editDefaults() {
      return {
        datetime: toLocalIsoMinute(this.race.datetime),
        vehicleId: this.race.vehicle_id,
        tuning: this.race.tuning,
        place: this.race.place || '',
        lapTimeMs: this.race.lap_time_ms,
        totalTimeMs: this.race.total_time_ms,
        performanceIndex: this.race.performance_index != null ? String(this.race.performance_index) : '0',
        notes: this.race.notes || ''
      }
    }
  },
  methods: {
    async onSave(payload) {
      this.saving = true
      try {
        await this.$emit('update', { id: this.race.id, patch: payload })
        this.editing = false
      } finally {
        this.saving = false
      }
    },
    onDelete() {
      this.confirmingDelete = true
    },
    onConfirmDelete() {
      this.confirmingDelete = false
      this.$emit('delete', this.race.id)
    },
    toggleExpanded() {
      this.expanded = !this.expanded
    },
    formatAssists
  }
}
</script>
