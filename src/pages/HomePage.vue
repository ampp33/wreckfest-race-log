<template>
  <div class="bg-brand-bg dark:bg-brand-bg-dark">
    <!-- The marketing page carries its own header: a visitor here isn't signed
         in, so App.vue's NavBar hasn't mounted. -->
    <header class="border-b border-brand-border dark:border-brand-border-dark">
      <div class="max-w-6xl mx-auto px-6 min-h-[72px] sm:min-h-[88px] py-3 flex items-center justify-between gap-4">
        <span class="flex items-baseline gap-2.5">
          <span class="font-display font-black tracking-tightest leading-none text-[17px] text-brand-text dark:text-brand-text-dark">WRECKFEST</span>
          <span class="ov hidden sm:inline whitespace-nowrap text-brand-accent dark:text-brand-accent-dark">RACE LOG</span>
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
            class="ov min-h-[44px] px-5 flex items-center whitespace-nowrap bg-brand-accent dark:bg-brand-accent-dark text-white hover:opacity-85"
          >Sign in</router-link>
        </div>
      </div>
    </header>

    <main>
      <!-- HERO. The W is cropped by two edges and sits behind the headline —
           the one element on the page that ignores the measure. -->
      <section class="relative overflow-hidden">
        <div
          aria-hidden="true"
          class="absolute z-0 select-none pointer-events-none font-display font-black leading-[0.8]
                 text-brand-accent dark:text-brand-accent-dark
                 text-[72vw] -right-[13vw] -top-[4vw]
                 sm:text-[42vw] sm:-right-[6vw] sm:-top-[3vw]"
        >W</div>

        <div class="relative z-10 max-w-6xl mx-auto px-6 pt-16 pb-20 sm:pt-24 sm:pb-28">
          <h1 class="font-display font-black tracking-tightest leading-[0.9] text-display-xl text-brand-text dark:text-brand-text-dark">
            Set a target.<br />Log every lap.<br />Watch the gap<br />
            <span class="outline-ink inline-block">close — or not.</span>
          </h1>
          <p class="font-body text-[17px] leading-relaxed text-brand-secondary dark:text-brand-secondary-dark max-w-lg mt-8 mb-9">
            A personal timing archive for Wreckfest. One target time per track variation,
            every run you have logged against it, and the distance in between.
          </p>
          <router-link
            to="/login"
            class="min-h-[56px] px-9 inline-flex items-center bg-brand-accent dark:bg-brand-accent-dark text-white font-bold text-[15px] tracking-tightest hover:opacity-85"
          >Start your log</router-link>
          <div class="ov text-brand-muted dark:text-brand-muted-dark mt-4">Free · your data exports whole</div>
        </div>
      </section>

      <!-- PROOF: the product itself, not a claim about it. -->
      <section class="relative z-10 max-w-6xl mx-auto px-6 mt-4 sm:mt-14">
        <div class="flex flex-wrap items-end justify-between gap-x-4 gap-y-2 border-b border-brand-border dark:border-brand-border-dark pb-3 mb-6">
          <h2 class="font-display font-black tracking-tightest leading-none text-display-sm text-brand-text dark:text-brand-text-dark flex items-baseline flex-wrap gap-x-3.5">
            <span>This is the <span class="outline-ink">whole</span> product.</span>
            <span class="ov hidden sm:inline text-brand-muted dark:text-brand-muted-dark self-end pb-2">8 columns</span>
          </h2>
          <span class="ov text-brand-muted dark:text-brand-muted-dark">Fig. — Races, newest first</span>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full min-w-[720px] border-collapse">
            <thead>
              <tr class="text-left ov text-brand-muted dark:text-brand-muted-dark border-b-2 border-brand-strong dark:border-brand-strong-dark">
                <th class="px-3.5 pb-2.5 font-medium">Date</th>
                <th class="px-3.5 pb-2.5 font-medium">Track / Variation</th>
                <th class="px-3.5 pb-2.5 font-medium">Vehicle</th>
                <th class="px-3.5 pb-2.5 font-medium">Class (PI)</th>
                <th class="px-3.5 pb-2.5 font-medium text-right">Place</th>
                <th class="px-3.5 pb-2.5 font-medium text-right">Laps</th>
                <th class="px-3.5 pb-2.5 font-medium text-right">Lap time</th>
                <th class="px-3.5 pb-2.5 font-medium text-right">Total time</th>
              </tr>
            </thead>
            <tbody class="border-b border-brand-border dark:border-brand-border-dark">
              <tr
                v-for="row in demoRaces"
                :key="row.date + row.track + row.lap"
                class="border-t border-brand-border dark:border-brand-border-dark"
              >
                <td class="px-3.5 py-2 tabular text-xs text-brand-muted dark:text-brand-muted-dark whitespace-nowrap">{{ row.date }}</td>
                <td class="px-3.5 py-2 text-[13px] whitespace-nowrap">
                  <span class="font-semibold text-brand-text dark:text-brand-text-dark">{{ row.track }}</span>
                  <span class="text-brand-muted dark:text-brand-muted-dark"> — {{ row.variation }}</span>
                </td>
                <td class="px-3.5 py-2 text-[13px] text-brand-muted dark:text-brand-muted-dark whitespace-nowrap">{{ row.vehicle }}</td>
                <td class="px-3.5 py-2 text-[13px] whitespace-nowrap">
                  <span class="font-extrabold" :style="{ color: piInfo(row.pi).color }">{{ piInfo(row.pi).cls }}</span>
                  <span class="ml-1 tabular text-brand-muted dark:text-brand-muted-dark">{{ row.pi }}</span>
                </td>
                <td class="px-3.5 py-2 text-right text-[13px] tabular" :class="row.place <= 3 ? 'font-bold' : ''">{{ row.place }}</td>
                <td class="px-3.5 py-2 text-right text-[13px] tabular text-brand-muted dark:text-brand-muted-dark">{{ row.laps }}</td>
                <td class="px-3.5 py-2 text-right text-[13px] tabular font-semibold text-brand-text dark:text-brand-text-dark">{{ row.lap }}</td>
                <td class="px-3.5 py-2 text-right text-[13px] tabular text-brand-muted dark:text-brand-muted-dark">{{ row.total }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p class="font-body text-[15px] leading-relaxed text-brand-muted dark:text-brand-muted-dark max-w-xl mt-5">
          Eight columns, sorted newest first, twenty-five to a hundred rows a page. Class colour is
          the in-game performance index band, so an A-class run never gets mistaken for a C-class one
          at a glance.<template v-if="!loadingCount && raceCount">
            <span class="ml-1 text-brand-text dark:text-brand-text-dark">{{ raceCount.toLocaleString() }} races logged across every account so far.</span>
          </template>
        </p>
      </section>

      <!-- THE MECHANIC, with the real numbers. -->
      <section class="relative z-10 max-w-6xl mx-auto px-6 mt-24 sm:mt-28">
        <div class="grid lg:grid-cols-12 gap-x-8 gap-y-10 items-end">
          <div class="lg:col-span-5">
            <div class="ov text-brand-muted dark:text-brand-muted-dark">The one comparison on the site</div>
            <h2 class="font-display font-black tracking-tightest leading-[0.9] text-display-sm text-brand-text dark:text-brand-text-dark mt-3.5 mb-4">
              A target, and<br />the gap.
            </h2>
            <p class="font-body text-[15px] leading-relaxed text-brand-muted dark:text-brand-muted-dark">
              You set the target yourself, per variation, and move it when it stops hurting. Everything
              else on the detail page exists to explain the gap: which lap of the six was the good one,
              how the trend has moved across eighteen runs, and what you wrote down last time about
              turn four.
            </p>
          </div>
          <div class="lg:col-span-7 grid grid-cols-3 gap-x-5 sm:gap-x-8">
            <div
              v-for="stat in gapStats"
              :key="stat.label"
              class="pt-3 border-t-2"
              :class="stat.accent
                ? 'border-brand-accent dark:border-brand-accent-dark'
                : 'border-brand-strong dark:border-brand-strong-dark'"
            >
              <div class="ov" :class="stat.accent
                ? 'text-brand-accent dark:text-brand-accent-dark'
                : 'text-brand-muted dark:text-brand-muted-dark'">{{ stat.label }}</div>
              <div
                class="font-display font-black tracking-tightest leading-none tabular text-[clamp(24px,3.4vw,46px)] mt-2"
                :class="stat.tone"
              >{{ stat.value }}</div>
            </div>
          </div>
        </div>
      </section>

      <!-- DOUBTS. Dense small type as counterweight to the hero. -->
      <section class="relative z-10 max-w-6xl mx-auto px-6 mt-24 sm:mt-28">
        <div class="rule-top pt-7 grid sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
          <div v-for="item in doubts" :key="item.n">
            <div class="outline-acc font-display font-black leading-[0.78] text-[96px] -ml-1.5 -mt-2">{{ item.n }}</div>
            <h3 class="font-body font-bold text-[15px] tracking-tightest leading-tight text-brand-text dark:text-brand-text-dark mt-3 mb-2.5">
              {{ item.q }}
            </h3>
            <p class="font-body text-[13px] leading-relaxed text-brand-muted dark:text-brand-muted-dark">{{ item.a }}</p>
          </div>
        </div>
      </section>

      <!-- Auto-logging. Not in the original artboard: the telemetry tool is a
           real feature the mockup predates. Kept off the red so the sign-up
           slab below stays the only one. -->
      <section class="relative z-10 max-w-6xl mx-auto px-6 mt-24 sm:mt-28">
        <div class="rule-top pt-7 grid lg:grid-cols-12 gap-x-8 gap-y-6 items-start">
          <div class="lg:col-span-5">
            <div class="ov text-brand-muted dark:text-brand-muted-dark">Or don't type at all</div>
            <h2 class="font-display font-black tracking-tightest leading-[0.9] text-display-sm text-brand-text dark:text-brand-text-dark mt-3.5">
              Wreckfest<br />Telemetry.
            </h2>
          </div>
          <div class="lg:col-span-7">
            <p class="font-body text-[15px] leading-relaxed text-brand-muted dark:text-brand-muted-dark max-w-xl">
              Run it alongside the game on Linux under Proton and it reads your race results straight
              out of Wreckfest's memory — no mods, no plugins — then posts them to your log the moment
              a race ends. Every field on this page fills itself in.
            </p>
            <div class="flex flex-wrap gap-2 mt-7">
              <router-link
                to="/telemetry"
                class="ov min-h-[44px] px-6 inline-flex items-center border border-brand-strong dark:border-brand-strong-dark text-brand-text dark:text-brand-text-dark hover:border-brand-accent dark:hover:border-brand-accent-dark"
              >Setup guide</router-link>
              <a
                href="https://github.com/ampp33/wreckfest-telemetry"
                target="_blank"
                rel="noopener noreferrer"
                class="ov min-h-[44px] px-6 inline-flex items-center border border-brand-border dark:border-brand-border-dark text-brand-muted dark:text-brand-muted-dark hover:border-brand-accent dark:hover:border-brand-accent-dark"
              >View on GitHub</a>
            </div>
          </div>
        </div>
      </section>

      <!-- CTA repeat. The page ends on the ask. -->
      <section class="relative z-10 max-w-6xl mx-auto px-6 mt-24 sm:mt-28">
        <div class="bg-brand-accent dark:bg-brand-accent-dark text-white p-10 sm:p-14 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div>
            <h2 class="font-display font-black tracking-tightest leading-none text-display-sm">Start with one lap.</h2>
            <p class="font-body text-[15px] leading-relaxed text-white/85 max-w-lg mt-4">
              Log the run you did last night. The archive is only worth anything once there is a
              second row to compare it to.
            </p>
          </div>
          <router-link
            to="/login"
            class="min-h-[56px] px-9 inline-flex items-center self-start lg:self-auto shrink-0 bg-white text-brand-accent font-bold text-[15px] tracking-tightest hover:opacity-90"
          >Start your log</router-link>
        </div>
      </section>
    </main>
  </div>
</template>

<script>
import { prefsStore } from '../stores/prefsStore.js'
import { getTotalRaceCount } from '../services/publicStatsService.js'
import { piInfo } from '../utils/piInfo.js'

export default {
  name: 'HomePage',
  data() {
    return {
      prefs: prefsStore,
      raceCount: 0,
      loadingCount: true,
      // The figure under "This is the whole product" — a static sample of the
      // real Races table, run through the app's own PI bands so the class
      // letters match what a signed-in visitor will actually see.
      // PI values sit on this app's own scale (piInfo bands at 235/165/100), not
      // the mockup's — otherwise every row renders class A and the caption below
      // contradicts the figure it is describing.
      demoRaces: [
        { date: '08.29.26', track: 'Sandpit',             variation: 'Main Loop', vehicle: 'Rocket RS',     pi: 190, place: 1, laps: 6,  lap: '1:12.483', total: '7:18.902' },
        { date: '08.28.26', track: 'Bloomfield Speedway', variation: 'Oval',      vehicle: 'Speedemon',     pi: 312, place: 3, laps: 8,  lap: '0:24.117', total: '3:16.440' },
        { date: '08.28.26', track: 'Fire Rock Raceway',   variation: 'Long',      vehicle: 'Killerbee',     pi: 205, place: 2, laps: 5,  lap: '1:44.026', total: '8:52.331' },
        { date: '08.27.26', track: 'Rattlesnake Ridge',   variation: 'Reverse',   vehicle: 'Rammer RS',     pi: 142, place: 5, laps: 4,  lap: '1:31.774', total: '6:12.588' },
        { date: '08.26.26', track: 'Big Valley Speedway', variation: 'Figure 8',  vehicle: 'Warwagon',      pi: 341, place: 1, laps: 10, lap: '0:41.209', total: '6:55.117' },
        { date: '08.25.26', track: 'Espedalen Raceway',   variation: 'Short',     vehicle: 'Roadslayer GT', pi: 178, place: 4, laps: 6,  lap: '1:08.955', total: '6:59.204' }
      ],
      gapStats: [
        { label: 'Personal best', value: '1:12.483', tone: 'text-brand-text dark:text-brand-text-dark' },
        { label: 'Goal',          value: '1:12.000', tone: 'text-brand-muted dark:text-brand-muted-dark' },
        { label: 'Gap',           value: '+0.483',   tone: 'text-brand-accent dark:text-brand-accent-dark', accent: true }
      ],
      doubts: [
        {
          n: '01',
          q: 'Do I have to type all this in by hand?',
          a: 'A race is one row. Press Q anywhere and the quick-add opens focused on the lap time — track, variation and vehicle carry over from your last entry, so a session of eight runs is eight lap times and a tab key. If you would rather not type at all, issue yourself an API key and post races in from whatever you already have running.'
        },
        {
          n: '02',
          q: 'What happens to my times if this site goes away?',
          a: 'Export the whole archive to JSON from the tracks page — every race, every split, every goal and every note, in one file, no account required to read it back. Import takes the same file. There is no export tier and nothing is held back.'
        },
        {
          n: '03',
          q: 'Is this another racing social network?',
          a: 'No. There is no feed, no friends list, no global leaderboard and no coaching. You are not ranked against strangers driving setups you do not have. The only comparison on the whole site is your current lap against the target you set yourself.'
        },
        {
          n: '04',
          q: 'Does it actually know Wreckfest?',
          a: 'All 38 tracks and 98 variations, by name, with their layout maps. Goals are set per variation, because Sandpit run backwards is not Sandpit. Drop numbered turn markers on the map and write notes against them — the ones you keep forgetting on lap four.'
        }
      ]
    }
  },
  async created() {
    try {
      this.raceCount = await getTotalRaceCount()
    } catch {
      // Non-critical — the caption reads fine without the count.
    } finally {
      this.loadingCount = false
    }
  },
  methods: {
    piInfo,
    onToggleDark() {
      this.prefs.darkMode = !this.prefs.darkMode
    }
  }
}
</script>
