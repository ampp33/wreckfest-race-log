<template>
  <div class="max-w-7xl mx-auto px-6 py-10">
    <h1 class="font-heading font-normal tracking-normal leading-none text-display-lg text-brand-accent dark:text-brand-accent-dark">
      Alerts
    </h1>
    <p class="font-body text-[15px] leading-relaxed text-brand-muted dark:text-brand-muted-dark mt-3.5 mb-9 max-w-xl">
      Post an announcement to everyone's alerts bell, or to a chosen few. Users who sign up later don't get alerts posted before they joined.
    </p>

    <form
      ref="formEl"
      class="flex flex-wrap rule-top border-b border-brand-border dark:border-brand-border-dark mb-12"
      @submit.prevent="onSubmit"
    >
      <!-- 01: the message -->
      <div class="flex-[1_1_420px] min-w-0 flex flex-col gap-[18px] pt-6 pb-7 lg:pr-8">
        <div class="flex items-baseline gap-3">
          <span class="font-display font-black text-[22px] tracking-tightest">01</span>
          <span class="ov text-brand-text dark:text-brand-text-dark">{{ editingId ? 'Edit the message' : 'The message' }}</span>
        </div>

        <label class="flex flex-col gap-1.5">
          <span class="font-body font-medium text-[13px] text-brand-secondary dark:text-brand-secondary-dark">Title</span>
          <input v-model="form.title" type="text" maxlength="120" required :disabled="saving" :class="inputClass" />
        </label>

        <label class="flex flex-col gap-1.5">
          <span class="flex justify-between gap-3">
            <span class="font-body font-medium text-[13px] text-brand-secondary dark:text-brand-secondary-dark">Message</span>
            <span
              class="ov tabular"
              :class="form.body.trim().length > PREVIEW_CHARS ? 'text-brand-accent dark:text-brand-accent-dark' : 'text-brand-muted dark:text-brand-muted-dark'"
            >{{ form.body.trim().length }} / {{ PREVIEW_CHARS }} in preview</span>
          </span>
          <textarea v-model="form.body" rows="4" required :disabled="saving" :class="[inputClass, 'py-2.5 resize-y']" />
        </label>

        <label class="flex flex-col gap-1.5">
          <span class="font-body font-medium text-[13px] text-brand-secondary dark:text-brand-secondary-dark">
            Link <span class="font-normal text-brand-muted dark:text-brand-muted-dark">optional</span>
          </span>
          <input
            v-model="form.link"
            type="text"
            placeholder="/news or https://…"
            :disabled="saving"
            :aria-invalid="!!linkError"
            :class="[inputClass, linkError && '!border-brand-accent dark:!border-brand-accent-dark']"
          />
          <span v-if="linkError" class="font-body text-[12px] text-brand-accent dark:text-brand-accent-dark">{{ linkError }}</span>
        </label>
      </div>

      <!-- 02: who gets it. Recipients are fixed once posted; editing only changes the content. -->
      <fieldset
        class="flex-[1_1_420px] min-w-0 flex flex-col gap-3.5 pt-6 pb-7 lg:pl-8 lg:border-l border-t lg:border-t-0 border-brand-border dark:border-brand-border-dark"
        :disabled="saving || !!editingId"
      >
        <legend class="sr-only">Recipients</legend>
        <div class="flex items-baseline gap-3">
          <span class="font-display font-black text-[22px] tracking-tightest">02</span>
          <span class="ov text-brand-text dark:text-brand-text-dark">Who gets it</span>
        </div>

        <p v-if="editingId" class="font-body text-[14px] leading-relaxed text-brand-muted dark:text-brand-muted-dark">
          Recipients can't be changed once an alert is posted. Only the title, message and link can.
        </p>

        <template v-else>
          <div class="grid grid-cols-2 border border-brand-border dark:border-brand-border-dark">
            <label
              v-for="opt in audienceOptions"
              :key="opt.value"
              class="flex items-center justify-center gap-2 min-h-[44px] px-3 font-body text-[14px] cursor-pointer"
              :class="audience === opt.value
                ? 'bg-brand-strong dark:bg-brand-strong-dark text-brand-bg dark:text-brand-bg-dark font-bold'
                : 'text-brand-secondary dark:text-brand-secondary-dark'"
            >
              <input v-model="audience" type="radio" :value="opt.value" class="accent-brand-accent" />
              {{ opt.label }}
            </label>
          </div>

          <template v-if="audience === 'specific'">
            <div v-if="selectedUsers.length" class="flex flex-wrap items-center gap-1.5">
              <span
                v-for="user in selectedUsers"
                :key="user.id"
                class="inline-flex items-center gap-1 min-h-[30px] pl-2.5 pr-1 font-body text-[13px] bg-brand-strong dark:bg-brand-strong-dark text-brand-bg dark:text-brand-bg-dark"
              >
                {{ userLabel(user) }}
                <button
                  type="button"
                  class="w-6 h-6 opacity-70 hover:opacity-100"
                  :aria-label="`Remove ${userLabel(user)}`"
                  @click="removeUser(user.id)"
                >✕</button>
              </span>
              <button
                type="button"
                class="ov min-h-[30px] px-1 text-brand-muted dark:text-brand-muted-dark hover:text-brand-accent dark:hover:text-brand-accent-dark"
                @click="selectedUserIds = []"
              >Clear</button>
            </div>

            <input
              v-model="userFilter"
              type="search"
              placeholder="Filter by name or email"
              aria-label="Filter users"
              :class="[inputClass, '!bg-brand-bg dark:!bg-brand-bg-dark !border-brand-strong dark:!border-brand-strong-dark']"
            />
            <p v-if="usersError" class="text-sm text-brand-accent dark:text-brand-accent-dark">{{ usersError }}</p>
            <div v-else class="max-h-64 overflow-y-auto border border-brand-border dark:border-brand-border-dark divide-y divide-brand-border dark:divide-brand-border-dark">
              <label
                v-for="user in filteredUsers"
                :key="user.id"
                class="flex items-center gap-3 px-3.5 min-h-[48px] py-1.5 cursor-pointer hover:bg-brand-surface dark:hover:bg-brand-surface-dark"
                :class="selectedUserIds.includes(user.id) && 'bg-brand-surface dark:bg-brand-surface-dark'"
              >
                <input v-model="selectedUserIds" type="checkbox" :value="user.id" class="accent-brand-accent w-4 h-4 shrink-0" />
                <span class="min-w-0 flex-1">
                  <span
                    class="block truncate font-body text-[14px] text-brand-text dark:text-brand-text-dark"
                    :class="selectedUserIds.includes(user.id) ? 'font-bold' : 'font-medium'"
                  >{{ userLabel(user) }}</span>
                  <span class="block truncate font-body text-[12px] text-brand-muted dark:text-brand-muted-dark">
                    <template v-if="user.display_name">{{ user.email }} · </template>{{ user.last_race_at ? `Last race ${formatRelativeDate(user.last_race_at)}` : 'No races yet' }}
                  </span>
                </span>
              </label>
              <p v-if="!filteredUsers.length" class="px-3.5 py-2.5 font-body text-[14px] text-brand-muted dark:text-brand-muted-dark">
                {{ users.length ? 'No matching users.' : 'Loading…' }}
              </p>
            </div>
          </template>
        </template>
      </fieldset>

      <div class="basis-full flex flex-wrap items-center justify-between gap-3 py-[18px] border-t border-brand-border dark:border-brand-border-dark">
        <span class="font-body text-[14px] text-brand-secondary dark:text-brand-secondary-dark">{{ submitHint }}</span>
        <div class="flex gap-3">
          <button
            v-if="editingId"
            type="button"
            class="min-h-[48px] px-4 font-body text-[14px] text-brand-muted dark:text-brand-muted-dark hover:text-brand-text dark:hover:text-brand-text-dark"
            :disabled="saving"
            @click="resetForm"
          >Cancel</button>
          <button
            type="submit"
            class="min-h-[48px] px-6 font-body font-bold text-[14px] tracking-[0.06em] uppercase bg-brand-accent dark:bg-brand-accent-dark text-white hover:opacity-90 disabled:opacity-50"
            :disabled="!canSubmit"
          >{{ submitLabel }}</button>
        </div>
      </div>
    </form>

    <p v-if="loading" class="font-body text-[15px] text-brand-muted dark:text-brand-muted-dark">Loading…</p>

    <p v-else-if="error" class="text-sm text-brand-accent dark:text-brand-accent-dark">{{ error }}</p>

    <div v-else-if="!entries.length" class="font-body text-[15px] text-brand-muted dark:text-brand-muted-dark">
      No alerts have been posted yet.
    </div>

    <section v-else>
      <div class="flex items-baseline justify-between pb-3 border-b-2 border-brand-strong dark:border-brand-strong-dark">
        <h2 class="font-body font-bold text-[15px] text-brand-text dark:text-brand-text-dark">Posted</h2>
        <span class="ov text-brand-muted dark:text-brand-muted-dark">{{ entries.length }} {{ entries.length === 1 ? 'alert' : 'alerts' }}</span>
      </div>
      <div
        v-for="entry in entries"
        :key="entry.id"
        class="border-b border-brand-border dark:border-brand-border-dark"
        :class="editingId === entry.id && 'bg-brand-surface dark:bg-brand-surface-dark'"
      >
        <div class="flex flex-wrap items-center gap-x-6 gap-y-2 py-3.5">
          <span class="ov tabular w-16 text-brand-muted dark:text-brand-muted-dark">{{ formatShortDate(entry.created_at) }}</span>
          <span class="flex-[999_1_260px] min-w-0 font-body font-bold text-brand-text dark:text-brand-text-dark" :title="entry.body">{{ entry.title }}</span>
          <button
            type="button"
            class="ov tabular min-h-[36px] inline-flex items-center"
            :class="openRecipientsId === entry.id ? 'text-brand-accent dark:text-brand-accent-dark' : 'text-brand-secondary dark:text-brand-secondary-dark hover:text-brand-accent dark:hover:text-brand-accent-dark'"
            :aria-expanded="openRecipientsId === entry.id"
            @click="toggleRecipients(entry.id)"
          >{{ entry.read_count }} / {{ entry.recipient_count }} seen</button>
          <span class="flex items-center gap-4">
            <button
              type="button"
              class="ov min-h-[36px] inline-flex items-center text-brand-secondary dark:text-brand-secondary-dark hover:text-brand-accent dark:hover:text-brand-accent-dark"
              @click="startEdit(entry)"
            >Edit</button>
            <button
              v-if="confirmDeleteId !== entry.id"
              type="button"
              class="ov min-h-[36px] inline-flex items-center text-brand-accent dark:text-brand-accent-dark hover:text-brand-text dark:hover:text-brand-text-dark"
              @click="confirmDeleteId = entry.id"
            >Delete</button>
            <span v-else class="inline-flex items-center gap-3">
              <span class="ov text-brand-muted dark:text-brand-muted-dark">Delete?</span>
              <button type="button" class="ov min-h-[36px] inline-flex items-center font-bold text-brand-accent dark:text-brand-accent-dark" @click="onDelete(entry.id)">Yes</button>
              <button type="button" class="ov min-h-[36px] inline-flex items-center text-brand-muted dark:text-brand-muted-dark hover:text-brand-text dark:hover:text-brand-text-dark" @click="confirmDeleteId = null">Cancel</button>
            </span>
          </span>
        </div>

        <div v-if="openRecipientsId === entry.id" class="pb-4 max-w-2xl">
          <p v-if="!recipients[entry.id]" class="font-body text-[14px] text-brand-muted dark:text-brand-muted-dark">Loading…</p>
          <ul v-else class="max-h-64 overflow-y-auto divide-y divide-brand-border dark:divide-brand-border-dark border border-brand-border dark:border-brand-border-dark bg-brand-surface dark:bg-brand-surface-dark">
            <li
              v-for="r in recipients[entry.id]"
              :key="r.user_id"
              class="flex justify-between gap-3 px-3.5 py-2.5 font-body text-[14px]"
            >
              <span class="text-brand-text dark:text-brand-text-dark">{{ r.display_name }}</span>
              <span class="ov tabular whitespace-nowrap" :class="r.read_at ? 'text-brand-muted dark:text-brand-muted-dark' : 'text-brand-accent dark:text-brand-accent-dark'">
                {{ r.read_at ? formatDate(r.read_at) : 'Not seen' }}
              </span>
            </li>
          </ul>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
import { getAdminAlerts, getAlertRecipients, createAlert, updateAlert, deleteAlert } from '../services/alertService.js'
import { getAllUsers } from '../services/adminService.js'
import { refreshAlerts } from '../stores/alertStore.js'
import { pushToast } from '../stores/toastStore.js'
import { formatDateTime, formatRelativeDate } from '../utils/dateFormat.js'

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
      audienceOptions: [
        { value: 'everyone', label: 'Everyone' },
        { value: 'specific', label: 'Specific users' }
      ],
      inputClass: 'w-full min-h-[44px] border border-brand-border dark:border-brand-border-dark bg-brand-surface dark:bg-brand-surface-dark text-brand-text dark:text-brand-text-dark font-body text-[15px] px-3 focus:outline-none focus:ring-2 focus:ring-brand-accent'
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
    selectedUsers() {
      return this.users.filter(u => this.selectedUserIds.includes(u.id))
    },
    submitLabel() {
      if (this.saving) return 'Saving…'
      if (this.editingId) return 'Save changes'
      if (this.audience === 'specific' && this.selectedUserIds.length) {
        const n = this.selectedUserIds.length
        return `Post to ${n} ${n === 1 ? 'user' : 'users'}`
      }
      return 'Post alert'
    },
    // Says who it goes to, or the first thing stopping it from posting.
    submitHint() {
      if (this.linkError) return 'Fix the link to post.'
      if (!this.form.title.trim() || !this.form.body.trim()) return 'Add a title and a message.'
      if (this.editingId) return 'Recipients stay as posted.'
      if (this.audience === 'everyone') return 'Goes to every current user.'
      const n = this.selectedUserIds.length
      return n ? `${n} ${n === 1 ? 'user' : 'users'} selected.` : 'Pick at least one user.'
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
    formatRelativeDate,
    formatShortDate(iso) {
      return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    },
    userLabel(user) {
      return user.display_name || user.email
    },
    removeUser(id) {
      this.selectedUserIds = this.selectedUserIds.filter(x => x !== id)
    },
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
