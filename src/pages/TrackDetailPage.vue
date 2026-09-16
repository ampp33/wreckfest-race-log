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
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
            </svg>
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

      <div class="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
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

      <LapTimeChart :races="races" :vehicles="vehicles" />

      <div>
        <div class="flex items-end justify-between border-b-2 border-brand-strong dark:border-brand-strong-dark pb-2.5 mb-1">
          <h2 class="font-heading font-normal tracking-normal leading-none text-display-sm text-brand-text dark:text-brand-text-dark">
            Logged races
          </h2>
          <span class="ov text-brand-muted dark:text-brand-muted-dark">{{ races.length }} at this variation</span>
        </div>

        <!-- Card layout (mobile) -->
        <div class="sm:hidden">
          <RaceRow
            v-for="race in races"
            :key="race.id"
            layout="card"
            :race="race"
            :vehicles="vehicles"
            :goal-lap-time-ms="goalLapTimeMs"
            :personal-best-ms="personalBestMs"
            @update="onUpdateRace"
            @delete="onDeleteRace"
          />
          <p v-if="!races.length" class="py-6 text-center font-body text-[15px] text-brand-muted dark:text-brand-muted-dark">
            No races yet — click <span class="font-semibold">+ Add Race</span> to log one.
          </p>
        </div>

        <!-- Table layout (desktop) -->
        <div class="hidden sm:block overflow-x-auto">
          <table class="min-w-full text-sm">
            <thead class="text-left ov text-brand-muted dark:text-brand-muted-dark">
              <tr>
                <th class="py-2.5 pl-0 pr-3">When</th>
                <th class="py-2 pr-3">Vehicle</th>
                <th class="py-2 pr-3">Class (PI)</th>
                <th class="py-2 pr-3 text-center">Tune</th>
                <th class="py-2 pr-3 text-center">Place</th>
                <th class="py-2 pr-3 text-center">Laps</th>
                <th class="py-2 pr-3">Lap</th>
                <th class="py-2 pr-3">Δ goal</th>
                <th class="py-2 pr-3">Total</th>
                <th class="py-2 pr-3">Notes</th>
                <th class="py-2 pr-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <RaceRow
                v-for="race in races"
                :key="race.id"
                :race="race"
                :vehicles="vehicles"
                :goal-lap-time-ms="goalLapTimeMs"
                :personal-best-ms="personalBestMs"
                @update="onUpdateRace"
                @delete="onDeleteRace"
              />
              <tr v-if="!races.length">
                <td colspan="11" class="py-6 text-center font-body text-[15px] text-brand-muted dark:text-brand-muted-dark">
                  No races yet — click <span class="font-semibold">+ Add Race</span> to log one.
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
          <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
          </svg>
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
import { getTrackBySlug, findVariation } from '../services/trackService.js'
import { getVehicles } from '../services/vehicleService.js'
import { getRacesByVariation, updateRace, deleteRace } from '../services/raceService.js'
import { getGoalForVariation, upsertGoal } from '../services/goalService.js'
import { getAnnotationsForVariation, saveAnnotations } from '../services/annotationService.js'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { authStore } from '../stores/authStore.js'
import { pushToast } from '../stores/toastStore.js'
import { quickAddStore, setOnRaceSaved, clearOnRaceSaved, openQuickAdd } from '../stores/quickAddStore.js'
import { formatMsToTime, formatDelta } from '../utils/timeFormat.js'
import LapTimeInput from '../components/LapTimeInput.vue'
import { trackImageUrl, variationImageUrl } from '../utils/imageUrl.js'
import { useEventListener } from '../composables/useEventListener.js'

const route = useRoute()

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

// Non-reactive: just tracks whether *this page* was the one that opened the
// quick-add modal, so its "saved" callback below only refreshes races when
// closing a modal it opened itself (not one opened from somewhere else).
let quickAddOpenedHere = false

const trackImage = computed(() => track.value ? trackImageUrl(track.value.slug) : '')
const goalLapTimeMs = computed(() => goal.value ? goal.value.goal_lap_time_ms : null)
const personalBestMs = computed(() => {
  const valid = races.value.map(r => r.lap_time_ms).filter(v => v != null)
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
