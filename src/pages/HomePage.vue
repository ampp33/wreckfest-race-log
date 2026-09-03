<template>
  <div class="bg-brand-bg dark:bg-brand-bg-dark">
    <!-- The marketing page carries its own header: a visitor here isn't signed
         in, so App.vue's NavBar hasn't mounted. -->
    <header class="border-b border-brand-border dark:border-brand-border-dark">
      <div class="max-w-5xl mx-auto px-6 min-h-[72px] sm:min-h-[88px] py-3 flex items-center justify-between gap-4">
        <span class="flex items-baseline gap-2.5">
          <span class="font-display font-black tracking-tightest leading-none text-[17px] text-brand-text dark:text-brand-text-dark">WRECKFEST</span>
          <span class="ov text-brand-accent dark:text-brand-accent-dark">RACE LOG</span>
        </span>
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="ov min-h-[44px] px-4 border border-brand-border dark:border-brand-border-dark text-brand-text dark:text-brand-text-dark hover:border-brand-accent dark:hover:border-brand-accent-dark"
            @click="onToggleDark"
            :aria-label="prefs.darkMode ? 'Switch to light mode' : 'Switch to dark mode'"
          >{{ prefs.darkMode ? 'Light' : 'Dark' }}</button>
          <router-link
            to="/login"
            class="ov min-h-[44px] px-5 flex items-center bg-brand-accent dark:bg-brand-accent-dark text-white hover:opacity-85"
          >Sign in</router-link>
        </div>
      </div>
    </header>

    <main class="max-w-5xl mx-auto px-6 py-14 sm:py-20">
      <!-- Hero -->
      <section>
        <div class="ov text-brand-accent dark:text-brand-accent-dark mb-5">A personal timing archive</div>
        <h1 class="font-display font-black tracking-tightest leading-[0.86] text-display-xl text-brand-text dark:text-brand-text-dark">
          <em class="signal">Track</em><br />every race
        </h1>
        <p class="font-body text-[17px] leading-relaxed text-brand-secondary dark:text-brand-secondary-dark max-w-lg mt-7">
          Log lap times, tuning setups and results by track and vehicle. Keep the notes
          you actually write between runs. Then watch the numbers move.
        </p>
        <router-link
          to="/login"
          class="ov mt-8 min-h-[44px] px-7 inline-flex items-center bg-brand-accent dark:bg-brand-accent-dark text-white hover:opacity-85"
        >Sign in to start tracking</router-link>
      </section>

      <!-- What it holds. Three columns under one 2px rule — the same section
           head every other page in the app uses. -->
      <section class="rule-top mt-20 pt-5">
        <div class="ov text-brand-muted dark:text-brand-muted-dark">What it holds</div>
        <div class="grid sm:grid-cols-3 gap-x-8 gap-y-10 mt-8">
          <div v-for="item in features" :key="item.title">
            <h2 class="font-display font-black tracking-tightest leading-none text-[26px] text-brand-text dark:text-brand-text-dark">
              {{ item.title }}
            </h2>
            <p class="font-body text-[15px] leading-relaxed text-brand-muted dark:text-brand-muted-dark mt-3">
              {{ item.body }}
            </p>
          </div>
        </div>
      </section>

      <!-- Site stats: one number, set at page-title scale. -->
      <section class="rule-top mt-20 pt-5">
        <div class="ov text-brand-muted dark:text-brand-muted-dark">Logged so far, across everyone</div>
        <div class="flex items-baseline gap-5 flex-wrap mt-4">
          <div class="font-display font-black tracking-tightest leading-[0.86] tabular text-display-lg text-brand-text dark:text-brand-text-dark">
            <span v-if="loadingCount">—</span>
            <span v-else>{{ raceCount.toLocaleString() }}</span>
          </div>
          <div class="ov text-brand-accent dark:text-brand-accent-dark">Races</div>
        </div>
      </section>

      <!-- Telemetry callout: a red slab, full bleed inside the measure. -->
      <section class="mt-20 bg-brand-accent dark:bg-brand-accent-dark text-white p-8 sm:p-12">
        <div class="ov text-white/70">Companion tool</div>
        <h2 class="font-display font-black tracking-tightest leading-[0.86] text-display-sm mt-4">
          Auto-log races with<br />Wreckfest Telemetry
        </h2>
        <p class="font-body text-[15px] leading-relaxed text-white/85 max-w-xl mt-5">
          Run it alongside the game on Linux/Proton and it reads your race results straight
          out of Wreckfest's memory — no mods required — and posts them to your Race Log
          account automatically.
        </p>
        <div class="flex flex-wrap gap-2 mt-8">
          <router-link
            to="/telemetry"
            class="ov min-h-[44px] px-6 inline-flex items-center bg-white text-brand-accent hover:opacity-90"
          >Setup guide</router-link>
          <a
            href="https://github.com/ampp33/wreckfest-telemetry"
            target="_blank"
            rel="noopener noreferrer"
            class="ov min-h-[44px] px-6 inline-flex items-center border border-white/60 text-white hover:bg-white/10"
          >View on GitHub</a>
        </div>
      </section>
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
      loadingCount: true,
      features: [
        {
          title: 'Every lap',
          body: 'Splits per lap, the total, and your delta to the goal you set for that layout — all in one row you can scan.'
        },
        {
          title: 'Every setup',
          body: 'Vehicle, performance index and tuning ride along with the time, so a fast lap tells you what made it fast.'
        },
        {
          title: 'Every note',
          body: 'Turn-by-turn annotations pinned to the track map. What you worked out at turn 4 is still there next month.'
        }
      ]
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
