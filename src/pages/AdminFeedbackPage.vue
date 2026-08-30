<template>
  <div class="max-w-4xl mx-auto px-6 py-6 pb-24">
    <h1 class="font-display font-black tracking-tighter leading-none text-display-lg text-brand-text dark:text-brand-text-dark mb-1">
      <em class="signal">Feedback</em>
    </h1>
    <p class="font-body text-[15px] leading-relaxed text-brand-secondary dark:text-brand-secondary-dark mb-6">
      All user-submitted feedback, newest first.
    </p>

    <p v-if="loading" class="font-body text-[15px] text-brand-muted dark:text-brand-muted-dark">Loading…</p>

    <p v-else-if="error" class="text-sm text-red-500">{{ error }}</p>

    <div v-else-if="!entries.length" class="font-body text-[15px] text-brand-muted dark:text-brand-muted-dark">
      No feedback has been submitted yet.
    </div>

    <div v-else class="space-y-3">
      <div
        v-for="entry in entries"
        :key="entry.id"
        class="bg-brand-surface dark:bg-brand-surface-dark rounded border border-brand-border dark:border-brand-border-dark p-4"
      >
        <div class="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 mb-2">
          <span class="font-body font-medium text-brand-text dark:text-brand-text-dark">{{ entry.user_email }}</span>
          <span class="text-xs text-brand-muted dark:text-brand-muted-dark whitespace-nowrap">{{ formatDate(entry.created_at) }}</span>
        </div>
        <p class="font-body text-[15px] leading-relaxed text-brand-text dark:text-brand-text-dark whitespace-pre-wrap mb-2">{{ entry.feedback_text }}</p>
        <a
          :href="entry.url"
          target="_blank"
          rel="noopener noreferrer"
          class="text-xs text-brand-accent hover:underline break-all"
        >
          {{ entry.url }}
        </a>
      </div>
    </div>
  </div>
</template>

<script>
import { getAllFeedback } from '../services/adminService.js'

export default {
  name: 'AdminFeedbackPage',
  data() {
    return {
      entries: [],
      loading: true,
      error: null
    }
  },
  async created() {
    try {
      this.entries = await getAllFeedback()
    } catch (err) {
      this.error = err.message || 'Failed to load feedback'
    } finally {
      this.loading = false
    }
  },
  methods: {
    formatDate(iso) {
      return new Date(iso).toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    }
  }
}
</script>
