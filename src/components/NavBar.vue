<template>
  <nav class="bg-white dark:bg-gray-800 border-b border-slate-200 dark:border-slate-700">
    <div class="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
      <router-link
        to="/"
        class="flex items-center gap-2 font-bold text-lg text-brand"
      >
        <span aria-hidden="true">🏁</span>
        <span>Wreckfest Tracker</span>
      </router-link>

      <div class="flex items-center gap-2 sm:gap-4 text-sm">
        <router-link
          to="/"
          class="hover:text-brand"
          active-class="text-brand font-semibold"
          :class="{ 'text-brand font-semibold': isTrackListRoute }"
        >
          Tracks
        </router-link>
        <router-link
          to="/stats"
          class="hover:text-brand"
          active-class="text-brand font-semibold"
        >
          Stats
        </router-link>

        <button
          type="button"
          class="ml-2 px-2 py-1 rounded border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700"
          @click="onToggleDark"
          :aria-label="prefs.darkMode ? 'Switch to light mode' : 'Switch to dark mode'"
        >
          {{ prefs.darkMode ? '☀' : '🌙' }}
        </button>

        <button
          v-if="auth.isAuthenticated"
          type="button"
          class="ml-2 text-slate-500 hover:text-brand text-xs"
          @click="onSignOut"
        >
          Sign out
        </button>
      </div>
    </div>
  </nav>
</template>

<script>
import { authStore } from '../stores/authStore.js'
import { prefsStore } from '../stores/prefsStore.js'
import { signOut } from '../services/authService.js'
import { pushToast } from '../stores/toastStore.js'

export default {
  name: 'NavBar',
  data() {
    return {
      auth: authStore,
      prefs: prefsStore
    }
  },
  computed: {
    isTrackListRoute() {
      return this.$route.path === '/'
    }
  },
  methods: {
    onToggleDark() {
      this.prefs.darkMode = !this.prefs.darkMode
    },
    async onSignOut() {
      try {
        await signOut()
        this.$router.push('/login')
      } catch (err) {
        pushToast(err.message || 'Sign out failed', 'error')
      }
    }
  }
}
</script>
