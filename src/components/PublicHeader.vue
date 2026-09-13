<template>
  <!-- The minimal header shown on public pages (home, plugin) to a visitor
       who isn't signed in — App.vue's NavBar only mounts once authenticated. -->
  <header v-if="!auth.isAuthenticated" class="border-b border-brand-border dark:border-brand-border-dark">
    <div class="max-w-7xl mx-auto px-6 min-h-[72px] sm:min-h-[88px] py-3 flex items-center justify-between gap-4">
      <span class="flex items-baseline gap-2.5">
        <span class="font-display font-black tracking-tightest leading-none text-[26px] text-brand-text dark:text-brand-text-dark">WRECKFEST</span>
        <span class="ov-lg hidden sm:inline whitespace-nowrap text-brand-accent dark:text-brand-accent-dark" style="font-size: 16px">RACE LOG</span>
      </span>
      <div class="flex items-center gap-2">
        <router-link
          to="/plugin"
          class="ov min-h-[44px] px-4 hidden sm:inline-flex items-center whitespace-nowrap text-brand-muted dark:text-brand-muted-dark hover:text-brand-accent dark:hover:text-brand-accent-dark"
        >Install Telemetry</router-link>
        <button
          type="button"
          class="ov min-h-[44px] px-4 border border-brand-border dark:border-brand-border-dark text-brand-text dark:text-brand-text-dark hover:border-brand-accent dark:hover:border-brand-accent-dark"
          @click="onToggleDark"
          :aria-label="prefs.darkMode ? 'Switch to light mode' : 'Switch to dark mode'"
        >{{ prefs.darkMode ? 'Light' : 'Dark' }}</button>
        <router-link
          to="/login"
          class="ov min-h-[44px] px-5 flex items-center whitespace-nowrap bg-brand-accent dark:bg-brand-accent-dark text-white hover:opacity-85"
        >Sign in</router-link>
      </div>
    </div>
  </header>
</template>

<script>
import { authStore } from '../stores/authStore.js'
import { prefsStore } from '../stores/prefsStore.js'

export default {
  name: 'PublicHeader',
  data() {
    return {
      auth: authStore,
      prefs: prefsStore
    }
  },
  methods: {
    onToggleDark() {
      this.prefs.darkMode = !this.prefs.darkMode
    }
  }
}
</script>
