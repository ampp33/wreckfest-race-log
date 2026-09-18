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
