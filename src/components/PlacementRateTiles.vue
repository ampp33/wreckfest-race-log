<template>
  <div class="grid grid-cols-3 gap-6">
    <div v-for="(rate, place) in rates" :key="place" class="rule-top pt-3">
      <div class="ov text-brand-muted dark:text-brand-muted-dark">Top {{ place }} finishes</div>
      <div class="font-display font-black tracking-tightest text-display-sm tabular text-brand-text dark:text-brand-text-dark mt-2">{{ rate.pct }}</div>
      <div class="text-xs tabular text-brand-muted dark:text-brand-muted-dark mt-1">{{ rate.count }} / {{ rate.total }}</div>
    </div>
  </div>
</template>

<script>
// Top 3/5/10 finish rates, as placementRate() (src/utils/stats.js) computes them.
export default {
  name: 'PlacementRateTiles',
  props: {
    // { 3: rate, 5: rate, 10: rate } — integer keys iterate in ascending order.
    rates: { type: Object, required: true }
  }
}
</script>
