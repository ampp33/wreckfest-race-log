<template>
  <!-- A segmented control whose highlight slides between stops, tinted with
       the selected class's color (the same colors PerformanceIndexBadge uses).
       Arrow keys move along it, like a native radio group. -->
  <div
    class="relative inline-flex border border-brand-border dark:border-brand-border-dark p-1"
    role="radiogroup"
    :aria-label="label"
    @keydown.left.prevent="step(-1)"
    @keydown.right.prevent="step(1)"
  >
    <span
      aria-hidden="true"
      class="absolute top-1 bottom-1 left-1 w-16 transition-[transform,background-color] duration-300 ease-out"
      :style="{ transform: `translateX(${selectedIndex * 100}%)`, backgroundColor: selectedColor }"
    ></span>
    <button
      v-for="option in options"
      :key="option.label"
      type="button"
      role="radio"
      :aria-checked="option.value === modelValue"
      :tabindex="option.value === modelValue ? 0 : -1"
      class="relative z-10 w-16 min-h-[44px] font-display font-black text-[15px] tracking-tight transition-colors duration-300"
      :class="option.value !== modelValue
        ? 'text-brand-muted dark:text-brand-muted-dark hover:text-brand-text dark:hover:text-brand-text-dark'
        : 'text-white'"
      :style="option.value !== modelValue ? { color: classLetterColor(option.value) } : undefined"
      @click="select(option.value)"
    >{{ option.label }}</button>
  </div>
</template>

<script>
import { classLetterColor } from '../utils/piInfo.js'

export default {
  name: 'PiClassSlider',
  props: {
    // 'D' / 'C' / 'B' / 'A'.
    modelValue: { type: String, default: 'C' },
    label: { type: String, default: 'Class' }
  },
  emits: ['update:modelValue'],
  data() {
    return {
      // Slowest to fastest, the way the game orders them.
      options: [
        { label: 'D', value: 'D' },
        { label: 'C', value: 'C' },
        { label: 'B', value: 'B' },
        { label: 'A', value: 'A' }
      ]
    }
  },
  computed: {
    selectedIndex() {
      return Math.max(0, this.options.findIndex(o => o.value === this.modelValue))
    },
    selectedColor() {
      return classLetterColor(this.modelValue)
    }
  },
  methods: {
    classLetterColor,
    select(value) {
      this.$emit('update:modelValue', value)
    },
    step(delta) {
      const next = this.options[this.selectedIndex + delta]
      if (!next) return
      this.select(next.value)
      this.$nextTick(() => this.$el.querySelector('[aria-checked="true"]')?.focus())
    }
  }
}
</script>
