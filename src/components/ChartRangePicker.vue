<template>
  <div class="flex gap-1">
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      class="px-2.5 py-1 text-xs rounded font-medium transition-colors"
      :class="modelValue === option.value
        ? 'bg-brand-accent text-white'
        : 'text-brand-muted dark:text-brand-muted-dark hover:text-brand-text dark:hover:text-brand-text-dark'"
      @click="$emit('update:modelValue', option.value)"
    >{{ option.label }}</button>
  </div>
</template>

<script>
export default {
  name: 'ChartRangePicker',
  props: {
    modelValue: { type: String, required: true }
  },
  emits: ['update:modelValue'],
  data() {
    return {
      options: [
        { value: '1d', label: '1D' },
        { value: '7d', label: '1W' },
        { value: '30d', label: '1M' },
        { value: '90d', label: '3M' },
        { value: '1y', label: '1Y' },
        { value: 'all', label: 'All' }
      ]
    }
  }
}
</script>
