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
import { races, flagshipRaceIndex, flagshipGoal, statsPreview } from '../data/homePageDemoData.js'

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
      races,
      flagshipRaceIndex,
      flagshipGoal,
      statsPreview
    }
  }
}
</script>
