<template>
  <nav class="bg-brand-bg dark:bg-brand-bg-dark border-b border-brand-border dark:border-brand-border-dark">
    <div class="max-w-7xl mx-auto px-6 min-h-[72px] sm:min-h-[88px] py-3 flex items-center justify-between gap-4">
      <router-link to="/races" class="flex items-baseline gap-2.5 shrink-0">
        <span class="font-display font-black tracking-tightest leading-none text-[26px] text-brand-text dark:text-brand-text-dark">WRECKFEST</span>
        <span class="ov-lg text-brand-accent dark:text-brand-accent-dark" style="font-size: 16px">RACE LOG</span>
      </router-link>

      <!-- Desktop nav -->
      <div class="hidden sm:flex flex-wrap items-center justify-end gap-x-5 gap-y-2 text-[13px] font-body">
        <!-- Getting Started leads the bar and is deliberately not one of the
             plain text links: it's the outlined red chip, so a new account
             can find it without reading the row. `ov` small-caps rather than
             the plain link style, so it reads as chrome rather than as a
             fifth section. -->
        <router-link
          to="/getting-started"
          class="ov min-h-[44px] px-3.5 flex items-center border border-brand-accent dark:border-brand-accent-dark text-brand-accent dark:text-brand-accent-dark hover:bg-brand-accent dark:hover:bg-brand-accent-dark hover:text-white dark:hover:text-white"
          active-class="bg-brand-accent dark:bg-brand-accent-dark text-white dark:text-white"
        >Getting Started</router-link>

        <router-link
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="min-h-[44px] flex items-center hover:text-brand-accent dark:hover:text-brand-accent-dark"
          active-class="text-brand-accent dark:text-brand-accent-dark font-semibold"
          :class="{ 'text-brand-accent dark:text-brand-accent-dark font-semibold': item.to === '/tracks' && isTrackListRoute }"
        >{{ item.label }}</router-link>

        <div class="relative group">
          <button
            type="button"
            class="min-h-[44px] flex items-center gap-1 hover:text-brand-accent dark:hover:text-brand-accent-dark"
            :class="{ 'text-brand-accent dark:text-brand-accent-dark font-semibold': isTelemetryRoute }"
          >
            Telemetry
            <span class="w-3 h-3 mt-px inline-block" v-html="chevronDownIcon"></span>
          </button>
          <div class="absolute right-0 top-full pt-1 hidden group-hover:block z-50">
            <div class="w-44 bg-brand-bg dark:bg-brand-bg-dark border border-brand-border dark:border-brand-border-dark py-1">
              <router-link
                v-for="item in telemetryItems"
                :key="item.to"
                :to="item.to"
                class="flex min-h-[44px] items-center px-4 text-[13px] hover:bg-brand-surface dark:hover:bg-brand-surface-dark"
                active-class="text-brand-accent dark:text-brand-accent-dark font-semibold"
              >{{ item.label }}</router-link>
            </div>
          </div>
        </div>

        <div v-if="auth.isAdmin" class="relative group">
          <button
            type="button"
            class="min-h-[44px] flex items-center gap-1 hover:text-brand-accent dark:hover:text-brand-accent-dark"
            :class="{ 'text-brand-accent dark:text-brand-accent-dark font-semibold': isAdminRoute }"
          >
            Admin
            <span class="w-3 h-3 mt-px inline-block" v-html="chevronDownIcon"></span>
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

        <!-- Icon-only control cluster, same sun/moon + door icons as
             PublicHeader's compact controls, grouped with a tighter gap than
             the text links so the three tiles read as one set. -->
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="min-h-[44px] min-w-[44px] flex items-center justify-center border border-brand-border dark:border-brand-border-dark text-brand-text dark:text-brand-text-dark hover:border-brand-accent dark:hover:border-brand-accent-dark"
            @click="onToggleDark"
            :aria-label="prefs.darkMode ? 'Switch to light mode' : 'Switch to dark mode'"
          >
            <span class="w-4 h-4 inline-block" v-html="prefs.darkMode ? sunIcon : moonIcon"></span>
          </button>

          <button
            type="button"
            class="min-h-[44px] min-w-[44px] flex items-center justify-center border border-brand-border dark:border-brand-border-dark text-brand-muted dark:text-brand-muted-dark hover:text-brand-accent dark:hover:text-brand-accent-dark"
            aria-label="Send feedback"
            @click="onOpenFeedback"
          >
            <span class="w-4 h-4 inline-block" v-html="feedbackIcon"></span>
          </button>

          <button
            v-if="auth.isAuthenticated"
            type="button"
            class="min-h-[44px] min-w-[44px] flex items-center justify-center border border-brand-border dark:border-brand-border-dark text-brand-muted dark:text-brand-muted-dark hover:text-brand-accent dark:hover:text-brand-accent-dark"
            aria-label="Sign out"
            @click="onSignOut"
          >
            <span class="w-4 h-4 inline-block" v-html="doorOpenIcon"></span>
          </button>
        </div>
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
        <span class="w-5 h-5 inline-block" v-html="mobileMenuOpen ? closeIcon : menuIcon"></span>
      </button>
    </div>

    <!-- Mobile menu: a red slab, full bleed, squared off. -->
    <div v-if="mobileMenuOpen" class="sm:hidden bg-brand-accent dark:bg-brand-accent-dark text-white font-body">
      <div class="max-w-7xl mx-auto px-6 py-2">
        <!-- Same idea as the desktop chip: inverted out of the red slab so
             it leads the menu instead of blending into the link list. -->
        <router-link
          to="/getting-started"
          class="ov my-2 min-h-[44px] px-4 flex items-center bg-white text-brand-accent"
          @click="mobileMenuOpen = false"
        >Getting Started</router-link>

        <router-link
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="flex min-h-[44px] items-center border-b border-white/20 text-[15px]"
          active-class="font-bold"
          :class="{ 'font-bold': item.to === '/tracks' && isTrackListRoute }"
          @click="mobileMenuOpen = false"
        >{{ item.label }}</router-link>

        <div class="ov text-white/70 pt-4 pb-2">Telemetry</div>
        <router-link
          v-for="item in telemetryItems"
          :key="item.to"
          :to="item.to"
          class="flex min-h-[44px] items-center border-b border-white/20 text-[15px]"
          active-class="font-bold"
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
            class="min-h-[44px] min-w-[44px] flex items-center justify-center border border-white/50 hover:bg-white/10"
            @click="onToggleDark"
            :aria-label="prefs.darkMode ? 'Switch to light mode' : 'Switch to dark mode'"
          >
            <span class="w-4 h-4 inline-block" v-html="prefs.darkMode ? sunIcon : moonIcon"></span>
          </button>

          <button
            type="button"
            class="min-h-[44px] min-w-[44px] flex items-center justify-center border border-white/50 hover:bg-white/10"
            aria-label="Send feedback"
            @click="onOpenFeedback"
          >
            <span class="w-4 h-4 inline-block" v-html="feedbackIcon"></span>
          </button>

          <button
            v-if="auth.isAuthenticated"
            type="button"
            class="ml-2 flex min-h-[44px] items-center gap-2 text-white/75 hover:text-white text-[13px]"
            @click="onSignOut"
          >
            <span class="w-4 h-4 inline-block" v-html="doorOpenIcon"></span>
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
import sunIcon from '../assets/icons/sun.svg?raw'
import moonIcon from '../assets/icons/moon.svg?raw'
import doorOpenIcon from '../assets/icons/door-open.svg?raw'
import chevronDownIcon from '../assets/icons/chevron-down-outline.svg?raw'
import feedbackIcon from '../assets/icons/feedback.svg?raw'
import menuIcon from '../assets/icons/menu.svg?raw'
import closeIcon from '../assets/icons/close-filled.svg?raw'

export default {
  name: 'NavBar',
  data() {
    return {
      auth: authStore,
      prefs: prefsStore,
      mobileMenuOpen: false,
      sunIcon,
      moonIcon,
      chevronDownIcon,
      feedbackIcon,
      menuIcon,
      closeIcon,
      doorOpenIcon,
      navItems: [
        { to: '/tracks', label: 'Tracks' },
        { to: '/races', label: 'Races' },
        { to: '/stats', label: 'Stats' }
      ],
      telemetryItems: [
        { to: '/plugin', label: 'Instructions' },
        { to: '/settings/api-keys', label: 'API keys' }
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
    },
    isTelemetryRoute() {
      return this.telemetryItems.some(item => item.to === this.$route.path)
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
