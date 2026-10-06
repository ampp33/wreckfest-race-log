<template>
  <!-- Your own pages (and community ones, which have no driver) render as-is,
       and so do other drivers' — ScopeKicker above the title names whose log
       it is. If they've gone private, or there's no such driver, a message
       replaces the page instead. -->
  <div>
    <template v-if="isOwn || !userId">
      <ScopeKicker />
      <slot />
    </template>

    <p v-else-if="loading" class="font-body text-[15px] text-brand-muted dark:text-brand-muted-dark">Loading…</p>

    <div v-else-if="!profile" class="rule-top pt-4 max-w-2xl">
      <p class="font-body text-[15px] text-brand-secondary dark:text-brand-secondary-dark mb-2">
        This driver's log is private.
      </p>
    </div>

    <template v-else>
      <ScopeKicker />
      <slot />
    </template>
  </div>
</template>

<script>
import { authStore } from '../stores/authStore.js'
import { getProfile } from '../services/profileService.js'
import { pushToast } from '../stores/toastStore.js'
import ScopeKicker from './ScopeKicker.vue'

export default {
  name: 'DriverScope',
  components: { ScopeKicker },
  props: {
    // null on community pages, which show everyone's races rather than one driver's.
    userId: { type: String, default: null }
  },
  data() {
    return {
      profile: null,
      loading: false
    }
  },
  computed: {
    isOwn() {
      return !!this.userId && authStore.user?.id === this.userId
    },
    // The same page, but yours: swap the driver prefix for your own id.
    ownPath() {
      if (!authStore.user) return null
      return this.$route.path.replace(/^\/[^/]+/, `/${authStore.user.id}`)
    }
  },
  watch: {
    userId: { immediate: true, handler: 'loadProfile' },
    isOwn: 'loadProfile'
  },
  methods: {
    async loadProfile() {
      if (this.isOwn || !this.userId) return
      this.loading = true
      try {
        this.profile = await getProfile(this.userId)
      } catch (err) {
        this.profile = null
        pushToast(err.message || 'Failed to load driver', 'error')
      } finally {
        this.loading = false
      }
    }
  }
}
</script>
