<template>
  <div class="max-w-7xl mx-auto px-6 py-10">
    <h1 class="font-heading font-normal tracking-normal leading-none text-display-lg text-brand-accent dark:text-brand-accent-dark">
      Alerts
    </h1>
    <p class="font-body text-[15px] leading-relaxed text-brand-muted dark:text-brand-muted-dark mt-3.5 mb-10">
      Announcements about the site and the telemetry tool, newest first.
    </p>

    <p v-if="loading" class="font-body text-[15px] text-brand-muted dark:text-brand-muted-dark">Loading…</p>

    <p v-else-if="error" class="text-sm text-brand-accent dark:text-brand-accent-dark">{{ error }}</p>

    <div v-else-if="!entries.length" class="font-body text-[15px] text-brand-muted dark:text-brand-muted-dark">
      No alerts yet.
    </div>

    <div v-else class="rule-top divide-y divide-brand-border dark:divide-brand-border-dark border-b border-brand-border dark:border-brand-border-dark">
      <div
        v-for="entry in entries"
        :key="entry.id"
        :ref="el => setEntryRef(entry.id, el)"
        class="py-5 pl-4 border-l-2 transition-colors"
        :class="[
          newIds.includes(entry.id)
            ? 'border-brand-accent dark:border-brand-accent-dark'
            : 'border-transparent',
          entry.id === highlightId && 'bg-brand-surface dark:bg-brand-surface-dark'
        ]"
      >
        <div class="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 mb-2">
          <span class="flex items-baseline gap-2.5">
            <span
              v-if="newIds.includes(entry.id)"
              class="ov text-brand-accent dark:text-brand-accent-dark"
            >New</span>
            <span class="font-body font-bold text-[17px] text-brand-text dark:text-brand-text-dark">{{ entry.title }}</span>
          </span>
          <span class="ov tabular text-brand-muted dark:text-brand-muted-dark whitespace-nowrap">{{ formatDate(entry.created_at) }}</span>
        </div>
        <p class="font-body text-[15px] leading-relaxed text-brand-secondary dark:text-brand-secondary-dark max-w-2xl whitespace-pre-wrap">{{ entry.body }}</p>
        <template v-if="entry.link">
          <router-link
            v-if="isInternalLink(entry.link)"
            :to="entry.link"
            class="inline-block mt-3 font-body text-[14px] text-brand-accent dark:text-brand-accent-dark hover:underline"
          >Read more →</router-link>
          <a
            v-else
            :href="entry.link"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-block mt-3 font-body text-[14px] text-brand-accent dark:text-brand-accent-dark hover:underline"
          >Read more →</a>
        </template>
      </div>
    </div>
  </div>
</template>

<script>
import { getAlerts } from '../services/alertService.js'
import { markRead } from '../stores/alertStore.js'
import { formatDate } from '../utils/dateFormat.js'

export default {
  name: 'AlertsPage',
  data() {
    return {
      entries: [],
      // Alerts that were unread when the page loaded. They're marked read
      // straight away, but keep their "New" styling for this visit so the
      // user can still tell which ones they hadn't seen.
      newIds: [],
      loading: true,
      error: null,
      entryEls: {}
    }
  },
  computed: {
    highlightId() {
      return typeof this.$route.query.highlight === 'string' ? this.$route.query.highlight : null
    }
  },
  watch: {
    highlightId() {
      this.scrollToHighlight()
    }
  },
  async created() {
    try {
      this.entries = await getAlerts()
      this.newIds = this.entries.filter(e => !e.is_read).map(e => e.id)
      markRead(this.newIds)
    } catch (err) {
      this.error = err.message || 'Failed to load alerts'
    } finally {
      this.loading = false
    }
    this.$nextTick(() => this.scrollToHighlight())
  },
  methods: {
    formatDate,
    setEntryRef(id, el) {
      if (el) this.entryEls[id] = el
    },
    scrollToHighlight() {
      const el = this.highlightId && this.entryEls[this.highlightId]
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    },
    isInternalLink(link) {
      return link.startsWith('/') && !link.startsWith('//')
    }
  }
}
</script>
