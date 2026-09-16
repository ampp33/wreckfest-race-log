<template>
  <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
    <div class="bg-brand-surface dark:bg-brand-surface-dark rounded border border-brand-border dark:border-brand-border-dark p-4">
      <div class="font-body font-medium uppercase tracking-widest text-[11px] text-brand-muted dark:text-brand-muted-dark">Most used vehicle</div>
      <div class="mt-1 font-display font-black tracking-tight text-2xl text-brand-text dark:text-brand-text-dark">
        {{ stats.mostUsedVehicle ? stats.mostUsedVehicle.name : '—' }}
      </div>
      <div v-if="stats.mostUsedVehicle" class="font-body text-[15px] text-brand-muted dark:text-brand-muted-dark">
        {{ stats.mostUsedVehicle.count }} races
      </div>
    </div>

    <div class="bg-brand-surface dark:bg-brand-surface-dark rounded border border-brand-border dark:border-brand-border-dark p-4">
      <div class="font-body font-medium uppercase tracking-widest text-[11px] text-brand-muted dark:text-brand-muted-dark">Most raced variation</div>
      <router-link
        v-if="stats.mostRacedVariation"
        :to="`/track/${stats.mostRacedVariation.trackSlug}/${stats.mostRacedVariation.variationSlug}`"
        class="block mt-1 font-display font-black tracking-tight text-2xl text-brand-accent hover:underline"
      >
        {{ stats.mostRacedVariation.trackName }}
        <span class="font-body font-normal text-base text-brand-muted dark:text-brand-muted-dark">
          — {{ stats.mostRacedVariation.variationName }}
        </span>
      </router-link>
      <div v-else class="mt-1 font-display font-black tracking-tight text-2xl text-brand-text dark:text-brand-text-dark">—</div>
      <div v-if="stats.mostRacedVariation" class="font-body text-[15px] text-brand-muted dark:text-brand-muted-dark">
        {{ stats.mostRacedVariation.count }} races
      </div>
    </div>

    <div class="bg-brand-surface dark:bg-brand-surface-dark rounded border border-brand-border dark:border-brand-border-dark p-4">
      <div class="font-body font-medium uppercase tracking-widest text-[11px] text-brand-muted dark:text-brand-muted-dark">Total races</div>
      <div class="mt-1 font-display font-black tracking-tight text-2xl text-brand-text dark:text-brand-text-dark">{{ stats.totalRaces }}</div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'StatsSummaryTiles',
  props: {
    // { mostUsedVehicle, mostRacedVariation, totalRaces } — the first two
    // may be null (StatsPage.vue's real, possibly-empty account data);
    // HomeStatsPreview.vue's demo data always has them populated.
    stats: { type: Object, required: true }
  }
}
</script>
