<template>
  <div class="max-w-7xl mx-auto px-6 py-10">
    <p v-if="loading" class="font-body text-[15px] text-brand-muted dark:text-brand-muted-dark">Loading…</p>

    <div v-else-if="!track">
      <p class="font-body text-[15px] text-brand-muted dark:text-brand-muted-dark">Track not found.</p>
      <router-link to="/tracks" class="text-brand-accent text-sm hover:underline">← Back to tracks</router-link>
    </div>

    <div v-else>
      <!-- Hero banner -->
      <img
        v-if="track"
        :src="trackImage"
        :alt="track.name"
        class="w-full h-28 sm:h-40 object-cover border border-brand-border dark:border-brand-border-dark mb-4 cursor-pointer grayscale hover:opacity-90 transition-opacity"
        @click="openImageModal"
      />

      <!-- Track header row -->
      <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
        <div class="min-w-0 flex-1">
          <h1 class="font-heading font-normal tracking-normal leading-none text-display-lg text-brand-text dark:text-brand-text-dark">
            <em class="signal">{{ track.name }}</em>
          </h1>
          <div class="flex flex-wrap gap-2 mt-3">
            <router-link
              v-for="v in track.track_variations"
              :key="v.id"
              :to="`/track/${track.slug}/${v.slug}`"
              class="flex items-center gap-2 min-h-[44px] px-4 text-xs border"
              :class="v.id === currentVariation.id
                ? 'bg-brand-accent dark:bg-brand-accent-dark text-white border-brand-accent dark:border-brand-accent-dark'
                : 'border-brand-border dark:border-brand-border-dark text-brand-muted dark:text-brand-muted-dark hover:border-brand-accent'"
            >
              <img
                :src="variationImageUrl(track.slug, v.slug)"
                alt=""
                aria-hidden="true"
                class="w-8 h-6 object-contain map-art"
                loading="lazy"
              />
              <span>{{ v.name }}</span>
            </router-link>
          </div>
        </div>

        <div class="flex gap-2 w-full sm:w-auto sm:self-start shrink-0">
          <button
            type="button"
            class="flex-1 sm:flex-none min-h-[44px] font-display font-bold text-[13px] bg-brand-accent dark:bg-brand-accent-dark text-white px-6 hover:opacity-85 active:opacity-70 transition-opacity"
            @click="onAddRow"
          >
            + Add race
          </button>
        </div>
      </div>

      <!-- Track Notes -->
      <div class="mb-8 rule-top pt-4">
        <div v-if="!notesEditMode" class="flex items-start gap-2">
          <div
            v-if="trackNotesHtml"
            class="flex-1 text-sm prose prose-sm dark:prose-invert max-w-none"
            v-html="trackNotesHtml"
          />
          <p
            v-else
            class="flex-1 font-body text-[15px] text-brand-muted dark:text-brand-muted-dark italic"
          >Add notes about this track…</p>
          <button
            type="button"
            class="text-brand-muted dark:text-brand-muted-dark hover:text-brand-accent shrink-0 mt-0.5"
            title="Edit notes"
            @click="startEditNotes"
          >
            <span class="w-4 h-4 inline-block" v-html="editIcon"></span>
          </button>
        </div>
        <div v-else class="flex flex-col gap-2">
          <textarea
            ref="notesTextarea"
            v-model="notesInput"
            rows="4"
            class="w-full text-sm rounded border border-brand-border dark:border-brand-border-dark bg-brand-bg dark:bg-brand-bg-dark text-brand-text dark:text-brand-text-dark px-2 py-1.5 resize-y focus:outline-none focus:ring-1 focus:ring-brand-accent"
            placeholder="Notes about this track…"
          />
          <div class="flex gap-2 justify-end">
            <button
              type="button"
              class="px-3 py-1 text-sm rounded border border-brand-border dark:border-brand-border-dark hover:border-brand-secondary dark:hover:border-brand-secondary-dark"
              @click="cancelEditNotes"
            >Cancel</button>
            <button
              type="button"
              class="font-display font-black uppercase tracking-widest bg-brand-accent text-white px-4 py-1 rounded-none hover:opacity-85 active:opacity-70 transition-opacity text-sm"
              @click="saveNotes"
            >Save</button>
          </div>
        </div>
      </div>

      <!-- Turn Annotations -->
      <VariationAnnotations
        v-if="currentVariation"
        :image-url="variationMapImage"
        :alt="currentVariation.name"
        :track-slug="track.slug"
        :variation-slug="currentVariation.slug"
        :ring-label="`${track.name} — ${currentVariation.name}`"
        :annotations="annotations"
        @save="onSaveAnnotations"
      />

      <LapTimeChart :races="filteredRaces" :vehicles="vehicles" />

      <div class="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div class="rule-top pt-3">
          <div class="ov text-brand-muted dark:text-brand-muted-dark">Personal best</div>
          <div class="font-display font-black tracking-tightest text-display-sm tabular text-brand-text dark:text-brand-text-dark mt-2">{{ pbDisplay }}</div>
        </div>
        <div class="rule-top pt-3">
          <div class="ov text-brand-muted dark:text-brand-muted-dark">Goal lap time</div>
          <div class="mt-2">
            <LapTimeInput v-model="goalInputMs" @blur="onSaveGoal" />
          </div>
        </div>
        <div class="pt-3 border-t-2 border-brand-accent dark:border-brand-accent-dark">
          <div class="ov text-brand-accent dark:text-brand-accent-dark">Gap to goal</div>
          <div class="font-display font-black tracking-tightest text-display-sm tabular mt-2"
               :class="gapMs != null && gapMs <= 0 ? 'text-brand-good dark:text-brand-good-dark' : 'text-brand-accent dark:text-brand-accent-dark'">
            {{ gapDisplay }}
          </div>
        </div>
        <div class="rule-top pt-3">
          <div class="ov text-brand-muted dark:text-brand-muted-dark">Races here</div>
          <div class="font-display font-black tracking-tightest text-display-sm tabular text-brand-text dark:text-brand-text-dark mt-2">{{ races.length }}</div>
        </div>
      </div>

      <div class="grid grid-cols-3 gap-6">
        <div class="rule-top pt-3">
          <div class="ov text-brand-muted dark:text-brand-muted-dark">Top 3 finishes</div>
          <div class="font-display font-black tracking-tightest text-display-sm tabular text-brand-text dark:text-brand-text-dark mt-2">{{ top3Rate.pct }}</div>
          <div class="text-xs tabular text-brand-muted dark:text-brand-muted-dark mt-1">{{ top3Rate.count }} / {{ top3Rate.total }}</div>
        </div>
        <div class="rule-top pt-3">
          <div class="ov text-brand-muted dark:text-brand-muted-dark">Top 5 finishes</div>
          <div class="font-display font-black tracking-tightest text-display-sm tabular text-brand-text dark:text-brand-text-dark mt-2">{{ top5Rate.pct }}</div>
          <div class="text-xs tabular text-brand-muted dark:text-brand-muted-dark mt-1">{{ top5Rate.count }} / {{ top5Rate.total }}</div>
        </div>
        <div class="rule-top pt-3">
          <div class="ov text-brand-muted dark:text-brand-muted-dark">Top 10 finishes</div>
          <div class="font-display font-black tracking-tightest text-display-sm tabular text-brand-text dark:text-brand-text-dark mt-2">{{ top10Rate.pct }}</div>
          <div class="text-xs tabular text-brand-muted dark:text-brand-muted-dark mt-1">{{ top10Rate.count }} / {{ top10Rate.total }}</div>
        </div>
      </div>
      <p class="text-xs text-brand-muted dark:text-brand-muted-dark italic mt-2 mb-12">
        Excludes lone races (a race with a roster, but only one racer) and races with no place logged.
      </p>

      <!-- Mobile filter drawer — the table's column-header filters have
           nowhere to live once the table becomes cards, so they're
           reproduced here (inline, not popup) behind a side tab. -->
      <FilterDrawer>
        <ColumnFilterMenu inline label="Vehicle" v-model="columnFilters.vehicleId" :options="vehicleOptions" />
        <ColumnFilterMenu inline label="Class (PI)" v-model="columnFilters.performanceIndex" :options="piOptions">
          <template #option="{ option }"><PerformanceIndexBadge :value="option.value" /></template>
        </ColumnFilterMenu>
        <ColumnFilterMenu inline label="Tune" v-model="columnFilters.tuning" :options="tuningOptions" />
        <ColumnFilterMenu inline label="Place" v-model="columnFilters.place" :options="placeOptions" />
        <ColumnFilterMenu
          inline
          label="Columns"
          heading="Columns to Display"
          :searchable="false"
          v-model="columnVisibility.state.hidden"
          :options="columnOptions"
        />
      </FilterDrawer>

      <div>
        <div class="flex items-end justify-between border-b-2 border-brand-strong dark:border-brand-strong-dark pb-2.5 mb-1">
          <h2 class="font-heading font-normal tracking-normal leading-none text-display-sm text-brand-text dark:text-brand-text-dark">
            Logged races
          </h2>
          <div class="hidden sm:flex items-center gap-3">
            <span class="ov text-brand-muted dark:text-brand-muted-dark">{{ filteredRaces.length }} at this variation</span>
            <ColumnFilterMenu
              label="Columns"
              heading="Columns to Display"
              title="Filter Columns"
              :icon="columnsIcon"
              icon-size="w-5 h-5"
              :searchable="false"
              :highlight-when-active="false"
              v-model="columnVisibility.state.hidden"
              :options="columnOptions"
            />
          </div>
          <span class="sm:hidden ov text-brand-muted dark:text-brand-muted-dark">{{ filteredRaces.length }} at this variation</span>
        </div>

        <!-- Card layout (mobile) -->
        <div class="sm:hidden">
          <RaceRow
            v-for="race in sortedRaces"
            :key="race.id"
            layout="card"
            :race="race"
            :vehicles="vehicles"
            :goal-lap-time-ms="goalLapTimeMs"
            :personal-best-ms="personalBestMs"
            :visible-columns="visibleColumnKeys"
            @update="onUpdateRace"
            @delete="onDeleteRace"
          />
          <p v-if="!races.length" class="py-6 text-center font-body text-[15px] text-brand-muted dark:text-brand-muted-dark">
            No races yet — click <span class="font-semibold">+ Add Race</span> to log one.
          </p>
          <p v-else-if="!filteredRaces.length" class="py-6 text-center font-body text-[15px] text-brand-muted dark:text-brand-muted-dark">
            No races match the current filter.
            <button type="button" class="text-brand-accent dark:text-brand-accent-dark underline" @click="resetColumnFilters">Clear filters</button>
          </p>
        </div>

        <!-- Table layout (desktop) -->
        <div class="hidden sm:block overflow-x-auto">
          <table class="min-w-full text-sm">
            <thead class="text-left ov ov-lg text-brand-accent dark:text-brand-accent-dark">
              <tr>
                <th v-if="columnVisibility.isVisible('when')" class="py-2.5 pl-0 pr-3">
                  <button type="button" class="group inline-flex items-center gap-1 hover:text-brand-text dark:hover:text-brand-text-dark" :title="sort.titleFor('when', 'Date')" :aria-label="sort.titleFor('when', 'Date')" @click="sort.toggle('when')">
                    Date
                    <SortCaret :direction="sort.directionFor('when')" />
                  </button>
                </th>
                <th v-if="columnVisibility.isVisible('vehicle')" class="py-2 pr-3">
                  <span class="inline-flex items-center gap-1">
                    <button type="button" class="group inline-flex items-center gap-1 hover:text-brand-text dark:hover:text-brand-text-dark" :title="sort.titleFor('vehicle', 'Vehicle')" :aria-label="sort.titleFor('vehicle', 'Vehicle')" @click="sort.toggle('vehicle')">
                      Vehicle
                      <SortCaret :direction="sort.directionFor('vehicle')" />
                    </button>
                    <ColumnFilterMenu label="Vehicle" icon-size="w-4 h-4" v-model="columnFilters.vehicleId" :options="vehicleOptions" />
                  </span>
                </th>
                <th v-if="columnVisibility.isVisible('pi')" class="py-2 pr-3">
                  <span class="inline-flex items-center gap-1">
                    <button type="button" class="group inline-flex items-center gap-1 hover:text-brand-text dark:hover:text-brand-text-dark" :title="sort.titleFor('pi', 'Class (PI)')" :aria-label="sort.titleFor('pi', 'Class (PI)')" @click="sort.toggle('pi')">
                      Class (PI)
                      <SortCaret :direction="sort.directionFor('pi')" />
                    </button>
                    <ColumnFilterMenu label="Class (PI)" icon-size="w-4 h-4" v-model="columnFilters.performanceIndex" :options="piOptions">
                      <template #option="{ option }"><PerformanceIndexBadge :value="option.value" /></template>
                    </ColumnFilterMenu>
                  </span>
                </th>
                <th v-if="columnVisibility.isVisible('weight')" class="py-2 pr-3 text-right">
                  <button type="button" class="group inline-flex items-center justify-end gap-1 w-full hover:text-brand-text dark:hover:text-brand-text-dark" :title="sort.titleFor('weight', 'Weight')" :aria-label="sort.titleFor('weight', 'Weight')" @click="sort.toggle('weight')">
                    Weight
                    <SortCaret :direction="sort.directionFor('weight')" />
                  </button>
                </th>
                <th v-if="columnVisibility.isVisible('tune')" class="py-2 pr-3 text-center">
                  <span class="inline-flex items-center justify-center gap-1">
                    <button type="button" class="group inline-flex items-center gap-1 hover:text-brand-text dark:hover:text-brand-text-dark" :title="sort.titleFor('tune', 'Tune')" :aria-label="sort.titleFor('tune', 'Tune')" @click="sort.toggle('tune')">
                      Tune
                      <SortCaret :direction="sort.directionFor('tune')" />
                    </button>
                    <ColumnFilterMenu label="Tune" icon-size="w-4 h-4" v-model="columnFilters.tuning" :options="tuningOptions" />
                  </span>
                </th>
                <th v-if="columnVisibility.isVisible('assists')" class="py-2 pr-3 text-center">
                  <button type="button" class="group inline-flex items-center justify-center gap-1 w-full hover:text-brand-text dark:hover:text-brand-text-dark" :title="sort.titleFor('assists', 'Assists')" :aria-label="sort.titleFor('assists', 'Assists')" @click="sort.toggle('assists')">
                    Assists
                    <SortCaret :direction="sort.directionFor('assists')" />
                  </button>
                </th>
                <th v-if="columnVisibility.isVisible('place')" class="py-2 pr-3 text-center">
                  <span class="inline-flex items-center justify-center gap-1">
                    <button type="button" class="group inline-flex items-center gap-1 hover:text-brand-text dark:hover:text-brand-text-dark" :title="sort.titleFor('place', 'Place')" :aria-label="sort.titleFor('place', 'Place')" @click="sort.toggle('place')">
                      Place
                      <SortCaret :direction="sort.directionFor('place')" />
                    </button>
                    <ColumnFilterMenu label="Place" icon-size="w-4 h-4" v-model="columnFilters.place" :options="placeOptions" />
                  </span>
                </th>
                <th v-if="columnVisibility.isVisible('laps')" class="py-2 pr-3 text-center">
                  <button type="button" class="group inline-flex items-center justify-center gap-1 w-full hover:text-brand-text dark:hover:text-brand-text-dark" :title="sort.titleFor('laps', 'Laps')" :aria-label="sort.titleFor('laps', 'Laps')" @click="sort.toggle('laps')">
                    Laps
                    <SortCaret :direction="sort.directionFor('laps')" />
                  </button>
                </th>
                <th v-if="columnVisibility.isVisible('lap')" class="py-2 pr-3">
                  <button type="button" class="group inline-flex items-center gap-1 hover:text-brand-text dark:hover:text-brand-text-dark" :title="sort.titleFor('lap', 'Lap time')" :aria-label="sort.titleFor('lap', 'Lap time')" @click="sort.toggle('lap')">
                    Lap time
                    <SortCaret :direction="sort.directionFor('lap')" />
                  </button>
                </th>
                <th v-if="columnVisibility.isVisible('gap')" class="py-2 pr-3">
                  <button type="button" class="group inline-flex items-center gap-1 hover:text-brand-text dark:hover:text-brand-text-dark" :title="sort.titleFor('gap', 'Δ goal')" :aria-label="sort.titleFor('gap', 'Δ goal')" @click="sort.toggle('gap')">
                    Δ goal
                    <SortCaret :direction="sort.directionFor('gap')" />
                  </button>
                </th>
                <th v-if="columnVisibility.isVisible('total')" class="py-2 pr-3">
                  <button type="button" class="group inline-flex items-center gap-1 hover:text-brand-text dark:hover:text-brand-text-dark" :title="sort.titleFor('total', 'Total time')" :aria-label="sort.titleFor('total', 'Total time')" @click="sort.toggle('total')">
                    Total time
                    <SortCaret :direction="sort.directionFor('total')" />
                  </button>
                </th>
                <th v-if="columnVisibility.isVisible('notes')" class="py-2 pr-3">Notes</th>
                <th class="py-2 pr-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <RaceRow
                v-for="race in sortedRaces"
                :key="race.id"
                :race="race"
                :vehicles="vehicles"
                :goal-lap-time-ms="goalLapTimeMs"
                :personal-best-ms="personalBestMs"
                :visible-columns="visibleColumnKeys"
                @update="onUpdateRace"
                @delete="onDeleteRace"
              />
              <tr v-if="!races.length">
                <td :colspan="visibleColumnKeys.length + 1" class="py-6 text-center font-body text-[15px] text-brand-muted dark:text-brand-muted-dark">
                  No races yet — click <span class="font-semibold">+ Add Race</span> to log one.
                </td>
              </tr>
              <tr v-else-if="!filteredRaces.length">
                <td :colspan="visibleColumnKeys.length + 1" class="py-6 text-center font-body text-[15px] text-brand-muted dark:text-brand-muted-dark">
                  No races match the current filter.
                  <button type="button" class="text-brand-accent dark:text-brand-accent-dark underline" @click="resetColumnFilters">Clear filters</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>

  <!-- Hero image modal -->
  <Teleport to="body">
    <div
      v-if="showImageModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      @click.self="closeImageModal"
    >
      <div class="relative max-w-4xl w-full mx-4">
        <button
          type="button"
          class="absolute -top-8 right-0 text-white/80 hover:text-white"
          aria-label="Close"
          @click="closeImageModal"
        >
          <span class="w-6 h-6 inline-block" v-html="closeIcon"></span>
        </button>
        <img
          :src="trackImage"
          :alt="track && track.name"
          class="w-full max-h-[85vh] object-contain rounded"
        />
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import RaceRow from '../components/RaceRow.vue'
import LapTimeChart from '../components/LapTimeChart.vue'
import VariationAnnotations from '../components/VariationAnnotations.vue'
import ColumnFilterMenu from '../components/ColumnFilterMenu.vue'
import FilterDrawer from '../components/FilterDrawer.vue'
import PerformanceIndexBadge from '../components/PerformanceIndexBadge.vue'
import { getTrackBySlug, findVariation } from '../services/trackService.js'
import { getVehicles } from '../services/vehicleService.js'
import { getRacesByVariation, updateRace, deleteRace } from '../services/raceService.js'
import { getGoalForVariation, upsertGoal } from '../services/goalService.js'
import { getAnnotationsForVariation, saveAnnotations } from '../services/annotationService.js'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { authStore } from '../stores/authStore.js'
import { pushToast } from '../stores/toastStore.js'
import editIcon from '../assets/icons/edit.svg?raw'
import closeIcon from '../assets/icons/close-filled.svg?raw'
import { quickAddStore, setOnRaceSaved, clearOnRaceSaved, openQuickAdd } from '../stores/quickAddStore.js'
import { formatMsToTime, formatDelta } from '../utils/timeFormat.js'
import LapTimeInput from '../components/LapTimeInput.vue'
import { trackImageUrl, variationImageUrl } from '../utils/imageUrl.js'
import { useEventListener } from '../composables/useEventListener.js'
import { buildOptions, sortOptions } from '../utils/filterOptions.js'
import { createColumnVisibility } from '../utils/columnVisibility.js'
import { createSortState, sortRows } from '../utils/sortState.js'
import { placementRate } from '../utils/raceStats.js'
import { formatAssists } from '../utils/assistsFormat.js'
import columnsIcon from '../assets/icons/columns.svg?raw'
import SortCaret from '../components/SortCaret.vue'

const route = useRoute()

const TABLE_COLUMNS = [
  { key: 'when', label: 'Date' },
  { key: 'vehicle', label: 'Vehicle' },
  { key: 'pi', label: 'Class (PI)' },
  { key: 'weight', label: 'Weight' },
  { key: 'tune', label: 'Tune' },
  { key: 'assists', label: 'Assists' },
  { key: 'place', label: 'Place' },
  { key: 'laps', label: 'Laps' },
  { key: 'lap', label: 'Lap time' },
  { key: 'gap', label: 'Δ goal' },
  { key: 'total', label: 'Total time' },
  { key: 'notes', label: 'Notes' }
  // 'Actions' is intentionally left out — it's always shown, since hiding it
  // would remove the row's only in-table way to edit/delete a race.
]
const columnOptions = TABLE_COLUMNS.map(c => ({ value: c.key, label: c.label }))
// Shown only on a first-ever visit, before the column picker has written
// anything to localStorage — after that, whatever the user has chosen wins.
const DEFAULT_HIDDEN_COLUMNS = ['weight', 'tune', 'gap', 'assists']
const columnVisibility = createColumnVisibility('wreckfest:columns:trackDetail', TABLE_COLUMNS.map(c => c.key), DEFAULT_HIDDEN_COLUMNS)
const visibleColumnKeys = computed(() => TABLE_COLUMNS.map(c => c.key).filter(columnVisibility.isVisible))
const sort = createSortState()

const loading = ref(true)
const track = ref(null)
const currentVariation = ref(null)
const vehicles = ref([])
const races = ref([])
const goal = ref(null)
const goalInputMs = ref(null)
const annotations = ref([])
const showImageModal = ref(false)
const notesEditMode = ref(false)
const notesInput = ref('')
const notesTextarea = ref(null)

const UNRESOLVED_VEHICLE = '__unresolved_vehicle__'
const columnFilters = ref({ vehicleId: [], performanceIndex: [], tuning: [], place: [] })

// Non-reactive: just tracks whether *this page* was the one that opened the
// quick-add modal, so its "saved" callback below only refreshes races when
// closing a modal it opened itself (not one opened from somewhere else).
let quickAddOpenedHere = false

const trackImage = computed(() => track.value ? trackImageUrl(track.value.slug) : '')
const goalLapTimeMs = computed(() => goal.value ? goal.value.goal_lap_time_ms : null)
const personalBestMs = computed(() => {
  // A 0 lap_time_ms means no completed lap was recorded (same convention
  // LapTimeChart.vue uses), not an actual zero-millisecond lap — treat it
  // like a missing time rather than letting it win every "personal best".
  const valid = filteredRaces.value.map(r => r.lap_time_ms).filter(v => !!v)
  if (!valid.length) return null
  return Math.min(...valid)
})
const pbDisplay = computed(() => personalBestMs.value != null ? formatMsToTime(personalBestMs.value) : '—')
const gapMs = computed(() => {
  if (personalBestMs.value == null || goalLapTimeMs.value == null) return null
  return personalBestMs.value - goalLapTimeMs.value
})
const gapDisplay = computed(() => gapMs.value == null ? '—' : formatDelta(gapMs.value))
const trackNotes = computed(() => goal.value ? (goal.value.notes || '') : '')
const trackNotesHtml = computed(() => trackNotes.value ? DOMPurify.sanitize(marked.parse(trackNotes.value)) : '')
const variationMapImage = computed(() => (
  track.value && currentVariation.value
    ? variationImageUrl(track.value.slug, currentVariation.value.slug)
    : ''
))

// These mirror RaceRow's own display fallbacks exactly (`??` for tuning,
// `||` for place, and vehicle lookup falling back to '—' for both a null
// vehicle_id and one that no longer resolves against `vehicles`), so a race
// bucketed under "—" here is always one that visually shows "—" in the table.
function vehicleKey(race) {
  const v = vehicles.value.find(x => x.id === race.vehicle_id)
  return v ? v.id : UNRESOLVED_VEHICLE
}
function vehicleLabel(race) {
  const v = vehicles.value.find(x => x.id === race.vehicle_id)
  return v ? v.name : '—'
}
function piKey(race) {
  return race.performance_index != null ? race.performance_index : null
}
function tuneKey(race) {
  // `tuning` is a numeric slider-config code (see RaceForm.vue), not text —
  // stringify it so it sorts/compares consistently with the other columns.
  return race.tuning != null ? String(race.tuning) : '—'
}
function placeKey(race) {
  return race.place || '—'
}

// One value-getter per sortable column (everything but Notes/Actions), fed
// to sortRows() — each returns either a number (or a date's timestamp) or a
// display string, so sortRows can compare by the right datatype instead of
// always doing a string compare.
function lapCountValue(race) {
  if (race.lap_count != null) return race.lap_count
  if (Array.isArray(race.lap_times_ms)) return race.lap_times_ms.length
  return null
}
const SORT_VALUE_GETTERS = {
  when: race => new Date(race.datetime).getTime(),
  vehicle: vehicleLabel,
  pi: race => race.performance_index,
  weight: race => race.vehicle_weight_kg,
  tune: race => race.tuning,
  assists: race => formatAssists(race.assists),
  place: race => race.place,
  laps: lapCountValue,
  lap: race => race.lap_time_ms,
  gap: race => (race.lap_time_ms != null && goalLapTimeMs.value != null) ? race.lap_time_ms - goalLapTimeMs.value : null,
  total: race => race.total_time_ms
}

// Matches a race against every column filter except `exceptKey` — used to
// build each column's own option list off what's visible once every *other*
// filter is applied (real cross-filtering, like Excel's AutoFilter), while
// never narrowing a column by its own selection so its own checked/unchecked
// values don't vanish from its own list.
function matchesFilters(race, exceptKey) {
  const f = columnFilters.value
  if (exceptKey !== 'vehicleId' && f.vehicleId.includes(vehicleKey(race))) return false
  if (exceptKey !== 'performanceIndex' && f.performanceIndex.includes(piKey(race))) return false
  if (exceptKey !== 'tuning' && f.tuning.includes(tuneKey(race))) return false
  if (exceptKey !== 'place' && f.place.includes(placeKey(race))) return false
  return true
}

const vehicleOptions = computed(() => sortOptions(
  buildOptions(races.value.filter(r => matchesFilters(r, 'vehicleId')), vehicleKey, vehicleLabel)
))
const piOptions = computed(() => sortOptions(
  buildOptions(
    races.value.filter(r => matchesFilters(r, 'performanceIndex')),
    piKey,
    race => race.performance_index != null ? String(race.performance_index) : '—'
  ),
  { numeric: true }
))
const tuningOptions = computed(() => sortOptions(
  buildOptions(races.value.filter(r => matchesFilters(r, 'tuning')), tuneKey, tuneKey),
  { numeric: true }
))
const placeOptions = computed(() => sortOptions(
  buildOptions(races.value.filter(r => matchesFilters(r, 'place')), placeKey, placeKey),
  { numeric: true }
))

const filteredRaces = computed(() => races.value.filter(race => matchesFilters(race)))
const sortedRaces = computed(() => sortRows(filteredRaces.value, sort.state, SORT_VALUE_GETTERS))

const top3Rate = computed(() => placementRate(filteredRaces.value, 3))
const top5Rate = computed(() => placementRate(filteredRaces.value, 5))
const top10Rate = computed(() => placementRate(filteredRaces.value, 10))

function resetColumnFilters() {
  columnFilters.value = { vehicleId: [], performanceIndex: [], tuning: [], place: [] }
}

async function loadRaces() {
  races.value = await getRacesByVariation(currentVariation.value.id)
}
async function loadGoal() {
  goal.value = await getGoalForVariation(currentVariation.value.id)
  goalInputMs.value = goal.value ? goal.value.goal_lap_time_ms : null
}
async function loadAnnotations() {
  annotations.value = await getAnnotationsForVariation(currentVariation.value.id)
}
async function loadAll() {
  loading.value = true
  resetColumnFilters()
  const slug = route.params.trackSlug
  const variationSlug = route.params.variationSlug
  try {
    const [trackData, vehicleList] = await Promise.all([
      getTrackBySlug(slug),
      getVehicles()
    ])
    track.value = trackData
    vehicles.value = vehicleList
    currentVariation.value = findVariation(trackData, variationSlug)
    if (!currentVariation.value) {
      pushToast('Variation not found', 'error')
      return
    }
    quickAddStore.currentPageVariationId = currentVariation.value.id
    await Promise.all([loadRaces(), loadGoal(), loadAnnotations()])
  } catch (err) {
    pushToast(err.message || 'Failed to load track', 'error')
  } finally {
    loading.value = false
  }
}

function isTypingTarget(el) {
  if (!el) return false
  const tag = (el.tagName || '').toLowerCase()
  if (tag === 'input' || tag === 'textarea' || tag === 'select') return true
  if (el.isContentEditable) return true
  return false
}

function onAddRow() {
  quickAddOpenedHere = true
  openQuickAdd(currentVariation.value.id)
}

function onAddRaceKeydown(event) {
  if (event.ctrlKey || event.metaKey || event.altKey) return
  if (isTypingTarget(event.target)) return
  if (event.key !== 'a' && event.key !== 'A') return
  if (quickAddStore.open || showImageModal.value) return
  if (!currentVariation.value) return
  event.preventDefault()
  onAddRow()
}

function openImageModal() {
  showImageModal.value = true
}
function closeImageModal() {
  showImageModal.value = false
}

function startEditNotes() {
  notesInput.value = trackNotes.value
  notesEditMode.value = true
  nextTick(() => notesTextarea.value?.focus())
}
function cancelEditNotes() {
  notesEditMode.value = false
}
async function saveNotes() {
  try {
    const userId = authStore.user && authStore.user.id
    goal.value = await upsertGoal({
      variationId: currentVariation.value.id,
      goalLapTimeMs: goalLapTimeMs.value,
      notes: notesInput.value,
      userId
    })
    notesEditMode.value = false
    pushToast('Notes saved', 'success', 1500)
  } catch (err) {
    pushToast(err.message || 'Failed to save notes', 'error')
  }
}

async function onSaveAnnotations(newAnnotations) {
  try {
    const userId = authStore.user && authStore.user.id
    annotations.value = await saveAnnotations({
      variationId: currentVariation.value.id,
      annotations: newAnnotations,
      userId
    })
    pushToast('Annotations saved', 'success', 1500)
  } catch (err) {
    pushToast(err.message || 'Failed to save annotations', 'error')
  }
}

async function onUpdateRace({ id, patch }) {
  try {
    const updated = await updateRace(id, patch)
    const idx = races.value.findIndex(r => r.id === id)
    if (idx !== -1) races.value.splice(idx, 1, updated)
    pushToast('Race updated', 'success', 1500)
  } catch (err) {
    pushToast(err.message || 'Failed to update race', 'error')
  }
}
async function onDeleteRace(id) {
  try {
    await deleteRace(id)
    races.value = races.value.filter(r => r.id !== id)
    pushToast('Race deleted', 'success', 1500)
  } catch (err) {
    pushToast(err.message || 'Failed to delete race', 'error')
  }
}
async function onSaveGoal() {
  const ms = goalInputMs.value
  if (!ms) return
  if (goal.value && goal.value.goal_lap_time_ms === ms) return
  try {
    const userId = authStore.user && authStore.user.id
    goal.value = await upsertGoal({
      variationId: currentVariation.value.id,
      goalLapTimeMs: ms,
      notes: trackNotes.value,
      userId
    })
    pushToast('Goal saved', 'success', 1500)
  } catch (err) {
    pushToast(err.message || 'Failed to save goal', 'error')
  }
}

watch(() => route.params, loadAll)
watch(() => quickAddStore.open, (isOpen) => {
  if (!isOpen && quickAddOpenedHere) {
    quickAddOpenedHere = false
    loadRaces()
  }
})

useEventListener(document, 'keydown', (e) => { if (e.key === 'Escape') closeImageModal() })
useEventListener(document, 'keydown', onAddRaceKeydown)

onMounted(() => {
  setOnRaceSaved((variationId) => {
    if (variationId === currentVariation.value?.id) loadRaces()
  })
  loadAll()
})

onUnmounted(() => {
  quickAddStore.currentPageVariationId = null
  clearOnRaceSaved()
})
</script>
