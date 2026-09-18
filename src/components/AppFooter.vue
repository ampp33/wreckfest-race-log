<template>
  <!-- Net-new. The page ends on a black slab in both themes, with the wordmark
       set huge and cropped by the bottom edge — the one place the grid is
       deliberately ignored. -->
  <footer class="relative mt-12 overflow-hidden bg-brand-slab text-[#F5F4F0] border-t-2 border-brand-accent dark:border-brand-accent-dark">
    <div class="max-w-7xl mx-auto px-6 sm:px-10 py-4">
      <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-x-8 gap-y-3">
        <div v-for="col in columns" :key="col.title">
          <div class="ov text-brand-accent-dark mb-1">{{ col.title }}</div>
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
                class="flex min-h-[24px] items-center gap-1.5 text-[13px] text-white/70 hover:text-white"
                :class="{ 'cursor-pointer': link.to || link.href }"
              ><span v-if="link.icon" class="inline-block w-[13px] h-[13px] shrink-0" v-html="link.icon"></span>{{ link.label }}</component>
              <button
                v-else-if="link.action === 'export'"
                type="button"
                class="flex min-h-[24px] items-center text-[13px] text-white/70 hover:text-white cursor-pointer"
                @click="exportJson"
              >{{ link.label }}</button>
              <label
                v-else-if="link.action === 'import'"
                class="flex min-h-[24px] items-center text-[13px] text-white/70 hover:text-white cursor-pointer"
              >{{ link.label }}
                <input type="file" accept="application/json" class="hidden" @change="importJson" />
              </label>
            </template>
          </div>
        </div>
      </div>

      <div class="flex flex-col sm:flex-row justify-between sm:items-end gap-3 mt-3">
        <div class="max-w-md">
          <p class="text-[11px] leading-relaxed text-white/55 m-0">
            A personal timing archive for Wreckfest. Not affiliated with Bugbear Entertainment or
            THQ Nordic — track names, layouts and vehicle names are theirs. Your log is yours:
            export it whole, any time.
          </p>
          <div class="flex items-center gap-3 mt-2">
            <span class="ov text-white/40">Powered by</span>
            <a
              href="https://supabase.com"
              target="_blank"
              rel="noopener noreferrer"
              class="text-white/45 hover:text-white transition-colors"
              aria-label="Supabase"
            >
              <span class="inline-block w-[15px] h-[15px]" v-html="supabaseIcon"></span>
            </a>
            <a
              href="https://github.com/ampp33/wreckfest-race-log"
              target="_blank"
              rel="noopener noreferrer"
              class="text-white/45 hover:text-white transition-colors"
              aria-label="GitHub"
            >
              <span class="inline-block w-[15px] h-[15px]" v-html="githubIcon"></span>
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
import supabaseIcon from '../assets/icons/supabase.svg?raw'
import githubIcon from '../assets/icons/github.svg?raw'
import emailIcon from '../assets/icons/email.svg?raw'
import discordIcon from '../assets/icons/discord.svg?raw'

export default {
  name: 'AppFooter',
  props: {
    // e.g. "247 races · 38 tracks · 89 podiums" — omitted when not yet loaded
    totals: { type: String, default: '' }
  },
  data() {
    return {
      supabaseIcon,
      githubIcon,
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
        { title: 'Telemetry Plugin', links: [
          { label: 'Setup guide', to: '/plugin' }
        ] },
        { title: 'Contact Us', links: [
          { label: 'Email', href: 'mailto:ampp33@gmail.com', icon: emailIcon },
          { label: 'Discord', href: 'https://discordapp.com/channels/@me/431110818302656530/', icon: discordIcon }
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
