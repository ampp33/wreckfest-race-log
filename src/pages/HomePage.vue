<template>
  <div class="bg-brand-bg dark:bg-brand-bg-dark">
    <!-- The marketing page carries its own header: a visitor here isn't signed
         in, so App.vue's NavBar hasn't mounted. -->
    <header class="border-b border-brand-border dark:border-brand-border-dark">
      <div class="max-w-7xl mx-auto px-6 min-h-[72px] sm:min-h-[88px] py-3 flex items-center justify-between gap-4">
        <span class="flex items-baseline gap-2.5">
          <span class="font-display font-black tracking-tightest leading-none text-[26px] text-brand-text dark:text-brand-text-dark">WRECKFEST</span>
          <span class="ov-lg hidden sm:inline whitespace-nowrap text-brand-accent dark:text-brand-accent-dark" style="font-size: 16px">RACE LOG</span>
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

        <div class="relative z-10 max-w-7xl mx-auto px-6 pt-16 pb-8 sm:pt-24 sm:pb-10">
          <h1 class="font-display font-black tracking-tightest leading-[0.9] text-display-xl text-brand-text dark:text-brand-text-dark">
            Set a target.<br />Log every lap.<br />Watch the gap<br />
            <span class="outline-ink inline-block">close — or not.</span>
          </h1>
          <p class="font-body text-[17px] leading-relaxed text-brand-secondary dark:text-brand-secondary-dark max-w-lg mt-8 mb-9">
            A personal race log for Wreckfest, powered by <b>two tools</b>: the
            <b>Telemetry plugin</b> that automatically reads race results from the
            game and posts them to <b>this site</b>, so you can track your progress and watch your progress towards becoming a better racer.
          </p>
          <div class="flex flex-wrap gap-3">
            <router-link
              to="/plugin"
              class="min-h-[56px] px-9 inline-flex items-center bg-brand-accent dark:bg-brand-accent-dark text-white font-bold text-[15px] tracking-tightest hover:opacity-85"
              >Setup Automatic Race Tracking</router-link>
              <router-link
              to="/login"
              class="min-h-[56px] px-9 inline-flex items-center border border-brand-strong dark:border-brand-strong-dark text-brand-text dark:text-brand-text-dark font-bold text-[15px] tracking-tightest hover:border-brand-accent dark:hover:border-brand-accent-dark"
            >Start logging your races</router-link>
          </div>
          <div class="ov text-brand-muted dark:text-brand-muted-dark mt-4">Free · your data exports whole</div>
        </div>
      </section>

      <!-- PAIR: both halves, named and linked, before either is shown alone.
           The mockup this page started from predates the telemetry tool, which
           used to live as a bolted-on section near the bottom — moved up front
           because the log and the plugin aren't really two products. -->
      <section class="relative z-10 max-w-7xl mx-auto px-6 mt-8 sm:mt-10">
        <div class="flex flex-wrap items-end justify-between gap-x-4 gap-y-2 border-b border-brand-border dark:border-brand-border-dark pb-3 mb-6">
          <h2 class="font-display font-black tracking-tightest leading-none text-display-sm text-brand-text dark:text-brand-text-dark">
            One <span class="outline-ink">system</span>, two halves.
          </h2>
          <span class="ov text-brand-muted dark:text-brand-muted-dark">Fig. — How it fits together</span>
        </div>

        <div class="grid sm:grid-cols-2 gap-x-8 gap-y-10">
          <div>
            <div class="outline-acc font-display font-black leading-[0.78] text-[96px] -ml-1.5 -mt-2">01</div>
            <h3 class="font-body font-bold text-[19px] tracking-tightest leading-tight text-brand-text dark:text-brand-text-dark mt-3 mb-3">
              Telemetry reads the race.
            </h3>
            <p class="font-body text-[15px] leading-relaxed text-brand-muted dark:text-brand-muted-dark mb-5">
              The Telemetry plugin runs alongside Wreckfest and automatically reads
              results straight out of the game's memory, then automatically posts them
              to your log the moment the race ends. No mods, no manual entry.
            </p>
            <div class="flex flex-wrap gap-2">
              <router-link
                to="/plugin"
                class="ov min-h-[44px] px-5 inline-flex items-center bg-brand-accent dark:bg-brand-accent-dark text-white hover:opacity-85"
              >Setup guide</router-link>
              <a
                href="https://github.com/ampp33/wreckfest-telemetry"
                target="_blank"
                rel="noopener noreferrer"
                class="ov min-h-[44px] px-5 inline-flex items-center border border-brand-border dark:border-brand-border-dark text-brand-muted dark:text-brand-muted-dark hover:border-brand-accent dark:hover:border-brand-accent-dark"
              >View on GitHub</a>
            </div>
          </div>
          <div>
            <div class="outline-acc font-display font-black leading-[0.78] text-[96px] -ml-1.5 -mt-2">02</div>
            <h3 class="font-body font-bold text-[19px] tracking-tightest leading-tight text-brand-text dark:text-brand-text-dark mt-3 mb-3">
              The log tracks the gap.
            </h3>
            <p class="font-body text-[15px] leading-relaxed text-brand-muted dark:text-brand-muted-dark">
              Every race that lands — typed in or posted by the plugin — is checked against the
              target time you set for that track variation: lap splits charted, personal bests
              rolled up, the trend visible across every run you've logged. That's everything below.
            </p>
          </div>
        </div>
      </section>

      <!-- PROOF: the product itself, not a claim about it. -->
      <section class="relative z-10 max-w-7xl mx-auto px-6 mt-16 sm:mt-20">
        <div class="flex flex-wrap items-end justify-between gap-x-4 gap-y-2 border-b border-brand-border dark:border-brand-border-dark pb-3 mb-6">
          <h2 class="font-display font-black tracking-tightest leading-none text-display-sm text-brand-text dark:text-brand-text-dark flex items-baseline flex-wrap gap-x-3.5">
            <span><span class="outline-ink">Analyze</span> your races.</span>
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
                <th class="pl-3.5 pb-2.5 font-medium w-10"></th>
              </tr>
            </thead>
            <tbody class="border-b border-brand-border dark:border-brand-border-dark">
              <template v-for="(row, i) in demoRaces" :key="row.date + row.track + row.lap">
                <tr class="border-t border-brand-border dark:border-brand-border-dark">
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
                  <td class="pl-3.5 py-2 text-right whitespace-nowrap">
                    <button
                      v-if="row.expandable"
                      type="button"
                      class="min-h-[36px] min-w-[36px] inline-flex items-center justify-center text-brand-muted dark:text-brand-muted-dark hover:text-brand-accent dark:hover:text-brand-accent-dark"
                      :aria-label="expandedDemoRow === i ? 'Collapse row' : 'Expand row'"
                      @click="expandedDemoRow = expandedDemoRow === i ? null : i"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
                        <path d="M4 10h12" />
                        <path v-if="expandedDemoRow !== i" d="M10 4v12" />
                      </svg>
                    </button>
                  </td>
                </tr>
                <tr v-if="row.expandable && expandedDemoRow === i">
                  <td colspan="9" class="p-4 sm:p-5 bg-brand-surface dark:bg-brand-surface-dark">
                    <div class="grid sm:grid-cols-2 gap-x-8 gap-y-6">
                      <div>
                        <div class="ov text-brand-accent dark:text-brand-accent-dark mb-1.5">Notes</div>
                        <p class="font-body text-[13px] text-brand-secondary dark:text-brand-secondary-dark mb-5">{{ row.tuning }}</p>
                        <div class="ov text-brand-accent dark:text-brand-accent-dark mb-1.5">Lap times</div>
                        <LapSplitsChart :lap-times="row.lapTimesMs" />
                      </div>
                      <div>
                        <div class="ov text-brand-accent dark:text-brand-accent-dark mb-1.5">Roster</div>
                        <RaceResultsRoster :roster="row.roster" />
                      </div>
                    </div>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>

        <p class="font-body text-[15px] leading-relaxed text-brand-muted dark:text-brand-muted-dark max-w-xl mt-5">
          Your data — typed in or posted straight from Telemetry — sorted newest first, listed and
          charted — expand a row (▸) for its full lap splits, tuning notes and race roster.  <template v-if="!loadingCount && raceCount">
            <span class="ml-1 text-brand-text dark:text-brand-text-dark">{{ raceCount.toLocaleString() }} races logged across every account so far.</span>
          </template>
        </p>

        <div class="mt-8 pt-5 border-t border-brand-border dark:border-brand-border-dark">
          <div class="ov text-brand-muted dark:text-brand-muted-dark mb-3">Rolled up on the Stats page</div>
          <div class="grid grid-cols-3 gap-x-5 sm:gap-x-6 max-w-xl">
            <div
              v-for="stat in statTiles"
              :key="stat.label"
              class="pt-3 border-t-2 border-brand-strong dark:border-brand-strong-dark"
            >
              <div class="ov text-brand-muted dark:text-brand-muted-dark">{{ stat.label }}</div>
              <div class="font-display font-black tracking-tightest leading-none text-[clamp(14px,1.7vw,20px)] mt-2 text-brand-text dark:text-brand-text-dark">
                {{ stat.value }}
              </div>
              <div v-if="stat.sub" class="font-body text-[11px] text-brand-muted dark:text-brand-muted-dark mt-1.5">{{ stat.sub }}</div>
            </div>
          </div>
        </div>
      </section>

      <!-- STATS PAGE: activity and goal progress, the other two things it tracks. -->
      <section class="relative z-10 max-w-7xl mx-auto px-6 mt-16 sm:mt-20">
        <div class="flex flex-wrap items-end justify-between gap-x-4 gap-y-2 border-b border-brand-border dark:border-brand-border-dark pb-3 mb-6">
          <h2 class="font-display font-black tracking-tightest leading-none text-display-sm text-brand-text dark:text-brand-text-dark">
            Then it <span class="outline-ink">adds it all up</span>.
          </h2>
          <span class="ov text-brand-muted dark:text-brand-muted-dark">Fig. — Activity & goals</span>
        </div>

        <div class="grid lg:grid-cols-2 gap-x-10 gap-y-10">
          <div>
            <RaceActivityChart :daily-counts="activityDailyCounts" :hourly-counts="activityHourlyCounts" initial-tab="year" />
            <p class="font-body text-[13px] leading-relaxed text-brand-muted dark:text-brand-muted-dark mt-3">
              The same chart on the Stats page, switchable between day, week, month and year.
            </p>
          </div>
          <div>
            <div class="ov text-brand-muted dark:text-brand-muted-dark mb-3">Goal progress</div>
            <ul class="divide-y divide-brand-border dark:divide-brand-border-dark border-t border-brand-border dark:border-brand-border-dark">
              <li
                v-for="row in goalProgressDemo"
                :key="row.track + row.variation"
                class="flex items-center justify-between gap-4 py-2.5"
              >
                <div class="min-w-0 text-[13px]">
                  <span class="font-semibold text-brand-text dark:text-brand-text-dark">{{ row.track }}</span>
                  <span class="text-brand-muted dark:text-brand-muted-dark"> — {{ row.variation }}</span>
                </div>
                <div class="flex items-center gap-3.5 shrink-0">
                  <div class="text-right">
                    <div class="ov text-brand-muted dark:text-brand-muted-dark leading-none mb-0.5">Goal</div>
                    <div class="tabular text-[13px] text-brand-text dark:text-brand-text-dark">{{ row.goal }}</div>
                  </div>
                  <div class="text-right">
                    <div class="ov text-brand-muted dark:text-brand-muted-dark leading-none mb-0.5">Best</div>
                    <div class="tabular text-[13px] text-brand-text dark:text-brand-text-dark">{{ row.best }}</div>
                  </div>
                  <div class="text-right min-w-[3.5rem]">
                    <div class="ov text-brand-muted dark:text-brand-muted-dark leading-none mb-0.5">Δ</div>
                    <div
                      class="tabular text-[13px] font-semibold"
                      :class="row.beat ? 'text-brand-good dark:text-brand-good-dark' : 'text-brand-accent dark:text-brand-accent-dark'"
                    >{{ row.delta }}</div>
                  </div>
                </div>
              </li>
            </ul>
            <p class="font-body text-[13px] leading-relaxed text-brand-muted dark:text-brand-muted-dark mt-3">
              Set once per variation, and re-checked against your personal best every time you log a lap.
            </p>
          </div>
        </div>
      </section>

      <!-- THE MECHANIC, with the real numbers. -->
      <section class="relative z-10 max-w-7xl mx-auto px-6 mt-16 sm:mt-20">
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

      <!-- DOUBTS. -->
      <section class="relative z-10 max-w-7xl mx-auto px-6 mt-9 sm:mt-12">
        <div class="rule-top pt-7 grid sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
          <div v-for="item in doubts" :key="item.n">
            <div class="outline-acc font-display font-black leading-[0.78] text-[96px] -ml-1.5 -mt-2">{{ item.n }}</div>
            <h3 class="font-body font-bold text-[19px] tracking-tightest leading-tight text-brand-text dark:text-brand-text-dark mt-3 mb-3">
              {{ item.q }}
            </h3>
            <p class="font-body text-[15px] leading-relaxed text-brand-muted dark:text-brand-muted-dark">{{ item.a }}</p>
          </div>
        </div>
      </section>

      <!-- CTA repeat. The page ends on the ask. -->
      <section class="relative z-10 max-w-7xl mx-auto px-6 mt-16 sm:mt-20">
        <div class="bg-brand-accent dark:bg-brand-accent-dark text-white p-10 sm:p-14 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div>
            <h2 class="font-display font-black tracking-tightest leading-none text-display-sm">Start with one lap.</h2>
            <p class="font-body text-[15px] leading-relaxed text-white/85 max-w-lg mt-4">
              Log the run you did last night — by hand, or let Telemetry post it for you. The
              archive is only worth anything once there is a second row to compare it to.
            </p>
          </div>
          <div class="flex flex-wrap gap-3 self-start lg:self-auto shrink-0">
            <router-link
              to="/login"
              class="min-h-[56px] px-9 inline-flex items-center bg-white text-brand-accent font-bold text-[15px] tracking-tightest hover:opacity-90"
            >Start your log</router-link>
            <router-link
              to="/plugin"
              class="min-h-[56px] px-9 inline-flex items-center border border-white/50 text-white font-bold text-[15px] tracking-tightest hover:border-white"
            >Setup Telemetry</router-link>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script>
import { prefsStore } from '../stores/prefsStore.js'
import { getTotalRaceCount } from '../services/publicStatsService.js'
import { piInfo } from '../utils/piInfo.js'
import LapSplitsChart from '../components/LapSplitsChart.vue'
import RaceResultsRoster from '../components/RaceResultsRoster.vue'
import RaceActivityChart from '../components/RaceActivityChart.vue'

// Builds a dailyCounts object (the shape RaceActivityChart/getStats produce)
// relative to *today*, not a fixed date, so the "year" tab keeps showing a
// full trailing 12 months no matter when a visitor actually loads the page.
// A count every 3rd day, busier on weekends and trending up in more recent
// months, is enough shape for the bars to read as a real, growing log without
// hand-authoring hundreds of entries.
function buildDemoDailyCounts() {
  const now = new Date()
  const counts = {}
  for (let monthsAgo = 11; monthsAgo >= 0; monthsAgo--) {
    const base = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1)
    const daysInMonth = new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate()
    const monthWeight = 1 + (11 - monthsAgo) * 0.35
    for (let day = 1; day <= daysInMonth; day += 3) {
      const d = new Date(base.getFullYear(), base.getMonth(), day)
      if (d > now) continue
      const isWeekend = d.getDay() === 0 || d.getDay() === 6
      const count = Math.round((isWeekend ? 2 : 1) * monthWeight)
      if (count <= 0) continue
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      counts[key] = count
    }
  }
  return counts
}

export default {
  name: 'HomePage',
  components: { LapSplitsChart, RaceResultsRoster, RaceActivityChart },
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
        {
          date: '08.29.26', track: 'Sandpit', variation: 'Main Loop', vehicle: 'Rocket RS',
          pi: 190, place: 1, laps: 6, lap: '1:12.483', total: '7:18.902',
          // The one row visitors see expanded by default — a taste of what's
          // behind every race, not just this demo table.
          expandable: true,
          tuning: 'Can\'t seem to keep grip around 2nd corner, need to ease into the gas more.',
          lapTimesMs: [74850, 73920, 72483, 74100, 73330, 70219],
          roster: [
            { position: 1, name: 'You', car: 'Rocket RS', class: 'B 190', best_lap_ms: 72483, total_time_ms: 438902, laps_completed: 6 },
            { position: 2, name: 'Vex_Raptor', car: 'Warwagon', class: 'A 241', best_lap_ms: 74110, total_time_ms: 442770, laps_completed: 6 },
            { position: 3, name: 'Nightshade', car: 'Killerbee', class: 'B 205', best_lap_ms: 76310, total_time_ms: 451200, laps_completed: 6 },
            { position: 4, name: 'Bumper_Bill', car: 'Speedemon', class: 'C 150', best_lap_ms: 79880, total_time_ms: 468920, laps_completed: 6 },
            { position: 5, name: 'Rusty_Cage', car: 'Rammer RS', class: 'C 142', best_lap_ms: 81002, total_time_ms: 471340, laps_completed: 6 },
            { position: null, name: 'Wreckwood', car: 'Boneshaker', class: 'D 89', dnf: true, laps_completed: 3 }
          ]
        },
        { date: '08.28.26', track: 'Bloomfield Speedway', variation: 'Oval',      vehicle: 'Speedemon',     pi: 312, place: 3, laps: 8,  lap: '0:24.117', total: '3:16.440' },
        { date: '08.28.26', track: 'Fire Rock Raceway',   variation: 'Long',      vehicle: 'Killerbee',     pi: 205, place: 2, laps: 5,  lap: '1:44.026', total: '8:52.331' },
        { date: '08.27.26', track: 'Rattlesnake Ridge',   variation: 'Reverse',   vehicle: 'Rammer RS',     pi: 142, place: 5, laps: 4,  lap: '1:31.774', total: '6:12.588' },
        { date: '08.26.26', track: 'Big Valley Speedway', variation: 'Figure 8',  vehicle: 'Warwagon',      pi: 341, place: 1, laps: 10, lap: '0:41.209', total: '6:55.117' },
        { date: '08.25.26', track: 'Espedalen Raceway',   variation: 'Short',     vehicle: 'Roadslayer GT', pi: 178, place: 4, laps: 6,  lap: '1:08.955', total: '6:59.204' }
      ],
      // Expanded by default so the payoff (lap chart + roster) is visible
      // without requiring a click; set to null to collapse.
      expandedDemoRow: 0,
      statTiles: [
        { label: 'Most used vehicle', value: 'Rocket RS', sub: '42 races' },
        { label: 'Most raced variation', value: 'Sandpit — Main Loop', sub: '28 races' },
        { label: 'Total races logged', value: '214' }
      ],
      // "Then it adds it all up" — the Stats page's activity chart, defaulting
      // to its Year tab so the bars read as races-per-month at a glance.
      activityDailyCounts: buildDemoDailyCounts(),
      // Day-tab filler so switching tabs on the demo doesn't go blank — an
      // evening-heavy session pattern, same shape a real player's would take.
      activityHourlyCounts: [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 5, 6, 8, 9, 7, 5, 3, 2, 1],
      // Same rows and numbers as the "Personal best / Goal / Gap" tiles further
      // down the page, so the two sections don't contradict each other.
      goalProgressDemo: [
        { track: 'Bloomfield Speedway', variation: 'Oval', goal: '0:24.500', best: '0:24.117', delta: '-0.383', beat: true },
        { track: 'Fire Rock Raceway', variation: 'Long', goal: '1:45.000', best: '1:44.026', delta: '-0.974', beat: true },
        { track: 'Sandpit', variation: 'Main Loop', goal: '1:12.000', best: '1:12.483', delta: '+0.483', beat: false },
        { track: 'Rattlesnake Ridge', variation: 'Reverse', goal: '1:30.000', best: '1:31.774', delta: '+1.774', beat: false }
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
          a: 'A race is one row. Press Q anywhere and the quick-add opens focused on the lap time — track, variation and vehicle carry over from your last entry, so a session of eight runs is eight lap times and a tab key. If you would rather not type at all, run the Telemetry plugin alongside the game — it reads and posts each race automatically the moment it ends — or issue yourself an API key and post from whatever else you have running.'
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
