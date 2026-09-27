<template>
  <div class="max-w-7xl mx-auto px-6 py-10">
    <h1 class="font-heading font-normal tracking-normal leading-none text-display-lg text-brand-text dark:text-brand-text-dark">
      <em class="signal">Alerts</em>
    </h1>
    <p class="font-body text-[15px] leading-relaxed text-brand-muted dark:text-brand-muted-dark mt-3.5 mb-10 max-w-xl">
      Post an announcement to every user's alerts bell. New alerts show as unread for everyone who signed up before they were posted.
    </p>

    <form
      ref="formEl"
      class="max-w-2xl mb-12 border border-brand-border dark:border-brand-border-dark p-5"
      @submit.prevent="onSubmit"
    >
      <div class="ov text-brand-muted dark:text-brand-muted-dark mb-4">
        {{ editingId ? 'Edit alert' : 'New alert' }}
      </div>

      <label class="block mb-4">
        <span class="block font-body text-[13px] text-brand-secondary dark:text-brand-secondary-dark mb-1.5">Title</span>
        <input
          v-model="form.title"
          type="text"
          maxlength="120"
          required
          :disabled="saving"
          :class="inputClass"
        />
      </label>

      <label class="block mb-4">
        <span class="block font-body text-[13px] text-brand-secondary dark:text-brand-secondary-dark mb-1.5">Message</span>
        <textarea
          v-model="form.body"
          rows="4"
          required
          :disabled="saving"
          :class="[inputClass, 'resize-y']"
        />
        <span class="block font-body text-[12px] text-brand-muted dark:text-brand-muted-dark mt-1">
          The bell's preview shows about the first {{ PREVIEW_CHARS }} characters — lead with the important part.
        </span>
      </label>

      <label class="block mb-5">
        <span class="block font-body text-[13px] text-brand-secondary dark:text-brand-secondary-dark mb-1.5">Link <span class="text-brand-muted dark:text-brand-muted-dark">(optional)</span></span>
        <input
          v-model="form.link"
          type="text"
          placeholder="/news or https://…"
          :disabled="saving"
          :class="inputClass"
        />
        <span v-if="linkError" class="block font-body text-[12px] text-brand-accent dark:text-brand-accent-dark mt-1">{{ linkError }}</span>
      </label>

      <div class="flex justify-end gap-3">
        <button
          v-if="editingId"
          type="button"
          class="px-4 py-2 text-sm font-body text-brand-muted dark:text-brand-muted-dark hover:text-brand-text dark:hover:text-brand-text-dark"
          :disabled="saving"
          @click="resetForm"
        >
          Cancel
        </button>
        <button
          type="submit"
          class="px-4 py-2 text-sm font-body bg-brand-accent text-white rounded hover:opacity-90 disabled:opacity-50"
          :disabled="!canSubmit"
        >
          {{ saving ? 'Saving…' : editingId ? 'Save changes' : 'Post alert' }}
        </button>
      </div>
    </form>

    <p v-if="loading" class="font-body text-[15px] text-brand-muted dark:text-brand-muted-dark">Loading…</p>

    <p v-else-if="error" class="text-sm text-brand-accent dark:text-brand-accent-dark">{{ error }}</p>

    <div v-else-if="!entries.length" class="font-body text-[15px] text-brand-muted dark:text-brand-muted-dark">
      No alerts have been posted yet.
    </div>

    <div v-else class="rule-top divide-y divide-brand-border dark:divide-brand-border-dark border-b border-brand-border dark:border-brand-border-dark">
      <div
        v-for="entry in entries"
        :key="entry.id"
        class="py-5"
      >
        <div class="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 mb-2">
          <span class="font-body font-bold text-brand-text dark:text-brand-text-dark">{{ entry.title }}</span>
          <span class="ov tabular text-brand-muted dark:text-brand-muted-dark whitespace-nowrap">{{ formatDate(entry.created_at) }}</span>
        </div>
        <p class="font-body text-[15px] leading-relaxed text-brand-secondary dark:text-brand-secondary-dark whitespace-pre-wrap max-w-2xl mb-2">{{ entry.body }}</p>
        <p v-if="entry.link" class="ov text-brand-accent dark:text-brand-accent-dark break-all mb-2">{{ entry.link }}</p>

        <div class="flex items-center gap-4">
          <button
            type="button"
            class="ov min-h-[44px] inline-flex items-center text-brand-muted dark:text-brand-muted-dark hover:text-brand-accent dark:hover:text-brand-accent-dark"
            @click="startEdit(entry)"
          >Edit</button>
          <button
            v-if="confirmDeleteId !== entry.id"
            type="button"
            class="ov min-h-[44px] inline-flex items-center text-brand-muted dark:text-brand-muted-dark hover:text-brand-accent dark:hover:text-brand-accent-dark"
            @click="confirmDeleteId = entry.id"
          >Delete</button>
          <span v-else class="inline-flex items-center gap-3">
            <span class="ov text-brand-muted dark:text-brand-muted-dark">Delete?</span>
            <button type="button" class="ov min-h-[44px] inline-flex items-center font-bold text-brand-accent dark:text-brand-accent-dark" @click="onDelete(entry.id)">Yes</button>
            <button type="button" class="ov min-h-[44px] inline-flex items-center text-brand-muted dark:text-brand-muted-dark hover:text-brand-text dark:hover:text-brand-text-dark" @click="confirmDeleteId = null">Cancel</button>
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { getAlerts, createAlert, updateAlert, deleteAlert } from '../services/alertService.js'
import { refreshAlerts } from '../stores/alertStore.js'
import { authStore } from '../stores/authStore.js'
import { pushToast } from '../stores/toastStore.js'
import { formatDateTime } from '../utils/dateFormat.js'

const emptyForm = () => ({ title: '', body: '', link: '' })

export default {
  name: 'AdminAlertsPage',
  data() {
    return {
      entries: [],
      loading: true,
      error: null,
      form: emptyForm(),
      editingId: null,
      saving: false,
      confirmDeleteId: null,
      PREVIEW_CHARS: 120,
      inputClass: 'w-full rounded border border-brand-border dark:border-brand-border-dark bg-brand-surface dark:bg-brand-surface-dark text-brand-text dark:text-brand-text-dark font-body text-[15px] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent'
    }
  },
  computed: {
    // Mirrors the alerts_link_check constraint in schema.sql: an in-app
    // path or an http(s) URL, nothing else (e.g. no javascript: links).
    linkError() {
      const link = this.form.link.trim()
      if (!link || /^\/(?!\/)/.test(link) || /^https?:\/\//i.test(link)) return null
      return 'Use an in-app path starting with / or a full http(s):// URL.'
    },
    canSubmit() {
      return !this.saving && !this.linkError && this.form.title.trim() && this.form.body.trim()
    }
  },
  created() {
    this.load()
  },
  methods: {
    formatDate: formatDateTime,
    async load() {
      try {
        this.entries = await getAlerts()
      } catch (err) {
        this.error = err.message || 'Failed to load alerts'
      } finally {
        this.loading = false
      }
    },
    resetForm() {
      this.form = emptyForm()
      this.editingId = null
    },
    startEdit(entry) {
      this.editingId = entry.id
      this.form = { title: entry.title, body: entry.body, link: entry.link || '' }
      this.$refs.formEl.scrollIntoView({ behavior: 'smooth', block: 'start' })
    },
    async onSubmit() {
      if (!this.canSubmit) return
      const payload = {
        title: this.form.title.trim(),
        body: this.form.body.trim(),
        link: this.form.link.trim()
      }
      this.saving = true
      try {
        if (this.editingId) {
          await updateAlert(this.editingId, payload)
          pushToast('Alert updated', 'success', 3000)
        } else {
          await createAlert({ ...payload, createdBy: authStore.user.id })
          pushToast('Alert posted', 'success', 3000)
        }
        this.resetForm()
        await this.load()
        refreshAlerts({ force: true })
      } catch (err) {
        pushToast(err.message || 'Failed to save alert', 'error')
      } finally {
        this.saving = false
      }
    },
    async onDelete(id) {
      this.confirmDeleteId = null
      try {
        await deleteAlert(id)
        this.entries = this.entries.filter(e => e.id !== id)
        if (this.editingId === id) this.resetForm()
        refreshAlerts({ force: true })
        pushToast('Alert deleted', 'success', 3000)
      } catch (err) {
        pushToast(err.message || 'Failed to delete alert', 'error')
      }
    }
  }
}
</script>
