<template>
  <div class="max-w-4xl mx-auto px-6 py-6 pb-24">
    <h1 class="font-display font-black tracking-tighter leading-none text-display-lg text-brand-text dark:text-brand-text-dark mb-1">
      API <em class="signal">Keys</em>
    </h1>
    <p class="font-body text-[15px] leading-relaxed text-brand-secondary dark:text-brand-secondary-dark mb-6">
      All API keys issued across every account. Raw key values are never stored, so only the hash is
      generated once at creation time and shown to the issuing user — this list can't reveal it.
    </p>

    <p v-if="loading" class="font-body text-[15px] text-brand-muted dark:text-brand-muted-dark">Loading…</p>

    <p v-else-if="error" class="text-sm text-red-500">{{ error }}</p>

    <div v-else-if="!keys.length" class="font-body text-[15px] text-brand-muted dark:text-brand-muted-dark">
      No API keys have been issued yet.
    </div>

    <div v-else class="bg-brand-surface dark:bg-brand-surface-dark rounded border border-brand-border dark:border-brand-border-dark">
      <!-- Card layout (mobile) -->
      <div class="sm:hidden divide-y divide-brand-border dark:divide-brand-border-dark">
        <div v-for="key in keys" :key="key.id" class="p-3">
          <div class="flex items-start justify-between gap-2">
            <div class="min-w-0">
              <div class="font-medium truncate">{{ key.name }}</div>
              <div class="text-xs text-brand-muted dark:text-brand-muted-dark truncate mt-0.5">{{ key.user_email }}</div>
              <div class="text-xs text-brand-muted dark:text-brand-muted-dark mt-0.5">Issued {{ formatDate(key.created_at) }}</div>
            </div>
          </div>
          <div class="mt-2">
            <button
              v-if="confirmDeleteId !== key.id"
              type="button"
              class="text-xs text-red-500 hover:underline"
              @click="confirmDeleteId = key.id"
            >
              Delete
            </button>
            <span v-else class="inline-flex items-center gap-2">
              <span class="text-xs text-brand-muted dark:text-brand-muted-dark">Sure?</span>
              <button type="button" class="text-xs text-red-500 font-semibold hover:underline" @click="onDelete(key.id)">Yes</button>
              <button type="button" class="text-xs text-brand-muted dark:text-brand-muted-dark hover:underline" @click="confirmDeleteId = null">Cancel</button>
            </span>
          </div>
        </div>
      </div>

      <!-- Table layout (desktop) -->
      <div class="hidden sm:block overflow-x-auto">
        <table class="min-w-full text-sm">
          <thead>
            <tr class="text-left font-body font-medium uppercase tracking-widest text-[11px] text-brand-muted dark:text-brand-muted-dark border-b border-brand-border dark:border-brand-border-dark">
              <th class="px-4 py-2 font-medium">Name</th>
              <th class="px-4 py-2 font-medium">Issued by</th>
              <th class="px-4 py-2 font-medium whitespace-nowrap">Issued</th>
              <th class="px-4 py-2 font-medium whitespace-nowrap">Last used</th>
              <th class="px-4 py-2 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-brand-border dark:divide-brand-border-dark">
            <tr v-for="key in keys" :key="key.id" class="hover:bg-brand-bg dark:hover:bg-brand-bg-dark/30">
              <td class="px-4 py-2 font-body text-brand-text dark:text-brand-text-dark">{{ key.name }}</td>
              <td class="px-4 py-2 text-brand-secondary dark:text-brand-secondary-dark">{{ key.user_email }}</td>
              <td class="px-4 py-2 text-brand-muted dark:text-brand-muted-dark whitespace-nowrap">{{ formatDate(key.created_at) }}</td>
              <td class="px-4 py-2 text-brand-muted dark:text-brand-muted-dark whitespace-nowrap">
                {{ key.last_used_at ? formatDate(key.last_used_at) : 'Never' }}
              </td>
              <td class="px-4 py-2 text-right">
                <button
                  v-if="confirmDeleteId !== key.id"
                  type="button"
                  class="text-xs text-red-500 hover:underline"
                  @click="confirmDeleteId = key.id"
                >
                  Delete
                </button>
                <span v-else class="inline-flex items-center gap-2">
                  <span class="text-xs text-brand-muted dark:text-brand-muted-dark">Sure?</span>
                  <button type="button" class="text-xs text-red-500 font-semibold hover:underline" @click="onDelete(key.id)">Yes</button>
                  <button type="button" class="text-xs text-brand-muted dark:text-brand-muted-dark hover:underline" @click="confirmDeleteId = null">Cancel</button>
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
import { getAllApiKeys, adminDeleteApiKey } from '../services/adminService.js'
import { pushToast } from '../stores/toastStore.js'

export default {
  name: 'AdminApiKeysPage',
  data() {
    return {
      keys: [],
      loading: true,
      error: null,
      confirmDeleteId: null
    }
  },
  async created() {
    try {
      this.keys = await getAllApiKeys()
    } catch (err) {
      this.error = err.message || 'Failed to load API keys'
    } finally {
      this.loading = false
    }
  },
  methods: {
    formatDate(iso) {
      return new Date(iso).toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    },
    async onDelete(id) {
      this.confirmDeleteId = null
      try {
        await adminDeleteApiKey(id)
        this.keys = this.keys.filter(k => k.id !== id)
        pushToast('API key deleted', 'success')
      } catch (err) {
        pushToast(err.message || 'Failed to delete key', 'error')
      }
    }
  }
}
</script>
