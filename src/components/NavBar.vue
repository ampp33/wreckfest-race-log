<template>
  <nav class="bg-white dark:bg-gray-800 border-b border-slate-200 dark:border-slate-700">
    <div class="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
      <router-link
        to="/"
        class="flex items-center gap-2 font-bold text-lg text-brand"
      >
        <span aria-hidden="true">🏁</span>
        <span>Wreckfest Race Log</span>
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

        <div v-if="auth.isAdmin" class="relative group">
          <button
            type="button"
            class="flex items-center gap-1 hover:text-brand"
            :class="{ 'text-brand font-semibold': isAdminRoute }"
          >
            Admin
            <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3 mt-px" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clip-rule="evenodd" />
            </svg>
          </button>
          <div class="absolute right-0 top-full pt-1 hidden group-hover:block z-50">
            <div class="w-40 bg-white dark:bg-gray-800 border border-slate-200 dark:border-slate-700 rounded shadow-lg py-1">
              <router-link
                to="/admin/diagnostics"
                class="block px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700"
                active-class="text-brand font-semibold"
              >
                Diagnostics
              </router-link>
              <router-link
                to="/admin/users"
                class="block px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700"
                active-class="text-brand font-semibold"
              >
                Users
              </router-link>
            </div>
          </div>
        </div>

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
    },
    isAdminRoute() {
      return this.$route.path.startsWith('/admin')
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
