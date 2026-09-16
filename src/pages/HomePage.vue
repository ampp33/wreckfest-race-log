<template>
  <div>
    <PublicHeader />

    <!-- HERO — inlined here rather than its own component now that the
         design (car watermark + gutter) is settled; it used to be a
         separate HeroIntro.vue while that was still being worked out. Its
         mounted/beforeUnmount toggling #app's has-hero-car-bg class moved
         to this component's own script for the same reason (see there).

         sm:pl-[22vw] (replacing the plain sm:px-10 left side) makes room
         for the car watermark running up the left edge (see style.css) —
         sized to clear its ~22vw visible width (25vw background-size, -3vw
         bled off the left edge), so the wheels point at empty space rather
         than the text. Only kicks in at the same sm breakpoint the car
         itself appears at; below that the car is hidden and this container
         falls back to the plain centered px-6 gutter. This 22vw is the
         page's one shared body-copy left edge at sm+ — the "Everything, on
         record."/"How to get started." sections and the numbered timeline
         below all key off this same value (see their own comments) so
         every section's text lands on one consistent line regardless of
         viewport width, car-clearance or not.

         sm:pr-[22vw] mirrors that same value on the right, in place of a
         plain sm:pr-10 — purely a visual-balance move, not a repositioning
         one: the text's own left edge doesn't move (sm:pl-[22vw] is
         untouched), this just gives the right side a matching margin so
         the block reads as a centered column instead of one huge gutter on
         the left and a bare 40px on the right. -->
    <section>
      <div class="mx-auto px-6 sm:pr-[22vw] sm:pl-[22vw] pt-16 pb-8 sm:pt-16 sm:pb-10">
        <h1 class="font-display font-black tracking-tightest leading-[0.9] text-display-xl text-brand-text dark:text-brand-text-dark">
          Track every race.<br><em class="font-heading font-normal tracking-normal signal">Sharpen your skills.</em>
        </h1>
        <p class="font-body text-[17px] leading-relaxed text-brand-secondary dark:text-brand-secondary-dark max-w-lg mt-8">
          <b>Wreckfest Race Log</b> is exactly what the name says — it's an online race log and note tracking tool for Wreckfest. Track every race automatically with the <router-link to="/plugin" class="font-bold hover:underline">Telemetry plugin</router-link>,
          or manually log them yourself here — then use the site to watch your stats improve, take notes
          track by track, and work toward mastering the game.
        </p>
        <p class="font-body text-[17px] leading-relaxed text-brand-secondary dark:text-brand-secondary-dark max-w-lg mt-4">
          <i>I built this site because I wanted a pretty and simple way to log my races and take notes, and I hope it helps you as much as it's helped me.</i> — Ampp33
        </p>
      </div>
    </section>

    <main>
      <!-- WHY TWO TOOLS — its sm:pl-[22vw]/sm:pr-[22vw] pair matches the
           hero section's own above (see style.css and its own comment on
           why the right side mirrors the left) — the hero car watermark's
           bleed runs the full height of this section too (747px hero + up
           to 1436px of car vs. this section's own ~560px), so its heading
           and copy need the same clearance, not just the hero's. -->
      <section class="mx-auto px-6 sm:pr-[22vw] sm:pl-[22vw] pt-4 pb-10">
        <h1 class="font-display font-black tracking-tightest leading-[0.92] text-display-lg text-brand-text dark:text-brand-text-dark">
          Everything, on <em class="font-heading font-normal tracking-normal signal">record</em>.
        </h1>
        <div class="mt-5 max-w-3xl space-y-3">
          <div>
            <h2 class="font-body font-bold text-[15px] tracking-tight text-brand-text dark:text-brand-text-dark mb-1.5">A Complete History of All Your Races</h2>
            <p class="font-body text-[16px] leading-relaxed text-brand-secondary dark:text-brand-secondary-dark">Full details about every race you've joined, all logged in one place.</p>
            <p class="font-body text-[16px] leading-relaxed text-brand-secondary dark:text-brand-secondary-dark">Revisit car details, tunings, lap times, race rosters, best laps, and positions.</p>
          </div>

          <div>
            <h2 class="font-body font-bold text-[15px] tracking-tight text-brand-text dark:text-brand-text-dark mb-1.5">Notes and Annotations</h2>
            <p class="font-body text-[16px] leading-relaxed text-brand-secondary dark:text-brand-secondary-dark">Forgot your brake points? Where hazards are? Or how to take tricky turns?  Not anymore.</p>
            <p class="font-body text-[16px] leading-relaxed text-brand-secondary dark:text-brand-secondary-dark">Keep notes on every track, every variation, and even add annotations to track maps.</p>
            <p class="font-body text-[16px] leading-relaxed text-brand-secondary dark:text-brand-secondary-dark">Jot down what works, what doesn't, shortcuts, and everything in between.</p>
          </div>

          <div>
            <h2 class="font-body font-bold text-[15px] tracking-tight text-brand-text dark:text-brand-text-dark mb-1.5">Stats, Stats, Stats</h2>
            <p class="font-body text-[16px] leading-relaxed text-brand-secondary dark:text-brand-secondary-dark">With all your data in one place, you can run the numbers to see the metrics that matter.</p>
            <p class="font-body text-[16px] leading-relaxed text-brand-secondary dark:text-brand-secondary-dark">Total number of races, most used vehicle, favorite track, races per week/month/year, goal lap time deltas, biggest improvements, and more.</p>
          </div>

          <div>
            <h2 class="font-body font-bold text-[15px] tracking-tight text-brand-text dark:text-brand-text-dark mb-1.5">More on the Horizon</h2>
            <p class="font-body text-[16px] leading-relaxed text-brand-secondary dark:text-brand-secondary-dark">This site is actively being developed — expect more features and fixes in the near future.</p>
            <p class="font-body text-[16px] leading-relaxed text-brand-secondary dark:text-brand-secondary-dark italic">Don't see a feature you want? Hit the Feedback button and leave a comment.</p>
          </div>
        </div>
      </section>

      <!-- HOW TO GET STARTED + TIMELINE: one section now (previously two
           separate <section>s, the heading with its own outer padding and
           the timeline with a different one) — that split is exactly how
           the two drifted out of alignment with each other across this
           conversation. One shared px-6/sm:pl-[22vw]/sm:pr-[22vw] here
           (matching the "Everything, on record." section above) means
           there's only one place left to change if this needs to move
           again.

           The heading sits flush against this section's own edge; the
           timeline below it is indented further in by its own inner
           pl-10 wrapper, which only sets the circle gutter — a single,
           fixed, non-responsive value that never changes size, so the
           heading and the step text (h2/p/link) do NOT currently share a
           left edge (the steps sit pl-10 to the right of the heading, with
           the numbered circles hanging further left again, off that same
           pl-10 wrapper). Putting the section's own margin AND the circle
           gutter on one element is what caused an actual bug once: they'd
           both set padding-left, so which one won depended on their order
           in Tailwind's *compiled* stylesheet, not on anything visible
           here — and that ordering doesn't necessarily stay stable across
           breakpoints, which is exactly why the line and circles could
           drift apart as the window resized. Keeping the gutter on its own
           dedicated wrapper, fixed and unresponsive, is what lets the
           circles and line hold their fixed offsets (left-5 / -left-9) at
           every width, full stop. -->
      <section class="mx-auto px-6 sm:pr-[22vw] sm:pl-[22vw] pt-4 pb-10">
        <h1 class="font-display font-black tracking-tightest leading-[0.92] text-display-lg text-brand-text dark:text-brand-text-dark mb-6">
          <em class="font-heading font-normal tracking-normal signal">How</em> to get started.
        </h1>

        <div class="relative pl-10">
          <div class="absolute left-5 top-2 bottom-2 w-0.5 bg-brand-border dark:bg-brand-border-dark"></div>

          <div class="relative mb-12">
            <div class="absolute -left-9 -top-[7px] w-8 h-8 rounded-full bg-brand-accent dark:bg-brand-accent-dark text-white font-display font-black text-[13px] flex items-center justify-center">1</div>
            <h2 class="font-body font-bold text-[18px] leading-none tracking-tightest text-brand-text dark:text-brand-text-dark mb-2">Create an account.</h2>
            <p class="font-body text-[14px] text-brand-muted dark:text-brand-muted-dark mb-3">Email or Google — either works, takes about ten seconds, no credit card, no personal info (we don't need it anyway).</p>
            <router-link to="/login" class="ov text-brand-accent dark:text-brand-accent-dark hover:underline">Create your account →</router-link>
          </div>

          <div class="relative mb-12">
            <div class="absolute -left-9 -top-[7px] w-8 h-8 rounded-full bg-brand-accent dark:bg-brand-accent-dark text-white font-display font-black text-[13px] flex items-center justify-center">2</div>
            <h2 class="font-body font-bold text-[18px] leading-none tracking-tightest text-brand-text dark:text-brand-text-dark mb-1">
              <router-link to="/plugin" class="hover:underline">Install the Telemetry plugin.</router-link>
            </h2>
            <p class="font-body text-[14px] text-brand-muted dark:text-brand-muted-dark max-w-3xl mb-3">Install it once. It runs quietly alongside Wreckfest and reads your results straight out of the game's own memory the instant a race ends — then posts them here automatically.</p>
            <router-link to="/plugin" class="ov text-brand-accent dark:text-brand-accent-dark hover:underline">Install Telemetry →</router-link>
          </div>

          <div class="relative mb-12">
            <div class="absolute -left-9 -top-[7px] w-8 h-8 rounded-full bg-brand-strong dark:bg-brand-strong-dark text-brand-bg dark:text-brand-bg-dark font-display font-black text-[13px] flex items-center justify-center">3</div>
            <h2 class="font-body font-bold text-[18px] leading-none tracking-tightest text-brand-text dark:text-brand-text-dark mb-2">Race in Wreckfest.</h2>
            <p class="font-body text-[14px] text-brand-muted dark:text-brand-muted-dark">Any track, any variation, any car. This part happens in the game, not here.</p>
          </div>

          <div class="relative mb-12">
            <div class="absolute -left-9 -top-[7px] w-8 h-8 rounded-full bg-brand-strong dark:bg-brand-strong-dark text-brand-bg dark:text-brand-bg-dark font-display font-black text-[13px] flex items-center justify-center">4</div>
            <h2 class="font-body font-bold text-[18px] leading-none tracking-tightest text-brand-text dark:text-brand-text-dark mb-1">Annotate.</h2>
            <p class="font-body text-[14px] text-brand-muted dark:text-brand-muted-dark max-w-3xl mb-3">View your latest logs on the Races screen, annotate the track diagram or add notes.  Did you forget that rock at the first corner?  Now's the time to make a note of that.</p>
          </div>

          <div class="relative mb-12">
            <div class="absolute -left-9 -top-[7px] w-8 h-8 rounded-full bg-brand-strong dark:bg-brand-strong-dark text-brand-bg dark:text-brand-bg-dark font-display font-black text-[13px] flex items-center justify-center">5</div>
            <h2 class="font-body font-bold text-[18px] leading-none tracking-tightest text-brand-text dark:text-brand-text-dark mb-2">Set your goals and chase them.</h2>
            <HomeGapTiles :goal="flagshipGoal" />
          </div>

          <div class="relative mb-12">
            <div class="absolute -left-9 -top-[7px] w-8 h-8 rounded-full bg-brand-strong dark:bg-brand-strong-dark text-brand-bg dark:text-brand-bg-dark font-display font-black text-[13px] flex items-center justify-center">6</div>
            <h2 class="font-body font-bold text-[18px] leading-none tracking-tightest text-brand-text dark:text-brand-text-dark mb-3">Review your races, track your goals and progress.</h2>
            <HomeRacesTable :rows="races" :initial-expanded="flagshipRaceIndex" :fade-after-index="4" />
          </div>

          <div class="relative">
            <div class="absolute -left-9 -top-[7px] w-8 h-8 rounded-full bg-brand-strong dark:bg-brand-strong-dark text-brand-bg dark:text-brand-bg-dark font-display font-black text-[13px] flex items-center justify-center">7</div>
            <h2 class="font-body font-bold text-[18px] leading-none tracking-tightest text-brand-text dark:text-brand-text-dark mb-3">Explore your stats.</h2>
            <p class="font-body text-[14px] text-brand-muted dark:text-brand-muted-dark mb-4">Real numbers, rolled up across this account's whole history:</p>
            <HomeStatsPreview :stats="statsPreview" :improvements-fade-after-index="1" />
          </div>
        </div>
      </section>

      <!-- CTA — max-w-7xl matches the rest of the page; the original
           production homepage's own CTA band used this same width. -->
      <section class="mx-auto px-6 sm:pr-[22vw] sm:pl-[22vw] pt-4 pb-8">
        <div class="relative bg-brand-accent dark:bg-brand-accent-dark text-center overflow-hidden py-[clamp(28px,8cqw,80px)] [container-type:inline-size]">
          <h2
            aria-hidden="true"
            class="absolute inset-0 flex flex-col items-center justify-center font-heading font-normal tracking-normal leading-none text-white text-[clamp(40px,15cqw,130px)] px-2 select-none pointer-events-none"
          ><span>What are you</span><span>waiting for?</span></h2>
          <div class="relative flex flex-wrap justify-center gap-3">
            <span class="sr-only">What are you waiting for?</span>
            <router-link to="/login" class="min-h-[48px] px-7 inline-flex items-center border border-white/50 text-white font-bold text-[14px] bg-brand-accent dark:bg-brand-accent-dark">Create an Account</router-link>
            <router-link to="/plugin" class="min-h-[48px] px-7 inline-flex items-center bg-white text-brand-accent font-bold text-[14px]">Install Telemetry</router-link>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script>
import PublicHeader from '../components/PublicHeader.vue'
import HomeGapTiles from '../components/HomeGapTiles.vue'
import HomeRacesTable from '../components/HomeRacesTable.vue'
import HomeStatsPreview from '../components/HomeStatsPreview.vue'

export default {
  name: 'HomePage',
  components: { PublicHeader, HomeGapTiles, HomeRacesTable, HomeStatsPreview },
  // The car watermark itself is a background-image on #app, the Vue mount
  // div (see style.css for why #app rather than <body>) — toggled here via
  // mounted/beforeUnmount rather than living in the hero section's own
  // markup above, since a background this large needs to bleed past that
  // section's own box (and did, back when it lived inside it — see git
  // history on this file, and on the old HeroIntro.vue this hero section
  // used to be its own component, for the CSS-transform approach that got
  // abandoned) rather than being clipped to it.
  mounted() {
    document.getElementById('app').classList.add('has-hero-car-bg')
  },
  beforeUnmount() {
    document.getElementById('app').classList.remove('has-hero-car-bg')
  },
  data() {
    return {
      // A real snapshot pulled directly from this app's own production
      // database (read-only, via the linked `supabase` CLI session,
      // 2026-09-12) — real tracks, vehicles, lap times, roster. Race notes
      // are deliberately omitted (real, but not homepage material — several
      // are genuine trash talk about other players); the roster's other
      // names are real public multiplayer handles, same as a Wreckfest
      // results screen would show.
      flagshipRaceIndex: 1, // Fire Rock Raceway — the one with real laps + roster
      races: [
        { id: 'afb9bb8e', datetime: '2026-09-12T03:47:36.339763+00:00', track: 'Savolax Sandpit', variation: 'Main Route Reverse', vehicle: 'Raiden RS', performance_index: 164, place: '2', lap_count: 5, lap_time_ms: 69013, total_time_ms: 352547,
          lap_times_ms: [74782, 69520, 69013, 69478, 69754],
          results_roster: [
            { position: 1, name: 'TSiSVT', car: 'Super Venom', class: 'C 164', best_lap_ms: 68060, total_time_ms: 348134, laps_completed: 5 },
            { position: 2, name: 'Ampp33', car: 'Raiden RS', class: 'C 164', best_lap_ms: 69013, total_time_ms: 352547, laps_completed: 5 },
            { position: 3, name: 'DonCobra', car: 'Sunrise Super', class: 'C 164', best_lap_ms: 71768, total_time_ms: 368236, laps_completed: 5 },
            { position: 4, name: 'ColeTrickle2709', car: 'Rocket Rx', class: 'C 164', best_lap_ms: 71621, total_time_ms: 368715, laps_completed: 5 },
            { position: 5, name: 'speedgamer5', car: 'Venom', class: 'C 164', best_lap_ms: 72685, total_time_ms: 369998, laps_completed: 5 },
            { position: 6, name: 'TRACANGUS', car: 'Rocket', class: 'C 164', best_lap_ms: 71810, total_time_ms: 370328, laps_completed: 5 }
          ]
        },
        { id: '8ae9ca4d', datetime: '2026-09-12T03:39:21.026537+00:00', track: 'Fire Rock Raceway', variation: 'Main Circuit Reverse', vehicle: 'Boomer RS', performance_index: 164, place: '1', lap_count: 5, lap_time_ms: 58090, total_time_ms: 301180,
          lap_times_ms: [65902, 58090, 59454, 58936, 58798],
          results_roster: [
            { position: 1, name: 'Ampp33', car: 'Boomer RS', class: 'C 164', best_lap_ms: 58090, total_time_ms: 301180, laps_completed: 5 },
            { position: 2, name: 'speedgamer5', car: 'Venom', class: 'C 164', best_lap_ms: 59873, total_time_ms: 303628, laps_completed: 5 },
            { position: 3, name: 'DonCobra', car: 'Rebelrat', class: 'C 163', best_lap_ms: 59978, total_time_ms: 309457, laps_completed: 5 },
            { position: 4, name: 'CeoKeanan', car: 'Super Venom', class: 'C 164', best_lap_ms: 59376, total_time_ms: 315032, laps_completed: 5 },
            { position: 5, name: 'Throat Clogger', car: 'Rocket', class: 'C 163', best_lap_ms: 60559, total_time_ms: 316571, laps_completed: 5 },
            { position: 6, name: 'TRACANGUS', car: 'Rocket', class: 'C 164', best_lap_ms: 60792, total_time_ms: 318205, laps_completed: 5 },
            { position: 7, name: 'ColeTrickle2709', car: 'Rocket Rx', class: 'C 164', best_lap_ms: 59516, total_time_ms: 320610, laps_completed: 5 }
          ]
        },
        { id: 'dbff4924', datetime: '2026-09-12T03:31:28.761778+00:00', track: 'Northland Raceway', variation: 'Outer Route Reverse', vehicle: 'Boomer RS', performance_index: 164, place: '1', lap_count: 5, lap_time_ms: 65045, total_time_ms: 337214,
          lap_times_ms: [71585, 68400, 66141, 66043, 65045],
          results_roster: [
            { position: 1, name: 'Ampp33', car: 'Boomer RS', class: 'C 164', best_lap_ms: 65045, total_time_ms: 337214, laps_completed: 5 },
            { position: 2, name: 'ColeTrickle2709', car: 'Rocket Rx', class: 'C 164', best_lap_ms: 65497, total_time_ms: 341408, laps_completed: 5 },
            { position: 3, name: 'Thainnn', car: 'Bandit Ripper V8', class: 'C 164', best_lap_ms: 65559, total_time_ms: 341808, laps_completed: 5 },
            { position: 4, name: 'LeoneL-02', car: 'Speedbird', class: 'C 163', best_lap_ms: 66761, total_time_ms: 344302, laps_completed: 5 },
            { position: 5, name: 'CeoKeanan', car: 'Super Venom', class: 'C 164', best_lap_ms: 67077, total_time_ms: 347614, laps_completed: 5 },
            { position: 6, name: 'TRACANGUS', car: 'Rocket', class: 'C 164', best_lap_ms: 66939, total_time_ms: 350018, laps_completed: 5 },
            { position: 7, name: 'speedgamer5', car: 'Venom', class: 'C 164', best_lap_ms: 66368, total_time_ms: 350180, laps_completed: 5 },
            { position: 8, name: 'DonCobra', car: 'Nexus Rx', class: 'C 164', best_lap_ms: 67426, total_time_ms: 350757, laps_completed: 5 }
          ]
        },
        { id: 'bb59417e', datetime: '2026-09-12T03:23:32.895966+00:00', track: 'Firwood Motocenter', variation: 'Short Circuit Reverse', vehicle: 'Boomer RS', performance_index: 164, place: '2', lap_count: 8, lap_time_ms: 35207, total_time_ms: 292131,
          lap_times_ms: [40069, 38434, 35377, 35862, 35207, 36021, 35886, 35275],
          results_roster: [
            { position: 1, name: 'Thainnn', car: 'Bandit Ripper V8', class: 'C 164', best_lap_ms: 35239, total_time_ms: 289759, laps_completed: 8 },
            { position: 2, name: 'Ampp33', car: 'Boomer RS', class: 'C 164', best_lap_ms: 35207, total_time_ms: 292131, laps_completed: 8 },
            { position: 3, name: 'CeoKeanan', car: 'Super Venom', class: 'C 164', best_lap_ms: 34491, total_time_ms: 292347, laps_completed: 8 },
            { position: 4, name: 'LeoneL-02', car: 'Speedbird', class: 'C 163', best_lap_ms: 35470, total_time_ms: 297527, laps_completed: 8 },
            { position: 5, name: 'speedgamer5', car: 'Venom', class: 'C 164', best_lap_ms: 35645, total_time_ms: 301403, laps_completed: 8 },
            { position: 6, name: 'ColeTrickle2709', car: 'Rocket Rx', class: 'C 164', best_lap_ms: 35250, total_time_ms: 313771, laps_completed: 8 }
          ]
        },
        { id: 'eb763042', datetime: '2026-09-12T03:16:00+00:00', track: 'Sandstone Raceway', variation: 'Main Route', vehicle: 'RoadSlayer', performance_index: 163, place: '2', lap_count: 5, lap_time_ms: 64130, total_time_ms: 337800,
          lap_times_ms: [73480, 64224, 66290, 69676, 64130],
          results_roster: [
            { position: 1, name: 'ColeTrickle2709', car: 'Rocket Rx', class: 'C 164', best_lap_ms: 64498, total_time_ms: 336656, laps_completed: 5 },
            { position: 2, name: 'Ampp33', car: 'RoadSlayer', class: 'C 163', best_lap_ms: 64130, total_time_ms: 337800, laps_completed: 5 },
            { position: 3, name: 'speedgamer5', car: 'Venom', class: 'C 164', best_lap_ms: 64844, total_time_ms: 339981, laps_completed: 5 },
            { position: 4, name: 'LeoneL-02', car: 'Nexus Rx', class: 'C 164', best_lap_ms: 65707, total_time_ms: 342300, laps_completed: 5 },
            { position: 5, name: 'CeoKeanan', car: 'Super Venom', class: 'C 164', best_lap_ms: 65209, total_time_ms: 349932, laps_completed: 5 },
            { position: 6, name: 'Thainnn', car: 'Bandit Ripper V8', class: 'C 164', best_lap_ms: 65181, total_time_ms: 352319, laps_completed: 5 },
            { position: 7, name: 'junaca', car: 'Venom', class: 'C 164', best_lap_ms: 68166, total_time_ms: 384077, laps_completed: 5 },
            { position: 8, name: 'OnePIK', car: 'Boomer Rs', class: 'C 164', best_lap_ms: 68441, total_time_ms: 387639, laps_completed: 5 },
            { position: 9, name: 'imroca®', car: 'Killerbee S', class: 'C 164', best_lap_ms: 75899, total_time_ms: 396624, laps_completed: 4 }
          ]
        },
        { id: '5f50bd71', datetime: '2026-09-12T03:07:37.063291+00:00', track: 'Espedalen Raceway', variation: 'Short Circuit Reverse', vehicle: 'RoadSlayer', performance_index: 163, place: '4', lap_count: 8, lap_time_ms: 35059, total_time_ms: 301279,
          lap_times_ms: [45375, 38859, 38319, 35385, 35059, 36510, 36012, 35760],
          results_roster: [
            { position: 1, name: 'speedgamer5', car: 'Venom', class: 'C 164', best_lap_ms: 36361, total_time_ms: 297774, laps_completed: 8 },
            { position: 2, name: 'CeoKeanan', car: 'Super Venom', class: 'C 164', best_lap_ms: 35395, total_time_ms: 298351, laps_completed: 8 },
            { position: 3, name: 'ColeTrickle2709', car: 'Rocket Rx', class: 'C 164', best_lap_ms: 35578, total_time_ms: 300439, laps_completed: 8 },
            { position: 4, name: 'Ampp33', car: 'RoadSlayer', class: 'C 163', best_lap_ms: 35059, total_time_ms: 301279, laps_completed: 8 },
            { position: 5, name: 'OnePIK', car: 'Boomer Rs', class: 'C 164', best_lap_ms: 36663, total_time_ms: 313309, laps_completed: 8 },
            { position: 6, name: 'LeoneL-02', car: 'Speedbird', class: 'C 163', best_lap_ms: 36784, total_time_ms: 314134, laps_completed: 8 },
            { position: 7, name: 'junaca', car: 'Venom', class: 'C 164', best_lap_ms: 36663, total_time_ms: 319025, laps_completed: 8 },
            { position: 8, name: 'imroca®', car: 'Tristar', class: 'C 164', best_lap_ms: 38055, total_time_ms: 355351, laps_completed: 8 }
          ]
        },
        { id: 'c43c5136', datetime: '2026-09-12T02:59:42.22323+00:00', track: 'Boulder Bank Circuit', variation: 'Main Route Reverse', vehicle: 'Boomer RS', performance_index: 164, place: '6', lap_count: 4, lap_time_ms: 83447, total_time_ms: 376720,
          lap_times_ms: [93034, 83447, 95454, 104785],
          results_roster: [
            { position: 1, name: 'ColeTrickle2709', car: 'Rocket Rx', class: 'C 164', best_lap_ms: 81851, total_time_ms: 350928, laps_completed: 4 },
            { position: 2, name: 'speedgamer5', car: 'Venom', class: 'C 164', best_lap_ms: 80890, total_time_ms: 351749, laps_completed: 4 },
            { position: 3, name: 'LeoneL-02', car: 'Speedbird', class: 'C 163', best_lap_ms: 84359, total_time_ms: 354441, laps_completed: 4 },
            { position: 4, name: 'junaca', car: 'Venom', class: 'C 164', best_lap_ms: 86727, total_time_ms: 372489, laps_completed: 4 },
            { position: 5, name: 'OnePIK', car: 'Boomer Rs', class: 'C 164', best_lap_ms: 86289, total_time_ms: 376348, laps_completed: 4 },
            { position: 6, name: 'Ampp33', car: 'Boomer RS', class: 'C 164', best_lap_ms: 83447, total_time_ms: 376720, laps_completed: 4 },
            { position: 7, name: 'imroca®', car: 'Tristar', class: 'C 164', best_lap_ms: 87261, total_time_ms: 387648, laps_completed: 4 }
          ]
        },
        { id: 'a76f22d4', datetime: '2026-09-12T02:50:51.795123+00:00', track: 'Dirt Devil Stadium', variation: 'Dirt Speedway', vehicle: 'Nexus RX', performance_index: 163, place: '1', lap_count: 8, lap_time_ms: 32563, total_time_ms: 275326,
          lap_times_ms: [37779, 34127, 33560, 32949, 32563, 33482, 32614, 38252],
          results_roster: [
            { position: 1, name: 'Ampp33', car: 'Nexus RX', class: 'C 163', best_lap_ms: 32563, total_time_ms: 275326, laps_completed: 8 },
            { position: 2, name: 'ColeTrickle2709', car: 'Rocket Rx', class: 'C 164', best_lap_ms: 33002, total_time_ms: 278271, laps_completed: 8 },
            { position: 3, name: 'speedgamer5', car: 'Venom', class: 'C 164', best_lap_ms: 33325, total_time_ms: 285124, laps_completed: 8 },
            { position: 4, name: 'junaca', car: 'Tristar', class: 'C 164', best_lap_ms: 34662, total_time_ms: 323504, laps_completed: 8 },
            { position: 5, name: 'imroca®', car: 'Killerbee S', class: 'C 164', best_lap_ms: 35266, total_time_ms: 328856, laps_completed: 8 }
          ]
        },
        { id: 'deec3515', datetime: '2026-09-11T03:37:39.476659+00:00', track: 'Rattlesnake Racepark', variation: 'Main Circuit Reverse', vehicle: 'RoadSlayer', performance_index: 163, place: '5', lap_count: 4, lap_time_ms: 59621, total_time_ms: 244072,
          lap_times_ms: [64001, 59621, 60577, 59873],
          results_roster: [
            { position: 1, name: 'BoKado', car: 'Killerbee S', class: 'C 164', best_lap_ms: 55919, total_time_ms: 234731, laps_completed: 4 },
            { position: 2, name: 'chivalarga', car: 'Starbeast Ss', class: 'C 164', best_lap_ms: 56952, total_time_ms: 237828, laps_completed: 4 },
            { position: 3, name: 'Martinco', car: 'Hammerhead Rs', class: 'C 164', best_lap_ms: 58697, total_time_ms: 242157, laps_completed: 4 },
            { position: 4, name: 'ElFrank644', car: 'Tristar', class: 'C 164', best_lap_ms: 59381, total_time_ms: 242701, laps_completed: 4 },
            { position: 5, name: 'Ampp33', car: 'RoadSlayer', class: 'C 163', best_lap_ms: 59621, total_time_ms: 244072, laps_completed: 4 },
            { position: 6, name: 'ChillDrift', car: 'Venom', class: 'C 164', best_lap_ms: 58582, total_time_ms: 244464, laps_completed: 4 },
            { position: 7, name: 'Langer', car: 'Trophy Runner', class: 'C 164', best_lap_ms: 59545, total_time_ms: 245366, laps_completed: 4 },
            { position: 8, name: 'carlossimes7', car: 'Nexus Rx', class: 'C 164', best_lap_ms: 56606, total_time_ms: 245395, laps_completed: 4 },
            { position: 9, name: 'Tito Calderon', car: 'Rocket Rx', class: 'C 164', best_lap_ms: 59701, total_time_ms: 245460, laps_completed: 4 },
            { position: 10, name: 'BorisLovis 2016', car: 'Raiden Rs', class: 'C 164', best_lap_ms: 59501, total_time_ms: 245741, laps_completed: 4 },
            { position: 11, name: 'helinho', car: 'Rocket', class: 'C 158', best_lap_ms: 62465, total_time_ms: 259211, laps_completed: 4 },
            { position: 12, name: 'Doin-ok', car: 'Tristar', class: 'C 155', best_lap_ms: 60166, total_time_ms: 268401, laps_completed: 4 }
          ]
        },
        { id: '97546914', datetime: '2026-09-11T03:31:37.853813+00:00', track: 'Hellride', variation: 'Main Circuit', vehicle: 'Nexus RX', performance_index: 163, place: '2', lap_count: 6, lap_time_ms: 43359, total_time_ms: 290588,
          lap_times_ms: [56935, 54279, 45091, 43359, 44923, 46001],
          results_roster: [
            { position: 1, name: 'carlossimes7', car: 'Nexus Rx', class: 'C 164', best_lap_ms: 42078, total_time_ms: 271597, laps_completed: 6 },
            { position: 2, name: 'Ampp33', car: 'Nexus RX', class: 'C 163', best_lap_ms: 43359, total_time_ms: 290588, laps_completed: 6 },
            { position: 3, name: 'chivalarga', car: 'Starbeast Ss', class: 'C 164', best_lap_ms: 44407, total_time_ms: 294648, laps_completed: 6 },
            { position: 4, name: 'ChillDrift', car: 'Gremlin', class: 'C 164', best_lap_ms: 44806, total_time_ms: 305837, laps_completed: 6 },
            { position: 5, name: 'Langer', car: 'Warwagon', class: 'C 158', best_lap_ms: 43385, total_time_ms: 306311, laps_completed: 6 },
            { position: 6, name: 'Tito Calderon', car: 'Tristar', class: 'C 164', best_lap_ms: 43742, total_time_ms: 314225, laps_completed: 6 },
            { position: 7, name: 'Martinco', car: 'Grand Duke', class: 'C 164', best_lap_ms: 47520, total_time_ms: 318709, laps_completed: 6 },
            { position: 8, name: 'ElFrank644', car: 'Tristar', class: 'C 164', best_lap_ms: 52157, total_time_ms: 326611, laps_completed: 6 },
            { position: 9, name: '7 SCOOPS OF PRE', car: 'Rocket', class: 'C 121', best_lap_ms: 53033, total_time_ms: 331584, laps_completed: 5 },
            { position: 10, name: 'helinho', car: 'Rocket', class: 'C 158', best_lap_ms: 56956, total_time_ms: 225632, laps_completed: 3 },
            { position: 11, name: 'RF₿', car: 'Rocket', class: 'C 121', best_lap_ms: 71075, total_time_ms: 236976, laps_completed: 2 },
            { position: 12, name: 'BoKado', car: 'Killerbee S', class: 'C 164', best_lap_ms: 42315, total_time_ms: 120144, laps_completed: 2 }
          ]
        },
        { id: 'ff5d7a58', datetime: '2026-09-11T03:23:18.127344+00:00', track: 'Drytown Desert Circuit', variation: 'Main Circuit Reverse', vehicle: 'Raiden RS', performance_index: 164, place: '3', lap_count: 5, lap_time_ms: 37472, total_time_ms: 195981,
          lap_times_ms: [41856, 38630, 37472, 38890, 39133],
          results_roster: [
            { position: 1, name: 'BoKado', car: 'Killerbee S', class: 'C 164', best_lap_ms: 37783, total_time_ms: 193792, laps_completed: 5 },
            { position: 2, name: 'carlossimes7', car: 'Nexus Rx', class: 'C 164', best_lap_ms: 37495, total_time_ms: 195309, laps_completed: 5 },
            { position: 3, name: 'Ampp33', car: 'Raiden RS', class: 'C 164', best_lap_ms: 37472, total_time_ms: 195981, laps_completed: 5 },
            { position: 4, name: 'ChillDrift', car: 'Gremlin', class: 'C 164', best_lap_ms: 39017, total_time_ms: 198829, laps_completed: 5 },
            { position: 5, name: 'Langer', car: 'Hammerhead Rs', class: 'C 164', best_lap_ms: 38055, total_time_ms: 200804, laps_completed: 5 },
            { position: 6, name: 'ElFrank644', car: 'Rebelrat', class: 'C 164', best_lap_ms: 39050, total_time_ms: 204456, laps_completed: 5 },
            { position: 7, name: 'Tito Calderon', car: 'Rocket Rx', class: 'C 164', best_lap_ms: 39099, total_time_ms: 209299, laps_completed: 5 },
            { position: 8, name: 'Boquitajuniors', car: 'Raiden Rs', class: 'C 164', best_lap_ms: 37931, total_time_ms: 214476, laps_completed: 5 },
            { position: 9, name: 'Martinco', car: 'Raiden Rs', class: 'C 164', best_lap_ms: 40577, total_time_ms: 216167, laps_completed: 5 },
            { position: 10, name: 'elchinootv', car: 'Gremlin (l)', class: 'C 153', best_lap_ms: 41728, total_time_ms: 208112, laps_completed: 4 },
            { position: 11, name: 'chivalarga', car: 'Starbeast Ss', class: 'C 164', best_lap_ms: 41889, total_time_ms: 156016, laps_completed: 2 }
          ]
        },
        { id: 'a451885a', datetime: '2026-09-11T03:09:04.985158+00:00', track: 'Mudford Motorpark', variation: 'Mud Oval', vehicle: 'RoadSlayer', performance_index: 163, place: '6', lap_count: 3, lap_time_ms: 17420, total_time_ms: 56030,
          lap_times_ms: [20633, 17977, 17420],
          results_roster: [
            { position: 1, name: 'Zachary101', car: 'Panther Rs', class: 'B 237', best_lap_ms: 15896, total_time_ms: 50124, laps_completed: 3 },
            { position: 2, name: 'Jarkynson', car: 'Sunrise Super', class: 'A 324', best_lap_ms: 15432, total_time_ms: 51816, laps_completed: 3 },
            { position: 3, name: 'EliteRCN1', car: 'Gatecrasher', class: 'A 304', best_lap_ms: 15794, total_time_ms: 52722, laps_completed: 3 },
            { position: 4, name: 'mjkelley', car: 'Sunrise Super', class: 'A 256', best_lap_ms: 16210, total_time_ms: 55269, laps_completed: 3 },
            { position: 5, name: 'Madriver911', car: 'Little Thrasher', class: 'B 250', best_lap_ms: 16023, total_time_ms: 55631, laps_completed: 3 },
            { position: 6, name: 'Ampp33', car: 'RoadSlayer', class: 'C 163', best_lap_ms: 17420, total_time_ms: 56030, laps_completed: 3 },
            { position: 7, name: 'Ripetin', car: 'Hornet', class: 'B 241', best_lap_ms: 16792, total_time_ms: 56682, laps_completed: 3 },
            { position: 8, name: 'gonzo_p_d', car: 'Grand Duke', class: 'A 302', best_lap_ms: 16582, total_time_ms: 57884, laps_completed: 3 },
            { position: 9, name: 'Marty McBacon', car: 'Grand Duke', class: 'A 261', best_lap_ms: 16566, total_time_ms: 58377, laps_completed: 3 },
            { position: 10, name: 'Purple44', car: 'Speedie', class: 'A 271', best_lap_ms: 17489, total_time_ms: 58433, laps_completed: 3 },
            { position: 11, name: 'BZ', car: 'Boomer', class: 'A 251', best_lap_ms: 20705, total_time_ms: 60509, laps_completed: 3 },
            { position: 12, name: 'Jaxte', car: 'Roadslayer', class: 'A 253', best_lap_ms: 16240, total_time_ms: 61408, laps_completed: 3 },
            { position: 13, name: 'Wurzsag', car: 'Razor', class: 'A 261', best_lap_ms: 16622, total_time_ms: 62522, laps_completed: 3 },
            { position: 14, name: 'BoGGe', car: 'Tristar', class: 'A 311', best_lap_ms: 20205, total_time_ms: 62736, laps_completed: 3 },
            { position: 15, name: 'HammerTime', car: 'Bulldog', class: 'A 258', best_lap_ms: 22459, total_time_ms: 63051, laps_completed: 3 },
            { position: 16, name: 'MALABUSA', car: 'Hammerhead', class: 'A 291', best_lap_ms: 17433, total_time_ms: 63911, laps_completed: 3 },
            { position: 17, name: 'B0R1S', car: 'Gatecrasher', class: 'A 304', best_lap_ms: 21110, total_time_ms: 64937, laps_completed: 3 },
            { position: 18, name: 'leocarch', car: 'Buggy', class: 'A 256', best_lap_ms: 15761, total_time_ms: 67987, laps_completed: 3 },
            { position: 19, name: 'mgc8888', car: 'Sunrise Super', class: 'A 256', best_lap_ms: 17472, total_time_ms: 68280, laps_completed: 3 },
            { position: 20, name: 'Markusnl', car: 'Wildking', class: 'A 302', best_lap_ms: 21499, total_time_ms: 68456, laps_completed: 3 },
            { position: 21, name: 'Sephirothreincarnate', car: 'Rammer', class: 'A 262', best_lap_ms: 20082, total_time_ms: 70277, laps_completed: 3 },
            { position: 22, name: 'TÆCH3D', car: 'Roadslayer', class: 'A 286', best_lap_ms: 23194, total_time_ms: 70713, laps_completed: 3 },
            { position: 23, name: 'DoctorCarrot', car: 'Tristar', class: 'A 266', best_lap_ms: 27133, total_time_ms: 83408, laps_completed: 3 },
            { position: 24, name: 'Theman883', car: 'Stellar', class: 'B 244', best_lap_ms: 41856, total_time_ms: 90373, laps_completed: 2 }
          ]
        }
      ],

      // Savolax Sandpit — Main Route: this account's closest open goal
      // (+0:00.055). racesHere is a real count, queried directly.
      flagshipGoal: { track: 'Savolax Sandpit', variation: 'Main Route', goalMs: 68000, bestMs: 68055, deltaMs: 55, beat: false, racesHere: 10 },

      // Real account-wide stats, queried directly — same relationship as
      // the real Races table vs. the real Stats page: bigger numbers than
      // the 12 itemized races above (this covers the account's full
      // history), never smaller.
      //
      // hourlyCounts is real hour-of-day data for one real day (2026-09-12,
      // the account's most recent), not an all-time sum — the real
      // RaceActivityChart's "Day" tab is specifically today's races by
      // hour (see statsService.js), so an all-time sum here would produce
      // bars like "56 races at 11am," which is impossible for a single day
      // and was a real bug caught earlier in this same rebuild. dailyCounts
      // is the real count for every one of the account's 43 active days,
      // summing to the same 211 as totalRaces below.
      statsPreview: {
        totalRaces: 211,
        mostUsedVehicle: { name: 'Raiden RS', count: 72 },
        mostRacedVariation: { trackName: 'Clayridge Circuit', variationName: 'Main Circuit', trackSlug: 'clayridge-circuit', variationSlug: 'main-circuit', count: 18 },
        dailyCounts: {
          '2026-04-25': 1, '2026-04-26': 1, '2026-04-27': 5, '2026-04-28': 6,
          '2026-05-01': 6, '2026-05-02': 9, '2026-05-06': 4, '2026-05-07': 3, '2026-05-09': 6, '2026-05-10': 11, '2026-05-11': 3, '2026-05-20': 1,
          '2026-06-15': 3,
          '2026-07-10': 3, '2026-07-11': 8, '2026-07-14': 3, '2026-07-18': 1, '2026-07-19': 1,
          '2026-08-02': 1, '2026-08-03': 6, '2026-08-04': 1, '2026-08-05': 4, '2026-08-06': 3, '2026-08-07': 3, '2026-08-08': 12,
          '2026-08-11': 5, '2026-08-16': 4, '2026-08-17': 2, '2026-08-19': 2, '2026-08-21': 1, '2026-08-22': 13, '2026-08-23': 3, '2026-08-24': 2,
          '2026-08-25': 7, '2026-08-27': 8, '2026-08-28': 10, '2026-08-29': 10, '2026-08-30': 8,
          '2026-09-01': 4, '2026-09-07': 4, '2026-09-08': 10, '2026-09-11': 4, '2026-09-12': 9
        },
        // 2026-09-12 (UTC), the real hours those 9 races landed in.
        hourlyCounts: [0, 0, 3, 6, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        // Real oldest-lap-vs-newest-lap improvement per variation, biggest
        // first, capped at 5 (matches computeBiggestImprovements in
        // statsService.js). One real result was excluded here: a variation
        // whose "newest" lap was a 0ms telemetry glitch, which would have
        // shown as an 83-second improvement — real row, nonsense number.
        biggestImprovements: [
          { trackName: 'Kingston Raceway', variationName: 'Asphalt Oval', trackSlug: 'kingston-raceway', variationSlug: 'asphalt-oval', deltaMs: 9854 },
          { trackName: 'Boulder Bank Circuit', variationName: 'Short Route', trackSlug: 'boulder-bank-circuit', variationSlug: 'short-route', deltaMs: 4220 },
          { trackName: "Devil's Canyon", variationName: 'Race Track', trackSlug: 'devil-s-canyon', variationSlug: 'race-track', deltaMs: 3147 },
          { trackName: 'Savolax Sandpit', variationName: 'Main Route Reverse', trackSlug: 'savolax-sandpit', variationSlug: 'main-route-reverse', deltaMs: 1653 },
          { trackName: 'Northfolk Ring', variationName: 'Main Circuit Reverse', trackSlug: 'northfolk-ring', variationSlug: 'main-circuit-reverse', deltaMs: 1602 }
        ]
      }
    }
  }
}
</script>
