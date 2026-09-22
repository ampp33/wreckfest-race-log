<template>
  <nav class="bg-brand-bg dark:bg-brand-bg-dark border-b border-brand-border dark:border-brand-border-dark">
    <div class="max-w-7xl mx-auto px-6 min-h-[72px] sm:min-h-[88px] py-3 flex items-center justify-between gap-4">
      <router-link to="/races" class="flex items-baseline gap-2.5 shrink-0">
        <span class="font-display font-black tracking-tightest leading-none text-[26px] text-brand-text dark:text-brand-text-dark">WRECKFEST</span>
        <span class="ov-lg text-brand-accent dark:text-brand-accent-dark" style="font-size: 16px">RACE LOG</span>
      </router-link>

      <!-- Desktop nav -->
      <div class="hidden sm:flex flex-wrap items-center justify-end gap-x-5 gap-y-2 text-[13px] font-body">
        <!-- Getting Started stays red so a new account can spot it without
             reading the row, but otherwise matches the plain links around it. -->
        <router-link
          to="/getting-started"
          class="min-h-[44px] flex items-center text-brand-accent dark:text-brand-accent-dark hover:opacity-80"
          active-class="font-semibold"
        >Getting Started</router-link>

        <router-link
          to="/news"
          class="min-h-[44px] flex items-center hover:text-brand-accent dark:hover:text-brand-accent-dark"
          active-class="text-brand-accent dark:text-brand-accent-dark font-semibold"
        >News</router-link>

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
            <span class="w-4 h-4 inline-block" v-html="signOutIcon"></span>
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

    <!-- Mobile menu: a red slab, full bleed, squared off. Slides open/closed
         via a grid-template-rows 0fr->1fr transition rather than height,
         since height:auto can't be animated directly and this content's
         height varies (e.g. whether the Admin section is present). -->
    <Transition
      enter-active-class="transition-[grid-template-rows] duration-300 ease-out"
      enter-from-class="grid-rows-[0fr]"
      enter-to-class="grid-rows-[1fr]"
      leave-active-class="transition-[grid-template-rows] duration-200 ease-in"
      leave-from-class="grid-rows-[1fr]"
      leave-to-class="grid-rows-[0fr]"
    >
      <div v-if="mobileMenuOpen" class="sm:hidden grid bg-brand-accent dark:bg-brand-accent-dark text-white font-body">
        <div class="overflow-hidden">
          <div class="max-w-7xl mx-auto px-6 py-2">
            <router-link
              to="/getting-started"
              class="flex min-h-[44px] items-center border-b border-white/20 text-[15px]"
              active-class="font-bold"
              @click="mobileMenuOpen = false"
            >Getting Started</router-link>

            <router-link
              to="/news"
              class="flex min-h-[44px] items-center border-b border-white/20 text-[15px]"
              active-class="font-bold"
              @click="mobileMenuOpen = false"
            >News</router-link>

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
                <span class="w-4 h-4 inline-block" v-html="signOutIconMobile"></span>
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </nav>
</template>

<script>
import { authStore, clearAuthSession } from '../stores/authStore.js'
import { prefsStore } from '../stores/prefsStore.js'
import { signOut } from '../services/authService.js'
import { pushToast } from '../stores/toastStore.js'
import { openFeedback } from '../stores/feedbackStore.js'
import sunIcon from '../assets/icons/sun.svg?raw'
import moonIcon from '../assets/icons/moon.svg?raw'
import signOutIcon from '../assets/icons/sign-out.svg?raw'
import chevronDownIcon from '../assets/icons/chevron-down-outline.svg?raw'
import feedbackIcon from '../assets/icons/feedback.svg?raw'
import menuIcon from '../assets/icons/menu.svg?raw'
import closeIcon from '../assets/icons/close-filled.svg?raw'

// The sign-out icon knocks its figure out of the doorway with an SVG <mask>,
// which is referenced by id — so inlining the same markup twice puts two
// elements with that id in the document, and both copies resolve to the first
// one. Below the sm breakpoint the first copy lives in the desktop cluster's
// `hidden` (display:none) subtree, which builds no mask at all, and the mobile
// drawer's copy then renders as a bare filled square. Giving the drawer its
// own id keeps the two instances independent.
const signOutIconMobile = signOutIcon.replace(/wfDoorOut/g, 'wfDoorOutMobile')

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
      signOutIcon,
      signOutIconMobile,
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
        clearAuthSession()
        this.$router.push('/')
      } catch (err) {
        pushToast(err.message || 'Sign out failed', 'error')
      }
    }
  }
}
</script>
