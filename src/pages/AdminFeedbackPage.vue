<template>
  <div class="max-w-4xl mx-auto px-6 py-10">
    <h1 class="font-display font-black tracking-tightest leading-none text-display-lg text-brand-text dark:text-brand-text-dark">
      <em class="signal">Feedback</em>
    </h1>
    <p class="font-body text-[15px] leading-relaxed text-brand-muted dark:text-brand-muted-dark mt-3.5 mb-10 max-w-xl">
      All user-submitted feedback, newest first.
    </p>

    <p v-if="loading" class="font-body text-[15px] text-brand-muted dark:text-brand-muted-dark">Loading…</p>

    <p v-else-if="error" class="text-sm text-brand-accent dark:text-brand-accent-dark">{{ error }}</p>

    <div v-else-if="!entries.length" class="font-body text-[15px] text-brand-muted dark:text-brand-muted-dark">
      No feedback has been submitted yet.
    </div>

    <div v-else class="rule-top divide-y divide-brand-border dark:divide-brand-border-dark border-b border-brand-border dark:border-brand-border-dark">
      <div
        v-for="entry in entries"
        :key="entry.id"
        class="py-5"
      >
        <div class="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 mb-3">
          <span class="font-body font-bold text-brand-text dark:text-brand-text-dark">{{ entry.user_email }}</span>
          <span class="ov tabular text-brand-muted dark:text-brand-muted-dark whitespace-nowrap">{{ formatDate(entry.created_at) }}</span>
        </div>
        <p class="font-body text-[15px] leading-relaxed text-brand-text dark:text-brand-text-dark whitespace-pre-wrap mb-3">{{ entry.feedback_text }}</p>
        <a
          :href="entry.url"
          target="_blank"
          rel="noopener noreferrer"
          class="ov text-brand-accent dark:text-brand-accent-dark hover:underline break-all"
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
