<template>
  <div v-if="rows.length" class="overflow-x-auto">
    <table class="w-full text-sm border-collapse">
      <thead>
        <tr class="text-[10px] uppercase tracking-widest text-brand-muted dark:text-brand-muted-dark">
          <th class="py-1 pr-3 text-left font-medium">Pos</th>
          <th class="py-1 pr-3 text-left font-medium">Name</th>
          <th class="py-1 pr-3 text-left font-medium">Car</th>
          <th class="py-1 pr-3 text-left font-medium">Class</th>
          <th class="py-1 pr-3 text-right font-medium">Best lap</th>
          <th class="py-1 pr-3 text-right font-medium">Total</th>
          <th class="py-1 pr-3 text-right font-medium">Laps</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(row, i) in rows"
          :key="i"
          class="border-t border-brand-border dark:border-brand-border-dark"
        >
          <td class="py-1 pr-3 font-mono text-brand-secondary dark:text-brand-secondary-dark">{{ row.position ?? '—' }}</td>
          <td class="py-1 pr-3 text-brand-text dark:text-brand-text-dark truncate max-w-[16ch]">{{ row.name || '—' }}</td>
          <td class="py-1 pr-3 text-brand-secondary dark:text-brand-secondary-dark truncate max-w-[16ch]">{{ row.car || '—' }}</td>
          <td class="py-1 pr-3 whitespace-nowrap">
            <template v-if="row.class">
              <span class="font-bold" :style="{ color: classColor(row.class) }">{{ classLetter(row.class) }}</span>
              {{ classRest(row.class) }}
            </template>
            <span v-else class="text-brand-muted dark:text-brand-muted-dark">—</span>
          </td>
          <td
            class="py-1 pr-3 text-right font-mono"
            :class="isFastestLap(row) ? 'text-brand-accent font-semibold' : 'text-brand-text dark:text-brand-text-dark'"
          >{{ formatTime(row.best_lap_ms) }}</td>
          <td class="py-1 pr-3 text-right font-mono text-brand-secondary dark:text-brand-secondary-dark">{{ formatTime(row.total_time_ms) }}</td>
          <td class="py-1 pr-3 text-right font-mono whitespace-nowrap" :class="row.dnf ? 'text-red-500' : 'text-brand-secondary dark:text-brand-secondary-dark'">
            {{ row.dnf ? 'DNF' : (row.laps_completed ?? '—') }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import { formatMsToTime } from '../utils/timeFormat.js'
import { classLetterColor } from '../utils/piInfo.js'

export default {
  name: 'RaceResultsRoster',
  props: {
    // JSON array stored on the race, see README / docs/external-api.md for
    // the entry shape (position, name, car, class, best_lap_ms,
    // total_time_ms, dnf, laps_completed).
    roster: { type: Array, default: () => [] }
  },
  computed: {
    rows() {
      return Array.isArray(this.roster) ? this.roster : []
    },
    fastestLapMs() {
      const times = this.rows
        .map(r => r.best_lap_ms)
        .filter(ms => ms != null && ms > 0)
      return times.length ? Math.min(...times) : null
    }
  },
  methods: {
    isFastestLap(row) {
      return row.best_lap_ms != null
        && row.best_lap_ms > 0
        && row.best_lap_ms === this.fastestLapMs
    },
    formatTime(ms) {
      if (ms == null || ms === 0) return '—'
      return formatMsToTime(ms)
    },
    // `class` is a string like "A 450" — the leading letter is colored the
    // same as the class letter elsewhere in the app, the rest (rating) is not.
    classLetter(cls) {
      return String(cls).trim().split(/\s+/)[0]
    },
    classRest(cls) {
      return String(cls).trim().split(/\s+/).slice(1).join(' ')
    },
    classColor(cls) {
      return classLetterColor(this.classLetter(cls))
    }
  }
}
</script>
