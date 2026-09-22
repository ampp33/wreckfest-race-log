<template>
  <div class="max-w-7xl mx-auto px-6 py-10">
    <h1 class="font-heading font-normal tracking-normal leading-none text-display-lg text-brand-text dark:text-brand-text-dark">
      Races
    </h1>
    <p class="font-body text-[15px] leading-relaxed text-brand-muted dark:text-brand-muted-dark mt-3.5 mb-2">
      <span class="tabular font-semibold text-brand-text dark:text-brand-text-dark">{{ total }}</span> logged, newest first.
      <template v-if="isFiltered">
        — filtered to races logged {{ apiKeyIdFilter ? 'with this API key' : `via the ${sourceFilter === 'api' ? 'Telemetry API' : 'web app'}` }}.
        <router-link to="/races" class="text-brand-accent dark:text-brand-accent-dark hover:underline">Clear filter</router-link>
      </template>
    </p>

    <p v-if="loading" class="font-body text-[15px] text-brand-muted dark:text-brand-muted-dark">Loading…</p>
    <!-- The controls row (and the refresh button in it) only renders once a
         load has succeeded, so the error state repeats it as a retry. -->
    <div v-else-if="error" class="flex items-center gap-3 flex-wrap">
      <p class="text-sm text-brand-accent dark:text-brand-accent-dark">{{ error }}</p>
      <button
        type="button"
        class="min-h-[44px] min-w-[44px] flex items-center justify-center text-brand-muted dark:text-brand-muted-dark hover:text-brand-accent dark:hover:text-brand-accent-dark disabled:opacity-40"
        :disabled="refreshing"
        :aria-busy="refreshing"
        title="Retry"
        aria-label="Retry loading races"
        @click="load({ refresh: true })"
      >
        <span class="w-6 h-6 inline-block" :class="{ 'animate-spin': refreshing }" v-html="refreshIcon"></span>
      </button>
    </div>

    <div v-else>
      <!-- Mobile filter drawer — the table's column-header filters have
           nowhere to live once the table becomes cards, so they're
           reproduced here (inline, not popup) behind a side tab. -->
      <FilterDrawer>
        <ColumnFilterMenu inline label="Track / Variation" v-model="columnFilters.trackVariationId" :options="trackVariationOptions" />
        <ColumnFilterMenu inline label="Vehicle" v-model="columnFilters.vehicleId" :options="vehicleOptions" />
        <ColumnFilterMenu inline label="Class (PI)" v-model="columnFilters.performanceIndex" :options="piOptions">
          <template #option="{ option }"><PerformanceIndexBadge :value="option.value" /></template>
        </ColumnFilterMenu>
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

      <!-- Controls row -->
      <div class="flex items-end justify-between mb-6 gap-4 flex-wrap">
        <div class="ov text-brand-muted dark:text-brand-muted-dark">
          {{ total }} race{{ total === 1 ? '' : 's' }}
        </div>
        <div class="flex items-center gap-3">
          <button
            type="button"
            class="min-h-[44px] min-w-[44px] flex items-center justify-center text-brand-muted dark:text-brand-muted-dark hover:text-brand-accent dark:hover:text-brand-accent-dark disabled:opacity-40"
            :disabled="refreshing"
            :aria-busy="refreshing"
            title="Refresh"
            aria-label="Refresh races"
            @click="load({ refresh: true })"
          >
            <span class="w-6 h-6 inline-block" :class="{ 'animate-spin': refreshing }" v-html="refreshIcon"></span>
          </button>
          <!-- The visible "Per page" label used to carry this group's meaning;
               with it dropped for room on phones, the name moves to ARIA. -->
          <div class="flex" role="group" aria-label="Races per page">
            <button
              v-for="size in [25, 50, 100]"
              :key="size"
              type="button"
              class="tabular min-h-[44px] min-w-[52px] border text-sm font-semibold -ml-px first:ml-0"
              :aria-pressed="pageSize === size"
              :title="`${size} per page`"
              :class="pageSize === size
                ? 'bg-brand-strong dark:bg-brand-strong-dark border-brand-strong dark:border-brand-strong-dark text-brand-bg dark:text-brand-bg-dark'
                : 'border-brand-border dark:border-brand-border-dark text-brand-muted dark:text-brand-muted-dark hover:border-brand-accent'"
              @click="pageSize = size; currentPage = 1"
            >{{ size }}</button>
          </div>
          <span class="hidden sm:inline-flex">
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
          </span>
        </div>
      </div>

      <p v-if="totalUnfiltered === 0" class="font-body text-[15px] text-brand-muted dark:text-brand-muted-dark">No races logged yet.</p>
      <p v-else-if="total === 0" class="font-body text-[15px] text-brand-muted dark:text-brand-muted-dark">
        No races match the current filter.
        <button type="button" class="text-brand-accent dark:text-brand-accent-dark underline" @click="resetColumnFilters">Clear filters</button>
      </p>

      <div v-else>
        <!-- Card layout (mobile) -->
        <div class="sm:hidden divide-y divide-brand-border dark:divide-brand-border-dark">
          <div v-for="race in pageRows" :key="race.id" class="p-3">
            <template v-if="!editing[race.id]">
              <div class="flex items-start gap-2">
                <div class="min-w-0 flex-1">
                  <template v-if="columnVisibility.isVisible('trackVariation')">
                    <router-link
                      v-if="race.trackSlug && race.variationSlug"
                      :to="`/track/${race.trackSlug}/${race.variationSlug}`"
                      class="font-bold text-brand-text dark:text-brand-text-dark hover:text-brand-accent dark:hover:text-brand-accent-dark truncate block"
                    >
                      {{ race.trackName }}
                      <span class="text-brand-muted dark:text-brand-muted-dark font-normal">— {{ race.variationName }}</span>
                    </router-link>
                    <span v-else class="font-bold text-brand-text dark:text-brand-text-dark">—</span>
                  </template>
                  <div v-if="columnVisibility.isVisible('date')" class="text-xs text-brand-muted dark:text-brand-muted-dark inline-flex items-center gap-1">
                    {{ formatDateTime(race.datetime) }}
                    <span
                      v-if="race.source === 'api'"
                      class="w-3 h-3 shrink-0 text-brand-accent dark:text-brand-accent-dark"
                      :title="apiSourceTitle(race)"
                      v-html="apiIcon"
                    ></span>
                  </div>

                  <!-- Same fields, in the same order, as the desktop table columns —
                       each gated by the same column-visibility picker so a card
                       shows only what the table would, instead of always
                       showing everything. -->
                  <div class="grid grid-cols-2 gap-x-3 gap-y-1.5 mt-3 text-sm">
                    <div v-if="columnVisibility.isVisible('vehicle')">
                      <div class="ov text-brand-accent dark:text-brand-accent-dark">Vehicle</div>
                      <div class="text-brand-secondary dark:text-brand-secondary-dark">{{ race.vehicleName }}</div>
                    </div>
                    <div v-if="columnVisibility.isVisible('pi')">
                      <div class="ov text-brand-accent dark:text-brand-accent-dark">Class (PI)</div>
                      <div><PerformanceIndexBadge :value="race.performance_index" /></div>
                    </div>
                    <div v-if="columnVisibility.isVisible('weight')">
                      <div class="ov text-brand-accent dark:text-brand-accent-dark">Weight</div>
                      <div class="tabular text-brand-secondary dark:text-brand-secondary-dark">{{ race.vehicle_weight_kg != null ? race.vehicle_weight_kg + ' kg' : '—' }}</div>
                    </div>
                    <div v-if="columnVisibility.isVisible('tune')">
                      <div class="ov text-brand-accent dark:text-brand-accent-dark">Tune</div>
                      <div class="text-brand-secondary dark:text-brand-secondary-dark">{{ race.tuning ?? '—' }}</div>
                    </div>
                    <div v-if="columnVisibility.isVisible('assists')">
                      <div class="ov text-brand-accent dark:text-brand-accent-dark">Assists</div>
                      <div class="text-brand-secondary dark:text-brand-secondary-dark">{{ formatAssists(race.assists) }}</div>
                    </div>
                    <div v-if="columnVisibility.isVisible('place')">
                      <div class="ov text-brand-accent dark:text-brand-accent-dark">Place</div>
                      <div class="tabular-nums">{{ race.place != null ? race.place : '—' }}</div>
                    </div>
                    <div v-if="columnVisibility.isVisible('laps')">
                      <div class="ov text-brand-accent dark:text-brand-accent-dark">Laps</div>
                      <div class="tabular-nums">{{ lapCount(race) }}</div>
                    </div>
                    <div v-if="columnVisibility.isVisible('lapTime')">
                      <div class="ov text-brand-accent dark:text-brand-accent-dark">Lap time</div>
                      <div class="tabular">{{ race.lap_time_ms != null ? formatMs(race.lap_time_ms) : '—' }}</div>
                    </div>
                    <div v-if="columnVisibility.isVisible('totalTime')">
                      <div class="ov text-brand-accent dark:text-brand-accent-dark">Total time</div>
                      <div class="tabular text-brand-muted dark:text-brand-muted-dark">{{ race.total_time_ms != null ? formatMs(race.total_time_ms) : '—' }}</div>
                    </div>
                  </div>
                </div>

                <RaceRowActions
                  vertical
                  :show-expand="!!(race.notes || hasLapTimes(race) || hasRoster(race))"
                  :expanded="!!expanded[race.id]"
                  @toggle-expand="toggleExpanded(race.id)"
                  @edit="editing[race.id] = true"
                  @delete="onDelete(race)"
                />
              </div>

              <div v-if="expanded[race.id]" class="mt-3 -mx-3 px-3 py-3 bg-brand-surface dark:bg-brand-surface-dark">
                <RaceExpandedDetails
                  :notes="race.notes || ''"
                  notes-fallback="No notes"
                  accent
                  divider
                  :lap-times="race.lap_times_ms"
                  :roster="race.results_roster"
                />
              </div>
            </template>

            <RaceForm
              v-else
              :vehicles="vehicles"
              :defaults="editDefaultsFor(race)"
              :saving="!!saving[race.id]"
              :autofocus="false"
              @submit="payload => onSave(race, payload)"
              @cancel="editing[race.id] = false"
            />
          </div>
        </div>

        <!-- Table layout (desktop) -->
        <div class="hidden sm:block overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="text-left ov ov-lg text-brand-accent dark:text-brand-accent-dark border-b-2 border-brand-strong dark:border-brand-strong-dark">
                <th v-if="columnVisibility.isVisible('date')" class="px-3.5 pb-2.5 font-medium">
                  <button type="button" class="group inline-flex items-center gap-1 hover:text-brand-text dark:hover:text-brand-text-dark" :title="sort.titleFor('date', 'Date')" :aria-label="sort.titleFor('date', 'Date')" @click="sort.toggle('date')">
                    Date
                    <SortCaret :direction="sort.directionFor('date')" />
                  </button>
                </th>
                <th v-if="columnVisibility.isVisible('trackVariation')" class="px-3.5 pb-2.5 font-medium">
                  <span class="inline-flex items-center gap-1">
                    <button type="button" class="group inline-flex items-center gap-1 hover:text-brand-text dark:hover:text-brand-text-dark" :title="sort.titleFor('trackVariation', 'Track / Variation')" :aria-label="sort.titleFor('trackVariation', 'Track / Variation')" @click="sort.toggle('trackVariation')">
                      Track / Variation
                      <SortCaret :direction="sort.directionFor('trackVariation')" />
                    </button>
                    <ColumnFilterMenu label="Track / Variation" icon-size="w-4 h-4" v-model="columnFilters.trackVariationId" :options="trackVariationOptions" />
                  </span>
                </th>
                <th v-if="columnVisibility.isVisible('vehicle')" class="px-3.5 pb-2.5 font-medium">
                  <span class="inline-flex items-center gap-1">
                    <button type="button" class="group inline-flex items-center gap-1 hover:text-brand-text dark:hover:text-brand-text-dark" :title="sort.titleFor('vehicle', 'Vehicle')" :aria-label="sort.titleFor('vehicle', 'Vehicle')" @click="sort.toggle('vehicle')">
                      Vehicle
                      <SortCaret :direction="sort.directionFor('vehicle')" />
                    </button>
                    <ColumnFilterMenu label="Vehicle" icon-size="w-4 h-4" v-model="columnFilters.vehicleId" :options="vehicleOptions" />
                  </span>
                </th>
                <th v-if="columnVisibility.isVisible('pi')" class="px-3.5 pb-2.5 font-medium">
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
                <th v-if="columnVisibility.isVisible('weight')" class="px-3.5 pb-2.5 font-medium text-right">
                  <button type="button" class="group inline-flex items-center justify-end gap-1 w-full hover:text-brand-text dark:hover:text-brand-text-dark" :title="sort.titleFor('weight', 'Weight')" :aria-label="sort.titleFor('weight', 'Weight')" @click="sort.toggle('weight')">
                    Weight
                    <SortCaret :direction="sort.directionFor('weight')" />
                  </button>
                </th>
                <th v-if="columnVisibility.isVisible('tune')" class="px-3.5 pb-2.5 font-medium text-center">
                  <button type="button" class="group inline-flex items-center justify-center gap-1 w-full hover:text-brand-text dark:hover:text-brand-text-dark" :title="sort.titleFor('tune', 'Tune')" :aria-label="sort.titleFor('tune', 'Tune')" @click="sort.toggle('tune')">
                    Tune
                    <SortCaret :direction="sort.directionFor('tune')" />
                  </button>
                </th>
                <th v-if="columnVisibility.isVisible('assists')" class="px-3.5 pb-2.5 font-medium text-center">
                  <button type="button" class="group inline-flex items-center justify-center gap-1 w-full hover:text-brand-text dark:hover:text-brand-text-dark" :title="sort.titleFor('assists', 'Assists')" :aria-label="sort.titleFor('assists', 'Assists')" @click="sort.toggle('assists')">
                    Assists
                    <SortCaret :direction="sort.directionFor('assists')" />
                  </button>
                </th>
                <th v-if="columnVisibility.isVisible('place')" class="px-3.5 pb-2.5 font-medium text-right">
                  <span class="inline-flex items-center justify-end gap-1">
                    <button type="button" class="group inline-flex items-center gap-1 hover:text-brand-text dark:hover:text-brand-text-dark" :title="sort.titleFor('place', 'Place')" :aria-label="sort.titleFor('place', 'Place')" @click="sort.toggle('place')">
                      Place
                      <SortCaret :direction="sort.directionFor('place')" />
                    </button>
                    <ColumnFilterMenu label="Place" icon-size="w-4 h-4" v-model="columnFilters.place" :options="placeOptions" />
                  </span>
                </th>
                <th v-if="columnVisibility.isVisible('laps')" class="px-3.5 pb-2.5 font-medium text-right">
                  <button type="button" class="group inline-flex items-center justify-end gap-1 w-full hover:text-brand-text dark:hover:text-brand-text-dark" :title="sort.titleFor('laps', 'Laps')" :aria-label="sort.titleFor('laps', 'Laps')" @click="sort.toggle('laps')">
                    Laps
                    <SortCaret :direction="sort.directionFor('laps')" />
                  </button>
                </th>
                <th v-if="columnVisibility.isVisible('lapTime')" class="px-3.5 pb-2.5 font-medium text-right">
                  <button type="button" class="group inline-flex items-center justify-end gap-1 w-full hover:text-brand-text dark:hover:text-brand-text-dark" :title="sort.titleFor('lapTime', 'Lap time')" :aria-label="sort.titleFor('lapTime', 'Lap time')" @click="sort.toggle('lapTime')">
                    Lap time
                    <SortCaret :direction="sort.directionFor('lapTime')" />
                  </button>
                </th>
                <th v-if="columnVisibility.isVisible('totalTime')" class="px-3.5 pb-2.5 font-medium text-right">
                  <button type="button" class="group inline-flex items-center justify-end gap-1 w-full hover:text-brand-text dark:hover:text-brand-text-dark" :title="sort.titleFor('totalTime', 'Total time')" :aria-label="sort.titleFor('totalTime', 'Total time')" @click="sort.toggle('totalTime')">
                    Total time
                    <SortCaret :direction="sort.directionFor('totalTime')" />
                  </button>
                </th>
                <th class="px-3.5 pb-2.5 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-brand-border dark:divide-brand-border-dark border-b border-brand-border dark:border-brand-border-dark">
              <template v-for="race in pageRows" :key="race.id">
                <tr v-if="!editing[race.id]" class="hover:bg-brand-surface dark:hover:bg-brand-surface-dark">
                  <td v-if="columnVisibility.isVisible('date')" class="px-3.5 py-2 whitespace-nowrap tabular text-xs text-brand-muted dark:text-brand-muted-dark">
                    <span class="inline-flex items-center gap-1">
                      {{ formatDateTime(race.datetime) }}
                      <span
                        v-if="race.source === 'api'"
                        class="w-3 h-3 shrink-0 text-brand-accent dark:text-brand-accent-dark"
                        :title="apiSourceTitle(race)"
                        v-html="apiIcon"
                      ></span>
                    </span>
                  </td>
                  <td v-if="columnVisibility.isVisible('trackVariation')" class="px-3.5 py-2">
                    <router-link
                      v-if="race.trackSlug && race.variationSlug"
                      :to="`/track/${race.trackSlug}/${race.variationSlug}`"
                      class="font-semibold text-brand-text dark:text-brand-text-dark hover:text-brand-accent dark:hover:text-brand-accent-dark"
                    >
                      {{ race.trackName }}
                      <span class="text-brand-muted dark:text-brand-muted-dark font-normal">— {{ race.variationName }}</span>
                    </router-link>
                    <span v-else class="text-brand-muted dark:text-brand-muted-dark">—</span>
                  </td>
                  <td v-if="columnVisibility.isVisible('vehicle')" class="px-3.5 py-2 text-brand-secondary dark:text-brand-secondary-dark">
                    {{ race.vehicleName }}
                  </td>
                  <td v-if="columnVisibility.isVisible('pi')" class="px-3.5 py-2 whitespace-nowrap">
                    <PerformanceIndexBadge :value="race.performance_index" />
                  </td>
                  <td v-if="columnVisibility.isVisible('weight')" class="px-3.5 py-2 text-right tabular text-brand-secondary dark:text-brand-secondary-dark">
                    {{ race.vehicle_weight_kg != null ? race.vehicle_weight_kg + ' kg' : '—' }}
                  </td>
                  <td v-if="columnVisibility.isVisible('tune')" class="px-3.5 py-2 text-center text-brand-secondary dark:text-brand-secondary-dark">
                    {{ race.tuning ?? '—' }}
                  </td>
                  <td v-if="columnVisibility.isVisible('assists')" class="px-3.5 py-2 text-center text-brand-secondary dark:text-brand-secondary-dark">
                    {{ formatAssists(race.assists) }}
                  </td>
                  <td v-if="columnVisibility.isVisible('place')" class="px-3.5 py-2 text-right tabular-nums">
                    {{ race.place != null ? race.place : '—' }}
                  </td>
                  <td v-if="columnVisibility.isVisible('laps')" class="px-3.5 py-2 text-right tabular-nums text-brand-secondary dark:text-brand-secondary-dark">
                    {{ lapCount(race) }}
                  </td>
                  <td v-if="columnVisibility.isVisible('lapTime')" class="px-3.5 py-2 text-right tabular">
                    {{ race.lap_time_ms != null ? formatMs(race.lap_time_ms) : '—' }}
                  </td>
                  <td v-if="columnVisibility.isVisible('totalTime')" class="px-3.5 py-2 text-right tabular text-brand-muted dark:text-brand-muted-dark">
                    {{ race.total_time_ms != null ? formatMs(race.total_time_ms) : '—' }}
                  </td>
                  <td class="px-3.5 py-2 text-right whitespace-nowrap">
                    <RaceRowActions
                      :show-expand="!!(race.notes || hasLapTimes(race) || hasRoster(race))"
                      :expanded="!!expanded[race.id]"
                      @toggle-expand="toggleExpanded(race.id)"
                      @edit="editing[race.id] = true"
                      @delete="onDelete(race)"
                    />
                  </td>
                </tr>
                <tr v-else>
                  <td :colspan="visibleColumnKeys.length + 1" class="p-5 bg-brand-surface dark:bg-brand-surface-dark">
                    <RaceForm
                      :vehicles="vehicles"
                      :defaults="editDefaultsFor(race)"
                      :saving="!!saving[race.id]"
                      :autofocus="false"
                      @submit="payload => onSave(race, payload)"
                      @cancel="editing[race.id] = false"
                    />
                  </td>
                </tr>
                <tr v-if="!editing[race.id] && expanded[race.id]">
                  <td :colspan="visibleColumnKeys.length + 1" class="px-3.5 py-3 bg-brand-surface dark:bg-brand-surface-dark">
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
              </template>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Pagination -->
      <div class="flex items-center justify-between gap-4 mt-5 flex-wrap">
        <span class="ov tabular text-brand-muted dark:text-brand-muted-dark">
          Showing {{ rangeStart }}–{{ rangeEnd }} of {{ total }}
        </span>
        <div v-if="totalPages > 1" class="flex flex-wrap items-center justify-end gap-1.5">
          <button
            :disabled="currentPage === 1"
            class="min-h-[44px] px-4 border border-brand-border dark:border-brand-border-dark text-[13px] text-brand-muted dark:text-brand-muted-dark disabled:opacity-40 hover:border-brand-accent"
            @click="currentPage--"
          >Prev</button>
          <button
            v-for="p in pageWindow"
            :key="p"
            type="button"
            class="tabular min-h-[44px] min-w-[44px] border text-[13px] font-semibold"
            :class="p === currentPage
              ? 'bg-brand-strong dark:bg-brand-strong-dark border-brand-strong dark:border-brand-strong-dark text-brand-bg dark:text-brand-bg-dark'
              : 'border-brand-border dark:border-brand-border-dark text-brand-muted dark:text-brand-muted-dark hover:border-brand-accent'"
            @click="currentPage = p"
          >{{ p }}</button>
          <button
            :disabled="currentPage === totalPages"
            class="min-h-[44px] px-4 border border-brand-border dark:border-brand-border-dark text-[13px] text-brand-muted dark:text-brand-muted-dark disabled:opacity-40 hover:border-brand-accent"
            @click="currentPage++"
          >Next</button>
        </div>
      </div>
    </div>

    <ConfirmDialog
      :open="!!confirmDeleteRace"
      title="Delete this race?"
      message="This can't be undone."
      confirm-label="Delete"
      @confirm="onConfirmDelete"
      @cancel="confirmDeleteRace = null"
    />
  </div>
</template>

<script>
import { getAllRaces, updateRace, deleteRace } from '../services/raceService.js'
import { getTracks } from '../services/trackService.js'
import { getVehicles } from '../services/vehicleService.js'
import { formatMsToTime } from '../utils/timeFormat.js'
import { formatDateTime } from '../utils/dateFormat.js'
import { formatAssists } from '../utils/assistsFormat.js'
import { pushToast } from '../stores/toastStore.js'
import LapSplitsChart from '../components/LapSplitsChart.vue'
import RaceResultsRoster from '../components/RaceResultsRoster.vue'
import RaceForm from '../components/RaceForm.vue'
import ConfirmDialog from '../components/ConfirmDialog.vue'
import PerformanceIndexBadge from '../components/PerformanceIndexBadge.vue'
import RaceRowActions from '../components/RaceRowActions.vue'
import RaceExpandedDetails from '../components/RaceExpandedDetails.vue'
import ColumnFilterMenu from '../components/ColumnFilterMenu.vue'
import FilterDrawer from '../components/FilterDrawer.vue'
import { buildOptions, sortOptions } from '../utils/filterOptions.js'
import { createColumnVisibility } from '../utils/columnVisibility.js'
import { createSortState, sortRows } from '../utils/sortState.js'
import SortCaret from '../components/SortCaret.vue'
import apiIcon from '../assets/icons/api.svg?raw'
import refreshIcon from '../assets/icons/refresh.svg?raw'
import columnsIcon from '../assets/icons/columns.svg?raw'

const UNRESOLVED_VEHICLE = '__unresolved_vehicle__'
const UNRESOLVED_VARIATION = '__unresolved_variation__'

const TABLE_COLUMNS = [
  { key: 'date', label: 'Date' },
  { key: 'trackVariation', label: 'Track / Variation' },
  { key: 'vehicle', label: 'Vehicle' },
  { key: 'pi', label: 'Class (PI)' },
  { key: 'weight', label: 'Weight' },
  { key: 'tune', label: 'Tune' },
  { key: 'assists', label: 'Assists' },
  { key: 'place', label: 'Place' },
  { key: 'laps', label: 'Laps' },
  { key: 'lapTime', label: 'Lap time' },
  { key: 'totalTime', label: 'Total time' }
  // 'Actions' is intentionally left out — it's always shown, since hiding it
  // would remove the row's only in-table way to edit/delete a race.
]
const COLUMN_OPTIONS = TABLE_COLUMNS.map(c => ({ value: c.key, label: c.label }))
// Shown only on a first-ever visit, before the column picker has written
// anything to localStorage — after that, whatever the user has chosen wins.
const DEFAULT_HIDDEN_COLUMNS = ['weight', 'tune', 'assists']

function trackVariationKey(race) { return race.trackSlug && race.variationSlug ? race.track_variation_id : UNRESOLVED_VARIATION }
function trackVariationLabel(race) { return race.trackSlug && race.variationSlug ? `${race.trackName} — ${race.variationName}` : '—' }
// Bucket by whether vehicleName resolved, not just a null vehicle_id — a
// vehicle_id pointing at a deleted vehicle also displays as '—' (RacesPage
// load()'s `vehicleMap[r.vehicle_id] ?? '—'`) and must land in the same bucket.
function vehicleKey(race) { return race.vehicleName === '—' ? UNRESOLVED_VEHICLE : race.vehicle_id }
function piKey(race) { return race.performance_index != null ? race.performance_index : null }
function placeKey(race) { return race.place != null ? race.place : '—' }

// One value-getter per sortable column (everything but Actions), fed to
// sortRows() — each returns either a number (or a date's timestamp) or a
// display string, so sortRows can compare by the right datatype instead of
// always doing a string compare.
function lapCountValue(race) {
  if (race.lap_count != null) return race.lap_count
  if (Array.isArray(race.lap_times_ms)) return race.lap_times_ms.length
  return null
}
const SORT_VALUE_GETTERS = {
  date: race => new Date(race.datetime).getTime(),
  trackVariation: trackVariationLabel,
  vehicle: race => race.vehicleName,
  pi: race => race.performance_index,
  weight: race => race.vehicle_weight_kg,
  tune: race => race.tuning,
  assists: race => formatAssists(race.assists),
  place: race => race.place,
  laps: lapCountValue,
  lapTime: race => race.lap_time_ms,
  totalTime: race => race.total_time_ms
}

function toLocalIsoMinute(isoString) {
  const d = new Date(isoString)
  const tzOffset = d.getTimezoneOffset() * 60_000
  return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16)
}

export default {
  name: 'RacesPage',
  components: { LapSplitsChart, RaceResultsRoster, RaceForm, ConfirmDialog, PerformanceIndexBadge, RaceRowActions, RaceExpandedDetails, ColumnFilterMenu, FilterDrawer, SortCaret },
  // A small Composition API bridge — `createColumnVisibility`/`createSortState`
  // (shared with TrackDetailPage.vue) are built on `reactive`/`watch`, not
  // lifecycle hooks, so they don't need this whole file converted to
  // `<script setup>`.
  setup() {
    const columnVisibility = createColumnVisibility('wreckfest:columns:races', TABLE_COLUMNS.map(c => c.key), DEFAULT_HIDDEN_COLUMNS)
    const sort = createSortState()
    return { columnVisibility, sort }
  },
  data() {
    return {
      loading: true,
      refreshing: false,
      error: null,
      rows: [],
      vehicles: [],
      currentPage: 1,
      pageSize: 50,
      expanded: {},
      editing: {},
      saving: {},
      confirmDeleteRace: null,
      columnFilters: { trackVariationId: [], vehicleId: [], performanceIndex: [], place: [] },
      columnOptions: COLUMN_OPTIONS,
      apiIcon,
      refreshIcon,
      columnsIcon
    }
  },
  computed: {
    sourceFilter() {
      const source = this.$route.query.source
      return source === 'web' || source === 'api' ? source : null
    },
    apiKeyIdFilter() {
      const apiKeyId = this.$route.query.api_key_id
      return typeof apiKeyId === 'string' && apiKeyId ? apiKeyId : null
    },
    isFiltered() {
      return !!(this.sourceFilter || this.apiKeyIdFilter)
    },
    visibleColumnKeys() {
      return TABLE_COLUMNS.map(c => c.key).filter(this.columnVisibility.isVisible)
    },
    trackVariationOptions() {
      return sortOptions(buildOptions(this.rows.filter(r => this.matchesFilters(r, 'trackVariationId')), trackVariationKey, trackVariationLabel))
    },
    vehicleOptions() {
      return sortOptions(buildOptions(this.rows.filter(r => this.matchesFilters(r, 'vehicleId')), vehicleKey, r => r.vehicleName))
    },
    piOptions() {
      return sortOptions(
        buildOptions(
          this.rows.filter(r => this.matchesFilters(r, 'performanceIndex')),
          piKey,
          r => r.performance_index != null ? String(r.performance_index) : '—'
        ),
        { numeric: true }
      )
    },
    placeOptions() {
      return sortOptions(buildOptions(this.rows.filter(r => this.matchesFilters(r, 'place')), placeKey, placeKey), { numeric: true })
    },
    filteredRows() {
      return this.rows.filter(race => this.matchesFilters(race))
    },
    sortedRows() {
      return sortRows(this.filteredRows, this.sort.state, SORT_VALUE_GETTERS)
    },
    totalUnfiltered() {
      return this.rows.length
    },
    total() {
      return this.filteredRows.length
    },
    totalPages() {
      return Math.max(1, Math.ceil(this.total / this.pageSize))
    },
    pageRows() {
      const start = (this.currentPage - 1) * this.pageSize
      return this.sortedRows.slice(start, start + this.pageSize)
    },
    rangeStart() {
      return this.total === 0 ? 0 : (this.currentPage - 1) * this.pageSize + 1
    },
    rangeEnd() {
      return Math.min(this.total, this.currentPage * this.pageSize)
    },
    // At most five numbered buttons, kept centred on the current page and
    // clamped so the window never runs off either end of the range.
    pageWindow() {
      const span = 5
      let first = Math.max(1, this.currentPage - Math.floor(span / 2))
      const last = Math.min(this.totalPages, first + span - 1)
      first = Math.max(1, last - span + 1)
      const out = []
      for (let p = first; p <= last; p++) out.push(p)
      return out
    }
  },
  async mounted() {
    await this.load()
  },
  watch: {
    '$route.query'() {
      this.resetColumnFilters()
      this.currentPage = 1
      this.load()
    },
    columnFilters: {
      deep: true,
      handler() {
        this.currentPage = 1
      }
    },
    'sort.state': {
      deep: true,
      handler() {
        this.currentPage = 1
      }
    }
  },
  methods: {
    resetColumnFilters() {
      this.columnFilters = { trackVariationId: [], vehicleId: [], performanceIndex: [], place: [] }
    },
    // Matches a race against every column filter except `exceptKey` — used
    // to build each column's own option list off what's visible once every
    // *other* filter is applied (real cross-filtering, like Excel's
    // AutoFilter), while never narrowing a column by its own selection so
    // its own checked/unchecked values don't vanish from its own list.
    matchesFilters(race, exceptKey) {
      const f = this.columnFilters
      if (exceptKey !== 'trackVariationId' && f.trackVariationId.includes(trackVariationKey(race))) return false
      if (exceptKey !== 'vehicleId' && f.vehicleId.includes(vehicleKey(race))) return false
      if (exceptKey !== 'performanceIndex' && f.performanceIndex.includes(piKey(race))) return false
      if (exceptKey !== 'place' && f.place.includes(placeKey(race))) return false
      return true
    },
    // Shared by the initial mount and the header's refresh button. A refresh
    // only raises `refreshing`, never `loading`/`error` — the table stays on
    // screen (keeping expanded rows, page and page size), and a refresh that
    // fails leaves the rows already shown in place and reports by toast
    // rather than replacing the whole page with an error line.
    async load({ refresh = false } = {}) {
      if (refresh) this.refreshing = true
      try {
        const [races, tracks, vehicles] = await Promise.all([
          getAllRaces({ source: this.sourceFilter, apiKeyId: this.apiKeyIdFilter }),
          getTracks(),
          getVehicles()
        ])

        const vehicleMap = Object.fromEntries(vehicles.map(v => [v.id, v.name]))

        const variationMap = {}
        for (const track of tracks) {
          for (const v of track.track_variations || []) {
            variationMap[v.id] = {
              trackName: track.name,
              trackSlug: track.slug,
              variationName: v.name,
              variationSlug: v.slug
            }
          }
        }

        this.vehicles = vehicles

        this.rows = races.map(r => ({
          ...r,
          vehicleName: vehicleMap[r.vehicle_id] ?? '—',
          ...(variationMap[r.track_variation_id] ?? {
            trackName: '—',
            trackSlug: null,
            variationName: '—',
            variationSlug: null
          })
        }))

        // Races deleted elsewhere can shrink the list past the page being
        // viewed, which would otherwise leave an empty table.
        if (this.currentPage > this.totalPages) this.currentPage = this.totalPages

        // Clearing this is what swaps the error state's Retry button out for
        // the table, so a refresh doubles as the recovery path.
        this.error = null
        if (refresh) pushToast('Races refreshed', 'success', 1500)
      } catch (err) {
        const message = err.message || 'Failed to load races'
        if (!refresh) this.error = message
        pushToast(message, 'error')
      } finally {
        this.loading = false
        this.refreshing = false
      }
    },
    formatDateTime,
    formatAssists,
    formatMs(ms) {
      return formatMsToTime(ms)
    },
    lapCount(race) {
      if (race.lap_count != null) return race.lap_count
      // Older races may only carry the splits array.
      if (Array.isArray(race.lap_times_ms)) return race.lap_times_ms.length
      return '—'
    },
    hasLapTimes(race) {
      return Array.isArray(race.lap_times_ms) && race.lap_times_ms.some(ms => ms != null)
    },
    hasRoster(race) {
      return Array.isArray(race.results_roster) && race.results_roster.length > 0
    },
    apiSourceTitle(race) {
      return race.api_key?.name
        ? `Logged via API — key: ${race.api_key.name}`
        : 'Logged via API'
    },
    toggleExpanded(id) {
      this.expanded[id] = !this.expanded[id]
    },
    editDefaultsFor(race) {
      return {
        datetime: toLocalIsoMinute(race.datetime),
        vehicleId: race.vehicle_id,
        tuning: race.tuning,
        place: race.place || '',
        lapTimeMs: race.lap_time_ms,
        totalTimeMs: race.total_time_ms,
        performanceIndex: race.performance_index != null ? String(race.performance_index) : '0',
        notes: race.notes || ''
      }
    },
    async onSave(race, payload) {
      this.saving[race.id] = true
      try {
        const updated = await updateRace(race.id, payload)
        const idx = this.rows.findIndex(r => r.id === race.id)
        if (idx !== -1) {
          this.rows.splice(idx, 1, {
            ...updated,
            vehicleName: this.vehicles.find(v => v.id === updated.vehicle_id)?.name ?? '—',
            trackName: race.trackName,
            trackSlug: race.trackSlug,
            variationName: race.variationName,
            variationSlug: race.variationSlug
          })
        }
        this.editing[race.id] = false
        pushToast('Race updated', 'success', 1500)
      } catch (err) {
        pushToast(err.message || 'Failed to update race', 'error')
      } finally {
        this.saving[race.id] = false
      }
    },
    onDelete(race) {
      this.confirmDeleteRace = race
    },
    async onConfirmDelete() {
      const race = this.confirmDeleteRace
      if (!race) return
      this.confirmDeleteRace = null
      try {
        await deleteRace(race.id)
        this.rows = this.rows.filter(r => r.id !== race.id)
        pushToast('Race deleted', 'success', 1500)
      } catch (err) {
        pushToast(err.message || 'Failed to delete race', 'error')
      }
    }
  }
}
</script>
