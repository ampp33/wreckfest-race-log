<template>
  <!-- Net-new. The page ends on a black slab in both themes, with the wordmark
       set huge and cropped by the bottom edge — the one place the grid is
       deliberately ignored. -->
  <footer class="relative mt-24 overflow-hidden bg-brand-slab text-[#F5F4F0] border-t-2 border-brand-accent dark:border-brand-accent-dark">
    <div class="max-w-6xl mx-auto px-6 pt-10">
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-8">
        <div v-for="col in columns" :key="col.title">
          <div class="ov text-brand-accent-dark mb-3">{{ col.title }}</div>
          <div class="flex flex-col">
            <component
              :is="link.to ? 'router-link' : (link.href ? 'a' : 'span')"
              v-for="link in col.links"
              :key="link.label"
              :to="link.to"
              :href="link.href"
              :target="link.href ? '_blank' : undefined"
              :rel="link.href ? 'noopener noreferrer' : undefined"
              class="flex min-h-[44px] items-center text-[13px] text-white/70 hover:text-white"
            >{{ link.label }}</component>
          </div>
        </div>
      </div>

      <div class="flex flex-col sm:flex-row justify-between sm:items-end gap-4 mt-10">
        <p class="text-[11px] leading-relaxed text-white/55 max-w-md m-0">
          A personal timing archive for Wreckfest. Not affiliated with Bugbear Entertainment or
          THQ Nordic — track names, layouts and vehicle names are theirs. Your log is yours:
          export it whole, any time.
        </p>
        <div v-if="totals" class="ov tabular text-brand-accent-dark whitespace-nowrap sm:text-right">
          {{ totals }}
        </div>
      </div>
    </div>

    <div
      aria-hidden="true"
      class="font-display font-black tracking-tightest leading-[0.86] text-brand-accent-dark whitespace-nowrap select-none
             text-[19vw] mt-4 -mb-[3.4vw] pl-4"
    >WRECKFEST</div>
  </footer>
</template>

<script>
export default {
  name: 'AppFooter',
  props: {
    // e.g. "247 races · 38 tracks · 89 podiums" — omitted when not yet loaded
    totals: { type: String, default: '' }
  },
  data() {
    return {
      columns: [
        { title: 'Log', links: [
          { label: 'Tracks', to: '/tracks' },
          { label: 'Races', to: '/races' },
          { label: 'Stats', to: '/stats' }
        ] },
        { title: 'Keyboard', links: [
          { label: 'Q — quick add a race' },
          { label: 'T — search tracks' }
        ] },
        { title: 'Your data', links: [
          { label: 'API keys', to: '/settings/api-keys' },
          { label: 'Export JSON' },
          { label: 'Import JSON' }
        ] },
        { title: 'Auto-logging', links: [
          { label: 'Setup guide', to: '/telemetry' },
          { label: 'Tool on GitHub', href: 'https://github.com/ampp33/wreckfest-telemetry' }
        ] }
      ]
    }
  }
}
</script>
