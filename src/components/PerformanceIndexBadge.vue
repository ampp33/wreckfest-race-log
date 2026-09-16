<template>
  <template v-if="value != null">
    <span class="font-extrabold" :style="{ color: piInfo(value).color }">{{ piInfo(value).cls }}</span>
    <span class="ml-1 tabular text-brand-muted dark:text-brand-muted-dark">{{ value }}</span>
  </template>
  <span v-else class="text-brand-muted dark:text-brand-muted-dark">—</span>
</template>

<script>
import { piInfo } from '../utils/piInfo.js'

export default {
  name: 'PerformanceIndexBadge',
  props: {
    value: { type: [Number, String], default: null }
  },
  methods: {
    piInfo
  }
}
</script>
