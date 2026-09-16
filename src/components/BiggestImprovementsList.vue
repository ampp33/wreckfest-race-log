<template>
  <div class="bg-brand-surface dark:bg-brand-surface-dark rounded border border-brand-border dark:border-brand-border-dark p-4">
    <h2 class="font-heading font-normal tracking-normal leading-none text-display-sm text-brand-text dark:text-brand-text-dark mb-3">
      Biggest <em class="signal">improvements</em> (oldest -> newest lap)
    </h2>
    <p v-if="!items.length && emptyMessage" class="font-body text-[15px] text-brand-muted dark:text-brand-muted-dark">
      {{ emptyMessage }}
    </p>
    <div v-else class="relative" :style="fadeHeight ? { maxHeight: fadeHeight + 'px', overflow: 'hidden' } : null">
      <ul class="space-y-2 text-sm">
        <li
          v-for="(row, i) in items"
          :key="row.variationSlug + row.trackSlug"
          :data-fade-item="i"
          class="flex items-center justify-between"
        >
          <router-link :to="`/track/${row.trackSlug}/${row.variationSlug}`" class="text-brand-accent hover:underline font-body">
            {{ row.trackName }} — {{ row.variationName }}
          </router-link>
          <span class="font-mono text-green-600">-{{ formatMsToTime(row.deltaMs) }}</span>
        </li>
      </ul>
      <div
        v-if="fadeHeight"
        aria-hidden="true"
        class="absolute bottom-0 left-0 right-0 pointer-events-none bg-gradient-to-b from-transparent to-brand-surface dark:to-brand-surface-dark"
        :style="{ height: gradientHeight + 'px' }"
      ></div>
    </div>
  </div>
</template>

<script>
import { formatMsToTime } from '../utils/timeFormat.js'

export default {
  name: 'BiggestImprovementsList',
  props: {
    items: { type: Array, default: () => [] },
    // Shown instead of the list when items is empty; leave '' to render an
    // empty list with no message (not currently used by any caller).
    emptyMessage: { type: String, default: '' },
    // Optional clip-and-fade, measured by the parent against this list's own
    // `data-fade-item="N"` rows (see the useMeasuredFade composable) — null
    // renders the plain, unclipped list.
    fadeHeight: { type: Number, default: null },
    gradientHeight: { type: Number, default: null }
  },
  methods: { formatMsToTime }
}
</script>
