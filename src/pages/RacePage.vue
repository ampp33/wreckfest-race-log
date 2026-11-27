<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
    <p v-if="loading" class="font-body text-[15px] text-brand-muted dark:text-brand-muted-dark">Loading…</p>

    <p v-else-if="!race" class="font-body text-[15px] text-brand-muted dark:text-brand-muted-dark">Race not found.</p>

    <template v-else>
      <!-- The share card: the race at a glance, always dark like a poster. -->
      <div class="relative sm:aspect-[1200/630] bg-brand-slab text-[#F5F4F0] overflow-hidden shadow-[0_18px_40px_rgba(0,0,0,0.25)]">
        <img :src="trackImage" alt="" aria-hidden="true" class="absolute inset-0 w-full h-full object-cover opacity-[0.38] grayscale contrast-[1.1]" />
        <div class="relative sm:absolute sm:inset-0 p-6 sm:px-11 sm:py-10 grid grid-cols-1 sm:grid-cols-2 sm:grid-rows-[auto_1fr_auto] gap-x-10 gap-y-4">
          <div class="sm:col-start-2 sm:text-right min-w-0">
            <div class="font-medium text-[11px] tracking-[0.2em] uppercase">{{ dateLabel }}<template v-if="race.performance_index != null"> · Class {{ classInfo.cls }}</template></div>
            <!-- One line; the full name is on hover (ServerName's title). -->
            <ServerName v-if="race.server_name" :name="race.server_name" class="mt-2 !whitespace-nowrap overflow-hidden text-ellipsis" />
          </div>

          <div class="self-end">
            <div v-if="race.place" class="font-heading leading-[0.75] text-brand-accent-dark text-[120px] sm:text-[clamp(120px,20vw,230px)]">P{{ race.place }}</div>
            <div class="text-xl sm:text-[22px] mt-4">
              <router-link :to="`/${userId}/races`" class="font-bold text-[#F5F4F0] hover:text-brand-accent-dark">{{ driverName }}</router-link>
              <span v-if="vehicleName"> · {{ vehicleName }}</span>
            </div>
          </div>

          <div v-if="podium.length" class="self-end grid grid-cols-3 items-end gap-1.5">
            <div v-for="r in podium" :key="r.position" class="text-center min-w-0">
              <div class="text-[13px] font-bold truncate" :class="isMe(r) ? 'text-brand-accent-dark' : ''">{{ r.name }}</div>
              <div class="mt-1.5 pt-1.5 font-heading text-[40px] leading-none" :class="PODIUM_STEP[r.position]">{{ r.position }}</div>
            </div>
          </div>
          <div v-else class="hidden sm:block"></div>

          <router-link :to="variationPath" class="flex items-center gap-4 text-[#F5F4F0] hover:opacity-90">
            <img :src="mapImage" :alt="`${race.variation.name} layout`" class="w-[110px] h-[50px] object-contain shrink-0" />
            <div class="min-w-0">
              <div class="font-heading text-[clamp(32px,4.4vw,48px)] leading-[0.85]">{{ race.variation.track.name }}</div>
              <div class="text-sm tracking-[0.08em] uppercase">{{ race.variation.name }}</div>
            </div>
          </router-link>

          <div class="flex sm:justify-end items-end gap-7 sm:text-right">
            <div>
              <div class="text-[11px] tracking-[0.2em] text-brand-accent-dark">BEST LAP</div>
              <div class="font-display font-black text-[34px] tracking-[-0.03em] tabular">{{ fmt(race.lap_time_ms) }}</div>
            </div>
            <div>
              <div class="text-[11px] tracking-[0.2em]">TOTAL</div>
              <div class="font-display font-black text-[34px] tracking-[-0.03em] tabular">{{ fmt(race.total_time_ms) }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Full results -->
      <section v-if="roster.length" class="mt-12 bg-brand-bg dark:bg-brand-surface-dark border border-brand-border dark:border-brand-border-dark">
        <div
          v-for="(r, i) in roster"
          :key="i"
          class="grid grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 sm:gap-x-4 px-4 sm:px-5 py-3.5 border-b last:border-b-0 border-brand-border dark:border-brand-border-dark sm:[grid-template-columns:var(--cols)]"
          :style="{ '--cols': rosterCols }"
          :class="[
            isMe(r) ?'bg-[#F7E3E1] dark:bg-[#2A1514]' : '',
            r.dnf || r.quit ? 'text-brand-muted dark:text-brand-muted-dark' : 'text-brand-text dark:text-brand-text-dark'
          ]"
        >
          <!-- Phone: a three-line card (name | gap, car | best, then the setup),
               placed explicitly; sm+ resets every cell to one row in DOM order. -->
          <span
            class="col-start-1 row-start-1 row-span-2 self-start sm:col-auto sm:row-auto sm:self-center font-heading leading-none whitespace-nowrap"
            :class="[isMe(r) ? 'text-brand-accent dark:text-brand-accent-dark' : '', r.dnf || r.quit ? 'text-xl' : 'text-[30px] sm:text-[34px]']"
          >{{ r.dnf ? 'DNF' : r.quit ? 'QUIT' : (r.position ?? '—') }}</span>
          <span class="col-start-2 row-start-1 sm:col-auto sm:row-auto min-w-0">
            <span class="block font-bold truncate">{{ r.name || '—' }}</span>
            <span class="block text-[13px] text-brand-muted dark:text-brand-muted-dark">{{ lapsText(r) }}</span>
          </span>
          <span class="col-start-2 row-start-2 sm:col-auto sm:row-auto min-w-0">
            <span class="block font-bold truncate">{{ r.car || '—' }}</span>
            <span v-if="r.class" class="block text-[13px]">
              <span class="font-black" :style="{ color: classLetterColor(classLetter(r.class)) }">{{ classLetter(r.class) }}</span>
              <span class="text-brand-muted dark:text-brand-muted-dark"> {{ String(r.class).trim().split(/\s+/).slice(1).join(' ') }}</span>
            </span>
          </span>
          <!-- Desktop: tune, assists and parts are three cells of the row, always
               rendered when any row has them so the columns line up. Phone: they
               swap for a labeled panel on the card's third line instead. -->
          <div
            class="col-start-1 col-span-3 row-start-3 sm:contents"
            :class="r.tuning || assistsOf(r) || r.parts ? '' : 'hidden'"
          >
          <div class="sm:hidden grid grid-cols-[64px_repeat(4,minmax(0,1fr))] items-center gap-x-2 gap-y-3 p-3 bg-black/[0.04] dark:bg-white/[0.04]">
            <template v-if="r.tuning">
              <span class="ov text-brand-muted dark:text-brand-muted-dark">Tune</span>
              <span v-for="t in tunes(r.tuning)" :key="t.k">
                <span class="block text-[10px] text-brand-muted dark:text-brand-muted-dark">{{ t.k }}</span>
                <b class="block text-base text-brand-text dark:text-brand-text-dark">{{ t.v ?? '—' }}</b>
              </span>
            </template>
            <template v-if="assistsOf(r)">
              <span class="ov text-brand-muted dark:text-brand-muted-dark">Assists</span>
              <span v-for="a in assistCodes(assistsOf(r))" :key="a.k">
                <span class="block text-[10px] text-brand-muted dark:text-brand-muted-dark">{{ a.k }}</span>
                <b class="block text-base text-brand-text dark:text-brand-text-dark">{{ a.v }}</b>
              </span>
            </template>
            <template v-if="r.parts">
              <span class="ov text-brand-muted dark:text-brand-muted-dark">Parts</span>
              <span class="col-span-4 flex items-center gap-3">
                <PartsBadge :parts="r.parts" />
                <span v-if="isMe(r) && race.vehicle_weight_kg != null" class="text-[13px] whitespace-nowrap text-brand-muted dark:text-brand-muted-dark">{{ race.vehicle_weight_kg.toLocaleString() }} kg</span>
              </span>
            </template>
          </div>
          <span v-if="hasTuning" class="hidden sm:flex gap-2">
            <template v-if="r.tuning">
              <span v-for="t in tunes(r.tuning)" :key="t.k" class="w-7 text-center text-[9px] tracking-[0.1em] text-brand-muted dark:text-brand-muted-dark">{{ t.k }}<b class="block text-[17px] tracking-normal text-brand-text dark:text-brand-text-dark">{{ t.v ?? '—' }}</b></span>
            </template>
          </span>
          <span v-if="hasAssists" class="hidden sm:flex gap-2 pl-6">
            <template v-if="assistsOf(r)">
              <span v-for="a in assistCodes(assistsOf(r))" :key="a.k" class="w-8 text-center text-[9px] tracking-[0.1em] text-brand-muted dark:text-brand-muted-dark">{{ a.k }}<b class="block text-[17px] tracking-normal text-brand-text dark:text-brand-text-dark">{{ a.v }}</b></span>
            </template>
          </span>
          <span v-if="hasParts" class="hidden sm:block pl-6">
            <PartsBadge v-if="r.parts" :parts="r.parts" />
            <!-- Only the driver's own car has a logged weight. -->
            <span v-if="isMe(r) && race.vehicle_weight_kg != null" class="block mt-1 text-[13px] text-brand-muted dark:text-brand-muted-dark">{{ race.vehicle_weight_kg.toLocaleString() }} kg</span>
          </span>
          </div>
          <span class="col-start-3 row-start-2 sm:col-auto sm:row-auto w-20 text-right tabular">
            <span class="block text-[11px] text-brand-muted dark:text-brand-muted-dark">best</span>
            <b :class="r.best_lap_ms && r.best_lap_ms === fastestLapMs ? 'text-brand-accent dark:text-brand-accent-dark' : ''">{{ fmt(r.best_lap_ms) }}</b>
          </span>
          <span class="col-start-3 row-start-1 sm:col-auto sm:row-auto w-20 text-right tabular">
            <span class="block text-[11px] text-brand-muted dark:text-brand-muted-dark">{{ fmt(r.total_time_ms) }}</span>
            <b>{{ gapText(r) }}</b>
          </span>
        </div>
      </section>

      <section v-if="hasLapTimes" class="mt-8 bg-brand-bg dark:bg-brand-surface-dark border border-brand-border dark:border-brand-border-dark p-5 sm:p-7">
        <div class="ov text-brand-muted dark:text-brand-muted-dark">Lap times</div>
        <!-- Bars rise from a baseline below the quickest lap, so taller = slower. -->
        <div class="relative h-60 mt-10 mb-8 ml-12">
          <div
            v-for="t in lapChart.ticks"
            :key="t.ms"
            class="absolute inset-x-0 border-t border-brand-border dark:border-brand-border-dark"
            :style="{ top: t.top }"
          >
            <span class="absolute -left-12 -top-2 text-[11px] tabular text-brand-muted dark:text-brand-muted-dark">{{ t.label }}</span>
          </div>
          <div class="absolute inset-0 flex">
            <div v-for="b in lapChart.bars" :key="b.n" class="relative flex-1 flex flex-col justify-end items-center">
              <template v-if="b.ms != null">
                <span class="text-xs font-bold tabular mb-1 whitespace-nowrap" :class="b.best ? 'text-brand-accent dark:text-brand-accent-dark' : 'text-brand-text dark:text-brand-text-dark'">{{ b.label }}</span>
                <span class="w-3/5 max-w-24" :class="b.best ? 'bg-brand-accent dark:bg-brand-accent-dark' : 'bg-brand-strong dark:bg-brand-strong-dark'" :style="{ height: b.height }"></span>
              </template>
              <span class="absolute top-full mt-2 text-[11px] text-brand-muted dark:text-brand-muted-dark whitespace-nowrap">Lap {{ b.n }}</span>
            </div>
          </div>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import PartsBadge from '../components/PartsBadge.vue'
import ServerName from '../components/ServerName.vue'
import { getRace } from '../services/raceService.js'
import { formatMsToTime, formatDelta } from '../utils/timeFormat.js'
import { piInfo, classLetterColor } from '../utils/piInfo.js'
import { trackImageUrl, variationImageUrl } from '../utils/imageUrl.js'
import { pushToast } from '../stores/toastStore.js'
import { formatAssists } from '../utils/assistsFormat.js'

// Podium step heights and colors on the dark card, by position.
const PODIUM_STEP = {
  1: 'h-[92px] bg-[#F5F4F0] text-brand-slab',
  2: 'h-[66px] bg-[#B4B2A9] text-brand-slab',
  3: 'h-[46px] bg-brand-accent-dark text-white'
}
const TUNE_KEYS = [['SUS', 'suspension'], ['GEAR', 'gear_ratio'], ['DIFF', 'differential'], ['BRK', 'brake_balance']]
const ASSIST_KEYS = ['SHIFT', 'ABS', 'TC', 'SC']

const route = useRoute()
const race = ref(null)
const loading = ref(true)
// Whose race it is comes from the race itself. RLS hides races of drivers
// who've gone private, so those come back null ("Race not found").
const userId = computed(() => race.value?.user_id)

watch(() => route.params.raceId, async id => {
  loading.value = true
  try {
    race.value = await getRace(id)
  } catch (err) {
    race.value = null
    pushToast(err.message || 'Failed to load race', 'error')
  } finally {
    loading.value = false
  }
}, { immediate: true })

const driverName = computed(() => race.value?.driver?.display_name || 'Driver')
const vehicleName = computed(() => race.value?.vehicle?.name || '')
const classInfo = computed(() => piInfo(race.value?.performance_index))
const trackImage = computed(() => trackImageUrl(race.value.variation.track.slug))
const mapImage = computed(() => variationImageUrl(race.value.variation.track.slug, race.value.variation.slug))
const variationPath = computed(() => `/${userId.value}/track/${race.value.variation.track.slug}/${race.value.variation.slug}`)
const dateLabel = computed(() => new Date(race.value.datetime).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }))
const hasLapTimes = computed(() => Array.isArray(race.value?.lap_times_ms) && race.value.lap_times_ms.some(ms => ms != null))

// Finishers by position, then anyone without one (DNFs) at the end.
const roster = computed(() => {
  const rows = Array.isArray(race.value?.results_roster) ? [...race.value.results_roster] : []
  return rows.sort((a, b) => (a.position ?? Infinity) - (b.position ?? Infinity))
})
const hasTuning = computed(() => roster.value.some(r => r.tuning))
const hasAssists = computed(() => roster.value.some(assistsOf))
const hasParts = computed(() => roster.value.some(r => r.parts))
// One grid template for every row (each row is its own grid, so only fixed
// widths line up across rows); tune/parts columns only when someone has them.
const rosterCols = computed(() => [
  '48px', 'minmax(0,1.6fr)', 'minmax(0,1fr)',
  hasTuning.value && '136px', hasAssists.value && '176px', hasParts.value && '136px',
  '80px', '80px'
].filter(Boolean).join(' '))
const podium = computed(() => [2, 1, 3].map(p => roster.value.find(r => r.position === p && !r.dnf && !r.quit)).filter(Boolean))
const winnerMs = computed(() => roster.value.find(r => r.position === 1)?.total_time_ms)
const fastestLapMs = computed(() => {
  const times = roster.value.map(r => r.best_lap_ms).filter(ms => ms > 0)
  return times.length ? Math.min(...times) : null
})
// Bar heights as a % of the chart: the axis starts well below the quickest
// lap (so it still has a visible bar) and tops out just above the slowest.
const TICK_STEPS = [500, 1000, 2000, 5000, 10000, 15000, 30000, 60000]
const lapChart = computed(() => {
  const laps = race.value.lap_times_ms.map(ms => (ms > 0 ? Number(ms) : null))
  const times = laps.filter(ms => ms != null)
  const min = Math.min(...times), max = Math.max(...times)
  const span = Math.max(max - min, min * 0.05) // all-equal laps still get a scale
  const hi = max + span * 0.15
  // Round gridlines: the smallest step giving at most 4 of them, the axis
  // starting on one.
  const rough = Math.max(0, min - span * 0.6)
  const step = TICK_STEPS.find(s => (hi - Math.floor(rough / s) * s) / s <= 4) ?? 60000
  const lo = Math.floor(rough / step) * step
  const pct = ms => ((ms - lo) / (hi - lo)) * 100
  const ticks = []
  for (let ms = lo; ms < hi; ms += step) ticks.push({ ms, top: `${100 - pct(ms)}%`, label: formatMsToTime(ms).replace(/\.000$/, '') })
  return {
    bars: laps.map((ms, i) => ({ n: i + 1, ms, best: ms === min, label: ms != null ? formatMsToTime(ms) : '', height: ms != null ? `${pct(ms)}%` : 0 })),
    ticks
  }
})

// The driver's own roster entry. races.place is text, roster positions are numbers.
function isMe(r) {
  return r.position != null && String(r.position) === String(race.value.place)
}
function fmt(ms) {
  return ms ? formatMsToTime(ms) : '—'
}
function classLetter(cls) {
  return String(cls).trim().split(/\s+/)[0]
}
function tunes(t) {
  return TUNE_KEYS.map(([k, key]) => ({ k, v: t[key] }))
}
// Roster entries often lack assists (the plugin can't always see other
// drivers'), but the driver's own are always on the race itself.
function assistsOf(r) {
  const a = r.assists ?? (isMe(r) ? race.value.assists : null)
  return a && Object.keys(a).length ? a : null
}
// formatAssists' "MC,H,O,F" codes, each under its own label like the tune.
function assistCodes(a) {
  const codes = formatAssists(a).split(',')
  return ASSIST_KEYS.map((k, i) => ({ k, v: codes[i] ?? '—' }))
}
function lapsText(r) {
  if (r.laps_completed == null) return ''
  if (r.dnf || r.quit) return `${r.dnf ? 'Did not finish' : 'Quit'} · ${r.laps_completed} laps`
  return `${r.laps_completed} laps`
}
function gapText(r) {
  if (r.dnf) return 'DNF'
  if (r.quit) return 'QUIT'
  if (r.position === 1) return 'Winner'
  if (r.total_time_ms && winnerMs.value) return formatDelta(r.total_time_ms - winnerMs.value)
  return '—'
}
async function copyLink() {
  try {
    await navigator.clipboard.writeText(window.location.href)
    pushToast('Link copied', 'success')
  } catch {
    pushToast('Could not copy the link', 'error')
  }
}
</script>
