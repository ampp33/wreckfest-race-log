<template>
  <!-- The minimal header shown on public pages (home, plugin) to a visitor
       who isn't signed in — App.vue's NavBar only mounts once authenticated. -->
  <header v-if="!auth.isAuthenticated" class="border-b border-brand-border dark:border-brand-border-dark">
    <div class="max-w-7xl mx-auto px-6 min-h-[72px] sm:min-h-[88px] py-3 flex items-center justify-between gap-4">
      <span class="flex items-baseline gap-2.5">
        <span class="font-display font-black tracking-tightest leading-none text-[26px] text-brand-text dark:text-brand-text-dark">WRECKFEST</span>
        <span class="ov-lg whitespace-nowrap text-brand-accent dark:text-brand-accent-dark" style="font-size: 16px">RACE LOG</span>
      </span>
      <div class="flex items-center gap-2">
        <router-link
          to="/plugin"
          class="ov min-h-[44px] px-4 hidden sm:inline-flex items-center whitespace-nowrap text-brand-muted dark:text-brand-muted-dark hover:text-brand-accent dark:hover:text-brand-accent-dark"
        >Install Telemetry</router-link>
        <!-- Below sm, "RACE LOG" above needs the width these two controls
             used to take up as text, so they shrink to icon-only (same
             44px touch target, just no label) — sm+ is unchanged. -->
        <button
          type="button"
          class="ov min-h-[44px] min-w-[44px] px-2.5 sm:px-4 flex items-center justify-center border border-brand-border dark:border-brand-border-dark text-brand-text dark:text-brand-text-dark hover:border-brand-accent dark:hover:border-brand-accent-dark"
          @click="onToggleDark"
          :aria-label="prefs.darkMode ? 'Switch to light mode' : 'Switch to dark mode'"
        >
          <span class="w-4 h-4 inline-block sm:hidden" v-html="prefs.darkMode ? sunIcon : moonIcon"></span>
          <span class="hidden sm:inline">{{ prefs.darkMode ? 'Light' : 'Dark' }}</span>
        </button>
        <router-link
          to="/login"
          class="ov min-h-[44px] min-w-[44px] px-2.5 sm:px-5 flex items-center justify-center whitespace-nowrap bg-brand-accent dark:bg-brand-accent-dark text-white hover:opacity-85"
          aria-label="Sign in"
        >
          <span class="w-4 h-4 inline-block sm:hidden" v-html="signInIcon"></span>
          <span class="hidden sm:inline">Sign in</span>
        </router-link>
      </div>
    </div>
  </header>
</template>

<script>
import { authStore } from '../stores/authStore.js'
import { prefsStore } from '../stores/prefsStore.js'
import sunIcon from '../assets/icons/sun.svg?raw'
import moonIcon from '../assets/icons/moon.svg?raw'
import signInIcon from '../assets/icons/sign-in.svg?raw'

export default {
  name: 'PublicHeader',
  data() {
    return {
      auth: authStore,
      prefs: prefsStore,
      sunIcon,
      moonIcon,
      signInIcon
    }
  },
  methods: {
    onToggleDark() {
      this.prefs.darkMode = !this.prefs.darkMode
    }
  }
}
</script>
