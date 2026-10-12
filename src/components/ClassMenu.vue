<template>
  <!-- "Car class" — the class filter's list: every class, or one of D–A.
       The same dark list renders as the desktop dropdown and the mobile
       drop-down. -->
  <div class="text-brand-text-dark">
    <div class="ov pt-3 pb-2 text-brand-muted-dark">Car class</div>
    <button
      v-for="row in rows"
      :key="row.key"
      type="button"
      class="w-full min-h-[48px] px-2 -mx-2 flex items-center gap-3 text-left text-[15px] hover:bg-brand-border-dark"
      :class="row.value === current ? 'font-bold' : 'font-medium'"
      :aria-pressed="row.value === current"
      @click="$emit('pick', row.value)"
    >
      <span class="w-8 h-8 shrink-0 flex items-center justify-center text-[15px] bg-brand-border-dark" :style="badgeStyle(row.value)">
        <ClassIcon :cls="row.value" />
      </span>
      <span class="flex-1 min-w-0 truncate">{{ row.label }}</span>
      <span class="text-[12px] tabular text-brand-muted-dark">{{ row.detail }}</span>
      <span class="w-4 text-center font-black text-brand-accent-dark">{{ row.value === current ? '✓' : '' }}</span>
    </button>
  </div>
</template>

<script>
import ClassIcon from './ClassIcon.vue'
import { CLASS_LETTERS, classLetterColor, classRangeLabel } from '../utils/piInfo.js'

export default {
  name: 'ClassMenu',
  components: { ClassIcon },
  props: {
    // The class being shown now ('A'..'D'), or null for all, to tick.
    current: { type: String, default: null }
  },
  emits: ['pick'],
  computed: {
    rows() {
      return [
        { key: 'all', value: null, label: 'All classes', detail: '' },
        ...CLASS_LETTERS.map(letter => ({ key: letter, value: letter, label: `Class ${letter}`, detail: classRangeLabel(letter) }))
      ]
    }
  },
  methods: {
    badgeStyle(value) {
      return value ? { backgroundColor: classLetterColor(value), color: '#fff' } : undefined
    }
  }
}
</script>
