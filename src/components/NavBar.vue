<template>
  <nav class="bg-brand-bg dark:bg-brand-bg-dark border-b border-brand-border dark:border-brand-border-dark">
    <div class="max-w-6xl mx-auto px-6 min-h-[72px] sm:min-h-[88px] py-3 flex items-center justify-between gap-4">
      <router-link to="/tracks" class="flex items-baseline gap-2.5 shrink-0">
        <span class="font-display font-black tracking-tightest leading-none text-[17px] text-brand-text dark:text-brand-text-dark">WRECKFEST</span>
        <span class="ov text-brand-accent dark:text-brand-accent-dark">RACE LOG</span>
      </router-link>

      <!-- Desktop nav -->
      <div class="hidden sm:flex flex-wrap items-center justify-end gap-x-5 gap-y-2 text-[13px] font-body">
        <router-link
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="min-h-[44px] flex items-center hover:text-brand-accent dark:hover:text-brand-accent-dark"
          active-class="text-brand-accent dark:text-brand-accent-dark font-semibold"
          :class="{ 'text-brand-accent dark:text-brand-accent-dark font-semibold': item.to === '/tracks' && isTrackListRoute }"
        >{{ item.label }}</router-link>

        <div v-if="auth.isAdmin" class="relative group">
          <button
            type="button"
            class="min-h-[44px] flex items-center gap-1 hover:text-brand-accent dark:hover:text-brand-accent-dark"
            :class="{ 'text-brand-accent dark:text-brand-accent-dark font-semibold': isAdminRoute }"
          >
            Admin
            <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3 mt-px" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clip-rule="evenodd" />
            </svg>
          </button>
          <div class="absolute right-0 top-full pt-1 hidden group-hover:block z-50">
            <div class="w-44 bg-brand-bg dark:bg-brand-bg-dark border border-brand-border dark:border-brand-border-dark py-1">
              <router-link
                v-for="item in adminItems"
                :key="item.to"
                :to="item.to"
                class="flex min-h-[44px] items-center px-4 text-[13px] hover:bg-brand-surface dark:hover:bg-brand-surface-dark"
                active-class="text-brand-accent dark:text-brand-accent-dark font-semibold"
              >{{ item.label }}</router-link>
            </div>
          </div>
        </div>

        <button
          type="button"
          class="ov min-h-[44px] px-4 border border-brand-border dark:border-brand-border-dark text-brand-text dark:text-brand-text-dark hover:border-brand-accent dark:hover:border-brand-accent-dark"
          @click="onToggleDark"
          :aria-label="prefs.darkMode ? 'Switch to light mode' : 'Switch to dark mode'"
        >{{ prefs.darkMode ? 'Light' : 'Dark' }}</button>

        <button
          type="button"
          class="min-h-[44px] min-w-[44px] flex items-center justify-center border border-brand-border dark:border-brand-border-dark text-brand-muted dark:text-brand-muted-dark hover:text-brand-accent dark:hover:text-brand-accent-dark"
          aria-label="Send feedback"
          @click="onOpenFeedback"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 0 1-.923 1.785A5.969 5.969 0 0 0 6 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337Z" />
          </svg>
        </button>

        <button
          v-if="auth.isAuthenticated"
          type="button"
          class="min-h-[44px] flex items-center text-brand-muted dark:text-brand-muted-dark hover:text-brand-accent dark:hover:text-brand-accent-dark text-[13px]"
          @click="onSignOut"
        >Sign out</button>
      </div>

      <!-- Mobile hamburger -->
      <button
        type="button"
        class="sm:hidden min-h-[44px] min-w-[44px] flex items-center justify-center border shrink-0"
        :class="mobileMenuOpen
          ? 'bg-brand-accent dark:bg-brand-accent-dark border-brand-accent dark:border-brand-accent-dark text-white'
          : 'border-brand-border dark:border-brand-border-dark text-brand-text dark:text-brand-text-dark'"
        :aria-expanded="mobileMenuOpen"
        aria-label="Toggle menu"
        @click="mobileMenuOpen = !mobileMenuOpen"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5" aria-hidden="true">
          <path v-if="!mobileMenuOpen" stroke-linecap="square" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
          <path v-else stroke-linecap="square" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- Mobile menu: a red slab, full bleed, squared off. -->
    <div v-if="mobileMenuOpen" class="sm:hidden bg-brand-accent dark:bg-brand-accent-dark text-white font-body">
      <div class="max-w-6xl mx-auto px-6 py-2">
        <router-link
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="flex min-h-[44px] items-center border-b border-white/20 text-[15px]"
          active-class="font-bold"
          :class="{ 'font-bold': item.to === '/tracks' && isTrackListRoute }"
          @click="mobileMenuOpen = false"
        >{{ item.label }}</router-link>

        <template v-if="auth.isAdmin">
          <div class="ov text-white/70 pt-4 pb-2">Admin</div>
          <router-link
            v-for="item in adminItems"
            :key="item.to"
            :to="item.to"
            class="flex min-h-[44px] items-center border-b border-white/20 text-[15px]"
            active-class="font-bold"
            @click="mobileMenuOpen = false"
          >{{ item.label }}</router-link>
        </template>

        <div class="flex gap-2 pt-3 pb-2">
          <button
            type="button"
            class="ov min-h-[44px] px-4 flex items-center border border-white/50 hover:bg-white/10"
            @click="onToggleDark"
            :aria-label="prefs.darkMode ? 'Switch to light mode' : 'Switch to dark mode'"
          >{{ prefs.darkMode ? 'Light' : 'Dark' }}</button>

          <button
            type="button"
            class="ov min-h-[44px] px-4 flex items-center gap-2 border border-white/50 hover:bg-white/10"
            @click="onOpenFeedback"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 0 1-.923 1.785A5.969 5.969 0 0 0 6 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337Z" />
            </svg>
            Feedback
          </button>
        </div>

        <button
          v-if="auth.isAuthenticated"
          type="button"
          class="flex min-h-[44px] w-full items-center text-white/75 hover:text-white text-[13px]"
          @click="onSignOut"
        >Sign out</button>
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
      mobileMenuOpen: false,
      navItems: [
        { to: '/tracks', label: 'Tracks' },
        { to: '/races', label: 'Races' },
        { to: '/stats', label: 'Stats' },
        { to: '/settings/api-keys', label: 'API keys' },
        { to: '/telemetry', label: 'Telemetry' }
      ],
      adminItems: [
        { to: '/admin/diagnostics', label: 'Diagnostics' },
        { to: '/admin/users', label: 'Users' },
        { to: '/admin/api-keys', label: 'API keys' },
        { to: '/admin/feedback', label: 'Feedback' }
      ]
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
