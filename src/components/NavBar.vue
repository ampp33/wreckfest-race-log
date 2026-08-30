<template>
  <nav class="bg-brand-bg dark:bg-brand-surface-dark border-b border-brand-border dark:border-brand-border-dark">
    <div class="max-w-6xl mx-auto px-4 py-3">
      <div class="flex items-center justify-between gap-2">
        <div>
          <router-link
            to="/tracks"
            class="font-display font-black tracking-tighter leading-none text-brand-text dark:text-brand-text-dark text-xl"
          >
            Wreckfest Race <em class="signal">Log</em>
          </router-link>
          <p class="hidden sm:block text-xs text-brand-muted dark:text-brand-muted-dark font-body mt-1">
            Track your Wreckfest races, notes, and progress towards being a better racer
          </p>
        </div>

        <!-- Desktop nav -->
        <div class="hidden sm:flex flex-wrap items-center gap-2 sm:gap-4 text-sm font-body">
          <router-link
            to="/tracks"
            class="hover:text-brand-accent"
            active-class="text-brand-accent font-semibold"
            :class="{ 'text-brand-accent font-semibold': isTrackListRoute }"
          >
            Tracks
          </router-link>
          <router-link
            to="/races"
            class="hover:text-brand-accent"
            active-class="text-brand-accent font-semibold"
          >
            Races
          </router-link>
          <router-link
            to="/stats"
            class="hover:text-brand-accent"
            active-class="text-brand-accent font-semibold"
          >
            Stats
          </router-link>
          <router-link
            to="/settings/api-keys"
            class="hover:text-brand-accent"
            active-class="text-brand-accent font-semibold"
          >
            API Keys
          </router-link>
          <router-link
            to="/telemetry"
            class="hover:text-brand-accent"
            active-class="text-brand-accent font-semibold"
          >
            Telemetry
          </router-link>

          <div v-if="auth.isAdmin" class="relative group">
            <button
              type="button"
              class="flex items-center gap-1 hover:text-brand-accent"
              :class="{ 'text-brand-accent font-semibold': isAdminRoute }"
            >
              Admin
              <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3 mt-px" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clip-rule="evenodd" />
              </svg>
            </button>
            <div class="absolute right-0 top-full pt-1 hidden group-hover:block z-50">
              <div class="w-40 bg-brand-bg dark:bg-brand-surface-dark border border-brand-border dark:border-brand-border-dark rounded shadow-lg py-1">
                <router-link
                  to="/admin/diagnostics"
                  class="block px-4 py-2 text-sm hover:bg-brand-surface dark:hover:bg-brand-surface-dark/70"
                  active-class="text-brand-accent font-semibold"
                >
                  Diagnostics
                </router-link>
                <router-link
                  to="/admin/users"
                  class="block px-4 py-2 text-sm hover:bg-brand-surface dark:hover:bg-brand-surface-dark/70"
                  active-class="text-brand-accent font-semibold"
                >
                  Users
                </router-link>
                <router-link
                  to="/admin/api-keys"
                  class="block px-4 py-2 text-sm hover:bg-brand-surface dark:hover:bg-brand-surface-dark/70"
                  active-class="text-brand-accent font-semibold"
                >
                  API Keys
                </router-link>
                <router-link
                  to="/admin/feedback"
                  class="block px-4 py-2 text-sm hover:bg-brand-surface dark:hover:bg-brand-surface-dark/70"
                  active-class="text-brand-accent font-semibold"
                >
                  Feedback
                </router-link>
              </div>
            </div>
          </div>

          <button
            type="button"
            class="h-7 px-2 flex items-center justify-center leading-none rounded border border-brand-border dark:border-brand-border-dark hover:bg-brand-surface dark:hover:bg-brand-surface-dark"
            @click="onToggleDark"
            :aria-label="prefs.darkMode ? 'Switch to light mode' : 'Switch to dark mode'"
          >
            {{ prefs.darkMode ? '☀' : '🌙' }}
          </button>

          <button
            type="button"
            class="h-7 px-2 flex items-center justify-center rounded border border-brand-border dark:border-brand-border-dark hover:bg-brand-surface dark:hover:bg-brand-surface-dark"
            aria-label="feedback"
            @click="onOpenFeedback"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 0 1-.923 1.785A5.969 5.969 0 0 0 6 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337Z" />
            </svg>
          </button>

          <button
            v-if="auth.isAuthenticated"
            type="button"
            class="ml-2 text-brand-muted dark:text-brand-muted-dark hover:text-brand-accent text-xs"
            @click="onSignOut"
          >
            Sign out
          </button>
        </div>

        <!-- Mobile hamburger -->
        <button
          type="button"
          class="sm:hidden h-9 w-9 flex items-center justify-center rounded border shrink-0"
          :class="mobileMenuOpen
            ? 'bg-brand-accent border-brand-accent text-white'
            : 'border-brand-border dark:border-brand-border-dark hover:bg-brand-surface dark:hover:bg-brand-surface-dark'"
          :aria-expanded="mobileMenuOpen"
          aria-label="Toggle menu"
          @click="mobileMenuOpen = !mobileMenuOpen"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5" aria-hidden="true">
            <path v-if="!mobileMenuOpen" stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
            <path v-else stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Mobile menu -->
      <div v-if="mobileMenuOpen" class="sm:hidden mt-3 rounded-lg bg-brand-accent text-white shadow-lg p-3 text-sm font-body">
        <div class="flex flex-col gap-1">
          <router-link
            to="/tracks"
            class="px-2 py-2 rounded hover:bg-white/10"
            active-class="bg-white/15 font-semibold"
            :class="{ 'bg-white/15 font-semibold': isTrackListRoute }"
            @click="mobileMenuOpen = false"
          >
            Tracks
          </router-link>
          <router-link
            to="/races"
            class="px-2 py-2 rounded hover:bg-white/10"
            active-class="bg-white/15 font-semibold"
            @click="mobileMenuOpen = false"
          >
            Races
          </router-link>
          <router-link
            to="/stats"
            class="px-2 py-2 rounded hover:bg-white/10"
            active-class="bg-white/15 font-semibold"
            @click="mobileMenuOpen = false"
          >
            Stats
          </router-link>
          <router-link
            to="/settings/api-keys"
            class="px-2 py-2 rounded hover:bg-white/10"
            active-class="bg-white/15 font-semibold"
            @click="mobileMenuOpen = false"
          >
            API Keys
          </router-link>
          <router-link
            to="/telemetry"
            class="px-2 py-2 rounded hover:bg-white/10"
            active-class="bg-white/15 font-semibold"
            @click="mobileMenuOpen = false"
          >
            Telemetry
          </router-link>

          <template v-if="auth.isAdmin">
            <div class="mt-1 px-2 pt-2 border-t border-white/20 text-[11px] font-medium uppercase tracking-widest text-white/70">
              Admin
            </div>
            <router-link
              to="/admin/diagnostics"
              class="px-2 py-2 rounded hover:bg-white/10"
              active-class="bg-white/15 font-semibold"
              @click="mobileMenuOpen = false"
            >
              Diagnostics
            </router-link>
            <router-link
              to="/admin/users"
              class="px-2 py-2 rounded hover:bg-white/10"
              active-class="bg-white/15 font-semibold"
              @click="mobileMenuOpen = false"
            >
              Users
            </router-link>
            <router-link
              to="/admin/api-keys"
              class="px-2 py-2 rounded hover:bg-white/10"
              active-class="bg-white/15 font-semibold"
              @click="mobileMenuOpen = false"
            >
              API Keys
            </router-link>
            <router-link
              to="/admin/feedback"
              class="px-2 py-2 rounded hover:bg-white/10"
              active-class="bg-white/15 font-semibold"
              @click="mobileMenuOpen = false"
            >
              Feedback
            </router-link>
          </template>

          <div class="mt-2 pt-2 border-t border-white/20 flex items-center gap-2">
            <button
              type="button"
              class="h-9 px-3 flex items-center justify-center gap-2 rounded border border-white/30 hover:bg-white/10"
              @click="onToggleDark"
              :aria-label="prefs.darkMode ? 'Switch to light mode' : 'Switch to dark mode'"
            >
              {{ prefs.darkMode ? '☀' : '🌙' }} <span>{{ prefs.darkMode ? 'Light mode' : 'Dark mode' }}</span>
            </button>

            <button
              type="button"
              class="h-9 px-3 flex items-center justify-center gap-2 rounded border border-white/30 hover:bg-white/10"
              aria-label="feedback"
              @click="onOpenFeedback"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 0 1-.923 1.785A5.969 5.969 0 0 0 6 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337Z" />
              </svg>
              <span>Feedback</span>
            </button>
          </div>

          <button
            v-if="auth.isAuthenticated"
            type="button"
            class="mt-1 px-2 py-2 text-left text-white/70 hover:text-white text-xs"
            @click="onSignOut"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  </nav>
</template>

<script>
import { authStore } from '../stores/authStore.js'
import { prefsStore } from '../stores/prefsStore.js'
import { signOut } from '../services/authService.js'
import { pushToast } from '../stores/toastStore.js'
import { openFeedback } from '../stores/feedbackStore.js'

export default {
  name: 'NavBar',
  data() {
    return {
      auth: authStore,
      prefs: prefsStore,
      mobileMenuOpen: false
    }
  },
  computed: {
    isTrackListRoute() {
      return this.$route.path === '/tracks'
    },
    isAdminRoute() {
      return this.$route.path.startsWith('/admin')
    }
  },
  watch: {
    '$route'() {
      this.mobileMenuOpen = false
    }
  },
  methods: {
    onToggleDark() {
      this.prefs.darkMode = !this.prefs.darkMode
    },
    onOpenFeedback() {
      this.mobileMenuOpen = false
      openFeedback()
    },
    async onSignOut() {
      this.mobileMenuOpen = false
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
