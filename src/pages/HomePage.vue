<template>
  <div class="min-h-screen flex flex-col bg-brand-bg dark:bg-brand-bg-dark">
    <header class="border-b border-brand-border dark:border-brand-border-dark">
      <div class="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between">
        <span class="font-display font-black tracking-tighter leading-none text-brand-text dark:text-brand-text-dark text-xl">
          Wreckfest Race <em class="signal">Log</em>
        </span>
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="h-7 px-2 flex items-center justify-center leading-none rounded border border-brand-border dark:border-brand-border-dark hover:bg-brand-surface dark:hover:bg-brand-surface-dark"
            @click="onToggleDark"
            :aria-label="prefs.darkMode ? 'Switch to light mode' : 'Switch to dark mode'"
          >
            {{ prefs.darkMode ? '☀' : '🌙' }}
          </button>
          <router-link
            to="/login"
            class="font-display font-black uppercase tracking-widest bg-brand-accent text-white px-4 py-1.5 text-xs rounded-none hover:opacity-85 active:opacity-70 transition-opacity"
          >
            Sign in
          </router-link>
        </div>
      </div>
    </header>

    <main class="flex-1">
      <div class="max-w-4xl mx-auto px-6 py-10 sm:py-14 space-y-12">
        <!-- Hero -->
        <section>
          <h1 class="font-display font-black tracking-tighter leading-none text-display-lg text-brand-text dark:text-brand-text-dark mb-4">
            <em class="signal">Track</em> every race
          </h1>
          <p class="font-body text-[15px] leading-relaxed text-brand-secondary dark:text-brand-secondary-dark max-w-xl mb-6">
            Track your Wreckfest races, notes, and progress towards being a better racer.
            Log lap times, tuning setups, and results by track and vehicle — then watch
            your stats improve over time.
          </p>
          <router-link
            to="/login"
            class="inline-block font-display font-black uppercase tracking-widest bg-brand-accent text-white px-6 py-3 rounded-none hover:opacity-85 active:opacity-70 transition-opacity"
          >
            Sign in to start tracking
          </router-link>
        </section>

        <!-- Site stats -->
        <section>
          <h2 class="font-display font-black tracking-tighter leading-none text-display-sm text-brand-text dark:text-brand-text-dark mb-3">
            Join the <em class="signal">community</em>
          </h2>
          <div class="bg-brand-surface dark:bg-brand-surface-dark rounded border border-brand-border dark:border-brand-border-dark p-4 inline-block">
            <div class="font-body font-medium uppercase tracking-widest text-[11px] text-brand-muted dark:text-brand-muted-dark">
              Races logged
            </div>
            <div class="mt-1 font-display font-black tracking-tight text-3xl text-brand-text dark:text-brand-text-dark">
              <span v-if="loadingCount">…</span>
              <span v-else>{{ raceCount.toLocaleString() }}</span>
            </div>
          </div>
        </section>

        <!-- Telemetry tool callout -->
        <section class="bg-brand-accent text-white rounded p-6 sm:p-8">
          <h2 class="font-display font-black tracking-tighter leading-none text-display-sm mb-2">
            Auto-log races with <em class="not-italic underline decoration-white/40">Wreckfest Telemetry</em>
          </h2>
          <p class="font-body text-[15px] leading-relaxed text-white/85 max-w-xl mb-5">
            Run this alongside the game on Linux/Proton and it reads your race results
            straight out of Wreckfest's memory — no mods required — and posts them
            directly to your Race Log account automatically.
          </p>
          <div class="flex flex-wrap gap-3">
            <router-link
              to="/telemetry"
              class="font-display font-black uppercase tracking-widest bg-white text-brand-accent px-5 py-2.5 text-sm rounded-none hover:opacity-90 active:opacity-80 transition-opacity"
            >
              Setup guide
            </router-link>
            <a
              href="https://github.com/ampp33/wreckfest-telemetry"
              target="_blank"
              rel="noopener noreferrer"
              class="font-display font-black uppercase tracking-widest border border-white/60 text-white px-5 py-2.5 text-sm rounded-none hover:bg-white/10 transition-colors"
            >
              View on GitHub
            </a>
          </div>
        </section>
      </div>
    </main>
  </div>
</template>

<script>
import { prefsStore } from '../stores/prefsStore.js'
import { getTotalRaceCount } from '../services/publicStatsService.js'

export default {
  name: 'HomePage',
  data() {
    return {
      prefs: prefsStore,
      raceCount: 0,
      loadingCount: true
    }
  },
  async created() {
    try {
      this.raceCount = await getTotalRaceCount()
    } catch {
      // Non-critical — leave the count at 0 rather than blocking the page.
    } finally {
      this.loadingCount = false
    }
  },
  methods: {
    onToggleDark() {
      this.prefs.darkMode = !this.prefs.darkMode
    }
  }
}
</script>
