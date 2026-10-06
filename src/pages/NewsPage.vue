<template>
  <div class="max-w-7xl mx-auto px-6 py-10">
    <h1 class="font-heading font-normal tracking-normal leading-none text-display-lg text-brand-accent dark:text-brand-accent-dark">
      News
    </h1>
    <p class="font-body text-[15px] leading-relaxed text-brand-muted dark:text-brand-muted-dark mt-3.5 mb-10">
      Updates about the site, newest first.
    </p>

    <div class="rule-top divide-y divide-brand-border dark:divide-brand-border-dark border-b border-brand-border dark:border-brand-border-dark">
      <div v-for="entry in entries" :key="entry.id" class="py-5">
        <div class="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 mb-2">
          <span class="font-body font-bold text-[17px] text-brand-text dark:text-brand-text-dark">{{ entry.title }}</span>
          <span class="ov tabular text-brand-muted dark:text-brand-muted-dark whitespace-nowrap">{{ formatDate(entry.date) }}</span>
        </div>
        <p v-if="entry.body" class="font-body text-[15px] leading-relaxed text-brand-secondary dark:text-brand-secondary-dark max-w-2xl mb-3">{{ entry.body }}</p>
        <ul v-if="entry.items" class="font-body text-[15px] leading-relaxed text-brand-secondary dark:text-brand-secondary-dark space-y-1.5 max-w-2xl list-disc pl-5">
          <li v-for="(item, i) in entry.items" :key="i" v-html="item"></li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
import { formatDate } from '../utils/dateFormat.js'

export default {
  name: 'NewsPage',
  data() {
    return {
      entries: [
        {
          id: 7,
          title: 'Coming Soon: See Everyone\'s Races',
          date: '2026-10-02',
          items: [
            'Logging races on your own gets lonely, so the site is opening up. A new Community section is on the way: leaderboards, a feed of everyone\'s latest races, and per-track pages showing how everyone else is doing.',
            'Races will be <b>public by default</b> — date, track, vehicle, tuning, assists, PI, place, lap times and roster. <b>Notes stay private, always</b>, as do your track notes, goal times and map annotations.',
            'Don\'t want your races shown? Head to <a href="#/settings/profile" class="text-brand-accent dark:text-brand-accent-dark hover:underline">your profile</a> and set them to private — you can change it any time. While you\'re there, pick a display name; everyone starts out as "Driver-something".'
          ]
        },
        {
          id: 6,
          title: 'Fixed Telemetry Tuning Bug (Again) + Opponent Tunings',
          date: '2026-09-30',
          items: [
            'Actually fixed tunings to be properly scraped, my bad.  The plugin now also pulls your opponent\'s tuning values too :)  <a href="https://github.com/ampp33/wreckfest-telemetry-asi/releases/tag/v1.2.0" target="_blank" rel="noopener" class="text-brand-accent dark:text-brand-accent-dark hover:underline">Download it here</a>.'
          ]
        },
        {
          id: 5,
          title: 'Fixed Telemetry Tuning Bug',
          date: '2026-09-26',
          items: [
            'Fixed a bug in the Telemetry tool where changes to tunings weren\'t being picked up.  <a href="https://github.com/ampp33/wreckfest-telemetry-asi/releases/tag/v1.1.1" target="_blank" rel="noopener" class="text-brand-accent dark:text-brand-accent-dark hover:underline">Download the patched plugin here</a>.'
          ]
        },
        {
          id: 4,
          title: 'Sortable Races and Track Detail tables',
          date: '2026-09-22',
          body: 'Column headers on the Races and Track Detail tables are now sortable — click a header to sort ascending, click again for descending, and a third click clears it. A caret icon next to each header shows whether that column is sorted and which way.'
        },
        {
          id: 3,
          title: 'Top 3, 5, and 10 finish percentages',
          date: '2026-09-21',
          items: [
            'Added Top 3, Top 5, and Top 10 finish percentage stats to the Track Detail and Stats pages, so you can see how often you land on the podium — or better — at a glance.',
            '<b class="text-brand-text dark:text-brand-text-dark">Telemetry:</b> v1.1.0 of the telemetry tool was re-released after a bug was accidentally re-introduced, causing certain stats to not be logged for non-Steam users.  <a href="https://github.com/ampp33/wreckfest-telemetry-asi/releases/tag/v1.1.0" target="_blank" rel="noopener" class="text-brand-accent dark:text-brand-accent-dark hover:underline">Download it here</a>.  <br>Nice catch, <code class="font-mono text-[13px] font-medium text-red-500">Thainnn</code>!'
          ]
        },
        {
          id: 2,
          title: 'Car weight & assists tracking, plus table filters and column picking',
          date: '2026-09-20',
          items: [
            '<b class="text-brand-text dark:text-brand-text-dark">Telemetry:</b> the plugin now also captures your car\'s weight and its assist settings (shifting, ABS, traction control, stability control) — both now show up on the site alongside everything else it already tracks.  <br><i>NOTE:</i> These columns are hidden by default but can be toggled via the Column picker.',
            '<b class="text-brand-text dark:text-brand-text-dark">Table filters:</b> races tables now have a funnel icon on select column headers — click it to check or uncheck values, search the list, or click a value\'s name to filter by just that value.',
            '<b class="text-brand-text dark:text-brand-text-dark">Column picker:</b> a new Columns icon in the upper right corner of the table lets you choose which columns are shown. Weight, Tune, Assists and Δ goal are hidden by default to keep things tidy, but they\'re one click away.'
          ]
        },
        {
          id: 1,
          title: 'News page, Getting Started, UI tweaks, and bans',
          date: '2026-09-17',
          items: [
            'Added News section: this page. It\'s where site updates, new features, and anything else worth knowing about will get posted from now on.',
            'Added Getting Started page: a single walkthrough covering nearly every feature on the site — for anyone new to the site.',
            'Minor UI tweaks: new "Contact Us" links (email and Discord) in the footer, a few icons swapped out, and a refresh button on the Races page so newly logged races show up without reloading the whole app.',
            '<b class="text-brand-text dark:text-brand-text-dark">Moderation:</b> admins and mods can now ban users directly, in case the site ends up getting abused.'
          ]
        }
      ]
    }
  },
  methods: {
    formatDate
  }
}
</script>
