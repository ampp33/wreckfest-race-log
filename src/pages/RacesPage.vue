<template>
  <DriverScope :user-id="userId" class="wide-table-page max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
    <h1 class="font-heading font-normal tracking-normal leading-none text-display-lg text-brand-text dark:text-brand-text-dark">
      Races
    </h1>
    <p v-if="isCommunity" class="font-body text-[15px] leading-relaxed text-brand-muted dark:text-brand-muted-dark mt-3.5 mb-2">
      The newest {{ classPhrase }}races from every driver — <span class="tabular font-semibold text-brand-text dark:text-brand-text-dark">{{ races.length }}</span> loaded.
      Only races logged by the <router-link to="/plugin" class="text-brand-accent dark:text-brand-accent-dark hover:underline">Telemetry plugin</router-link> show here.
      <template v-if="hasMore">Sorting and filters apply to the races loaded so far; load older ones at the end of the list.</template>
    </p>
    <p v-else class="font-body text-[15px] leading-relaxed text-brand-muted dark:text-brand-muted-dark mt-3.5 mb-2">
      <span class="tabular font-semibold text-brand-text dark:text-brand-text-dark">{{ total }}</span><template v-if="prefs.piClass"> class {{ prefs.piClass }} {{ total === 1 ? 'race' : 'races' }}</template> logged, newest first.
      <template v-if="isFiltered">
        — filtered to races {{ filterDescription }}.
        <router-link :to="$route.path" class="text-brand-accent dark:text-brand-accent-dark hover:underline">Clear filter</router-link>
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
        <SortMenu :columns="sortableColumns" :sort="sort" @toggle="toggleSort" @clear="clearSort" />
        <ColumnFilterMenu v-if="isCommunity" inline label="Driver" v-model="columnFilters.driver" :options="filterOptions.driver" />
        <ColumnFilterMenu inline label="Track / Variation" v-model="columnFilters.trackVariationId" :options="filterOptions.trackVariationId" />
        <ColumnFilterMenu inline label="Vehicle" v-model="columnFilters.vehicleId" :options="filterOptions.vehicleId" />
        <ColumnFilterMenu inline label="Class (PI)" v-model="columnFilters.performanceIndex" :options="filterOptions.performanceIndex">
          <template #option="{ option }"><PerformanceIndexBadge :value="option.value" /></template>
        </ColumnFilterMenu>
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
          <!-- The group's name is in ARIA, there being no room for a visible
               "Per page" label on phones. -->
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
              v-model="hiddenColumns"
              :options="columnOptions"
            />
          </span>
        </div>
      </div>

      <p v-if="races.length === 0" class="font-body text-[15px] text-brand-muted dark:text-brand-muted-dark">No races logged yet.</p>
      <p v-else-if="total === 0" class="font-body text-[15px] text-brand-muted dark:text-brand-muted-dark">
        No races match the current filter.
        <button type="button" class="text-brand-accent dark:text-brand-accent-dark underline" @click="resetColumnFilters">Clear filters</button>
      </p>

      <div v-else>
        <!-- Card layout (mobile) -->
        <div class="sm:hidden divide-y divide-brand-border dark:divide-brand-border-dark">
          <div v-for="race in pageRows" :key="race.id" class="py-3">
            <!-- The row stays put while editing; the form opens below it. -->
            <div class="flex items-start gap-2">
              <div class="min-w-0 flex-1">
                <router-link
                  v-if="isCommunity && isVisible('driver')"
                  :to="`/${race.user_id}/races`"
                  class="ov text-brand-accent dark:text-brand-accent-dark hover:underline"
                >{{ race.driverName }}</router-link>
                <template v-if="isVisible('trackVariation')">
                  <router-link
                    v-if="race.trackSlug && race.variationSlug"
                    :to="`${basePath}/track/${race.trackSlug}/${race.variationSlug}`"
                    class="font-bold text-brand-text dark:text-brand-text-dark hover:text-brand-accent dark:hover:text-brand-accent-dark truncate block"
                  >
                    {{ race.trackName }}
                    <span class="text-brand-muted dark:text-brand-muted-dark font-normal">— {{ race.variationName }}</span>
                  </router-link>
                  <span v-else class="font-bold text-brand-text dark:text-brand-text-dark">—</span>
                </template>
                <div v-if="isVisible('date')" class="text-xs text-brand-muted dark:text-brand-muted-dark inline-flex items-center gap-1">
                  {{ formatDateTime(race.datetime) }}
                  <span
                    v-if="race.source === 'api'"
                    class="w-3 h-3 shrink-0 text-brand-accent dark:text-brand-accent-dark"
                    :title="apiSourceTitle(race)"
                    v-html="apiIcon"
                  />
                  <OnlineRaceIcon v-if="race.server_name" :server-name="race.server_name" />
                </div>

                <!-- The table's columns, in its order and under its column picker. -->
                <div class="grid grid-cols-3 gap-x-3 gap-y-3 mt-3 text-sm">
                  <CardField v-if="isVisible('vehicle')" label="Vehicle" value-class="text-brand-secondary dark:text-brand-secondary-dark">{{ race.vehicleName }}</CardField>
                  <CardField v-if="isVisible('pi')" label="Class (PI)"><PerformanceIndexBadge :value="race.performance_index" /></CardField>
                  <CardField v-if="isVisible('weight')" label="Weight" value-class="tabular text-brand-secondary dark:text-brand-secondary-dark">{{ formatWeight(race.vehicle_weight_kg) }}</CardField>
                  <CardField v-if="isVisible('tune')" label="Tune" value-class="text-brand-secondary dark:text-brand-secondary-dark">{{ race.tuning ?? '—' }}</CardField>
                  <CardField v-if="isVisible('assists')" label="Assists" value-class="text-brand-secondary dark:text-brand-secondary-dark">{{ formatAssists(race.assists) }}</CardField>
                  <CardField v-if="isVisible('parts')" label="Parts"><PartsBadge :parts="race.parts" /></CardField>
                  <CardField v-if="isVisible('place')" label="Place" value-class="tabular-nums">{{ race.place ?? '—' }}</CardField>
                  <CardField v-if="isVisible('laps')" label="Laps" value-class="tabular-nums">{{ lapCount(race) ?? '—' }}</CardField>
                  <CardField v-if="isVisible('lapTime')" label="Lap time" value-class="tabular">{{ formatTime(race.lap_time_ms) }}</CardField>
                  <CardField v-if="isVisible('totalTime')" label="Total time" value-class="tabular text-brand-muted dark:text-brand-muted-dark">{{ formatTime(race.total_time_ms) }}</CardField>
                </div>
              </div>

              <RaceRowActions
                vertical
                :show-expand="hasDetails(race)"
                :expanded="!!expanded[race.id]"
                @toggle-expand="expanded[race.id] = !expanded[race.id]"
                :editable="isOwnRace(race)"
                @edit="editing[race.id] = true"
                @delete="confirmDeleteRace = race"
              >
                <FavoriteStar v-if="isSignedIn" :race-id="race.id" />
              </RaceRowActions>
            </div>

            <div v-if="expanded[race.id] && !editing[race.id]" class="mt-3 px-3 py-3 bg-brand-surface dark:bg-brand-surface-dark">
              <RaceExpandedDetails
                :notes="race.notes || ''"
                :notes-fallback="isOwnRace(race) ? 'No notes' : ''"
                card-labels
                divider
                :lap-times="race.lap_times_ms"
                :roster="race.results_roster"
                :server-name="race.server_name || ''"
              />
            </div>

            <RaceForm
              v-if="editing[race.id]"
              :notes-only="race.source === 'api'"
              class="mt-3"
              :vehicles="vehicles"
              :defaults="editDefaults(race)"
              :saving="!!saving[race.id]"
              :autofocus="false"
              @submit="payload => onSave(race, payload)"
              @cancel="editing[race.id] = false"
            />
          </div>
        </div>

        <!-- Table layout (desktop) — no scroll box of its own; a table too
             wide for the page widens the page instead (see .wide-table-page). -->
        <div class="hidden sm:block">
          <table class="w-full text-sm">
            <thead>
              <tr class="text-left ov ov-lg text-brand-accent dark:text-brand-accent-dark border-b-2 border-brand-strong dark:border-brand-strong-dark">
                <th v-if="isSignedIn" class="w-px p-0 pb-2.5 font-medium">
                  <span class="flex w-5 justify-center">
                    <ColumnFilterMenu label="Favorites" :icon="columnFilters.favorite.length ? starFillIcon : starIcon" icon-size="w-4 h-4" v-model="columnFilters.favorite" :options="filterOptions.favorite" />
                  </span>
                </th>
                <th v-if="isVisible('date')" class="px-3.5 pb-2.5 font-medium">
                  <SortHeader label="Date" sort-key="date" :sort="sort" @toggle="toggleSort" />
                </th>
                <th v-if="isCommunity && isVisible('driver')" class="px-3.5 pb-2.5 font-medium">
                  <span class="inline-flex items-center gap-1">
                    <SortHeader label="Driver" sort-key="driver" :sort="sort" @toggle="toggleSort" />
                    <ColumnFilterMenu label="Driver" icon-size="w-4 h-4" v-model="columnFilters.driver" :options="filterOptions.driver" />
                  </span>
                </th>
                <th v-if="isVisible('trackVariation')" class="px-3.5 pb-2.5 font-medium">
                  <span class="inline-flex items-center gap-1">
                    <SortHeader label="Track / Variation" sort-key="trackVariation" :sort="sort" @toggle="toggleSort" />
                    <ColumnFilterMenu label="Track / Variation" icon-size="w-4 h-4" v-model="columnFilters.trackVariationId" :options="filterOptions.trackVariationId" />
                  </span>
                </th>
                <th v-if="isVisible('vehicle')" class="px-3.5 pb-2.5 font-medium">
                  <span class="inline-flex items-center gap-1">
                    <SortHeader label="Vehicle" sort-key="vehicle" :sort="sort" @toggle="toggleSort" />
                    <ColumnFilterMenu label="Vehicle" icon-size="w-4 h-4" v-model="columnFilters.vehicleId" :options="filterOptions.vehicleId" />
                  </span>
                </th>
                <th v-if="isVisible('pi')" class="px-3.5 pb-2.5 font-medium">
                  <span class="inline-flex items-center gap-1">
                    <SortHeader label="Class (PI)" sort-key="pi" :sort="sort" @toggle="toggleSort" />
                    <ColumnFilterMenu label="Class (PI)" icon-size="w-4 h-4" v-model="columnFilters.performanceIndex" :options="filterOptions.performanceIndex">
                      <template #option="{ option }"><PerformanceIndexBadge :value="option.value" /></template>
                    </ColumnFilterMenu>
                  </span>
                </th>
                <th v-if="isVisible('weight')" class="px-3.5 pb-2.5 font-medium text-right">
                  <SortHeader class="justify-end w-full" label="Weight" sort-key="weight" :sort="sort" @toggle="toggleSort" />
                </th>
                <th v-if="isVisible('tune')" class="px-3.5 pb-2.5 font-medium text-center">
                  <SortHeader class="justify-center w-full" label="Tune" sort-key="tune" :sort="sort" @toggle="toggleSort" />
                </th>
                <th v-if="isVisible('assists')" class="px-3.5 pb-2.5 font-medium text-center">
                  <SortHeader class="justify-center w-full" label="Assists" sort-key="assists" :sort="sort" @toggle="toggleSort" />
                </th>
                <th v-if="isVisible('parts')" class="w-px px-3.5 pb-2.5 font-medium text-center whitespace-nowrap">Parts</th>
                <th v-if="isVisible('place')" class="px-3.5 pb-2.5 font-medium text-right">
                  <span class="inline-flex items-center justify-end gap-1">
                    <SortHeader label="Place" sort-key="place" :sort="sort" @toggle="toggleSort" />
                    <ColumnFilterMenu label="Place" icon-size="w-4 h-4" v-model="columnFilters.place" :options="filterOptions.place" />
                  </span>
                </th>
                <th v-if="isVisible('laps')" class="px-3.5 pb-2.5 font-medium text-right">
                  <SortHeader class="justify-end w-full" label="Laps" sort-key="laps" :sort="sort" @toggle="toggleSort" />
                </th>
                <th v-if="isVisible('lapTime')" class="px-3.5 pb-2.5 font-medium text-right">
                  <SortHeader class="justify-end w-full" label="Lap time" sort-key="lapTime" :sort="sort" @toggle="toggleSort" />
                </th>
                <th v-if="isVisible('totalTime')" class="px-3.5 pb-2.5 font-medium text-right">
                  <SortHeader class="justify-end w-full" label="Total time" sort-key="totalTime" :sort="sort" @toggle="toggleSort" />
                </th>
                <th class="px-3.5 pb-2.5 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-brand-border dark:divide-brand-border-dark border-b border-brand-border dark:border-brand-border-dark">
              <template v-for="race in pageRows" :key="race.id">
                <tr class="hover:bg-brand-surface dark:hover:bg-brand-surface-dark">
                  <td v-if="isSignedIn" class="w-px p-0">
                    <FavoriteStar compact :race-id="race.id" />
                  </td>
                  <td v-if="isVisible('date')" class="px-3.5 py-2 whitespace-nowrap tabular text-xs text-brand-muted dark:text-brand-muted-dark">
                    <span class="inline-flex items-center gap-1">
                      {{ formatDateTime(race.datetime) }}
                      <span
                        v-if="race.source === 'api'"
                        class="w-3 h-3 shrink-0 text-brand-accent dark:text-brand-accent-dark"
                        :title="apiSourceTitle(race)"
                        v-html="apiIcon"
                      ></span>
                      <OnlineRaceIcon v-if="race.server_name" :server-name="race.server_name" />
                    </span>
                  </td>
                  <td v-if="isCommunity && isVisible('driver')" class="px-3.5 py-2 whitespace-nowrap">
                    <router-link
                      :to="`/${race.user_id}/races`"
                      class="text-brand-secondary dark:text-brand-secondary-dark hover:text-brand-accent dark:hover:text-brand-accent-dark"
                    >{{ race.driverName }}</router-link>
                  </td>
                  <td v-if="isVisible('trackVariation')" class="px-3.5 py-2">
                    <router-link
                      v-if="race.trackSlug && race.variationSlug"
                      :to="`${basePath}/track/${race.trackSlug}/${race.variationSlug}`"
                      class="font-semibold text-brand-text dark:text-brand-text-dark hover:text-brand-accent dark:hover:text-brand-accent-dark"
                    >
                      {{ race.trackName }}
                      <span class="text-brand-muted dark:text-brand-muted-dark font-normal">— {{ race.variationName }}</span>
                    </router-link>
                    <span v-else class="text-brand-muted dark:text-brand-muted-dark">—</span>
                  </td>
                  <td v-if="isVisible('vehicle')" class="px-3.5 py-2 text-brand-secondary dark:text-brand-secondary-dark">
                    {{ race.vehicleName }}
                  </td>
                  <td v-if="isVisible('pi')" class="px-3.5 py-2 whitespace-nowrap">
                    <PerformanceIndexBadge :value="race.performance_index" />
                  </td>
                  <td v-if="isVisible('weight')" class="px-3.5 py-2 text-right tabular text-brand-secondary dark:text-brand-secondary-dark">
                    {{ formatWeight(race.vehicle_weight_kg) }}
                  </td>
                  <td v-if="isVisible('tune')" class="px-3.5 py-2 text-center text-brand-secondary dark:text-brand-secondary-dark">
                    {{ race.tuning ?? '—' }}
                  </td>
                  <td v-if="isVisible('assists')" class="px-3.5 py-2 text-center text-brand-secondary dark:text-brand-secondary-dark">
                    {{ formatAssists(race.assists) }}
                  </td>
                  <td v-if="isVisible('parts')" class="w-px px-3.5 py-2 text-center whitespace-nowrap">
                    <PartsBadge :parts="race.parts" />
                  </td>
                  <td v-if="isVisible('place')" class="px-3.5 py-2 text-right tabular-nums">
                    {{ race.place ?? '—' }}
                  </td>
                  <td v-if="isVisible('laps')" class="px-3.5 py-2 text-right tabular-nums text-brand-secondary dark:text-brand-secondary-dark">
                    {{ lapCount(race) ?? '—' }}
                  </td>
                  <td v-if="isVisible('lapTime')" class="px-3.5 py-2 text-right tabular">
                    {{ formatTime(race.lap_time_ms) }}
                  </td>
                  <td v-if="isVisible('totalTime')" class="px-3.5 py-2 text-right tabular text-brand-muted dark:text-brand-muted-dark">
                    {{ formatTime(race.total_time_ms) }}
                  </td>
                  <td class="px-3.5 py-2 text-right whitespace-nowrap">
                    <RaceRowActions
                      :show-expand="hasDetails(race)"
                      :expanded="!!expanded[race.id]"
                      @toggle-expand="expanded[race.id] = !expanded[race.id]"
                      :editable="isOwnRace(race)"
                      @edit="editing[race.id] = true"
                      @delete="confirmDeleteRace = race"
                    />
                  </td>
                </tr>
                <tr v-if="editing[race.id]">
                  <td :colspan="tableColspan" class="p-5 bg-brand-surface dark:bg-brand-surface-dark">
                    <RaceForm
                      :notes-only="race.source === 'api'"
                      :vehicles="vehicles"
                      :defaults="editDefaults(race)"
                      :saving="!!saving[race.id]"
                      :autofocus="false"
                      @submit="payload => onSave(race, payload)"
                      @cancel="editing[race.id] = false"
                    />
                  </td>
                </tr>
                <tr v-if="!editing[race.id] && expanded[race.id]">
                  <td :colspan="tableColspan" class="px-3.5 py-3 bg-brand-surface dark:bg-brand-surface-dark">
                    <RaceExpandedDetails
                      :notes="race.notes || ''"
                      :notes-fallback="isOwnRace(race) ? 'No notes' : ''"
                      accent
                      divider
                      :lap-times="race.lap_times_ms"
                      :roster="race.results_roster"
                      :server-name="race.server_name || ''"
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
          Showing {{ total === 0 ? 0 : (currentPage - 1) * pageSize + 1 }}–{{ Math.min(total, currentPage * pageSize) }} of {{ total }}
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

      <div v-if="isCommunity && hasMore && currentPage === totalPages" class="mt-6 flex justify-center">
        <button
          type="button"
          class="ov min-h-[44px] px-6 border border-brand-border dark:border-brand-border-dark text-brand-text dark:text-brand-text-dark hover:border-brand-accent dark:hover:border-brand-accent-dark disabled:opacity-50"
          :disabled="loadingMore"
          @click="loadMore"
        >{{ loadingMore ? 'Loading…' : `Load ${COMMUNITY_PAGE_SIZE} older races` }}</button>
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
  </DriverScope>
</template>

<script>
import { getAllRaces, getCommunityRaces, COMMUNITY_PAGE_SIZE, updateRace, deleteRace, getTracks, getVehicles } from '../api.js'
import { prefsStore, pushToast } from '../stores.js'
import { scopedPage } from '../utils/scope.js'
import { raceTable, DRIVER_FILTER, PI_FILTER, FAVORITE_FILTER, lapCount, hasDetails, apiSourceTitle, editDefaults } from '../utils/raceTable.js'
import { formatMsToTime, formatDateTime, formatAssists, formatWeight } from '../utils/format.js'
import DriverScope from '../components/DriverScope.vue'
import RaceForm from '../components/RaceForm.vue'
import ConfirmDialog from '../components/ConfirmDialog.vue'
import PerformanceIndexBadge from '../components/PerformanceIndexBadge.vue'
import RaceRowActions from '../components/RaceRowActions.vue'
import RaceExpandedDetails from '../components/RaceExpandedDetails.vue'
import OnlineRaceIcon from '../components/OnlineRaceIcon.vue'
import PartsBadge from '../components/PartsBadge.vue'
import FavoriteStar from '../components/FavoriteStar.vue'
import ColumnFilterMenu from '../components/ColumnFilterMenu.vue'
import FilterDrawer from '../components/FilterDrawer.vue'
import SortHeader from '../components/SortHeader.vue'
import SortMenu from '../components/SortMenu.vue'
import CardField from '../components/CardField.vue'
import apiIcon from '../assets/icons/api.svg?raw'
import refreshIcon from '../assets/icons/refresh.svg?raw'
import columnsIcon from '../assets/icons/columns.svg?raw'
import starIcon from '../assets/icons/star.svg?raw'
import starFillIcon from '../assets/icons/star-fill.svg?raw'

// 'Actions' is left out — always shown, as the row's only way to edit/delete.
const TABLE_COLUMNS = [
  { key: 'date', label: 'Date' },
  { key: 'trackVariation', label: 'Track / Variation' },
  { key: 'vehicle', label: 'Vehicle' },
  { key: 'pi', label: 'Class (PI)' },
  { key: 'weight', label: 'Weight' },
  { key: 'tune', label: 'Tune' },
  { key: 'assists', label: 'Assists' },
  { key: 'parts', label: 'Parts' },
  { key: 'place', label: 'Place' },
  { key: 'laps', label: 'Laps' },
  { key: 'lapTime', label: 'Lap time' },
  { key: 'totalTime', label: 'Total time' }
]
// Community races add who raced, right after the date.
const COMMUNITY_TABLE_COLUMNS = [TABLE_COLUMNS[0], { key: 'driver', label: 'Driver' }, ...TABLE_COLUMNS.slice(1)]

const UNRESOLVED_VEHICLE = '__unresolved_vehicle__'
const UNRESOLVED_VARIATION = '__unresolved_variation__'
const NO_VARIATION = { trackName: '—', trackSlug: null, variationName: '—', variationSlug: null }

const resolved = race => race.trackSlug && race.variationSlug
const trackVariationLabel = race => resolved(race) ? `${race.trackName} — ${race.variationName}` : '—'
const placeKey = race => race.place != null ? race.place : '—'

export default {
  name: 'RacesPage',
  components: { DriverScope, RaceForm, ConfirmDialog, PerformanceIndexBadge, RaceRowActions, RaceExpandedDetails, OnlineRaceIcon, PartsBadge, FavoriteStar, ColumnFilterMenu, FilterDrawer, SortHeader, SortMenu, CardField },
  mixins: [scopedPage, raceTable],
  raceTable: {
    storageKey: 'wreckfest:columns:races',
    // One instance serves both a driver's races and the community's (the
    // router reuses it), so it knows every column.
    columns: COMMUNITY_TABLE_COLUMNS.map(c => c.key),
    defaultHidden: ['weight', 'tune', 'assists', 'parts'],
    filters: {
      driver: DRIVER_FILTER,
      trackVariationId: { value: race => resolved(race) ? race.track_variation_id : UNRESOLVED_VARIATION, label: trackVariationLabel },
      // Bucketed by whether the name resolved, so a race whose vehicle was
      // deleted lands with the ones that have none.
      vehicleId: { value: race => race.vehicleName === '—' ? UNRESOLVED_VEHICLE : race.vehicle_id, label: race => race.vehicleName },
      performanceIndex: PI_FILTER,
      place: { value: placeKey, label: placeKey, numeric: true },
      favorite: FAVORITE_FILTER
    },
    sortValues: {
      date: race => new Date(race.datetime).getTime(),
      driver: race => race.driverName,
      trackVariation: trackVariationLabel,
      vehicle: race => race.vehicleName,
      pi: race => race.performance_index,
      weight: race => race.vehicle_weight_kg,
      tune: race => race.tuning,
      assists: race => formatAssists(race.assists),
      place: race => race.place,
      laps: lapCount,
      lapTime: race => race.lap_time_ms,
      totalTime: race => race.total_time_ms
    }
  },
  data() {
    return {
      prefs: prefsStore,
      loading: true,
      refreshing: false,
      error: null,
      races: [],
      vehicles: [],
      currentPage: 1,
      pageSize: 50,
      expanded: {},
      editing: {},
      saving: {},
      confirmDeleteRace: null,
      // Community mode: whether the server has older races than those loaded,
      // and how many rows have been fetched — the next page's offset, which
      // isn't races.length since overlapping pages are de-duplicated.
      hasMore: false,
      loadingMore: false,
      fetchedCount: 0,
      COMMUNITY_PAGE_SIZE,
      apiIcon,
      refreshIcon,
      columnsIcon,
      starIcon,
      starFillIcon
    }
  },
  computed: {
    tableColumns() {
      return this.isCommunity ? COMMUNITY_TABLE_COLUMNS : TABLE_COLUMNS
    },
    columnOptions() {
      return this.tableColumns.map(c => ({ value: c.key, label: c.label }))
    },
    visibleColumnKeys() {
      return this.tableColumns.map(c => c.key).filter(this.isVisible)
    },
    // Every visible column, plus Actions, plus the favorite star's when signed in.
    tableColspan() {
      return this.visibleColumnKeys.length + 1 + (this.isSignedIn ? 1 : 0)
    },
    // The mobile drawer's sort choices: visible columns only, and never Parts,
    // which has no single value to order by.
    sortableColumns() {
      return this.tableColumns.filter(c => c.key !== 'parts' && this.isVisible(c.key))
    },
    sourceFilter() {
      if (this.isCommunity) return null
      const source = this.$route.query.source
      return source === 'web' || source === 'api' ? source : null
    },
    // Which API key logged a race is private, so this only means anything on
    // your own races.
    apiKeyIdFilter() {
      const apiKeyId = this.$route.query.api_key_id
      return this.isOwnView && typeof apiKeyId === 'string' && apiKeyId ? apiKeyId : null
    },
    vehicleIdFilter() {
      const vehicleId = this.$route.query.vehicle_id
      return !this.isCommunity && typeof vehicleId === 'string' && vehicleId ? vehicleId : null
    },
    isFiltered() {
      return !!(this.sourceFilter || this.apiKeyIdFilter || this.vehicleIdFilter)
    },
    // "in the Nexus RX logged via the Telemetry API", for the filtered intro.
    filterDescription() {
      const parts = []
      if (this.vehicleIdFilter) {
        const name = this.vehicles.find(v => v.id === this.vehicleIdFilter)?.name
        parts.push(name ? `in the ${name}` : 'in this vehicle')
      }
      if (this.apiKeyIdFilter) parts.push('logged with this API key')
      else if (this.sourceFilter) parts.push(`logged via the ${this.sourceFilter === 'api' ? 'Telemetry API' : 'web app'}`)
      return parts.join(' ')
    },
    // "class C " while the nav's car-class filter is on, for the community intro.
    classPhrase() {
      return this.prefs.piClass ? `class ${this.prefs.piClass} ` : ''
    },
    total() {
      return this.filteredRaces.length
    },
    totalPages() {
      return Math.max(1, Math.ceil(this.total / this.pageSize))
    },
    pageRows() {
      const start = (this.currentPage - 1) * this.pageSize
      return this.sortedRaces.slice(start, start + this.pageSize)
    },
    // At most five numbered buttons, centred on the current page and clamped
    // to the range.
    pageWindow() {
      const last = Math.min(this.totalPages, Math.max(1, this.currentPage - 2) + 4)
      const first = Math.max(1, last - 4)
      return Array.from({ length: last - first + 1 }, (_, i) => first + i)
    }
  },
  watch: {
    // $route watchers also fire on the way out to another page, hence the
    // route check — leaving shouldn't kick off a reload.
    '$route.query'() {
      if (!this.isRacesRoute()) return
      this.resetColumnFilters()
      this.currentPage = 1
      this.load()
    },
    // Also covers switching between a driver's races and the community's,
    // which reuses this component instance.
    userId() {
      if (!this.isRacesRoute()) return
      this.resetColumnFilters()
      this.currentPage = 1
      this.expanded = {}
      this.editing = {}
      this.load()
    },
    // The nav's car-class filter, applied server-side — so a fresh load.
    'prefs.piClass'() {
      if (!this.isRacesRoute()) return
      this.currentPage = 1
      this.load()
    },
    columnFilters: {
      deep: true,
      handler() {
        this.currentPage = 1
      }
    },
    sort() {
      this.currentPage = 1
    }
  },
  mounted() {
    this.load()
  },
  methods: {
    formatDateTime,
    formatAssists,
    formatWeight,
    lapCount,
    hasDetails,
    apiSourceTitle,
    editDefaults,
    formatTime(ms) {
      return ms != null ? formatMsToTime(ms) : '—'
    },
    isRacesRoute() {
      return this.$route.name === 'driver-races' || this.$route.name === 'community-races'
    },
    // The first load and the refresh button. A refresh keeps the table on
    // screen (expanded rows, page and page size included) and reports a
    // failure by toast rather than replacing the page with an error.
    async load({ refresh = false } = {}) {
      if (refresh) this.refreshing = true
      // A newer load (driver, filter or class changed) supersedes this one,
      // and any older loadMore() page with it.
      const token = (this.loadToken = (this.loadToken || 0) + 1)
      try {
        const piClass = this.prefs.piClass
        const [races, tracks, vehicles] = await Promise.all([
          this.isCommunity
            ? getCommunityRaces({ piClass })
            : getAllRaces({ userId: this.userId, source: this.sourceFilter, apiKeyId: this.apiKeyIdFilter, vehicleId: this.vehicleIdFilter, piClass }),
          getTracks(),
          getVehicles()
        ])
        if (token !== this.loadToken) return

        this.vehicles = vehicles
        // Name lookups, kept (non-reactively) so loadMore() can decorate later
        // pages without refetching the catalogue.
        this.vehicleNames = Object.fromEntries(vehicles.map(v => [v.id, v.name]))
        this.variationNames = {}
        for (const track of tracks) {
          for (const v of track.track_variations || []) {
            this.variationNames[v.id] = { trackName: track.name, trackSlug: track.slug, variationName: v.name, variationSlug: v.slug }
          }
        }
        this.races = races.map(this.decorate)
        this.fetchedCount = races.length
        this.hasMore = this.isCommunity && races.length === COMMUNITY_PAGE_SIZE

        // Races deleted elsewhere can shrink the list past the page in view.
        if (this.currentPage > this.totalPages) this.currentPage = this.totalPages

        // Clearing this swaps the error state for the table, so a refresh
        // doubles as the recovery path.
        this.error = null
        if (refresh) pushToast('Races refreshed', 'success', 1500)
      } catch (err) {
        if (token !== this.loadToken) return
        const message = err.message || 'Failed to load races'
        if (!refresh) this.error = message
        pushToast(message, 'error')
      } finally {
        if (token === this.loadToken) {
          this.loading = false
          this.refreshing = false
        }
      }
    },
    decorate(race) {
      return { ...race, vehicleName: this.vehicleNames[race.vehicle_id] ?? '—', ...(this.variationNames[race.track_variation_id] ?? NO_VARIATION) }
    },
    // Community mode: append the next-older page. Offset paging, so a race
    // logged since the last fetch shifts everything down one — the overlap is
    // dropped by id rather than shown twice.
    async loadMore() {
      this.loadingMore = true
      const token = this.loadToken
      try {
        const races = await getCommunityRaces({ piClass: this.prefs.piClass, offset: this.fetchedCount })
        if (token !== this.loadToken) return
        const seen = new Set(this.races.map(r => r.id))
        this.races = this.races.concat(races.filter(r => !seen.has(r.id)).map(this.decorate))
        this.fetchedCount += races.length
        this.hasMore = races.length === COMMUNITY_PAGE_SIZE
      } catch (err) {
        pushToast(err.message || 'Failed to load older races', 'error')
      } finally {
        this.loadingMore = false
      }
    },
    async onSave(race, payload) {
      this.saving[race.id] = true
      try {
        const updated = await updateRace(race.id, payload)
        const idx = this.races.findIndex(r => r.id === race.id)
        // updateRace() doesn't bring back the driver's name; the rest re-decorates.
        if (idx !== -1) this.races.splice(idx, 1, { ...this.decorate(updated), driverName: race.driverName })
        this.editing[race.id] = false
        pushToast('Race updated', 'success', 1500)
      } catch (err) {
        pushToast(err.message || 'Failed to update race', 'error')
      } finally {
        this.saving[race.id] = false
      }
    },
    async onConfirmDelete() {
      const race = this.confirmDeleteRace
      if (!race) return
      this.confirmDeleteRace = null
      try {
        await deleteRace(race.id)
        this.races = this.races.filter(r => r.id !== race.id)
        pushToast('Race deleted', 'success', 1500)
      } catch (err) {
        pushToast(err.message || 'Failed to delete race', 'error')
      }
    }
  }
}
</script>
