<template>
  <tr class="border-b border-slate-200 dark:border-slate-700">
    <template v-if="!editing">
      <td class="py-2 pl-3 pr-3 whitespace-nowrap text-xs text-slate-500">
        {{ formattedDate }}
      </td>
      <td class="py-2 pr-3">{{ vehicleName }}</td>
      <td class="py-2 pr-3 text-center">{{ race.tuning ?? '—' }}</td>
      <td class="py-2 pr-3 text-center">{{ race.place || '—' }}</td>
      <td class="py-2 pr-3 font-mono">{{ formatLap }}</td>
      <td class="py-2 pr-3 font-mono text-xs" :class="deltaColor">{{ deltaLabel }}</td>
      <td class="py-2 pr-3 font-mono text-xs">{{ formatTotal }}</td>
      <td class="py-2 pr-3 text-xs text-slate-500 truncate max-w-[18ch]" :title="race.notes || ''">
        {{ race.notes || '' }}
      </td>
      <td class="py-2 pr-3 text-right text-xs space-x-2 whitespace-nowrap">
        <button class="text-brand hover:underline" @click="editing = true">Edit</button>
        <button class="text-slate-500 hover:text-red-600" @click="onDelete">Delete</button>
      </td>
    </template>

    <td v-else colspan="9" class="py-3">
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
</template>

<script>
import RaceForm from './RaceForm.vue'
import { formatMsToTime, formatDelta } from '../utils/timeFormat.js'

function toLocalIsoMinute(isoString) {
  const d = new Date(isoString)
  const tzOffset = d.getTimezoneOffset() * 60_000
  return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16)
}

export default {
  name: 'RaceRow',
  components: { RaceForm },
  props: {
    race: { type: Object, required: true },
    vehicles: { type: Array, required: true },
    goalLapTimeMs: { type: Number, default: null },
    personalBestMs: { type: Number, default: null }
  },
  emits: ['update', 'delete'],
  data() {
    return {
      editing: false,
      saving: false
    }
  },
  computed: {
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
    formatLap() {
      if (this.race.lap_time_ms == null) return '—'
      const isPb = this.personalBestMs != null && this.race.lap_time_ms === this.personalBestMs
      return isPb ? `★ ${formatMsToTime(this.race.lap_time_ms)}` : formatMsToTime(this.race.lap_time_ms)
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
      if (diff < 0) return 'text-green-600'
      if (diff > 0) return 'text-red-500'
      return 'text-slate-500'
    },
    editDefaults() {
      return {
        datetime: toLocalIsoMinute(this.race.datetime),
        vehicleId: this.race.vehicle_id,
        tuning: this.race.tuning,
        place: this.race.place || '',
        lapTime: this.race.lap_time_ms != null ? formatMsToTime(this.race.lap_time_ms) : '',
        totalTime: this.race.total_time_ms != null ? formatMsToTime(this.race.total_time_ms) : '',
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
      if (!window.confirm('Delete this race?')) return
      this.$emit('delete', this.race.id)
    }
  }
}
</script>
