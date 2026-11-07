<template>
  <DriverScope :user-id="userId" class="wide-table-page max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
    <p v-if="loading" class="font-body text-[15px] text-brand-muted dark:text-brand-muted-dark">Loading…</p>

    <div v-else-if="!track">
      <p class="font-body text-[15px] text-brand-muted dark:text-brand-muted-dark">Track not found.</p>
      <router-link :to="`${basePath}/tracks`" class="text-brand-accent text-sm hover:underline">← Back to tracks</router-link>
    </div>

    <div v-else>
      <!-- Hero banner -->
      <img
        v-if="track"
        :src="trackImage"
        :alt="track.name"
        class="w-full h-28 sm:h-40 object-cover border border-brand-border dark:border-brand-border-dark mb-4 cursor-pointer grayscale hover:opacity-90 transition-opacity"
        @click="showImageModal = true"
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
              :to="`${basePath}/track/${track.slug}/${v.slug}`"
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

        <div v-if="isOwnView" class="flex gap-2 w-full sm:w-auto sm:self-start shrink-0">
          <button
            type="button"
            class="flex-1 sm:flex-none min-h-[44px] font-display font-bold text-[13px] bg-brand-accent dark:bg-brand-accent-dark text-white px-6 hover:opacity-85 active:opacity-70 transition-opacity"
            @click="onAddRow"
          >
            + Add race
          </button>
        </div>
      </div>

      <!-- Your own track notes and annotations, on any log you're viewing —
           they're private, and only ever load and save as yours. -->
      <p v-if="isSignedIn && !isOwnView" class="ov text-brand-muted dark:text-brand-muted-dark mb-2">Your notes &amp; annotations — only you can see these</p>

      <!-- Track Notes (private — stored on your goal for this variation) -->
      <div v-if="isSignedIn" class="mb-8 rule-top pt-4">
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
              @click="notesEditMode = false"
            >Cancel</button>
            <button
              type="button"
              class="font-display font-black uppercase tracking-widest bg-brand-accent text-white px-4 py-1 rounded-none hover:opacity-85 active:opacity-70 transition-opacity text-sm"
              @click="saveNotes"
            >Save</button>
          </div>
        </div>
      </div>

      <!-- Turn Annotations (private) -->
      <VariationAnnotations
        v-if="currentVariation && isSignedIn"
        :image-url="variationImageUrl(track.slug, currentVariation.slug)"
        :alt="currentVariation.name"
        :track-slug="track.slug"
        :variation-slug="currentVariation.slug"
        :ring-label="`${track.name} — ${currentVariation.name}`"
        :annotations="annotations"
        @save="onSaveAnnotations"
      />

      <VehicleBestLapChart :races="filteredRaces" :vehicles="vehicles" />

      <div class="grid grid-cols-2 gap-6 mb-8" :class="{ 'lg:grid-cols-4': isOwnView }">
        <div class="rule-top pt-3">
          <div class="ov text-brand-muted dark:text-brand-muted-dark">{{ isCommunity ? 'Best lap' : 'Personal best' }}</div>
          <div class="font-display font-black tracking-tightest text-display-sm tabular text-brand-text dark:text-brand-text-dark mt-2">{{ personalBestMs != null ? formatMsToTime(personalBestMs) : '—' }}</div>
          <router-link
            v-if="isCommunity && bestRace"
            :to="`/${bestRace.user_id}/track/${track.slug}/${currentVariation.slug}`"
            class="text-xs text-brand-muted dark:text-brand-muted-dark hover:text-brand-accent dark:hover:text-brand-accent-dark"
          >by {{ bestRace.driverName }}</router-link>
        </div>
        <div v-if="isOwnView" class="rule-top pt-3">
          <div class="ov text-brand-muted dark:text-brand-muted-dark">Goal lap time</div>
          <div class="mt-2">
            <LapTimeInput v-model="goalInputMs" @blur="onSaveGoal" />
          </div>
        </div>
        <div v-if="isOwnView" class="pt-3 border-t-2 border-brand-accent dark:border-brand-accent-dark">
          <div class="ov text-brand-accent dark:text-brand-accent-dark">Gap to goal</div>
          <div class="font-display font-black tracking-tightest text-display-sm tabular mt-2"
               :class="gapMs != null && gapMs <= 0 ? 'text-brand-good dark:text-brand-good-dark' : 'text-brand-accent dark:text-brand-accent-dark'">
            {{ gapMs == null ? '—' : formatDelta(gapMs) }}
          </div>
        </div>
        <div class="rule-top pt-3">
          <div class="ov text-brand-muted dark:text-brand-muted-dark">Races here</div>
          <div class="font-display font-black tracking-tightest text-display-sm tabular text-brand-text dark:text-brand-text-dark mt-2">{{ races.length }}{{ hasMore ? '+' : '' }}</div>
        </div>
      </div>

      <!-- Placement rates describe one driver's results; across everyone
           they'd just average strangers together, so community mode skips them. -->
      <PlacementRateTiles v-if="!isCommunity" :rates="placementRates" />
      <p v-if="!isCommunity" class="text-xs text-brand-muted dark:text-brand-muted-dark italic mt-2 mb-12">
        Excludes lone races (a race with a roster, but only one racer) and races with no place logged.
      </p>
      <div v-else class="mb-12"></div>

      <!-- Mobile filter drawer — the table's column-header filters have
           nowhere to live once the table becomes cards, so they're
           reproduced here (inline, not popup) behind a side tab. -->
      <FilterDrawer>
        <SortMenu :columns="sortableColumns" :sort="sort" @toggle="toggleSort" @clear="clearSort" />
        <ColumnFilterMenu v-if="isCommunity" inline label="Driver" v-model="columnFilters.driver" :options="filterOptions.driver" />
        <ColumnFilterMenu inline label="Vehicle" v-model="columnFilters.vehicleId" :options="filterOptions.vehicleId" />
        <ColumnFilterMenu inline label="Class (PI)" v-model="columnFilters.performanceIndex" :options="filterOptions.performanceIndex">
          <template #option="{ option }"><PerformanceIndexBadge :value="option.value" /></template>
        </ColumnFilterMenu>
        <ColumnFilterMenu inline label="Tune" v-model="columnFilters.tuning" :options="filterOptions.tuning" />
        <ColumnFilterMenu inline label="Place" v-model="columnFilters.place" :options="filterOptions.place" />
        <ColumnFilterMenu v-if="isSignedIn" inline label="Favorites" v-model="columnFilters.favorite" :options="filterOptions.favorite" />
        <ColumnFilterMenu
          inline
          label="Columns"
          heading="Columns to Display"
          :searchable="false"
          v-model="hiddenColumns"
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
              v-model="hiddenColumns"
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
            :read-only="!isOwnRace(race)"
            :driver-path-suffix="`/track/${track.slug}/${currentVariation.slug}`"
            :favoritable="isSignedIn"
            @update="onUpdateRace"
            @delete="onDeleteRace"
          />
          <p v-if="!races.length" class="py-6 text-center font-body text-[15px] text-brand-muted dark:text-brand-muted-dark">
            <template v-if="isOwnView">No races{{ classSuffix }} yet — click <span class="font-semibold">+ Add Race</span> to log one.</template>
            <template v-else-if="isCommunity">No one has logged a race{{ classSuffix }} here yet.</template>
            <template v-else>No races logged{{ classSuffix }} here yet.</template>
          </p>
          <p v-else-if="!filteredRaces.length" class="py-6 text-center font-body text-[15px] text-brand-muted dark:text-brand-muted-dark">
            No races match the current filter.
            <button type="button" class="text-brand-accent dark:text-brand-accent-dark underline" @click="resetColumnFilters">Clear filters</button>
          </p>
        </div>

        <!-- Table layout (desktop) — no scroll box of its own; a table too
             wide for the page widens the page instead (see .wide-table-page). -->
        <div class="hidden sm:block">
          <table class="min-w-full text-sm">
            <thead class="text-left ov ov-lg text-brand-accent dark:text-brand-accent-dark">
              <tr>
                <th v-if="isSignedIn" class="w-px py-2 pl-0 pr-2">
                  <span class="flex w-5 justify-center">
                    <ColumnFilterMenu label="Favorites" :icon="columnFilters.favorite.length ? starFillIcon : starIcon" icon-size="w-4 h-4" v-model="columnFilters.favorite" :options="filterOptions.favorite" />
                  </span>
                </th>
                <th v-if="isShown('when')" class="py-2.5 pl-0 pr-3">
                  <SortHeader label="Date" sort-key="when" :sort="sort" @toggle="toggleSort" />
                </th>
                <th v-if="isShown('driver')" class="py-2 pr-3">
                  <span class="inline-flex items-center gap-1">
                    <SortHeader label="Driver" sort-key="driver" :sort="sort" @toggle="toggleSort" />
                    <ColumnFilterMenu label="Driver" icon-size="w-4 h-4" v-model="columnFilters.driver" :options="filterOptions.driver" />
                  </span>
                </th>
                <th v-if="isShown('vehicle')" class="py-2 pr-3">
                  <span class="inline-flex items-center gap-1">
                    <SortHeader label="Vehicle" sort-key="vehicle" :sort="sort" @toggle="toggleSort" />
                    <ColumnFilterMenu label="Vehicle" icon-size="w-4 h-4" v-model="columnFilters.vehicleId" :options="filterOptions.vehicleId" />
                  </span>
                </th>
                <th v-if="isShown('pi')" class="py-2 pr-3">
                  <span class="inline-flex items-center gap-1">
                    <SortHeader label="Class (PI)" sort-key="pi" :sort="sort" @toggle="toggleSort" />
                    <ColumnFilterMenu label="Class (PI)" icon-size="w-4 h-4" v-model="columnFilters.performanceIndex" :options="filterOptions.performanceIndex">
                      <template #option="{ option }"><PerformanceIndexBadge :value="option.value" /></template>
                    </ColumnFilterMenu>
                  </span>
                </th>
                <th v-if="isShown('weight')" class="py-2 pr-3 text-right">
                  <SortHeader class="justify-end w-full" label="Weight" sort-key="weight" :sort="sort" @toggle="toggleSort" />
                </th>
                <th v-if="isShown('tune')" class="py-2 pr-3 text-center">
                  <span class="inline-flex items-center justify-center gap-1">
                    <SortHeader label="Tune" sort-key="tune" :sort="sort" @toggle="toggleSort" />
                    <ColumnFilterMenu label="Tune" icon-size="w-4 h-4" v-model="columnFilters.tuning" :options="filterOptions.tuning" />
                  </span>
                </th>
                <th v-if="isShown('assists')" class="py-2 pr-3 text-center">
                  <SortHeader class="justify-center w-full" label="Assists" sort-key="assists" :sort="sort" @toggle="toggleSort" />
                </th>
                <th v-if="isShown('parts')" class="w-px py-2 pr-3 text-center whitespace-nowrap">Parts</th>
                <th v-if="isShown('place')" class="py-2 pr-3 text-center">
                  <span class="inline-flex items-center justify-center gap-1">
                    <SortHeader label="Place" sort-key="place" :sort="sort" @toggle="toggleSort" />
                    <ColumnFilterMenu label="Place" icon-size="w-4 h-4" v-model="columnFilters.place" :options="filterOptions.place" />
                  </span>
                </th>
                <th v-if="isShown('laps')" class="py-2 pr-3 text-center">
                  <SortHeader class="justify-center w-full" label="Laps" sort-key="laps" :sort="sort" @toggle="toggleSort" />
                </th>
                <th v-if="isShown('lap')" class="py-2 pr-3">
                  <SortHeader label="Lap time" sort-key="lap" :sort="sort" @toggle="toggleSort" />
                </th>
                <th v-if="isShown('gap')" class="py-2 pr-3">
                  <SortHeader label="Δ goal" sort-key="gap" :sort="sort" @toggle="toggleSort" />
                </th>
                <th v-if="isShown('total')" class="py-2 pr-3">
                  <SortHeader label="Total time" sort-key="total" :sort="sort" @toggle="toggleSort" />
                </th>
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
                :read-only="!isOwnRace(race)"
                :driver-path-suffix="`/track/${track.slug}/${currentVariation.slug}`"
                :favoritable="isSignedIn"
                @update="onUpdateRace"
                @delete="onDeleteRace"
              />
              <tr v-if="!races.length">
                <td :colspan="tableColspan" class="py-6 text-center font-body text-[15px] text-brand-muted dark:text-brand-muted-dark">
                  <template v-if="isOwnView">No races{{ classSuffix }} yet — click <span class="font-semibold">+ Add Race</span> to log one.</template>
                  <template v-else-if="isCommunity">No one has logged a race{{ classSuffix }} here yet.</template>
                  <template v-else>No races logged{{ classSuffix }} here yet.</template>
                </td>
              </tr>
              <tr v-else-if="!filteredRaces.length">
                <td :colspan="tableColspan" class="py-6 text-center font-body text-[15px] text-brand-muted dark:text-brand-muted-dark">
                  No races match the current filter.
                  <button type="button" class="text-brand-accent dark:text-brand-accent-dark underline" @click="resetColumnFilters">Clear filters</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="hasMore" class="mt-6 flex justify-center">
          <button
            type="button"
            class="ov min-h-[44px] px-6 border border-brand-border dark:border-brand-border-dark text-brand-text dark:text-brand-text-dark hover:border-brand-accent dark:hover:border-brand-accent-dark disabled:opacity-50"
            :disabled="loadingMore"
            @click="loadMoreRaces"
          >{{ loadingMore ? 'Loading…' : `Load ${COMMUNITY_PAGE_SIZE} older races` }}</button>
        </div>
      </div>
    </div>
  </DriverScope>

  <!-- Hero image modal -->
  <Teleport to="body">
    <div
      v-if="showImageModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      @click.self="showImageModal = false"
    >
      <div class="relative max-w-4xl w-full mx-4">
        <button
          type="button"
          class="absolute -top-8 right-0 text-white/80 hover:text-white"
          aria-label="Close"
          @click="showImageModal = false"
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

<script>
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import RaceRow from '../components/RaceRow.vue'
import DriverScope from '../components/DriverScope.vue'
import VehicleBestLapChart from '../components/VehicleBestLapChart.vue'
import VariationAnnotations from '../components/VariationAnnotations.vue'
import ColumnFilterMenu from '../components/ColumnFilterMenu.vue'
import FilterDrawer from '../components/FilterDrawer.vue'
import PerformanceIndexBadge from '../components/PerformanceIndexBadge.vue'
import PlacementRateTiles from '../components/PlacementRateTiles.vue'
import LapTimeInput from '../components/LapTimeInput.vue'
import SortHeader from '../components/SortHeader.vue'
import SortMenu from '../components/SortMenu.vue'
import {
  getTrackBySlug, getVehicles, getRacesByVariation, getCommunityRaces, COMMUNITY_PAGE_SIZE, updateRace, deleteRace,
  getGoalForVariation, upsertGoal, getAnnotationsForVariation, saveAnnotations
} from '../api.js'
import { authStore, prefsStore, pushToast, modals, openQuickAdd, setOnRaceSaved } from '../stores.js'
import { scopedPage } from '../utils/scope.js'
import { raceTable, DRIVER_FILTER, PI_FILTER, FAVORITE_FILTER, lapCount } from '../utils/raceTable.js'
import { placementRate } from '../utils/stats.js'
import { formatMsToTime, formatDelta, formatAssists } from '../utils/format.js'
import { trackImageUrl, variationImageUrl } from '../utils/imageUrl.js'
import { isPlainKeypress } from '../utils/keys.js'
import editIcon from '../assets/icons/edit.svg?raw'
import closeIcon from '../assets/icons/close-filled.svg?raw'
import columnsIcon from '../assets/icons/columns.svg?raw'
import starIcon from '../assets/icons/star.svg?raw'
import starFillIcon from '../assets/icons/star-fill.svg?raw'

// 'Actions' is left out — always shown, as the row's only way to edit/delete.
const TABLE_COLUMNS = [
  { key: 'when', label: 'Date' },
  { key: 'driver', label: 'Driver' },
  { key: 'vehicle', label: 'Vehicle' },
  { key: 'pi', label: 'Class (PI)' },
  { key: 'weight', label: 'Weight' },
  { key: 'tune', label: 'Tune' },
  { key: 'assists', label: 'Assists' },
  { key: 'parts', label: 'Parts' },
  { key: 'place', label: 'Place' },
  { key: 'laps', label: 'Laps' },
  { key: 'lap', label: 'Lap time' },
  { key: 'gap', label: 'Δ goal' },
  { key: 'total', label: 'Total time' }
]

const UNRESOLVED_VEHICLE = '__unresolved_vehicle__'

// These mirror RaceRow's own display fallbacks exactly, so a race bucketed
// under "—" is always one that shows "—" in the table.
const vehicleOf = (race, vm) => vm.vehicles.find(v => v.id === race.vehicle_id)
const vehicleLabel = (race, vm) => vehicleOf(race, vm)?.name ?? '—'
// `tuning` is a numeric slider code, stringified to compare like the others.
const tuneKey = race => race.tuning != null ? String(race.tuning) : '—'
const placeKey = race => race.place || '—'

export default {
  name: 'TrackDetailPage',
  components: { RaceRow, DriverScope, VehicleBestLapChart, VariationAnnotations, ColumnFilterMenu, FilterDrawer, PerformanceIndexBadge, PlacementRateTiles, LapTimeInput, SortHeader, SortMenu },
  mixins: [scopedPage, raceTable],
  raceTable: {
    storageKey: 'wreckfest:columns:trackDetail',
    columns: TABLE_COLUMNS.map(c => c.key),
    defaultHidden: ['weight', 'tune', 'gap', 'assists', 'parts'],
    filters: {
      driver: DRIVER_FILTER,
      vehicleId: { value: (race, vm) => vehicleOf(race, vm)?.id ?? UNRESOLVED_VEHICLE, label: vehicleLabel },
      performanceIndex: PI_FILTER,
      tuning: { value: tuneKey, label: tuneKey, numeric: true },
      place: { value: placeKey, label: placeKey, numeric: true },
      favorite: FAVORITE_FILTER
    },
    sortValues: {
      when: race => new Date(race.datetime).getTime(),
      driver: race => race.driverName,
      vehicle: vehicleLabel,
      pi: race => race.performance_index,
      weight: race => race.vehicle_weight_kg,
      tune: race => race.tuning,
      assists: race => formatAssists(race.assists),
      place: race => race.place,
      laps: lapCount,
      lap: race => race.lap_time_ms,
      gap: (race, vm) => (race.lap_time_ms != null && vm.goalLapTimeMs != null) ? race.lap_time_ms - vm.goalLapTimeMs : null,
      total: race => race.total_time_ms
    }
  },
  data() {
    return {
      prefs: prefsStore,
      loading: true,
      track: null,
      currentVariation: null,
      vehicles: [],
      races: [],
      // Your goal for this variation; it also holds your track notes.
      goal: null,
      goalInputMs: null,
      annotations: [],
      showImageModal: false,
      notesEditMode: false,
      notesInput: '',
      // Community mode pages through races COMMUNITY_PAGE_SIZE at a time, like /community/races.
      hasMore: false,
      loadingMore: false,
      COMMUNITY_PAGE_SIZE,
      editIcon,
      closeIcon,
      columnsIcon,
      starIcon,
      starFillIcon
    }
  },
  computed: {
    // Δ goal needs your goal, so it doesn't exist on anyone else's page — not
    // as a column, nor in the picker. Driver only exists on the community page.
    availableColumns() {
      return TABLE_COLUMNS.filter(c => (this.isOwnView || c.key !== 'gap') && (this.isCommunity || c.key !== 'driver'))
    },
    columnOptions() {
      return this.availableColumns.map(c => ({ value: c.key, label: c.label }))
    },
    // What RaceRow renders, so a header can never sit over no cells.
    visibleColumnKeys() {
      return this.availableColumns.map(c => c.key).filter(this.isVisible)
    },
    // Every visible column, plus Actions, plus the favorite star's when signed in.
    tableColspan() {
      return this.visibleColumnKeys.length + 1 + (this.isSignedIn ? 1 : 0)
    },
    // The mobile drawer's sort choices: visible columns only, and never Parts.
    sortableColumns() {
      return this.availableColumns.filter(c => c.key !== 'parts' && this.isVisible(c.key))
    },
    // " in class C" for the empty states while the nav's class filter is on.
    classSuffix() {
      return this.prefs.piClass ? ` in class ${this.prefs.piClass}` : ''
    },
    trackImage() {
      return this.track ? trackImageUrl(this.track.slug) : ''
    },
    goalLapTimeMs() {
      return this.goal ? this.goal.goal_lap_time_ms : null
    },
    // A 0 lap_time_ms means no completed lap was recorded, not a zero lap, so
    // it never wins.
    personalBestMs() {
      const valid = this.filteredRaces.map(r => r.lap_time_ms).filter(v => !!v)
      return valid.length ? Math.min(...valid) : null
    },
    // The race that set it — community mode credits its driver.
    bestRace() {
      return this.personalBestMs == null ? null : this.filteredRaces.find(r => r.lap_time_ms === this.personalBestMs)
    },
    gapMs() {
      return this.personalBestMs == null || this.goalLapTimeMs == null ? null : this.personalBestMs - this.goalLapTimeMs
    },
    trackNotes() {
      return this.goal ? (this.goal.notes || '') : ''
    },
    trackNotesHtml() {
      return this.trackNotes ? DOMPurify.sanitize(marked.parse(this.trackNotes)) : ''
    },
    placementRates() {
      return { 3: placementRate(this.filteredRaces, 3), 5: placementRate(this.filteredRaces, 5), 10: placementRate(this.filteredRaces, 10) }
    }
  },
  watch: {
    '$route.params': 'loadAll',
    'prefs.piClass'() {
      if (!this.currentVariation) return
      this.resetColumnFilters()
      this.loadRaces().catch(err => pushToast(err.message || 'Failed to load races', 'error'))
    }
  },
  mounted() {
    document.addEventListener('keydown', this.onKeydown)
    setOnRaceSaved(variationId => {
      if (variationId === this.currentVariation?.id) this.loadRaces()
    })
    this.loadAll()
  },
  beforeUnmount() {
    document.removeEventListener('keydown', this.onKeydown)
    setOnRaceSaved(null)
  },
  methods: {
    formatMsToTime,
    formatDelta,
    variationImageUrl,
    isShown(key) {
      return this.visibleColumnKeys.includes(key)
    },
    async loadAll() {
      this.loading = true
      this.resetColumnFilters()
      const { trackSlug, variationSlug } = this.$route.params
      try {
        const [track, vehicles] = await Promise.all([getTrackBySlug(trackSlug), getVehicles()])
        this.track = track
        this.vehicles = vehicles
        this.currentVariation = track?.track_variations?.find(v => v.slug === variationSlug) || null
        if (!this.currentVariation) {
          pushToast('Variation not found', 'error')
          return
        }
        await Promise.all([this.loadRaces(), this.loadGoal(), this.loadAnnotations()])
      } catch (err) {
        pushToast(err.message || 'Failed to load track', 'error')
      } finally {
        this.loading = false
      }
    },
    async loadRaces() {
      // A newer load (variation or class changed) supersedes this one, and
      // any older loadMoreRaces() page with it.
      const token = (this.loadToken = (this.loadToken || 0) + 1)
      const piClass = prefsStore.piClass
      if (this.isCommunity) {
        const page = await getCommunityRaces({ variationId: this.currentVariation.id, piClass })
        if (token !== this.loadToken) return
        this.races = page
        this.fetchedCount = page.length
        this.hasMore = page.length === COMMUNITY_PAGE_SIZE
        return
      }
      const races = await getRacesByVariation(this.currentVariation.id, this.userId, { piClass })
      if (token !== this.loadToken) return
      this.races = races
      this.hasMore = false
    },
    // Same offset paging (and overlap de-dupe) as RacesPage's loadMore().
    async loadMoreRaces() {
      this.loadingMore = true
      const token = this.loadToken
      try {
        const page = await getCommunityRaces({ variationId: this.currentVariation.id, piClass: prefsStore.piClass, offset: this.fetchedCount })
        if (token !== this.loadToken) return
        const seen = new Set(this.races.map(r => r.id))
        this.races = this.races.concat(page.filter(r => !seen.has(r.id)))
        this.fetchedCount += page.length
        this.hasMore = page.length === COMMUNITY_PAGE_SIZE
      } catch (err) {
        pushToast(err.message || 'Failed to load older races', 'error')
      } finally {
        this.loadingMore = false
      }
    },
    // Goals and annotations are RLS-scoped to the signed-in user, so these
    // always fetch *yours*, even on another driver's page — where your goal
    // must still load so saving your notes keeps it.
    async loadGoal() {
      this.goal = this.isSignedIn ? await getGoalForVariation(this.currentVariation.id) : null
      this.goalInputMs = this.goal ? this.goal.goal_lap_time_ms : null
    },
    async loadAnnotations() {
      this.annotations = this.isSignedIn ? await getAnnotationsForVariation(this.currentVariation.id) : []
    },
    onAddRow() {
      openQuickAdd(this.currentVariation.id)
    },
    onKeydown(event) {
      if (event.key === 'Escape') this.showImageModal = false
      // A: add a race here — your own page only.
      if (event.key !== 'a' && event.key !== 'A') return
      if (!isPlainKeypress(event) || modals.quickAdd || this.showImageModal) return
      if (!this.currentVariation || !this.isOwnView) return
      event.preventDefault()
      this.onAddRow()
    },
    startEditNotes() {
      this.notesInput = this.trackNotes
      this.notesEditMode = true
      this.$nextTick(() => this.$refs.notesTextarea?.focus())
    },
    // Notes and goal share a row, so each save carries the other along.
    async saveGoal(patch, success, failure) {
      try {
        this.goal = await upsertGoal({
          variationId: this.currentVariation.id,
          goalLapTimeMs: this.goalLapTimeMs,
          notes: this.trackNotes,
          ...patch,
          userId: authStore.user && authStore.user.id
        })
        pushToast(success, 'success', 1500)
        return true
      } catch (err) {
        pushToast(err.message || failure, 'error')
        return false
      }
    },
    async saveNotes() {
      if (await this.saveGoal({ notes: this.notesInput }, 'Notes saved', 'Failed to save notes')) this.notesEditMode = false
    },
    onSaveGoal() {
      const ms = this.goalInputMs
      if (!ms || (this.goal && this.goal.goal_lap_time_ms === ms)) return
      this.saveGoal({ goalLapTimeMs: ms }, 'Goal saved', 'Failed to save goal')
    },
    async onSaveAnnotations(annotations) {
      try {
        this.annotations = await saveAnnotations({ variationId: this.currentVariation.id, annotations, userId: authStore.user && authStore.user.id })
        pushToast('Annotations saved', 'success', 1500)
      } catch (err) {
        pushToast(err.message || 'Failed to save annotations', 'error')
      }
    },
    async onUpdateRace({ id, patch }) {
      try {
        const updated = await updateRace(id, patch)
        const idx = this.races.findIndex(r => r.id === id)
        // updateRace() doesn't bring the driver's name back; the community view shows it.
        if (idx !== -1) this.races.splice(idx, 1, { ...updated, driverName: this.races[idx].driverName })
        pushToast('Race updated', 'success', 1500)
      } catch (err) {
        pushToast(err.message || 'Failed to update race', 'error')
      }
    },
    async onDeleteRace(id) {
      try {
        await deleteRace(id)
        this.races = this.races.filter(r => r.id !== id)
        pushToast('Race deleted', 'success', 1500)
      } catch (err) {
        pushToast(err.message || 'Failed to delete race', 'error')
      }
    }
  }
}
</script>
