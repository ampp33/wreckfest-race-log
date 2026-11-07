<template>
  <div class="app-shell min-h-screen flex flex-col bg-brand-bg dark:bg-brand-bg-dark text-brand-text dark:text-brand-text-dark font-body">
    <!-- Every page but sign-in gets the real nav, signed in or not. -->
    <NavBar v-if="!isLoginRoute" />
    <WF2Banner v-if="auth.isAuthenticated && !isLoginRoute" />

    <main class="flex-1">
      <p
        v-if="!auth.ready"
        class="font-body text-[15px] text-brand-muted dark:text-brand-muted-dark px-4 sm:px-6 py-6"
      >
        Loading session…
      </p>
      <router-view v-else />
    </main>

    <AppFooter v-if="!isLoginRoute && $route.name !== 'home'" />

    <QuickAddModal v-if="auth.isAuthenticated" />
    <TrackSearchModal />
    <PrepRaceModal />
    <FeedbackModal v-if="auth.isAuthenticated" />
    <FloatingQuickAddButton v-if="auth.isAuthenticated && !isLoginRoute" />
    <ToastContainer />
    <NavIntroOverlay v-if="auth.ready && auth.isAuthenticated && !isLoginRoute" />
  </div>
</template>

<script>
import NavBar from './components/NavBar.vue'
import AppFooter from './components/AppFooter.vue'
import WF2Banner from './components/WF2Banner.vue'
import QuickAddModal from './components/QuickAddModal.vue'
import TrackSearchModal from './components/TrackSearchModal.vue'
import PrepRaceModal from './components/PrepRaceModal.vue'
import FeedbackModal from './components/FeedbackModal.vue'
import FloatingQuickAddButton from './components/FloatingQuickAddButton.vue'
import ToastContainer from './components/ToastContainer.vue'
import NavIntroOverlay from './components/NavIntroOverlay.vue'
import { authStore, modals, openQuickAdd, applyDarkModeClass } from './stores.js'
import { isPlainKeypress } from './utils/keys.js'

// Global single-letter shortcuts → the dialog each opens.
const SHORTCUTS = { q: 'quickAdd', t: 'trackSearch', p: 'prepRace' }

export default {
  name: 'App',
  components: { NavBar, AppFooter, WF2Banner, QuickAddModal, TrackSearchModal, PrepRaceModal, FeedbackModal, FloatingQuickAddButton, ToastContainer, NavIntroOverlay },
  data() {
    return { auth: authStore }
  },
  computed: {
    isLoginRoute() {
      return this.$route.name === 'login'
    }
  },
  mounted() {
    applyDarkModeClass()
    document.addEventListener('keydown', this.onGlobalKeydown)
  },
  beforeUnmount() {
    document.removeEventListener('keydown', this.onGlobalKeydown)
  },
  methods: {
    onGlobalKeydown(event) {
      const modal = SHORTCUTS[event.key?.toLowerCase()]
      if (!modal || !isPlainKeypress(event)) return
      // Quick add writes to your own log, so it's signed-in only; track search
      // and prep for race read public data, so they work signed out too.
      if (modal === 'quickAdd' && !authStore.isAuthenticated) return
      if (modals.quickAdd || modals.trackSearch || modals.prepRace) return
      event.preventDefault()
      if (modal === 'quickAdd') openQuickAdd()
      else modals[modal] = true
    }
  }
}
</script>
