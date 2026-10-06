<template>
  <div class="max-w-7xl mx-auto px-6 py-10">
    <ScopeKicker />
    <h1 class="font-heading font-normal tracking-normal leading-none text-display-lg text-brand-text dark:text-brand-text-dark mb-1">
      Community <em class="signal">Stats</em>
    </h1>
    <p class="font-body text-[15px] leading-relaxed text-brand-secondary dark:text-brand-secondary-dark mb-10 max-w-2xl">
      Coming soon — site-wide numbers from every driver's races: how much racing gets logged, where, and in what.
    </p>

    <div class="rule-top pt-4 max-w-2xl">
      <p class="font-body text-[15px] text-brand-secondary dark:text-brand-secondary-dark">
        In the meantime, see
        <router-link to="/community/races" class="text-brand-accent dark:text-brand-accent-dark hover:underline">everyone's latest races</router-link><template v-if="ownStatsPath">,
        or <router-link :to="ownStatsPath" class="text-brand-accent dark:text-brand-accent-dark hover:underline">your own stats</router-link></template>.
      </p>
    </div>
  </div>
</template>

<script>
import { authStore } from '../stores/authStore.js'
import ScopeKicker from '../components/ScopeKicker.vue'

// Placeholder. Site-wide aggregates will come from a get_community_stats()
// function over the public races table — see
// docs/public-section-design.md, "Leaderboards and community stats".
export default {
  name: 'CommunityStatsPage',
  components: { ScopeKicker },
  computed: {
    ownStatsPath() {
      return authStore.user ? `/${authStore.user.id}/stats` : null
    }
  }
}
</script>
