<template>
  <BaseModal :open="fb.open" @close="onClose">
    <template #title>Send <em class="signal">feedback</em></template>

    <p class="font-body text-[15px] text-brand-muted dark:text-brand-muted-dark mb-4">
      Got a bug to report, a feature idea, or just some general feedback? Drop it here and we'll take a look.
    </p>

    <div class="flex flex-wrap items-center gap-x-4 gap-y-2 mb-4">
      <span class="font-body text-[13px] text-brand-muted dark:text-brand-muted-dark">Prefer to reach out directly?</span>
      <a
        href="mailto:ampp33@gmail.com"
        class="inline-flex items-center gap-1.5 font-body text-[13px] text-brand-accent dark:text-brand-accent-dark hover:underline"
      >
        <span class="inline-block w-[14px] h-[14px]" v-html="emailIcon"></span>
        Email
      </a>
      <a
        href="https://discordapp.com/channels/@me/431110818302656530/"
        target="_blank"
        rel="noopener noreferrer"
        class="inline-flex items-center gap-1.5 font-body text-[13px] text-brand-accent dark:text-brand-accent-dark hover:underline"
      >
        <span class="inline-block w-[14px] h-[14px]" v-html="discordIcon"></span>
        Discord
      </a>
    </div>

    <form @submit.prevent="onSubmit">
      <textarea
        v-model="feedbackText"
        rows="5"
        placeholder="Describe your feedback, bug, or suggestion…"
        class="w-full rounded border border-brand-border dark:border-brand-border-dark bg-brand-surface dark:bg-brand-surface-dark text-brand-text dark:text-brand-text-dark font-body text-[15px] px-3 py-2 resize-y focus:outline-none focus:ring-2 focus:ring-brand-accent"
        :disabled="submitting"
      />

      <div class="flex justify-end gap-3 mt-4">
        <button
          type="button"
          class="px-4 py-2 text-sm font-body text-brand-muted dark:text-brand-muted-dark hover:text-brand-text dark:hover:text-brand-text-dark"
          :disabled="submitting"
          @click="onClose"
        >
          Cancel
        </button>
        <button
          type="submit"
          class="px-4 py-2 text-sm font-body bg-brand-accent text-white rounded hover:opacity-90 disabled:opacity-50"
          :disabled="submitting || !feedbackText.trim()"
        >
          {{ submitting ? 'Sending…' : 'Send feedback' }}
        </button>
      </div>
    </form>
  </BaseModal>
</template>

<script>
import BaseModal from './BaseModal.vue'
import { feedbackStore, closeFeedback } from '../stores/feedbackStore.js'
import { authStore } from '../stores/authStore.js'
import { submitFeedback } from '../services/feedbackService.js'
import { pushToast } from '../stores/toastStore.js'
import emailIcon from '../assets/icons/email.svg?raw'
import discordIcon from '../assets/icons/discord.svg?raw'

export default {
  name: 'FeedbackModal',
  components: { BaseModal },
  data() {
    return {
      fb: feedbackStore,
      feedbackText: '',
      submitting: false,
      emailIcon,
      discordIcon
    }
  },
  watch: {
    'fb.open'(isOpen) {
      if (isOpen) this.feedbackText = ''
    }
  },
  methods: {
    async onSubmit() {
      if (!this.feedbackText.trim() || this.submitting) return
      const userId = authStore.user && authStore.user.id
      if (!userId) {
        pushToast('Not signed in', 'error')
        return
      }
      this.submitting = true
      try {
        await submitFeedback({
          userId,
          url: window.location.href,
          feedbackText: this.feedbackText.trim()
        })
        pushToast('Feedback sent — thank you!', 'success', 3000)
        closeFeedback()
      } catch (err) {
        pushToast(err.message || 'Failed to send feedback', 'error')
      } finally {
        this.submitting = false
      }
    },
    onClose() {
      closeFeedback()
    }
  }
}
</script>
