<template>
  <div class="max-w-7xl mx-auto px-6 py-10">
    <h1 class="font-heading font-normal tracking-normal leading-none text-display-lg text-brand-text dark:text-brand-text-dark">
      <em class="signal">Alerts</em>
    </h1>
    <p class="font-body text-[15px] leading-relaxed text-brand-muted dark:text-brand-muted-dark mt-3.5 mb-10 max-w-xl">
      Post an announcement to everyone's alerts bell, or to a chosen few. Users who sign up later don't get alerts posted before they joined.
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

      <!-- Recipients are fixed once posted; editing only changes the content. -->
      <fieldset v-if="!editingId" class="mb-5" :disabled="saving">
        <legend class="block font-body text-[13px] text-brand-secondary dark:text-brand-secondary-dark mb-1.5">Send to</legend>
        <div class="flex gap-5 mb-2">
          <label class="inline-flex items-center gap-2 min-h-[44px] font-body text-[15px] text-brand-text dark:text-brand-text-dark">
            <input v-model="audience" type="radio" value="everyone" class="accent-brand-accent" />
            Everyone
          </label>
          <label class="inline-flex items-center gap-2 min-h-[44px] font-body text-[15px] text-brand-text dark:text-brand-text-dark">
            <input v-model="audience" type="radio" value="specific" class="accent-brand-accent" />
            Specific users<template v-if="selectedUserIds.length"> ({{ selectedUserIds.length }})</template>
          </label>
        </div>
        <div v-if="audience === 'specific'">
          <input
            v-model="userFilter"
            type="search"
            placeholder="Filter by name or email"
            aria-label="Filter users"
            :class="[inputClass, 'mb-2']"
          />
          <p v-if="usersError" class="text-sm text-brand-accent dark:text-brand-accent-dark">{{ usersError }}</p>
          <div v-else class="max-h-64 overflow-y-auto border border-brand-border dark:border-brand-border-dark">
            <label
              v-for="user in filteredUsers"
              :key="user.id"
              class="flex items-center gap-2.5 px-3 min-h-[44px] font-body text-[14px] text-brand-text dark:text-brand-text-dark hover:bg-brand-surface dark:hover:bg-brand-surface-dark"
            >
              <input v-model="selectedUserIds" type="checkbox" :value="user.id" class="accent-brand-accent" />
              <span>{{ user.display_name || user.email }}</span>
              <span v-if="user.display_name" class="text-brand-muted dark:text-brand-muted-dark truncate">{{ user.email }}</span>
            </label>
            <p v-if="!filteredUsers.length" class="px-3 py-2.5 font-body text-[14px] text-brand-muted dark:text-brand-muted-dark">
              {{ users.length ? 'No matching users.' : 'Loading…' }}
            </p>
          </div>
        </div>
      </fieldset>

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

        <div class="flex flex-wrap items-center gap-4">
          <button
            type="button"
            class="ov min-h-[44px] inline-flex items-center text-brand-muted dark:text-brand-muted-dark hover:text-brand-accent dark:hover:text-brand-accent-dark"
            :aria-expanded="openRecipientsId === entry.id"
            @click="toggleRecipients(entry.id)"
          >Seen by {{ entry.read_count }} / {{ entry.recipient_count }}</button>
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

        <div v-if="openRecipientsId === entry.id" class="mt-2 max-w-2xl">
          <p v-if="!recipients[entry.id]" class="font-body text-[14px] text-brand-muted dark:text-brand-muted-dark">Loading…</p>
          <ul v-else class="max-h-64 overflow-y-auto divide-y divide-brand-border dark:divide-brand-border-dark border-y border-brand-border dark:border-brand-border-dark">
            <li
              v-for="r in recipients[entry.id]"
              :key="r.user_id"
              class="flex justify-between gap-3 py-2 font-body text-[14px]"
            >
              <span class="text-brand-text dark:text-brand-text-dark">{{ r.display_name }}</span>
              <span class="tabular whitespace-nowrap" :class="r.read_at ? 'text-brand-muted dark:text-brand-muted-dark' : 'text-brand-accent dark:text-brand-accent-dark'">
                {{ r.read_at ? formatDate(r.read_at) : 'Not seen' }}
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { getAdminAlerts, getAlertRecipients, createAlert, updateAlert, deleteAlert } from '../services/alertService.js'
import { getAllUsers } from '../services/adminService.js'
import { refreshAlerts } from '../stores/alertStore.js'
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
      audience: 'everyone',
      selectedUserIds: [],
      userFilter: '',
      users: [],
      usersError: null,
      // alert id -> recipient list, fetched when its "Seen by" is first opened
      recipients: {},
      openRecipientsId: null,
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
      const hasAudience = this.editingId || this.audience === 'everyone' || this.selectedUserIds.length
      return !this.saving && !this.linkError && this.form.title.trim() && this.form.body.trim() && hasAudience
    },
    filteredUsers() {
      const q = this.userFilter.trim().toLowerCase()
      return this.users.filter(u =>
        !q || (u.display_name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q)
      )
    }
  },
  watch: {
    // The user list is only needed for targeting, so fetch it on first use.
    async audience(value) {
      if (value !== 'specific' || this.users.length) return
      this.usersError = null
      try {
        const users = await getAllUsers()
        this.users = users.sort((a, b) =>
          (a.display_name || a.email || '').localeCompare(b.display_name || b.email || '')
        )
      } catch (err) {
        this.usersError = err.message || 'Failed to load users'
      }
    }
  },
  created() {
    this.load()
  },
  methods: {
    formatDate: formatDateTime,
    async toggleRecipients(id) {
      if (this.openRecipientsId === id) {
        this.openRecipientsId = null
        return
      }
      this.openRecipientsId = id
      try {
        // Refetched on every open — read state changes while the page sits open.
        this.recipients[id] = await getAlertRecipients(id)
      } catch (err) {
        this.openRecipientsId = null
        pushToast(err.message || 'Failed to load recipients', 'error')
      }
    },
    async load() {
      try {
        this.entries = await getAdminAlerts()
      } catch (err) {
        this.error = err.message || 'Failed to load alerts'
      } finally {
        this.loading = false
      }
    },
    resetForm() {
      this.form = emptyForm()
      this.editingId = null
      this.audience = 'everyone'
      this.selectedUserIds = []
      this.userFilter = ''
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
          await createAlert({
            ...payload,
            userIds: this.audience === 'specific' ? this.selectedUserIds : null
          })
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
