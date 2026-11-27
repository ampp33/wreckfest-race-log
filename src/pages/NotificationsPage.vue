<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
    <div class="flex flex-wrap items-end justify-between gap-4 mb-8">
      <div>
        <h1 class="font-heading font-normal tracking-normal leading-none text-display-lg text-brand-accent dark:text-brand-accent-dark">
          Notifications
        </h1>
        <p class="font-body text-[15px] leading-relaxed text-brand-muted dark:text-brand-muted-dark mt-3.5">
          Every announcement, one line each. Open a row to read it.
        </p>
      </div>
      <label v-if="entries.length" class="flex flex-col gap-1.5">
        <span class="ov text-brand-muted dark:text-brand-muted-dark">Search notifications</span>
        <input
          v-model="query"
          type="search"
          placeholder="Plugin, maintenance…"
          class="w-[260px] max-w-full min-h-[40px] px-3 border border-brand-border dark:border-brand-border-dark bg-brand-surface dark:bg-brand-surface-dark text-brand-text dark:text-brand-text-dark font-body text-[14px] focus:outline-none focus:ring-2 focus:ring-brand-accent"
        />
      </label>
    </div>

    <p v-if="loading" class="font-body text-[15px] text-brand-muted dark:text-brand-muted-dark">Loading…</p>

    <p v-else-if="error" class="text-sm text-brand-accent dark:text-brand-accent-dark">{{ error }}</p>

    <div v-else-if="!entries.length" class="font-body text-[15px] text-brand-muted dark:text-brand-muted-dark">
      No notifications yet.
    </div>

    <!-- One line per notification from sm up (number, date, title, status);
         on phones each row stacks date + status over the full-width title,
         so nothing scrolls sideways. -->
    <div v-else class="rule-top border-b border-brand-border dark:border-brand-border-dark font-body text-[14px]">
      <div class="hidden sm:flex items-center gap-4 px-4 py-3.5 ov text-brand-muted dark:text-brand-muted-dark" aria-hidden="true">
        <span class="w-10 shrink-0">#</span>
        <span class="flex-1 flex gap-4"><span class="w-32 shrink-0">Date</span><span class="flex-1">Title</span><span class="w-20 shrink-0">Status</span></span>
        <span class="w-9 shrink-0"></span>
      </div>

      <div
        v-for="row in rows"
        :key="row.entry.id"
        :ref="el => setEntryRef(row.entry.id, el)"
        class="border-t border-brand-border dark:border-brand-border-dark"
        :class="isOpen(row.entry.id) && 'bg-brand-surface dark:bg-brand-surface-dark'"
      >
        <div class="flex items-center gap-4 px-4 py-3.5 cursor-pointer" @click="toggle(row.entry.id)">
          <span class="hidden sm:block w-10 shrink-0 tabular text-brand-muted dark:text-brand-muted-dark">{{ row.number }}</span>
          <div class="flex-1 min-w-0 flex flex-wrap sm:flex-nowrap items-center gap-x-3 gap-y-1.5 sm:gap-4">
            <span
              class="sm:w-32 sm:shrink-0 whitespace-nowrap max-sm:text-[13px]"
              :class="row.isNew ? 'text-brand-text dark:text-brand-text-dark' : 'text-brand-muted dark:text-brand-muted-dark'"
            >{{ formatDate(row.entry.created_at) }}</span>
            <span
              class="basis-full sm:basis-auto sm:flex-1 min-w-0 order-last sm:order-none max-sm:text-[15px] leading-snug"
              :class="row.isNew ? 'font-bold text-brand-text dark:text-brand-text-dark' : 'font-medium text-brand-secondary dark:text-brand-secondary-dark'"
            >{{ row.entry.title }}</span>
            <span class="sm:w-20 sm:shrink-0">
              <span v-if="row.isNew" class="ov px-1.5 py-1 bg-brand-accent dark:bg-brand-accent-dark text-white">New</span>
              <span v-else class="ov text-brand-muted dark:text-brand-muted-dark">Read</span>
            </span>
          </div>
          <button
            type="button"
            class="w-9 h-9 shrink-0 border text-[16px] leading-none"
            :class="isOpen(row.entry.id)
              ? 'border-brand-strong dark:border-brand-strong-dark bg-brand-strong dark:bg-brand-strong-dark text-brand-bg dark:text-brand-bg-dark'
              : 'border-brand-border dark:border-brand-border-dark text-brand-text dark:text-brand-text-dark'"
            :aria-expanded="isOpen(row.entry.id)"
            :aria-label="`${isOpen(row.entry.id) ? 'Collapse' : 'Expand'} ${row.entry.title}`"
            @click.stop="toggle(row.entry.id)"
          >{{ isOpen(row.entry.id) ? '−' : '+' }}</button>
        </div>

        <!-- From sm up the body lines up under the title column. -->
        <div v-if="isOpen(row.entry.id)" class="px-4 pb-6 sm:pl-[13.5rem] sm:pr-[4.25rem]">
          <p class="max-w-2xl text-[15px] leading-relaxed text-brand-secondary dark:text-brand-secondary-dark whitespace-pre-wrap break-words">{{ row.entry.body }}</p>
          <template v-if="row.entry.link">
            <router-link
              v-if="isInternalLink(row.entry.link)"
              :to="row.entry.link"
              class="inline-flex items-center min-h-[44px] mt-1 font-bold text-brand-accent dark:text-brand-accent-dark hover:underline"
            >{{ row.entry.link_text || 'Read more' }} →</router-link>
            <a
              v-else
              :href="row.entry.link"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center min-h-[44px] mt-1 font-bold text-brand-accent dark:text-brand-accent-dark hover:underline"
            >{{ row.entry.link_text || 'Read more' }} →</a>
          </template>
        </div>
      </div>

      <p v-if="!rows.length" class="border-t border-brand-border dark:border-brand-border-dark px-4 py-6 text-brand-muted dark:text-brand-muted-dark">
        No notifications match “{{ query }}”.
      </p>
    </div>
  </div>
</template>

<script>
import { getNotifications } from '../services/notificationService.js'
import { markRead } from '../stores/notificationStore.js'
import { formatDate } from '../utils/dateFormat.js'

export default {
  name: 'NotificationsPage',
  data() {
    return {
      entries: [],
      // Notifications that were unread when the page loaded. They're marked read
      // straight away, but keep their "New" styling for this visit so the
      // user can still tell which ones they hadn't seen.
      newIds: [],
      // Rows showing their body. Starts as the new ones plus any highlight.
      openIds: [],
      query: '',
      loading: true,
      error: null,
      entryEls: {}
    }
  },
  computed: {
    highlightId() {
      return typeof this.$route.query.highlight === 'string' ? this.$route.query.highlight : null
    },
    // Numbered oldest = 01, so a row keeps its number as new notifications arrive.
    rows() {
      const q = this.query.trim().toLowerCase()
      const total = this.entries.length
      return this.entries
        .map((entry, i) => ({
          entry,
          number: String(total - i).padStart(2, '0'),
          isNew: this.newIds.includes(entry.id)
        }))
        .filter(r => !q || r.entry.title.toLowerCase().includes(q) || r.entry.body.toLowerCase().includes(q))
    }
  },
  watch: {
    highlightId() {
      this.openHighlight()
    }
  },
  async created() {
    try {
      this.entries = await getNotifications()
      this.newIds = this.entries.filter(e => !e.is_read).map(e => e.id)
      this.openIds = [...this.newIds]
      markRead(this.newIds)
    } catch (err) {
      this.error = err.message || 'Failed to load notifications'
    } finally {
      this.loading = false
    }
    this.openHighlight()
  },
  methods: {
    formatDate,
    isOpen(id) {
      return this.openIds.includes(id)
    },
    toggle(id) {
      this.openIds = this.isOpen(id) ? this.openIds.filter(x => x !== id) : [...this.openIds, id]
    },
    setEntryRef(id, el) {
      if (el) this.entryEls[id] = el
    },
    openHighlight() {
      const id = this.highlightId
      if (!id) return
      if (!this.isOpen(id)) this.openIds = [...this.openIds, id]
      this.query = ''
      this.$nextTick(() => {
        const el = this.entryEls[id]
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      })
    },
    isInternalLink(link) {
      return link.startsWith('/') && !link.startsWith('//')
    }
  }
}
</script>
