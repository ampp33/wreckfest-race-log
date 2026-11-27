<template>
  <div class="max-w-7xl mx-auto px-6 py-10">
    <div class="flex flex-wrap items-end justify-between gap-4 mb-8">
      <div>
        <h1 class="font-heading font-normal tracking-normal leading-none text-display-lg text-brand-accent dark:text-brand-accent-dark">
          Alerts
        </h1>
        <p class="font-body text-[15px] leading-relaxed text-brand-muted dark:text-brand-muted-dark mt-3.5">
          Every announcement, one line each. Open a row to read it.
        </p>
      </div>
      <label v-if="entries.length" class="flex flex-col gap-1.5">
        <span class="ov text-brand-muted dark:text-brand-muted-dark">Search alerts</span>
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
      No alerts yet.
    </div>

    <div v-else class="overflow-x-auto rule-top">
      <table class="w-full min-w-[640px] border-collapse font-body text-[14px]">
        <thead>
          <tr class="ov text-left text-brand-muted dark:text-brand-muted-dark">
            <th class="px-4 py-3.5 font-medium w-14">#</th>
            <th class="px-4 py-3.5 font-medium w-36">Date</th>
            <th class="px-4 py-3.5 font-medium">Title</th>
            <th class="px-4 py-3.5 font-medium w-24">Status</th>
            <th class="px-4 py-3.5 font-medium w-12"><span class="sr-only">Expand</span></th>
          </tr>
        </thead>
        <tbody>
          <template v-for="row in rows" :key="row.entry.id">
            <tr
              :ref="el => setEntryRef(row.entry.id, el)"
              class="border-t border-brand-border dark:border-brand-border-dark cursor-pointer"
              :class="isOpen(row.entry.id) && 'bg-brand-surface dark:bg-brand-surface-dark'"
              @click="toggle(row.entry.id)"
            >
              <td class="px-4 py-3.5 text-brand-muted dark:text-brand-muted-dark">{{ row.number }}</td>
              <td class="px-4 py-3.5 whitespace-nowrap" :class="row.isNew ? 'text-brand-text dark:text-brand-text-dark' : 'text-brand-muted dark:text-brand-muted-dark'">{{ formatDate(row.entry.created_at) }}</td>
              <td
                class="px-4 py-3.5"
                :class="row.isNew ? 'font-bold text-brand-text dark:text-brand-text-dark' : 'font-medium text-brand-secondary dark:text-brand-secondary-dark'"
              >{{ row.entry.title }}</td>
              <td class="px-4 py-3.5">
                <span v-if="row.isNew" class="ov px-1.5 py-1 bg-brand-accent dark:bg-brand-accent-dark text-white">New</span>
                <span v-else class="ov text-brand-muted dark:text-brand-muted-dark">Read</span>
              </td>
              <td class="px-2 py-1.5">
                <button
                  type="button"
                  class="w-9 h-9 border text-[16px] leading-none"
                  :class="isOpen(row.entry.id)
                    ? 'border-brand-strong dark:border-brand-strong-dark bg-brand-strong dark:bg-brand-strong-dark text-brand-bg dark:text-brand-bg-dark'
                    : 'border-brand-border dark:border-brand-border-dark text-brand-text dark:text-brand-text-dark'"
                  :aria-expanded="isOpen(row.entry.id)"
                  :aria-label="`${isOpen(row.entry.id) ? 'Collapse' : 'Expand'} ${row.entry.title}`"
                  @click.stop="toggle(row.entry.id)"
                >{{ isOpen(row.entry.id) ? '−' : '+' }}</button>
              </td>
            </tr>
            <tr v-if="isOpen(row.entry.id)" class="bg-brand-surface dark:bg-brand-surface-dark">
              <td colspan="2"></td>
              <td colspan="3" class="px-4 pb-6">
                <p class="max-w-2xl font-body text-[15px] leading-relaxed text-brand-secondary dark:text-brand-secondary-dark whitespace-pre-wrap">{{ row.entry.body }}</p>
                <template v-if="row.entry.link">
                  <router-link
                    v-if="isInternalLink(row.entry.link)"
                    :to="row.entry.link"
                    class="inline-block mt-3 font-bold text-brand-accent dark:text-brand-accent-dark hover:underline"
                  >Read more →</router-link>
                  <a
                    v-else
                    :href="row.entry.link"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="inline-block mt-3 font-bold text-brand-accent dark:text-brand-accent-dark hover:underline"
                  >Read more →</a>
                </template>
              </td>
            </tr>
          </template>
          <tr v-if="!rows.length" class="border-t border-brand-border dark:border-brand-border-dark">
            <td colspan="5" class="px-4 py-6 text-brand-muted dark:text-brand-muted-dark">No alerts match “{{ query }}”.</td>
          </tr>
        </tbody>
      </table>
      <div class="border-b border-brand-border dark:border-brand-border-dark"></div>
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
    // Numbered oldest = 01, so a row keeps its number as new alerts arrive.
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
      this.entries = await getAlerts()
      this.newIds = this.entries.filter(e => !e.is_read).map(e => e.id)
      this.openIds = [...this.newIds]
      markRead(this.newIds)
    } catch (err) {
      this.error = err.message || 'Failed to load alerts'
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
