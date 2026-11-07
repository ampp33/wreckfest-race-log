<template>
  <!-- Net-new. The page ends on a black slab in both themes, with the wordmark
       set huge and cropped by the bottom edge — the one place the grid is
       deliberately ignored. -->
  <footer class="relative mt-12 overflow-hidden bg-brand-slab text-[#F5F4F0] border-t-2 border-brand-accent dark:border-brand-accent-dark">
    <div class="max-w-7xl mx-auto px-4 sm:px-10 py-4">
      <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-x-8 gap-y-3">
        <div v-for="col in columns" :key="col.title">
          <div class="ov text-brand-accent-dark mb-1">{{ col.title }}</div>
          <div class="flex flex-col">
            <!-- A link navigates, Export is a button, Import a label around a
                 hidden file input (a file picker only opens from a real
                 gesture on a form control), and the shortcut hints are
                 plain, unclickable spans. -->
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
                @click="onExport"
              >{{ link.label }}</button>
              <label
                v-else-if="link.action === 'import'"
                class="flex min-h-[24px] items-center text-[13px] text-white/70 hover:text-white cursor-pointer"
              >{{ link.label }}
                <input type="file" accept="application/json" class="hidden" @change="importRaces($event, auth.user && auth.user.id)" />
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
      </div>
    </div>
  </footer>
</template>

<script>
// Export/Import here are the Tracks page's, reachable from anywhere — the
// footer's promise: "Your log is yours: export it whole, any time".
import { authStore, pushToast } from '../stores.js'
import { exportRaces, importRaces } from '../utils/exportImport.js'
import supabaseIcon from '../assets/icons/supabase.svg?raw'
import githubIcon from '../assets/icons/github.svg?raw'
import emailIcon from '../assets/icons/email.svg?raw'
import discordIcon from '../assets/icons/discord.svg?raw'

export default {
  name: 'AppFooter',
  data() {
    return {
      auth: authStore,
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
          { label: 'T — search tracks' },
          { label: 'P — prep for a race' }
        ] },
        { title: 'Your data', links: [
          { label: 'Profile', to: '/settings/profile' },
          { label: 'API keys', to: '/settings/api-keys' },
          { label: 'Export JSON', action: 'export' },
          { label: 'Import JSON', action: 'import' }
        ] },
        { title: 'Telemetry Plugin', links: [
          { label: 'Setup guide', to: '/plugin' }
        ] },
        { title: 'Contact Us', links: [
          { label: 'Email', href: 'mailto:ampp33@gmail.com', icon: emailIcon },
          { label: 'Discord', href: 'https://discord.gg/j7c4JCtxVs', icon: discordIcon }
        ] }
      ]
    }
  },
  methods: {
    importRaces,
    onExport() {
      if (!authStore.user) pushToast('Sign in to export your races', 'error')
      else exportRaces(authStore.user.id)
    }
  }
}
</script>
