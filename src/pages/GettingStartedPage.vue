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
        <section id="nav" class="scroll-mt-8">
          <h2 class="font-body font-bold text-[22px] tracking-tightest text-brand-text dark:text-brand-text-dark rule-top pt-3 mb-3">The top menu</h2>
          <p class="font-body text-[16px] leading-relaxed text-brand-secondary dark:text-brand-secondary-dark mb-4 max-w-2xl">
            Races are public, so you can look at anyone's log, not just yours. Three things up top decide what every page shows:
          </p>
          <ul class="font-body text-[15px] leading-relaxed text-brand-secondary dark:text-brand-secondary-dark space-y-1.5 mb-6 max-w-2xl">
            <li><b class="text-brand-text dark:text-brand-text-dark">Whose races</b> — the first icon. Everyone, your own log, a driver you've looked at lately, or find one by name. Clicking a driver's name anywhere opens their log too.</li>
            <li><b class="text-brand-text dark:text-brand-text-dark">Car class</b> — the icon beside it. All, D, C, B or A narrows leaderboards, tracks, races and stats to that class, and stays picked until you change it.</li>
            <li><b class="text-brand-text dark:text-brand-text-dark">The view</b> — Leaderboard (everyone only), Tracks, Races, Stats, and Profile on your own log. Switch whose races and you stay on the same view.</li>
          </ul>
          <p class="font-body text-[15px] leading-relaxed text-brand-muted dark:text-brand-muted-dark mb-6 max-w-2xl">
            Rather keep your races to yourself? Make them private in <router-link to="/settings/profile" class="text-brand-accent dark:text-brand-accent-dark hover:underline">Profile settings</router-link>. Notes, map annotations, goals and API keys are always yours alone.
          </p>
          <div class="grid sm:grid-cols-2 gap-6 mb-6">
            <AppShot name="nav-scope-menu" alt="The nav's scope menu open: Everyone, You, recently viewed drivers and Find a driver" caption="Whose races" />
            <AppShot name="nav-class-menu" alt="The nav's car class menu open: All classes, then classes D, C, B and A with their PI ranges" caption="Car class" />
          </div>
          <AppShot name="nav-viewing-driver" alt="The nav while viewing another driver's races in class C" caption="Viewing another driver, in class C" img-class="border border-brand-border dark:border-brand-border-dark max-w-xl" />
        </section>

        <section id="shortcuts" class="scroll-mt-8">
          <h2 class="font-body font-bold text-[22px] tracking-tightest text-brand-text dark:text-brand-text-dark rule-top pt-3 mb-3">Keyboard shortcuts</h2>
          <p class="font-body text-[16px] leading-relaxed text-brand-secondary dark:text-brand-secondary-dark mb-5 max-w-2xl">
            Five keys, live on every screen, to help you get around the site faster.
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
              <dt class="w-14 shrink-0"><kbd class="font-display font-black text-[13px] px-2.5 py-1.5 bg-brand-strong dark:bg-brand-strong-dark text-brand-bg dark:text-brand-bg-dark">P</kbd></dt>
              <dd class="font-body text-[15px] text-brand-secondary dark:text-brand-secondary-dark">Prep for a race. Pick a track to see the fastest lap in each class — vehicle, tune, parts, PI and weight — or pick your car to see its best setup. Below that, the track map with your own annotations. Also the button in the bottom right.</dd>
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
          <AppShot name="prep-race" alt="The prep for race dialog opened with P on Savolax Sandpit: the fastest lap in each class with vehicle, tune, parts, PI and weight, then the track map with your numbered annotation pins and their notes listed below" caption="P — prep for race" class="mt-6" img-class="border border-brand-border dark:border-brand-border-dark max-w-xl" />
        </section>

        <section id="telemetry" class="scroll-mt-8">
          <h2 class="font-body font-bold text-[22px] tracking-tightest text-brand-text dark:text-brand-text-dark rule-top pt-3 mb-3">Telemetry plugin</h2>
          <p class="font-body text-[16px] leading-relaxed text-brand-secondary dark:text-brand-secondary-dark mb-3 max-w-2xl">
            An auto-loading plugin that runs alongside Wreckfest, reads each result straight out of the game's own memory the instant a race ends, and posts it here. Windows and Linux (Steam + Proton).
          </p>
          <p class="font-body text-[16px] leading-relaxed text-brand-secondary dark:text-brand-secondary-dark mb-5 max-w-2xl">
            Worth the ten minutes twice over: you stop logging races by hand, and it's the only way to get <b class="text-brand-text dark:text-brand-text-dark">per-lap splits</b> and the <b class="text-brand-text dark:text-brand-text-dark">full finishing roster</b> — there's no field to type those into.
          </p>
          <p class="font-body text-[16px] leading-relaxed text-brand-secondary dark:text-brand-secondary-dark mb-2 max-w-2xl">
            Everything it records for every race:
          </p>
          <ul class="font-body text-[15px] leading-relaxed text-brand-secondary dark:text-brand-secondary-dark list-disc pl-5 space-y-1.5 mb-6 max-w-2xl marker:text-brand-accent dark:marker:text-brand-accent-dark">
            <li><b class="text-brand-text dark:text-brand-text-dark">Where</b> — track and variation, plus the server name for online races</li>
            <li><b class="text-brand-text dark:text-brand-text-dark">Your result</b>
              <ul class="list-[circle] pl-5 mt-1 space-y-1">
                <li>Finishing place</li>
                <li>Best lap and total race time</li>
                <li>Number of laps, and the time of every single lap</li>
              </ul>
            </li>
            <li><b class="text-brand-text dark:text-brand-text-dark">Your car</b>
              <ul class="list-[circle] pl-5 mt-1 space-y-1">
                <li>Vehicle, class and PI</li>
                <li>Weight</li>
                <li>Tune — suspension, gear ratio, differential and brake balance</li>
                <li>Assists — shifting, ABS, traction control and stability control</li>
                <li>Performance parts — the engine, and the tier of each of its ten upgrades: air filter, cooling, intake manifold, fuel system, ignition, exhaust, exhaust manifold, valves, camshaft and pistons</li>
                <li>Armor — which part is fitted in each slot and what it weighs: front bumper, rear bumper, roll cage, side protector and window bars</li>
              </ul>
            </li>
            <li><b class="text-brand-text dark:text-brand-text-dark">Everyone else in the race</b>, in finishing order
              <ul class="list-[circle] pl-5 mt-1 space-y-1">
                <li>Name, and whether they're a human or AI</li>
                <li>Vehicle, class and PI</li>
                <li>Best lap, total time and laps completed, or a DNF</li>
                <li>Their tune and parts, the same detail as yours</li>
              </ul>
            </li>
          </ul>
          <div class="flex flex-wrap gap-3">
            <router-link to="/plugin" class="ov min-h-[44px] px-6 inline-flex items-center bg-brand-accent dark:bg-brand-accent-dark text-white hover:opacity-85">Full instructions →</router-link>
          </div>
        </section>

        <section id="leaderboard" class="scroll-mt-8">
          <h2 class="font-body font-bold text-[22px] tracking-tightest text-brand-text dark:text-brand-text-dark rule-top pt-3 mb-3">Leaderboard</h2>
          <p class="font-body text-[16px] leading-relaxed text-brand-secondary dark:text-brand-secondary-dark mb-5 max-w-2xl">
            <b class="text-brand-text dark:text-brand-text-dark">Most races</b> ranks drivers by how much they've logged; <b class="text-brand-text dark:text-brand-text-dark">Fastest laps</b> lists the quickest lap anyone has set on every track and variation — narrow it to one vehicle with the dropdown, or to one class with the class icon up top. Only races logged by the telemetry plugin count, and a clicking driver's name opens their log.
          </p>
          <AppShot name="leaderboard" alt="The Most races board and the start of the Fastest laps table" />
        </section>

        <section id="races" class="scroll-mt-8">
          <h2 class="font-body font-bold text-[22px] tracking-tightest text-brand-text dark:text-brand-text-dark rule-top pt-3 mb-3">The Races page</h2>
          <p class="font-body text-[16px] leading-relaxed text-brand-secondary dark:text-brand-secondary-dark mb-4 max-w-2xl">
            Every race in whichever log you've picked, newest first. On your own log it's <b><i>the screen to open right after a race or session</i></b>, while you still remember what went right (or wrong). Under Everyone it adds a Driver column, and shows only telemetry-logged races.
          </p>
          <ul class="font-body text-[15px] leading-relaxed text-brand-secondary dark:text-brand-secondary-dark space-y-1.5 mb-6 max-w-2xl">
            <li><span class="w-5 h-5 inline-block align-text-bottom mr-1.5" v-html="expandIcon"></span>Expands the race to show additional details: your notes, the lap-by-lap chart, and the full roster with everyone's best lap and finishing time.</li>
            <li><span class="w-5 h-5 inline-block align-text-bottom mr-1.5" v-html="editIcon"></span>Edits the race entry in place — the fastest way to add a note or make a change. Your own races only.</li>
            <li><span class="w-5 h-5 inline-block align-text-bottom mr-1.5" v-html="trashIcon"></span>Deletes the entry, after a confirm. Your own races only.</li>
            <li>Column headers sort the table; click again to flip the order.</li>
            <li>Track names link to that track and variation page.</li>
            <li><span class="w-5 h-5 inline-block align-text-bottom mr-1.5" v-html="filterIcon"></span>On a column header, lets you filter the table by that column's values — uncheck what you don't want, search the list, or click a single value's text to only filter by that one value.</li>
            <li><span class="w-5 h-5 inline-block align-text-bottom mr-1.5" v-html="columnsIcon"></span>Top right of the table, picks which columns are shown. Weight, Tune, Assists and Parts start hidden to keep the table tidy, but they're one click away — and your choice is remembered next time you visit.</li>
          </ul>
          <div class="space-y-6">
            <AppShot name="races-expanded" alt="The Races table with one row expanded: notes, server, lap time chart and the finishing roster with each driver's tuning and parts, one parts popup open" caption="One race, expanded" />
            <AppShot name="races-filters" alt="The Track/Variation filter popup open, with a search box and checked values narrowing the Races table down to one track" caption="Filtering by Track / Variation" />
          </div>
        </section>

        <section id="track" class="scroll-mt-8">
          <h2 class="font-body font-bold text-[22px] tracking-tightest text-brand-text dark:text-brand-text-dark rule-top pt-3 mb-3">The track page</h2>
          <p class="font-body text-[16px] leading-relaxed text-brand-secondary dark:text-brand-secondary-dark max-w-2xl">
            One track, one variation — reached via the <kbd class="font-display font-black text-[11px] px-1.5 py-1 bg-brand-strong dark:bg-brand-strong-dark text-brand-bg dark:text-brand-bg-dark">T</kbd> hotkey, via the Tracks screen, or from any track link. This is where you can focus on improving a specific race. The goal only appears on your own log; your notes and map annotations show on any log, including Everyone and other drivers' (they're still only yours, and only you can see them). Anyone's log shows the chart, best lap and races.
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
            Notes you can add to specific parts of the track's map — braking points, hazards, tricks, shortcuts, etc.
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
          <h3 class="font-body font-bold text-[17px] tracking-tightest text-brand-text dark:text-brand-text-dark mb-2">Goal lap time &amp; top finishes</h3>
          <p class="font-body text-[15px] leading-relaxed text-brand-secondary dark:text-brand-secondary-dark mb-3 max-w-2xl">
            Type a target into the Goal tile — it saves as soon as you click away. <b class="text-brand-text dark:text-brand-text-dark">Gap to goal</b> is your personal best minus that target: red while you're chasing it, green the moment it's beaten. It also feeds the Δ goal column in Logged races and the Goal progress panel on Stats.
          </p>
          <p class="font-body text-[15px] leading-relaxed text-brand-secondary dark:text-brand-secondary-dark mb-4 max-w-2xl">
            Below that, <b class="text-brand-text dark:text-brand-text-dark">Top 3 / 5 / 10 finishes</b>: how often you place that high here. Races with no place, or with nobody else in the roster, don't count.
          </p>
          <AppShot name="goal-tiles" alt="Personal best, goal lap time, gap to goal and races here tiles, with top 3, 5 and 10 finish rates below" />
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
            Every run at this exact track and variation, with a ★ on the personal best. Expand a race to read its notes. Same expand / edit / delete / sort / filter / column controls as the Races page, and the same columns hidden at first — plus <b class="text-brand-text dark:text-brand-text-dark">Δ goal</b>, each race's gap to your goal, which the column picker turns on.
          </p>
          <AppShot name="track-races" alt="Logged races for one variation with a delta-to-goal column" />
        </section>

        <section id="stats" class="scroll-mt-8">
          <h2 class="font-body font-bold text-[22px] tracking-tightest text-brand-text dark:text-brand-text-dark rule-top pt-3 mb-3">Stats</h2>
          <p class="font-body text-[16px] leading-relaxed text-brand-secondary dark:text-brand-secondary-dark mb-6 max-w-2xl">
            A driver's whole log, aggregated — yours or anyone else's: most used vehicle, most raced variation, race count, top 3 / 5 / 10 finish rates, and a bar chart of when the racing happens — by hour today, or by day across a week, month or year. Two panels below that are worth acting on; Goal progress only shows on your own log.
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

        <section id="profile" class="scroll-mt-8">
          <h2 class="font-body font-bold text-[22px] tracking-tightest text-brand-text dark:text-brand-text-dark rule-top pt-3 mb-3">Profile</h2>
          <p class="font-body text-[16px] leading-relaxed text-brand-secondary dark:text-brand-secondary-dark mb-4 max-w-2xl">
            Under Profile on your own log, or straight to <router-link to="/settings/profile" class="text-brand-accent dark:text-brand-accent-dark hover:underline">Profile settings</router-link>. How you show up to everyone else:
          </p>
          <ul class="font-body text-[15px] leading-relaxed text-brand-secondary dark:text-brand-secondary-dark space-y-1.5 max-w-2xl">
            <li><b class="text-brand-text dark:text-brand-text-dark">Display name</b> — what other racers see on leaderboards, track pages and race lists. 3–24 characters, and no two drivers can share one.</li>
            <li><b class="text-brand-text dark:text-brand-text-dark">Who can see your races</b> — Public or Private. Private takes you off the leaderboards and community pages, and your log shows nothing to anyone else. Notes, track notes, goals, map annotations, API keys and your email are private either way.</li>
          </ul>
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
          <AppShot name="feedback" alt="The send feedback dialog" img-class="border border-brand-border dark:border-brand-border-dark max-w-md" />
        </section>
      </div>
    </div>
  </div>
</template>

<script>
import AppShot from '../components/AppShot.vue'
import { openFeedback } from '../stores/feedbackStore.js'
import feedbackIcon from '../assets/icons/feedback.svg?raw'
import expandIcon from '../assets/icons/expand.svg?raw'
import editIcon from '../assets/icons/edit.svg?raw'
import trashIcon from '../assets/icons/trash.svg?raw'
import filterIcon from '../assets/icons/filter.svg?raw'
import columnsIcon from '../assets/icons/columns.svg?raw'

export default {
  name: 'GettingStartedPage',
  components: { AppShot },
  data() {
    return {
      active: 'nav',
      feedbackIcon,
      expandIcon,
      editIcon,
      trashIcon,
      filterIcon,
      columnsIcon,
      toc: [
        { id: 'nav',         label: 'Top menu' },
        { id: 'shortcuts',   label: 'Shortcuts' },
        { id: 'telemetry',   label: 'Telemetry' },
        { id: 'leaderboard', label: 'Leaderboard' },
        { id: 'races',       label: 'Races page' },
        { id: 'track',       label: 'Track page' },
        { id: 'track-notes', label: 'Notes', sub: true },
        { id: 'annotations', label: 'Annotations', sub: true },
        { id: 'goal',        label: 'Goal & top finishes', sub: true },
        { id: 'lap-chart',   label: 'Lap times chart', sub: true },
        { id: 'track-races', label: 'Logged races', sub: true },
        { id: 'stats',       label: 'Stats' },
        { id: 'profile',     label: 'Profile' },
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
