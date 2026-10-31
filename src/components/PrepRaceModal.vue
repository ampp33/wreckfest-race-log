<template>
  <BaseModal :open="pr.open" wide @close="onClose">
    <template #title>Prep for <em class="signal">race</em></template>

    <p v-if="loadingTracks" class="font-body text-[15px] text-brand-muted dark:text-brand-muted-dark">Loading tracks…</p>

    <TrackVariationPicker v-else-if="!chosen" :tracks="tracks" @select="onTrackSelected" />

    <div v-else>
      <div class="mb-4 flex items-center justify-between gap-3 text-sm">
        <div class="flex items-center gap-3 min-w-0">
          <img
            :src="variationImageUrl(chosen.track.slug, chosen.variation.slug)"
            :alt="chosen.variation.name"
            class="w-16 h-12 object-contain bg-black rounded shrink-0"
            loading="lazy"
          />
          <div class="min-w-0">
            <div class="font-semibold truncate text-brand-text dark:text-brand-text-dark">{{ chosen.track.name }}</div>
            <div class="font-body text-[15px] text-brand-muted dark:text-brand-muted-dark truncate">{{ chosen.variation.name }}</div>
          </div>
        </div>
        <button type="button" class="text-xs text-brand-accent hover:underline shrink-0" @click="chosen = null">
          Change track
        </button>
      </div>

      <label class="flex items-start gap-2 mb-3 text-sm text-brand-secondary dark:text-brand-secondary-dark cursor-pointer">
        <input v-model="excludeMeta" type="checkbox" class="mt-0.5 accent-brand-accent" />
        Exclude Meta Vehicles (Raiden, Super Venom, Hammerhead RS, Speedie)
      </label>

      <label class="ov block text-brand-muted dark:text-brand-muted-dark mb-2" for="prep-vehicle">Vehicle</label>
      <select
        id="prep-vehicle"
        v-model="vehicleId"
        class="w-full min-h-[44px] mb-4 border border-brand-border dark:border-brand-border-dark bg-brand-bg dark:bg-brand-surface-dark px-3 py-2 focus:outline-none focus:border-brand-accent dark:focus:border-brand-accent-dark"
      >
        <option :value="null">Any vehicle</option>
        <option v-for="v in vehicles" :key="v.id" :value="v.id">{{ v.name }}</option>
      </select>

      <p v-if="loadingLaps" class="font-body text-[15px] text-brand-muted dark:text-brand-muted-dark">Loading fastest laps…</p>

      <div v-else class="overflow-x-auto">
        <table class="w-full min-w-[36rem] table-fixed text-sm">
          <thead>
            <tr class="text-[11px] uppercase tracking-widest text-brand-muted dark:text-brand-muted-dark border-b border-brand-border dark:border-brand-border-dark">
              <th class="w-12 text-left font-medium py-1 pr-2">Class</th>
              <th class="text-left font-medium py-1 pr-2">Vehicle</th>
              <th class="w-14 text-center font-medium py-1 pr-2">Tune</th>
              <th class="w-32 text-left font-medium py-1 pr-2">Parts</th>
              <th class="w-16 text-left font-medium py-1 pr-2">PI</th>
              <th class="w-20 text-right font-medium py-1 pr-2">Weight</th>
              <th class="w-20 text-right font-medium py-1">Lap</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-brand-border dark:divide-brand-border-dark">
            <tr v-for="c in classes" :key="c.letter">
              <td class="py-2 pr-2 font-display font-black" :style="{ color: classLetterColor(c.letter) }" :title="classRangeLabel(c.letter)">{{ c.letter }}</td>
              <td v-if="!c.lap" colspan="6" class="py-2 text-brand-muted dark:text-brand-muted-dark">No laps logged.</td>
              <template v-else>
                <td class="py-2 pr-2 truncate text-brand-text dark:text-brand-text-dark">{{ vehicleName(c.lap) }}</td>
                <td class="py-2 pr-2 text-center text-brand-secondary dark:text-brand-secondary-dark">{{ c.lap.tuning ?? '—' }}</td>
                <td class="py-2 pr-2"><PartsBadge :parts="c.lap.parts" /></td>
                <td class="py-2 pr-2 whitespace-nowrap"><PerformanceIndexBadge :value="c.lap.performance_index" /></td>
                <td class="py-2 pr-2 text-right tabular whitespace-nowrap text-brand-secondary dark:text-brand-secondary-dark">{{ c.lap.vehicle_weight_kg != null ? c.lap.vehicle_weight_kg + ' kg' : '—' }}</td>
                <td class="py-2 text-right tabular font-semibold">{{ formatMsToTime(c.lap.lap_time_ms) }}</td>
              </template>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="mt-5 pt-5 border-t border-brand-border dark:border-brand-border-dark">
        <AnnotationMap
          :image-url="variationImageUrl(chosen.track.slug, chosen.variation.slug)"
          :alt="chosen.variation.name"
          :track-slug="chosen.track.slug"
          :variation-slug="chosen.variation.slug"
          :ring-label="`${chosen.track.name} — ${chosen.variation.name}`"
          :annotations="annotations"
          :editable="false"
          :max-height="288"
        />
        <ol v-if="annotations.length" class="mt-4 space-y-1.5 text-sm text-brand-secondary dark:text-brand-secondary-dark">
          <li v-for="ann in sortedAnnotations" :key="ann.id" class="flex gap-2.5">
            <span class="shrink-0 w-6 h-6 rounded-full bg-brand-accent dark:bg-brand-accent-dark text-white text-xs font-bold tabular flex items-center justify-center">{{ ann.number }}</span>
            <span class="pt-0.5 whitespace-pre-line">{{ ann.note || '—' }}</span>
          </li>
        </ol>
      </div>
    </div>
  </BaseModal>
</template>

<script>
import BaseModal from './BaseModal.vue'
import TrackVariationPicker from './TrackVariationPicker.vue'
import PartsBadge from './PartsBadge.vue'
import PerformanceIndexBadge from './PerformanceIndexBadge.vue'
import AnnotationMap from './AnnotationMap.vue'
import { variationImageUrl } from '../utils/imageUrl.js'
import { formatMsToTime } from '../utils/timeFormat.js'
import { CLASS_LETTERS, META_VEHICLES, classLetterColor, classRangeLabel } from '../utils/piInfo.js'
import { prepRaceStore, closePrepRace } from '../stores/prepRaceStore.js'
import { getTracks } from '../services/trackService.js'
import { getVehicles } from '../services/vehicleService.js'
import { getFastestLapsPerVehicleOnVariation } from '../services/raceService.js'
import { pushToast } from '../stores/toastStore.js'
import { authStore } from '../stores/authStore.js'
import { getAnnotationsForVariation } from '../services/annotationService.js'

export default {
  name: 'PrepRaceModal',
  components: { BaseModal, TrackVariationPicker, PartsBadge, PerformanceIndexBadge, AnnotationMap },
  data() {
    return {
      pr: prepRaceStore,
      tracks: [],
      vehicles: [],
      loadingTracks: false,
      chosen: null,
      excludeMeta: false,
      vehicleId: null,
      loadingLaps: false,
      laps: [],
      // Your own pins for the chosen variation (RLS returns only yours).
      annotations: []
    }
  },
  computed: {
    sortedAnnotations() {
      return [...this.annotations].sort((a, b) => a.number - b.number)
    },
    metaVehicleIds() {
      return new Set(this.vehicles.filter(v => META_VEHICLES.includes(v.name)).map(v => v.id))
    },
    // The quickest lap per class. A picked vehicle wins over the meta
    // checkbox, so picking a meta car still shows its laps.
    classes() {
      const matches = this.vehicleId
        ? lap => lap.vehicle_id === this.vehicleId
        : lap => !(this.excludeMeta && this.metaVehicleIds.has(lap.vehicle_id))
      return CLASS_LETTERS.map(letter => ({
        letter,
        lap: this.laps.find(lap => lap.pi_class === letter && matches(lap))
      }))
    }
  },
  watch: {
    'pr.open'(isOpen) {
      if (isOpen) this.onOpened()
      else this.chosen = null
    }
  },
  methods: {
    variationImageUrl,
    formatMsToTime,
    classLetterColor,
    classRangeLabel,
    async onOpened() {
      if (this.tracks.length) return
      this.loadingTracks = true
      try {
        const [tracks, vehicles] = await Promise.all([getTracks(), getVehicles()])
        this.tracks = tracks
        this.vehicles = vehicles
      } catch (err) {
        pushToast(err.message || 'Failed to load tracks', 'error')
      } finally {
        this.loadingTracks = false
      }
    },
    onTrackSelected({ track, variation }) {
      this.chosen = { track, variation }
      this.loadLaps()
      this.loadAnnotations(variation.id)
    },
    async loadAnnotations(variationId) {
      this.annotations = []
      if (!authStore.isAuthenticated) return
      try {
        const annotations = await getAnnotationsForVariation(variationId)
        if (this.chosen?.variation.id === variationId) this.annotations = annotations
      } catch (err) {
        pushToast(err.message || 'Failed to load annotations', 'error')
      }
    },
    async loadLaps() {
      const variationId = this.chosen.variation.id
      this.latestVariationId = variationId
      this.loadingLaps = true
      try {
        const laps = await getFastestLapsPerVehicleOnVariation(variationId)
        // A quicker track change already superseded this one.
        if (this.latestVariationId !== variationId) return
        this.laps = laps
      } catch (err) {
        pushToast(err.message || 'Failed to load fastest laps', 'error')
      } finally {
        if (this.latestVariationId === variationId) this.loadingLaps = false
      }
    },
    // The roster names its car, so vehicle_name is there even when it
    // matched no vehicle (and vehicle_id is null).
    vehicleName(lap) {
      return lap.vehicle_name ?? '—'
    },
    onClose() {
      closePrepRace()
    }
  }
}
</script>
