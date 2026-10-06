<template>
  <!-- The line above a page's title naming whose races it shows —
       "Everyone", "Your log · Ampp33", "Viewing Thainnn" — so the nav's
       scope icon is never the only clue. -->
  <div
    v-if="scope"
    class="ov flex items-center gap-2 mb-3"
    :class="scope.kind === 'driver' ? 'text-brand-accent dark:text-brand-accent-dark' : 'text-brand-muted dark:text-brand-muted-dark'"
  >
    <span
      v-if="scope.kind === 'driver'"
      class="w-4 h-4 flex items-center justify-center bg-brand-accent dark:bg-brand-accent-dark text-white text-[10px] tracking-normal"
    ><ScopeIcon kind="driver" :name="driverName" /></span>
    <ScopeIcon v-else :kind="scope.kind" icon-class="w-3.5 h-3.5" />
    <span>{{ label }}</span>
  </div>
</template>

<script>
import ScopeIcon from './ScopeIcon.vue'
import { authStore } from '../stores/authStore.js'
import { getProfile } from '../services/profileService.js'
import { scopeOfRoute } from '../utils/scope.js'

export default {
  name: 'ScopeKicker',
  components: { ScopeIcon },
  data() {
    return {
      auth: authStore,
      driverName: ''
    }
  },
  computed: {
    scope() {
      return scopeOfRoute(this.$route, this.auth.user?.id)
    },
    label() {
      if (!this.scope) return ''
      if (this.scope.kind === 'everyone') return 'Everyone'
      if (this.scope.kind === 'you') return `Your log · ${this.auth.profile?.display_name ?? ''}`
      return `Viewing ${this.driverName}`
    }
  },
  watch: {
    'scope.userId': {
      immediate: true,
      async handler(userId) {
        this.driverName = ''
        if (!userId) return
        try {
          const profile = await getProfile(userId)
          if (userId === this.scope?.userId) this.driverName = profile?.display_name ?? ''
        } catch {
          // DriverScope reports load failures; the line just goes nameless.
        }
      }
    }
  }
}
</script>
