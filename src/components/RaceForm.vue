<template>
  <form @submit.prevent="onSubmit" @keydown="onFormKeydown">
    <div class="grid grid-cols-2 gap-3">
      <div class="col-span-2 min-w-0 overflow-hidden">
        <label class="ov block text-brand-muted dark:text-brand-muted-dark mb-2">
          Date / time
        </label>
        <input
          v-model="form.datetime"
          type="datetime-local"
          class="w-full min-w-0 max-w-full min-h-[44px] border border-brand-border dark:border-brand-border-dark bg-brand-bg dark:bg-brand-surface-dark px-3 py-2 focus:outline-none focus:border-brand-accent dark:focus:border-brand-accent-dark"
        />
      </div>

      <div>
        <label class="ov block text-brand-muted dark:text-brand-muted-dark mb-2">
          Vehicle
        </label>
        <select
          ref="vehicleInput"
          v-model="form.vehicleId"
          class="w-full min-h-[44px] border border-brand-border dark:border-brand-border-dark bg-brand-bg dark:bg-brand-surface-dark px-3 py-2 focus:outline-none focus:border-brand-accent dark:focus:border-brand-accent-dark"
        >
          <option :value="null">— none —</option>
          <option v-for="v in vehicles" :key="v.id" :value="v.id">
            {{ v.name }}
          </option>
        </select>
      </div>

      <div>
        <label class="ov block text-brand-muted dark:text-brand-muted-dark mb-2">
          Class (PI)
        </label>
        <div class="flex gap-2">
          <div
            class="w-11 min-h-[44px] shrink-0 flex items-center justify-center font-display font-black text-white text-base"
            :style="{ backgroundColor: piColor }"
          >{{ piClass }}</div>
          <input
            :value="form.performanceIndex"
            type="text"
            inputmode="numeric"
            class="w-full min-h-[44px] border border-brand-border dark:border-brand-border-dark bg-brand-bg dark:bg-brand-surface-dark px-3 py-2 focus:outline-none focus:border-brand-accent dark:focus:border-brand-accent-dark"
            placeholder="0"
            @input="form.performanceIndex = $event.target.value.replace(/[^0-9]/g, '')"
          />
        </div>
      </div>

      <div class="col-span-2 bg-brand-surface dark:bg-brand-surface-dark px-4 py-1 space-y-1">
        <div v-for="(cfg, i) in tuningSliderConfig" :key="i">
          <div class="ov block text-brand-text dark:text-brand-text-dark mb-0 mt-3">{{ cfg.label }}</div>
          <div class="relative flex items-center">
            <div class="absolute inset-x-0 h-px bg-brand-border dark:bg-brand-border-dark" />
            <div class="relative flex justify-between w-full">
              <div
                v-for="pos in 5"
                :key="pos"
                role="button"
                tabindex="0"
                class="group flex items-center justify-center w-14 h-14 cursor-pointer"
                @click="setSlider(i, pos)"
                @keydown.enter.prevent="setSlider(i, pos)"
                @keydown.space.prevent="setSlider(i, pos)"
              >
                <span
                  class="w-5 h-5 rounded-full border-2 transition-colors pointer-events-none"
                  :class="sliders[i] === pos
                    ? 'bg-brand-text border-brand-text dark:bg-brand-text-dark dark:border-brand-text-dark'
                    : 'bg-brand-border border-brand-border dark:bg-brand-surface-dark dark:border-brand-border-dark group-hover:border-brand-secondary group-hover:bg-brand-muted dark:group-hover:border-brand-muted-dark dark:group-hover:bg-brand-secondary-dark'"
                />
              </div>
            </div>
          </div>
          <div class="flex justify-between font-body text-[11px] text-brand-muted dark:text-brand-muted-dark mt-0 px-7">
            <span class="block -translate-x-1/2">{{ cfg.left }}</span>
            <span>{{ cfg.center }}</span>
            <span class="block translate-x-1/2">{{ cfg.right }}</span>
          </div>
        </div>
      </div>

      <div>
        <label class="ov block text-brand-muted dark:text-brand-muted-dark mb-2">
          Tuning
        </label>
        <input
          v-model.number="form.tuning"
          type="number"
          min="0"
          inputmode="numeric"
          class="w-full min-h-[44px] border border-brand-border dark:border-brand-border-dark bg-brand-bg dark:bg-brand-surface-dark px-3 py-2 focus:outline-none focus:border-brand-accent dark:focus:border-brand-accent-dark"
        />
      </div>
      
      <div>
        <label class="ov block text-brand-muted dark:text-brand-muted-dark mb-2">
          Place
        </label>
        <input
          :value="form.place"
          type="text"
          inputmode="numeric"
          class="w-full min-h-[44px] border border-brand-border dark:border-brand-border-dark bg-brand-bg dark:bg-brand-surface-dark px-3 py-2 focus:outline-none focus:border-brand-accent dark:focus:border-brand-accent-dark"
          placeholder="1"
          @input="form.place = $event.target.value.replace(/[^0-9]/g, '')"
        />
      </div>

      <div>
        <label class="ov block text-brand-muted dark:text-brand-muted-dark mb-2">
          Lap time<template v-if="goalLapTimeMs"> (🎯 {{ formatMsToTime(goalLapTimeMs) }})</template>
        </label>
        <LapTimeInput v-model="form.lapTimeMs" />
      </div>

      <div>
        <label class="ov block text-brand-muted dark:text-brand-muted-dark mb-2">
          Total time (optional)
        </label>
        <LapTimeInput v-model="form.totalTimeMs" />
      </div>

      <div class="col-span-2">
        <label class="ov block text-brand-muted dark:text-brand-muted-dark mb-2">
          Notes (Ctrl+Enter to save)
        </label>
        <textarea
          ref="notesInput"
          v-model="form.notes"
          rows="2"
          class="w-full min-h-[44px] border border-brand-border dark:border-brand-border-dark bg-brand-bg dark:bg-brand-surface-dark px-3 py-2 focus:outline-none focus:border-brand-accent dark:focus:border-brand-accent-dark resize-none"
          @input="autoExpand"
        />
      </div>

    </div>

    <p v-if="errorMessage" class="mt-3 text-sm text-brand-accent dark:text-brand-accent-dark">{{ errorMessage }}</p>

    <div class="mt-4 flex items-center justify-between gap-3">
      <button
        type="button"
        class="ov min-h-[44px] flex items-center text-brand-muted dark:text-brand-muted-dark hover:text-brand-text dark:hover:text-brand-text-dark"
        @click="$emit('cancel')"
      >
        Cancel (Esc)
      </button>
      <div class="flex items-center gap-2">
        <button
          type="submit"
          :disabled="saving"
          class="ov min-h-[44px] px-7 flex items-center bg-brand-accent dark:bg-brand-accent-dark text-white hover:opacity-85 disabled:opacity-60"
        >
          {{ saving ? 'Saving...' : 'Save (Enter)' }}
        </button>
      </div>
    </div>
  </form>
</template>

<script setup>
import { reactive, ref, computed, watch, nextTick, onMounted } from 'vue'
import LapTimeInput from './LapTimeInput.vue'
import { formatMsToTime } from '../utils/timeFormat.js'
import { piInfo } from '../utils/piInfo.js'
import { useEventListener } from '../composables/useEventListener.js'

const tuningSliderConfig = [
  { label: 'Suspension',    left: 'SOFT',  center: 'STANDARD', right: 'STIFF'  },
  { label: 'Gear Ratio',    left: 'SHORT', center: 'STANDARD', right: 'LONG'   },
  { label: 'Differential',  left: 'OPEN',  center: 'LIMITED',  right: 'LOCKED' },
  { label: 'Brake Balance', left: 'REAR',  center: 'MIDDLE',   right: 'FRONT'  },
]

function parseSliders(tuning) {
  if (tuning == null) return [1, 1, 1, 1]
  const s = String(Math.round(tuning))
  if (s.length !== 4) return [1, 1, 1, 1]
  const digits = s.split('').map(d => parseInt(d))
  if (digits.some(n => n < 1 || n > 5)) return [1, 1, 1, 1]
  return digits
}

function slidersToTuning(sliders) {
  return sliders[0] * 1000 + sliders[1] * 100 + sliders[2] * 10 + sliders[3]
}

function nowLocalIsoMinute() {
  const d = new Date()
  d.setSeconds(0, 0)
  const tzOffset = d.getTimezoneOffset() * 60_000
  return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16)
}

function emptyForm() {
  return {
    datetime: nowLocalIsoMinute(),
    vehicleId: null,
    tuning: null,
    place: '',
    lapTimeMs: null,
    totalTimeMs: null,
    performanceIndex: '0',
    notes: ''
  }
}

const props = defineProps({
  vehicles: { type: Array, required: true },
  vehiclePiMap: { type: Object, default: () => ({}) },
  defaults: { type: Object, default: () => ({}) },
  goalLapTimeMs: { type: Number, default: null },
  saving: { type: Boolean, default: false },
  autofocus: { type: Boolean, default: true }
})

const emit = defineEmits(['submit', 'cancel'])

const form = reactive({ ...emptyForm(), ...props.defaults })
const errorMessage = ref('')
const sliders = ref(parseSliders(props.defaults.tuning))

const vehicleInput = ref(null)
const notesInput = ref(null)

const piClass = computed(() => piInfo(form.performanceIndex).cls)
const piColor = computed(() => piInfo(form.performanceIndex).color)

watch(() => form.tuning, (val) => {
  if (val !== slidersToTuning(sliders.value)) {
    const parsed = parseSliders(val)
    parsed.forEach((v, i) => sliders.value.splice(i, 1, v))
  }
})

watch(() => form.vehicleId, (vehicleId) => {
  if (!vehicleId) return
  const pi = props.vehiclePiMap[vehicleId]
  if (pi != null) form.performanceIndex = String(pi)
}, { immediate: true })

function setSlider(i, pos) {
  sliders.value.splice(i, 1, pos)
  form.tuning = slidersToTuning(sliders.value)
}

function onFormKeydown(event) {
  // Enter submits form unless we're inside the textarea (use Ctrl+Enter
  // there). This matches the spec's "fast input" rule.
  if (event.key === 'Enter') {
    const inTextarea = event.target && event.target.tagName === 'TEXTAREA'
    if (inTextarea && !event.ctrlKey && !event.metaKey) return
    event.preventDefault()
    onSubmit()
  }
}

function autoExpand() {
  const el = notesInput.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = `${Math.min(el.scrollHeight, 200)}px`
}

function onSubmit() {
  errorMessage.value = ''
  const pi = parseInt(form.performanceIndex, 10)
  const payload = {
    datetime: new Date(form.datetime).toISOString(),
    vehicle_id: form.vehicleId || null,
    tuning: form.tuning ?? null,
    place: form.place || null,
    lap_time_ms: form.lapTimeMs,
    total_time_ms: form.totalTimeMs,
    performance_index: isNaN(pi) ? null : pi,
    notes: form.notes || null
  }
  emit('submit', payload)
}

// Escape is bound at the document level rather than on the form, because
// when editing an existing race (autofocus: false) nothing has focus when
// the form mounts — the "Edit" button that had it is gone — so a keydown
// on the form itself would never see the first Escape press.
useEventListener(document, 'keydown', (event) => {
  if (event.key === 'Escape') {
    event.preventDefault()
    emit('cancel')
  }
})

onMounted(() => {
  if (props.autofocus) {
    nextTick(() => vehicleInput.value && vehicleInput.value.focus())
  }
  autoExpand()
})
</script>
