<template>
  <!-- Net-new. The page ends on a black slab in both themes, with the wordmark
       set huge and cropped by the bottom edge — the one place the grid is
       deliberately ignored. -->
  <footer class="relative mt-24 overflow-hidden bg-brand-slab text-[#F5F4F0] border-t-2 border-brand-accent dark:border-brand-accent-dark">
    <div class="max-w-7xl mx-auto sm:px-10 p-8">
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-8">
        <div v-for="col in columns" :key="col.title">
          <div class="ov text-brand-accent-dark mb-3">{{ col.title }}</div>
          <div class="flex flex-col">
            <!-- Three shapes here, picked per link: a real link (router-link
                 or <a>) for navigation, a <button> for an in-place action
                 (Export — no navigation, just triggers a download), and a
                 <label> wrapping a hidden file input for Import (a file
                 picker can only be opened from a real user gesture on a
                 form control, so this has to be a label+input, not a click
                 handler that calls .click() itself). The plain <span> case
                 stays for the two keyboard-shortcut hints below, which
                 aren't clickable at all — cursor-pointer is added to the
                 other three, but deliberately left off those, since they
                 don't do anything when clicked and shouldn't look like
                 they do. The v-for has to sit on the <template> wrapper
                 rather than each branch individually — v-if/else-if/else
                 only chain across sibling *elements*, so each branch would
                 otherwise need its own identical v-for (and `link` wouldn't
                 exist yet for Vue to even evaluate their v-if conditions
                 against). -->
            <template v-for="link in col.links" :key="link.label">
              <component
                v-if="!link.action"
                :is="link.to ? 'router-link' : (link.href ? 'a' : 'span')"
                :to="link.to"
                :href="link.href"
                :target="link.href ? '_blank' : undefined"
                :rel="link.href ? 'noopener noreferrer' : undefined"
                class="flex min-h-[44px] items-center text-[13px] text-white/70 hover:text-white"
                :class="{ 'cursor-pointer': link.to || link.href }"
              >{{ link.label }}</component>
              <button
                v-else-if="link.action === 'export'"
                type="button"
                class="flex min-h-[44px] items-center text-[13px] text-white/70 hover:text-white cursor-pointer"
                @click="exportJson"
              >{{ link.label }}</button>
              <label
                v-else-if="link.action === 'import'"
                class="flex min-h-[44px] items-center text-[13px] text-white/70 hover:text-white cursor-pointer"
              >{{ link.label }}
                <input type="file" accept="application/json" class="hidden" @change="importJson" />
              </label>
            </template>
          </div>
        </div>
      </div>

      <div class="flex flex-col sm:flex-row justify-between sm:items-end gap-4 mt-8">
        <div class="max-w-md">
          <p class="text-[11px] leading-relaxed text-white/55 m-0">
            A personal timing archive for Wreckfest. Not affiliated with Bugbear Entertainment or
            THQ Nordic — track names, layouts and vehicle names are theirs. Your log is yours:
            export it whole, any time.
          </p>
          <div class="flex items-center gap-3 mt-3.5">
            <span class="ov text-white/40">Powered by</span>
            <a
              href="https://supabase.com"
              target="_blank"
              rel="noopener noreferrer"
              class="text-white/45 hover:text-white transition-colors"
              aria-label="Supabase"
            >
              <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><path d="M11.9 1.036c-.015-.986-1.26-1.41-1.874-.637L.764 12.05C-.33 13.427.65 15.455 2.409 15.455h9.579l.113 7.51c.014.985 1.259 1.408 1.873.636l9.262-11.653c1.093-1.375.113-3.403-1.645-3.403h-9.642z"/></svg>
            </a>
            <a
              href="https://github.com/ampp33/wreckfest-race-log"
              target="_blank"
              rel="noopener noreferrer"
              class="text-white/45 hover:text-white transition-colors"
              aria-label="GitHub"
            >
              <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
            </a>
          </div>
        </div>
        <div v-if="totals" class="ov tabular text-brand-accent-dark whitespace-nowrap sm:text-right">
          {{ totals }}
        </div>
      </div>
    </div>
  </footer>
</template>

<script>
// Export/Import here duplicate TrackListPage.vue's own onExport/onImport
// almost verbatim (same downloadJson/readJsonFile utils, same race-field
// whitelist, same toasts) — the footer versions exist so the actions are
// reachable from anywhere on the site, not just the Tracks page, matching
// the footer's own promise a few lines down ("Your log is yours: export it
// whole, any time"), which nothing here actually backed until now: these
// two links previously had no `to`/`href` at all, so they always rendered
// as inert, unclickable <span>s.
import { getAllRaces, bulkInsertRaces } from '../services/raceService.js'
import { authStore } from '../stores/authStore.js'
import { downloadJson, readJsonFile } from '../utils/exportImport.js'
import { pushToast } from '../stores/toastStore.js'

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
          { label: 'Export JSON', action: 'export' },
          { label: 'Import JSON', action: 'import' }
        ] },
        { title: 'Auto-logging', links: [
          { label: 'Setup guide', to: '/plugin' }
        ] }
      ]
    }
  },
  methods: {
    async exportJson() {
      try {
        const races = await getAllRaces()
        downloadJson(`wreckfest-races-${Date.now()}.json`, { races })
        pushToast('Exported races', 'success')
      } catch (err) {
        pushToast(err.message || 'Export failed', 'error')
      }
    },
    async importJson(event) {
      const file = event.target.files && event.target.files[0]
      if (!file) return
      try {
        const parsed = await readJsonFile(file)
        const races = parsed && Array.isArray(parsed.races) ? parsed.races : null
        if (!races || !races.length) {
          pushToast('No races found in file', 'error')
          return
        }
        const userId = authStore.user && authStore.user.id
        const cleaned = races.map(r => ({
          datetime: r.datetime,
          track_variation_id: r.track_variation_id,
          vehicle_id: r.vehicle_id || null,
          tuning: r.tuning ?? null,
          place: r.place || null,
          lap_time_ms: r.lap_time_ms ?? null,
          total_time_ms: r.total_time_ms ?? null,
          notes: r.notes || null
        }))
        await bulkInsertRaces(cleaned, userId)
        pushToast(`Imported ${cleaned.length} races`, 'success')
      } catch (err) {
        pushToast(err.message || 'Import failed', 'error')
      } finally {
        event.target.value = ''
      }
    }
  }
}
</script>
