<!-- Getting Started — the "Docs Split" layout.

     The shape people already know from documentation sites: a sticky index
     down the left that highlights wherever you've scrolled to, content on
     the right. Picked out of eight directions (the other seven are archived
     outside the repo) as the most navigable, and the easiest to come back
     to for one specific answer — which is what a quick-start page mostly
     gets used for after the first read. -->
<template>
  <div class="max-w-7xl mx-auto px-6 py-12">
    <header class="mb-12 max-w-3xl">
      <div class="ov text-brand-accent dark:text-brand-accent-dark mb-5">Getting started</div>
      <h1 class="font-display font-black tracking-tightest leading-[0.88] text-display-lg text-brand-text dark:text-brand-text-dark">
        The short version of <em class="font-heading font-normal tracking-normal signal">everything</em>.
      </h1>
      <p class="font-body text-[17px] leading-relaxed text-brand-secondary dark:text-brand-secondary-dark mt-6">
        Read it once end to end, or jump to the one thing you're stuck on. The index on the left follows you down the page.
      </p>
    </header>

    <div class="grid lg:grid-cols-[190px_minmax(0,1fr)] gap-x-12">
      <!-- INDEX -->
      <nav class="hidden lg:block" aria-label="On this page">
        <div class="sticky top-8">
          <div class="ov text-brand-muted dark:text-brand-muted-dark rule-top pt-3 mb-3">On this page</div>
          <ul class="space-y-0.5">
            <li v-for="item in toc" :key="item.id">
              <a
                :href="`#${item.id}`"
                class="block py-1.5 font-body text-[14px] leading-snug border-l-2 -ml-px pl-3"
                :class="[
                  item.sub ? 'text-[13px] pl-6' : '',
                  active === item.id
                    ? 'border-brand-accent dark:border-brand-accent-dark text-brand-accent dark:text-brand-accent-dark font-semibold'
                    : 'border-brand-border dark:border-brand-border-dark text-brand-muted dark:text-brand-muted-dark hover:text-brand-text dark:hover:text-brand-text-dark'
                ]"
                @click.prevent="goTo(item.id)"
              >{{ item.label }}</a>
            </li>
          </ul>
        </div>
      </nav>

      <!-- CONTENT -->
      <div class="min-w-0 space-y-14">
        <section id="shortcuts" class="scroll-mt-8">
          <h2 class="font-body font-bold text-[22px] tracking-tightest text-brand-text dark:text-brand-text-dark rule-top pt-3 mb-3">Keyboard shortcuts</h2>
          <p class="font-body text-[16px] leading-relaxed text-brand-secondary dark:text-brand-secondary-dark mb-5 max-w-2xl">
            Four keys, live on every screen, to help you get around the site faster.
          </p>
          <dl class="border-y border-brand-border dark:border-brand-border-dark divide-y divide-brand-border dark:divide-brand-border-dark mb-6 max-w-2xl">
            <div class="flex items-baseline gap-4 py-3">
              <dt class="w-14 shrink-0"><kbd class="font-display font-black text-[13px] px-2.5 py-1.5 bg-brand-strong dark:bg-brand-strong-dark text-brand-bg dark:text-brand-bg-dark">T</kbd></dt>
              <dd class="font-body text-[15px] text-brand-secondary dark:text-brand-secondary-dark">Go to track. Type part of the name, use arrows to select a variation, Enter.</dd>
            </div>
            <div class="flex items-baseline gap-4 py-3">
              <dt class="w-14 shrink-0"><kbd class="font-display font-black text-[13px] px-2.5 py-1.5 bg-brand-strong dark:bg-brand-strong-dark text-brand-bg dark:text-brand-bg-dark">Q</kbd></dt>
              <dd class="font-body text-[15px] text-brand-secondary dark:text-brand-secondary-dark">Quick add a race by hand, from any screen.</dd>
            </div>
            <div class="flex items-baseline gap-4 py-3">
              <dt class="w-14 shrink-0"><kbd class="font-display font-black text-[13px] px-2.5 py-1.5 border border-brand-border dark:border-brand-border-dark text-brand-muted dark:text-brand-muted-dark">A</kbd></dt>
              <dd class="font-body text-[15px] text-brand-muted dark:text-brand-muted-dark">Track page only — adds a race to the open variation.</dd>
            </div>
            <div class="flex items-baseline gap-4 py-3">
              <dt class="w-14 shrink-0"><kbd class="font-display font-black text-[13px] px-2.5 py-1.5 border border-brand-border dark:border-brand-border-dark text-brand-muted dark:text-brand-muted-dark">Esc</kbd></dt>
              <dd class="font-body text-[15px] text-brand-muted dark:text-brand-muted-dark">Closes the open dialog. Enter saves it.</dd>
            </div>
          </dl>
          <div class="grid sm:grid-cols-2 gap-6">
            <AppShot name="track-search" alt="The track search dialog opened with T" caption="T — go to track" img-class="border border-brand-border dark:border-brand-border-dark object-cover object-top h-[220px]" />
            <AppShot name="quick-add-top" alt="The quick add race dialog opened with Q" caption="Q — quick add race" img-class="border border-brand-border dark:border-brand-border-dark object-cover object-top h-[220px]" />
          </div>
        </section>

        <section id="telemetry" class="scroll-mt-8">
          <h2 class="font-body font-bold text-[22px] tracking-tightest text-brand-text dark:text-brand-text-dark rule-top pt-3 mb-3">Telemetry plugin</h2>
          <p class="font-body text-[16px] leading-relaxed text-brand-secondary dark:text-brand-secondary-dark mb-3 max-w-2xl">
            An auto-loading plugin that runs alongside Wreckfest, reads each result straight out of the game's own memory the instant a race ends, and posts it here. Windows and Linux (Steam + Proton).
          </p>
          <p class="font-body text-[16px] leading-relaxed text-brand-secondary dark:text-brand-secondary-dark mb-5 max-w-2xl">
            Worth the ten minutes twice over: you stop logging races by hand, and it's the only way to get <b class="text-brand-text dark:text-brand-text-dark">per-lap splits</b> and the <b class="text-brand-text dark:text-brand-text-dark">full finishing roster</b> — there's no field to type those into.
          </p>
          <div class="flex flex-wrap gap-3">
            <router-link to="/plugin" class="ov min-h-[44px] px-6 inline-flex items-center bg-brand-accent dark:bg-brand-accent-dark text-white hover:opacity-85">Full instructions →</router-link>
          </div>
        </section>

        <section id="races" class="scroll-mt-8">
          <h2 class="font-body font-bold text-[22px] tracking-tightest text-brand-text dark:text-brand-text-dark rule-top pt-3 mb-3">The Races page</h2>
          <p class="font-body text-[16px] leading-relaxed text-brand-secondary dark:text-brand-secondary-dark mb-4 max-w-2xl">
            Every race you've logged, newest first — <b><i>the screen to open right after a race or session</i></b>, while you still remember what went right (or wrong).
          </p>
          <ul class="font-body text-[15px] leading-relaxed text-brand-secondary dark:text-brand-secondary-dark space-y-1.5 mb-6 max-w-2xl">
            <li><b class="text-brand-text dark:text-brand-text-dark text-xl">+</b> expands the race to show additional details: your notes, the lap-by-lap chart, and the full roster with everyone's best lap and finishing time.</li>
            <li><b class="text-brand-text dark:text-brand-text-dark">Pencil</b> turns the row into a form in place — the fastest way to add the note.</li>
            <li><b class="text-brand-text dark:text-brand-text-dark">Trash</b> deletes the entry, after a confirm.</li>
            <li>Track names link to that track and variation page.</li>
          </ul>
          <AppShot name="races-expanded" alt="The Races table with one row expanded: notes, lap time chart and finishing roster" caption="One race, expanded" />
        </section>

        <section id="track" class="scroll-mt-8">
          <h2 class="font-body font-bold text-[22px] tracking-tightest text-brand-text dark:text-brand-text-dark rule-top pt-3 mb-3">The track page</h2>
          <p class="font-body text-[16px] leading-relaxed text-brand-secondary dark:text-brand-secondary-dark max-w-2xl">
            One track, one variation — reached via the <kbd class="font-display font-black text-[11px] px-1.5 py-1 bg-brand-strong dark:bg-brand-strong-dark text-brand-bg dark:text-brand-bg-dark">T</kbd> hotkey, via the Tracks screen, of from any track link. Five tools live here, and this is where you can focus on improving a specific race.
          </p>
        </section>

        <section id="track-notes" class="scroll-mt-8">
          <h3 class="font-body font-bold text-[17px] tracking-tightest text-brand-text dark:text-brand-text-dark mb-2">Notes</h3>
          <p class="font-body text-[15px] leading-relaxed text-brand-secondary dark:text-brand-secondary-dark mb-4 max-w-2xl">
            Free-form notes for the track as a whole. Click the pencil, type, Save. Markdown renders, so bold and bullets work.
          </p>
          <AppShot name="track-notes" alt="Track notes with the edit pencil" />
        </section>

        <section id="annotations" class="scroll-mt-8">
          <h3 class="font-body font-bold text-[17px] tracking-tightest text-brand-text dark:text-brand-text-dark mb-2">Map annotations</h3>
          <p class="font-body text-[15px] leading-relaxed text-brand-secondary dark:text-brand-secondary-dark mb-4 max-w-2xl">
            A note fixed to the corner it describes — braking points, hazards, where the pack piles up.
          </p>
          <ol class="font-body text-[15px] leading-relaxed text-brand-secondary dark:text-brand-secondary-dark space-y-2 mb-5 max-w-2xl">
            <li><span class="ov text-brand-accent dark:text-brand-accent-dark mr-2">01</span>Open <b class="text-brand-text dark:text-brand-text-dark">Track Map &amp; Annotations</b> and click the pencil on the map.</li>
            <li><span class="ov text-brand-accent dark:text-brand-accent-dark mr-2">02</span>Click anywhere on the circuit. A numbered pin drops where you clicked.</li>
            <li><span class="ov text-brand-accent dark:text-brand-accent-dark mr-2">03</span>Type the note in the box beside that number on the right.</li>
            <li><span class="ov text-brand-accent dark:text-brand-accent-dark mr-2">04</span>Drag a pin to reposition it; the trash icon removes it. Renumber by editing the number field.</li>
            <li><span class="ov text-brand-accent dark:text-brand-accent-dark mr-2">05</span><b class="text-brand-text dark:text-brand-text-dark">✓</b> saves the set. <b class="text-brand-text dark:text-brand-text-dark">✕</b> discards every change since you opened edit mode.</li>
          </ol>
          <AppShot name="track-map-edit" alt="The track map in edit mode with numbered pins and editable notes" caption="Edit mode — click the map to drop a turn" />
        </section>

        <section id="goal" class="scroll-mt-8">
          <h3 class="font-body font-bold text-[17px] tracking-tightest text-brand-text dark:text-brand-text-dark mb-2">Goal lap time</h3>
          <p class="font-body text-[15px] leading-relaxed text-brand-secondary dark:text-brand-secondary-dark mb-4 max-w-2xl">
            Type a target into the Goal tile — it saves as soon as you click away. <b class="text-brand-text dark:text-brand-text-dark">Gap to goal</b> is your personal best minus that target: red while you're chasing it, green the moment it's beaten. It also feeds Δ goal on every race row and the Goal progress panel on Stats.
          </p>
          <AppShot name="goal-tiles" alt="Personal best, goal lap time, gap to goal and races here tiles" />
        </section>

        <section id="lap-chart" class="scroll-mt-8">
          <h3 class="font-body font-bold text-[17px] tracking-tightest text-brand-text dark:text-brand-text-dark mb-2">Lap times over time</h3>
          <p class="font-body text-[15px] leading-relaxed text-brand-secondary dark:text-brand-secondary-dark mb-4 max-w-2xl">
            Each point is your <i>fastest lap on that day</i>, with a separate line per car — so one bad night in a slow car never buries a good trend. Sloping down means there's still time in it. Flat means you've plateaued: change the car, the tune, or the line.
          </p>
          <AppShot name="lap-chart" alt="Line chart of fastest lap per day, one line per vehicle" />
        </section>

        <section id="track-races" class="scroll-mt-8">
          <h3 class="font-body font-bold text-[17px] tracking-tightest text-brand-text dark:text-brand-text-dark mb-2">Logged races</h3>
          <p class="font-body text-[15px] leading-relaxed text-brand-secondary dark:text-brand-secondary-dark mb-4 max-w-2xl">
            Every run at this exact track and variation, with a <b class="text-brand-text dark:text-brand-text-dark">Δ goal</b> per race, a ★ on your personal best and the notes previewed inline. Same expand / edit / delete controls as the Races page.
          </p>
          <AppShot name="track-races" alt="Logged races for one variation with a delta-to-goal column" />
        </section>

        <section id="stats" class="scroll-mt-8">
          <h2 class="font-body font-bold text-[22px] tracking-tightest text-brand-text dark:text-brand-text-dark rule-top pt-3 mb-3">Stats</h2>
          <p class="font-body text-[16px] leading-relaxed text-brand-secondary dark:text-brand-secondary-dark mb-6 max-w-2xl">
            Your whole history, aggregated: most used vehicle, most raced variation, lifetime race count, and a bar chart of when you actually race — by hour today, or by day across a week, month or year. Two panels below that are worth acting on.
          </p>
          <div class="space-y-7">
            <div>
              <h3 class="font-body font-bold text-[17px] tracking-tightest text-brand-text dark:text-brand-text-dark mb-2">Goal progress</h3>
              <p class="font-body text-[15px] leading-relaxed text-brand-secondary dark:text-brand-secondary-dark mb-3 max-w-2xl">
                Goal, best and delta for every target you've set, sorted with beaten goals on top and the nearest misses right beneath. That first red row is the track you're closest to cracking.
              </p>
              <AppShot name="stats-goals" alt="Goal progress with goal, best and delta per variation" />
            </div>
            <div>
              <h3 class="font-body font-bold text-[17px] tracking-tightest text-brand-text dark:text-brand-text-dark mb-2">Biggest improvements</h3>
              <p class="font-body text-[15px] leading-relaxed text-brand-secondary dark:text-brand-secondary-dark mb-3 max-w-2xl">
                The oldest lap you logged at a variation against your newest one — where the practice actually paid off.
              </p>
              <AppShot name="stats-improvements" alt="Biggest improvements list" />
            </div>
            <div>
              <h3 class="font-body font-bold text-[17px] tracking-tightest text-brand-text dark:text-brand-text-dark mb-2">Race activity</h3>
              <AppShot name="stats-activity" alt="Race activity bar chart with day, week, month and year tabs" />
            </div>
          </div>
        </section>

        <section id="feedback" class="scroll-mt-8">
          <h2 class="font-body font-bold text-[22px] tracking-tightest text-brand-text dark:text-brand-text-dark rule-top pt-3 mb-3">Feedback</h2>
          <p class="font-body text-[16px] leading-relaxed text-brand-secondary dark:text-brand-secondary-dark mb-3 max-w-2xl">
            The speech bubble in the nav bar, or in the mobile menu. Bugs, feature requests, a missing track variation, wording that made no sense. The page you sent it from travels with the message, so you don't have to explain where you were.
          </p>
          <p class="font-body text-[15px] leading-relaxed text-brand-muted dark:text-brand-muted-dark italic mb-6 max-w-2xl">
            The site is actively being built, and most of what ships next comes out of that box.
          </p>
          <button
            type="button"
            class="ov min-h-[44px] px-6 inline-flex items-center gap-2 border border-brand-border dark:border-brand-border-dark text-brand-text dark:text-brand-text-dark hover:border-brand-accent mb-6"
            @click="openFeedback"
          >
            <span class="w-4 h-4 inline-block" v-html="feedbackIcon"></span>
            Send feedback
          </button>
          <AppShot name="feedback" alt="The send feedback dialog with a feature request typed in" img-class="border border-brand-border dark:border-brand-border-dark max-w-md" />
        </section>
      </div>
    </div>
  </div>
</template>

<script>
import AppShot from '../components/AppShot.vue'
import { openFeedback } from '../stores/feedbackStore.js'
import feedbackIcon from '../assets/icons/feedback.svg?raw'

export default {
  name: 'GettingStartedPage',
  components: { AppShot },
  data() {
    return {
      active: 'shortcuts',
      feedbackIcon,
      toc: [
        { id: 'shortcuts',   label: 'Shortcuts' },
        { id: 'telemetry',   label: 'Telemetry' },
        { id: 'races',       label: 'Races page' },
        { id: 'track',       label: 'Track page' },
        { id: 'track-notes', label: 'Notes', sub: true },
        { id: 'annotations', label: 'Annotations', sub: true },
        { id: 'goal',        label: 'Goal lap time', sub: true },
        { id: 'lap-chart',   label: 'Lap times chart', sub: true },
        { id: 'track-races', label: 'Logged races', sub: true },
        { id: 'stats',       label: 'Stats' },
        { id: 'feedback',    label: 'Feedback' }
      ],
      observer: null
    }
  },
  mounted() {
    // Highlights whichever section heading is nearest the top of the
    // viewport. The rootMargin pulls the trigger line down to ~20% and up
    // from the bottom, so a section counts as "current" while its heading
    // is in the upper band rather than the instant it appears.
    this.observer = new IntersectionObserver(
      entries => {
        const visible = entries.filter(e => e.isIntersecting)
        if (!visible.length) return
        visible.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        this.active = visible[0].target.id
      },
      { rootMargin: '-20% 0px -70% 0px', threshold: 0 }
    )
    for (const item of this.toc) {
      const el = document.getElementById(item.id)
      if (el) this.observer.observe(el)
    }
  },
  beforeUnmount() {
    if (this.observer) this.observer.disconnect()
  },
  methods: {
    openFeedback,
    goTo(id) {
      const el = document.getElementById(id)
      if (!el) return
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      this.active = id
    }
  }
}
</script>
