<template>
  <nav class="bg-brand-bg dark:bg-brand-bg-dark border-b border-brand-border dark:border-brand-border-dark">
    <!-- One row at every width. From 1200px up it holds everything: the
         scope picker and its views beside the logo, the site links and
         controls on the right. Below that there isn't room, so it switches
         to the phone layout — scope icon and hamburger, views in the menu. -->
    <div class="max-w-7xl mx-auto px-6 min-h-[72px] sm:min-h-[88px] py-3 flex items-center gap-6">
      <!-- A size smaller on phones, where it shares the row with two buttons. -->
      <router-link :to="homePath" class="flex items-baseline gap-2 sm:gap-2.5 min-w-0">
        <span class="font-display font-black tracking-tightest leading-none text-[21px] sm:text-[26px] text-brand-text dark:text-brand-text-dark">WRECKFEST</span>
        <span class="ov-lg whitespace-nowrap text-[12px] sm:text-[16px] text-brand-accent dark:text-brand-accent-dark">RACE LOG</span>
      </router-link>

      <!-- Desktop: whose races (the scope icon) and which view of them. On
           pages outside any scope — News, admin — it keeps the last scope
           you were in, with no view lit. `data-nav-intro` (here and on the
           mobile pair below) is what NavIntroOverlay spotlights. -->
      <div data-nav-intro class="hidden min-[1200px]:flex items-center gap-6 shrink-0">
        <div ref="scopePicker" class="relative">
          <button
            type="button"
            class="min-h-[44px] min-w-[44px] flex items-center justify-center text-[17px]"
            :class="scopeButtonClass(desktopScopeOpen)"
            :aria-expanded="desktopScopeOpen"
            aria-haspopup="true"
            :aria-label="`Whose races: ${scopeKickerLabel}`"
            :title="scopeKickerLabel"
            @click="desktopScopeOpen = !desktopScopeOpen"
          >
            <ScopeIcon :kind="scope.kind" :name="scopeName" />
          </button>
          <div
            v-if="desktopScopeOpen"
            class="absolute left-0 top-full mt-2 z-50 w-80 bg-brand-slab dark:bg-brand-surface-dark dark:border dark:border-brand-border-dark px-4 pb-4 shadow-[0_18px_40px_rgba(10,10,10,0.3)]"
          >
            <ScopeMenu
              variant="dark"
              :current="scope"
              :my-id="myId"
              :my-name="myName"
              :recent="recentDrivers"
              @pick="pickScope"
            />
          </div>
        </div>
        <nav class="flex items-center gap-5 text-[13px] font-body" aria-label="Views">
          <router-link
            v-for="view in views"
            :key="view.key"
            :to="view.to"
            class="min-h-[44px] flex items-center"
            :class="view.active
              ? 'text-brand-accent dark:text-brand-accent-dark font-semibold underline decoration-2 underline-offset-[10px]'
              : 'hover:text-brand-accent dark:hover:text-brand-accent-dark'"
            :aria-current="view.active ? 'page' : undefined"
          >{{ view.label }}</router-link>
        </nav>
      </div>

      <!-- Desktop: site links and controls -->
      <div class="hidden min-[1200px]:flex items-center justify-end gap-x-5 ml-auto text-[13px] font-body">
        <!-- Getting Started stays red so a new account can spot it without
             reading the row, but otherwise matches the plain links around it. -->
        <router-link
          v-if="auth.isAuthenticated"
          to="/getting-started"
          class="min-h-[44px] flex items-center text-brand-accent dark:text-brand-accent-dark hover:opacity-80"
          active-class="font-semibold"
        >Getting Started</router-link>

        <router-link
          v-if="auth.isAuthenticated"
          to="/news"
          class="min-h-[44px] flex items-center hover:text-brand-accent dark:hover:text-brand-accent-dark"
          active-class="text-brand-accent dark:text-brand-accent-dark font-semibold"
        >News</router-link>

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
            v-if="auth.isAuthenticated"
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

          <!-- Same treatment as PublicHeader's sign-in button. -->
          <router-link
            v-if="!auth.isAuthenticated"
            :to="signInRoute"
            class="ov min-h-[44px] px-5 flex items-center whitespace-nowrap bg-brand-accent dark:bg-brand-accent-dark text-white hover:opacity-85"
          >Sign in</router-link>
        </div>
      </div>

      <!-- Mobile: whose races (scope) and the menu, each opening its own red
           drop-down. Only one is open at a time; the open one turns red. -->
      <div data-nav-intro class="min-[1200px]:hidden flex items-center gap-2 shrink-0 ml-auto">
        <button
          type="button"
          class="min-h-[44px] min-w-[44px] flex items-center justify-center text-[17px]"
          :class="scopeButtonClass(mobileMenu === 'scope')"
          :aria-expanded="mobileMenu === 'scope'"
          :aria-label="`Whose races: ${scopeKickerLabel}`"
          @click="toggleMobileMenu('scope')"
        >
          <ScopeIcon :kind="scope.kind" :name="scopeName" />
        </button>
        <button
          type="button"
          class="min-h-[44px] min-w-[44px] flex items-center justify-center border"
          :class="mobileMenu === 'menu'
            ? 'bg-brand-accent dark:bg-brand-accent-dark border-brand-accent dark:border-brand-accent-dark text-white'
            : 'border-brand-border dark:border-brand-border-dark text-brand-text dark:text-brand-text-dark'"
          :aria-expanded="mobileMenu === 'menu'"
          aria-label="Toggle menu"
          @click="toggleMobileMenu('menu')"
        >
          <span class="w-5 h-5 inline-block" v-html="mobileMenu === 'menu' ? closeIcon : menuIcon"></span>
        </button>
      </div>
    </div>

    <!-- Mobile drop-downs: red slabs, full bleed, squared off. They slide
         open/closed via a grid-template-rows 0fr->1fr transition rather
         than height, since height:auto can't be animated directly and the
         content's height varies. -->
    <Transition
      enter-active-class="transition-[grid-template-rows] duration-300 ease-out"
      enter-from-class="grid-rows-[0fr]"
      enter-to-class="grid-rows-[1fr]"
      leave-active-class="transition-[grid-template-rows] duration-200 ease-in"
      leave-from-class="grid-rows-[1fr]"
      leave-to-class="grid-rows-[0fr]"
      mode="out-in"
    >
      <div v-if="mobileMenu === 'scope'" key="scope" class="min-[1200px]:hidden grid bg-brand-accent dark:bg-brand-accent-dark text-white font-body">
        <div class="overflow-hidden">
          <div class="max-w-7xl mx-auto px-6 pt-1 pb-4">
            <ScopeMenu
              variant="red"
              :current="scope"
              :my-id="myId"
              :my-name="myName"
              :recent="recentDrivers"
              @pick="pickScope"
            />
          </div>
        </div>
      </div>

      <div v-else-if="mobileMenu === 'menu'" key="menu" class="min-[1200px]:hidden grid bg-brand-accent dark:bg-brand-accent-dark text-white font-body">
        <div class="overflow-hidden">
          <div class="max-w-7xl mx-auto px-6 py-2">
            <div class="ov text-white/70 pt-3 pb-2">{{ scopeLabel }}</div>
            <router-link
              v-for="view in views"
              :key="view.key"
              :to="view.to"
              class="flex min-h-[44px] items-center border-b border-white/20 text-[15px]"
              :class="{ 'font-bold': view.active }"
              @click="mobileMenu = null"
            >{{ view.label }}</router-link>

            <div class="ov text-white/70 pt-4 pb-2">Telemetry</div>
            <router-link
              v-for="item in telemetryItems"
              :key="item.to"
              :to="item.to"
              class="flex min-h-[44px] items-center border-b border-white/20 text-[15px]"
              active-class="font-bold"
              @click="mobileMenu = null"
            >{{ item.label }}</router-link>

            <template v-if="auth.isAdmin">
              <div class="ov text-white/70 pt-4 pb-2">Admin</div>
              <router-link
                v-for="item in adminItems"
                :key="item.to"
                :to="item.to"
                class="flex min-h-[44px] items-center border-b border-white/20 text-[15px]"
                active-class="font-bold"
                @click="mobileMenu = null"
              >{{ item.label }}</router-link>
            </template>

            <template v-if="auth.isAuthenticated">
              <div class="ov text-white/70 pt-4 pb-2">More</div>
              <router-link
                to="/getting-started"
                class="flex min-h-[44px] items-center border-b border-white/20 text-[15px]"
                active-class="font-bold"
                @click="mobileMenu = null"
              >Getting Started</router-link>
              <router-link
                to="/news"
                class="flex min-h-[44px] items-center border-b border-white/20 text-[15px]"
                active-class="font-bold"
                @click="mobileMenu = null"
              >News</router-link>
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
                v-if="auth.isAuthenticated"
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

              <router-link
                v-if="!auth.isAuthenticated"
                :to="signInRoute"
                class="ml-2 flex min-h-[44px] items-center px-4 border border-white/50 hover:bg-white/10 text-[13px] font-semibold"
                @click="mobileMenu = null"
              >Sign in</router-link>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </nav>
</template>

<script>
import ScopeIcon from './ScopeIcon.vue'
import ScopeMenu from './ScopeMenu.vue'
import { authStore, clearAuthSession } from '../stores/authStore.js'
import { prefsStore } from '../stores/prefsStore.js'
import { recentDriversStore, rememberDriver } from '../stores/recentDriversStore.js'
import { signOut } from '../services/authService.js'
import { pushToast } from '../stores/toastStore.js'
import { openFeedback } from '../stores/feedbackStore.js'
import { getProfile } from '../services/profileService.js'
import { scopeOfRoute, scopeViews, viewOfRoute, pathForScope, sameScope } from '../utils/scope.js'
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
// one. Below the 1200px breakpoint the first copy lives in the desktop cluster's
// `hidden` (display:none) subtree, which builds no mask at all, and the mobile
// drawer's copy then renders as a bare filled square. Giving the drawer its
// own id keeps the two instances independent.
const signOutIconMobile = signOutIcon.replace(/wfDoorOut/g, 'wfDoorOutMobile')

export default {
  name: 'NavBar',
  components: { ScopeIcon, ScopeMenu },
  data() {
    return {
      auth: authStore,
      prefs: prefsStore,
      recent: recentDriversStore,
      // Which mobile drop-down is open: 'scope', 'menu' or null.
      mobileMenu: null,
      desktopScopeOpen: false,
      // The scope of the last scoped page you were on, so pages outside any
      // scope (News, admin) keep the picker and tabs where you left them.
      lastScope: null,
      // Profile of the driver whose pages are open, for their name.
      viewedProfile: null,
      sunIcon,
      moonIcon,
      chevronDownIcon,
      feedbackIcon,
      menuIcon,
      closeIcon,
      signOutIcon,
      signOutIconMobile,
      adminItems: [
        { to: '/admin/users', label: 'Users' },
        { to: '/admin/api-keys', label: 'API keys' },
        { to: '/admin/feedback', label: 'Feedback' }
      ]
    }
  },
  computed: {
    // Same place sign-in lands (router's signedInHomeRoute); the landing
    // page when signed out.
    homePath() {
      return this.auth.user ? '/community/leaderboard' : '/'
    },
    myId() {
      return this.auth.user?.id ?? null
    },
    myName() {
      return this.auth.isAuthenticated ? (this.auth.profile?.display_name ?? 'You') : null
    },
    recentDrivers() {
      return this.recent.drivers
    },
    routeScope() {
      return scopeOfRoute(this.$route, this.myId)
    },
    scope() {
      const scope = this.routeScope || this.lastScope
      // "You" means nothing once signed out.
      if (!scope || (scope.kind === 'you' && !this.myId)) return { kind: 'everyone' }
      return scope
    },
    scopeName() {
      if (this.scope.kind === 'you') return this.myName ?? ''
      if (this.scope.kind !== 'driver') return ''
      if (this.viewedProfile && this.viewedProfile.user_id === this.scope.userId) return this.viewedProfile.display_name
      return this.recentDrivers.find(d => d.id === this.scope.userId)?.name ?? ''
    },
    // The picker's label: who, in a word or a name.
    scopeLabel() {
      if (this.scope.kind === 'everyone') return 'Everyone'
      if (this.scope.kind === 'you') return 'Your log'
      return this.scopeName || 'Driver'
    },
    scopeKickerLabel() {
      if (this.scope.kind === 'driver') return `Viewing ${this.scopeLabel}`
      return this.scopeLabel
    },
    views() {
      const onScope = sameScope(this.routeScope, this.scope)
      const current = viewOfRoute(this.$route)
      return scopeViews(this.scope, this.myId).map(view => ({
        ...view,
        active: onScope && view.key === current
      }))
    },
    // API keys need an account; the setup guide doesn't.
    telemetryItems() {
      const items = [{ to: '/plugin', label: 'Instructions' }]
      if (this.auth.isAuthenticated) items.push({ to: '/settings/api-keys', label: 'API keys' })
      return items
    },
    // Back to the page you were on once you've signed in.
    signInRoute() {
      return { name: 'login', query: { redirect: this.$route.fullPath } }
    },
    isAdminRoute() {
      return this.$route.path.startsWith('/admin')
    },
    isTelemetryRoute() {
      return this.telemetryItems.some(item => item.to === this.$route.path)
    }
  },
  watch: {
    '$route': {
      immediate: true,
      handler() {
        this.mobileMenu = null
        this.desktopScopeOpen = false
        if (this.routeScope) this.lastScope = this.routeScope
      }
    },
    // Fetch the open driver's name, and remember them for the scope menu's
    // "Recently viewed".
    'routeScope.userId': {
      immediate: true,
      async handler(userId) {
        if (!userId) return
        try {
          const profile = await getProfile(userId)
          // Ignore a slow answer for a driver we've already navigated away from.
          if (userId !== this.routeScope?.userId || !profile) return
          this.viewedProfile = profile
          rememberDriver(userId, profile.display_name)
        } catch {
          // The page itself reports load failures; the nav just goes nameless.
        }
      }
    }
  },
  mounted() {
    document.addEventListener('click', this.onDocumentClick)
    document.addEventListener('keydown', this.onDocumentKeydown)
  },
  beforeUnmount() {
    document.removeEventListener('click', this.onDocumentClick)
    document.removeEventListener('keydown', this.onDocumentKeydown)
  },
  methods: {
    // The scope button, desktop or mobile: solid red while its menu is open,
    // red-outlined on another driver's log, otherwise like the other tiles.
    scopeButtonClass(open) {
      if (open) {
        return 'border bg-brand-accent dark:bg-brand-accent-dark border-brand-accent dark:border-brand-accent-dark text-white'
      }
      if (this.scope.kind === 'driver') {
        return 'border-2 border-brand-accent dark:border-brand-accent-dark text-brand-accent dark:text-brand-accent-dark'
      }
      return 'border border-brand-border dark:border-brand-border-dark text-brand-text dark:text-brand-text-dark'
    },
    toggleMobileMenu(which) {
      this.mobileMenu = this.mobileMenu === which ? null : which
    },
    pickScope(scope) {
      this.mobileMenu = null
      this.desktopScopeOpen = false
      this.$router.push(pathForScope(this.$route, scope, this.myId))
    },
    // Close the desktop picker on a click anywhere outside it.
    onDocumentClick(event) {
      if (this.desktopScopeOpen && !this.$refs.scopePicker?.contains(event.target)) {
        this.desktopScopeOpen = false
      }
    },
    onDocumentKeydown(event) {
      if (event.key === 'Escape') {
        this.desktopScopeOpen = false
        this.mobileMenu = null
      }
    },
    onToggleDark() {
      this.prefs.darkMode = !this.prefs.darkMode
    },
    onOpenFeedback() {
      this.mobileMenu = null
      openFeedback()
    },
    async onSignOut() {
      this.mobileMenu = null
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
