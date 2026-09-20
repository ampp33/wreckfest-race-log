<template>
  <div class="max-w-7xl mx-auto px-6 py-10">
    <h1 class="font-heading font-normal tracking-normal leading-none text-display-lg text-brand-text dark:text-brand-text-dark">
      API <em class="signal">Keys</em>
    </h1>
    <p class="font-body text-[15px] leading-relaxed text-brand-muted dark:text-brand-muted-dark mt-3.5 mb-10 max-w-xl">
      All API keys issued across every account. Raw key values are never stored, so only the hash is
      generated once at creation time and shown to the issuing user — this list can't reveal it.
    </p>

    <p v-if="loading" class="font-body text-[15px] text-brand-muted dark:text-brand-muted-dark">Loading…</p>

    <p v-else-if="error" class="text-sm text-brand-accent dark:text-brand-accent-dark">{{ error }}</p>

    <div v-else-if="!keys.length" class="font-body text-[15px] text-brand-muted dark:text-brand-muted-dark">
      No API keys have been issued yet.
    </div>

    <div v-else>
      <p class="font-body text-[15px] text-brand-muted dark:text-brand-muted-dark mb-6">
        <span class="font-bold text-brand-text dark:text-brand-text-dark">{{ totalRaceCount.toLocaleString() }}</span>
        {{ totalRaceCount === 1 ? 'race' : 'races' }} logged across all keys.
      </p>

      <!-- Card layout (mobile) -->
      <div class="sm:hidden rule-top divide-y divide-brand-border dark:divide-brand-border-dark border-b border-brand-border dark:border-brand-border-dark">
        <div v-for="key in keys" :key="key.id" class="py-3">
          <div class="flex items-start justify-between gap-2">
            <div class="min-w-0">
              <div class="flex items-center gap-1.5">
                <span class="font-bold truncate text-brand-text dark:text-brand-text-dark">{{ key.name }}</span>
                <span v-if="key.revoked_at" class="ov shrink-0 text-brand-muted dark:text-brand-muted-dark">Revoked</span>
              </div>
              <div class="text-xs text-brand-muted dark:text-brand-muted-dark truncate mt-0.5">{{ key.user_email }}</div>
              <div class="text-xs text-brand-muted dark:text-brand-muted-dark mt-0.5">Issued {{ formatDate(key.created_at) }}</div>
              <div class="text-xs text-brand-muted dark:text-brand-muted-dark mt-0.5">
                Last used {{ key.last_used_at ? formatDate(key.last_used_at) : 'never' }}
              </div>
              <div class="text-xs text-brand-muted dark:text-brand-muted-dark mt-0.5">
                <router-link
                  :to="{ path: '/races', query: { source: 'api', api_key_id: key.id } }"
                  class="font-semibold text-brand-accent dark:text-brand-accent-dark hover:underline"
                >{{ key.race_count.toLocaleString() }} {{ key.race_count === 1 ? 'race' : 'races' }} logged</router-link>
              </div>
            </div>
          </div>
          <div v-if="!key.revoked_at" class="mt-2">
            <button
              v-if="confirmDeleteId !== key.id"
              type="button"
              class="ov min-h-[44px] inline-flex items-center text-brand-muted dark:text-brand-muted-dark hover:text-brand-accent dark:hover:text-brand-accent-dark"
              @click="confirmDeleteId = key.id"
            >
              Revoke
            </button>
            <span v-else class="inline-flex items-center gap-2">
              <span class="ov text-brand-muted dark:text-brand-muted-dark">Sure?</span>
              <button type="button" class="ov min-h-[44px] inline-flex items-center font-bold text-brand-accent dark:text-brand-accent-dark" @click="onDelete(key.id)">Yes</button>
              <button type="button" class="ov min-h-[44px] inline-flex items-center text-brand-muted dark:text-brand-muted-dark hover:text-brand-text dark:hover:text-brand-text-dark" @click="confirmDeleteId = null">Cancel</button>
            </span>
          </div>
        </div>
      </div>

      <!-- Table layout (desktop) -->
      <div class="hidden sm:block overflow-x-auto">
        <table class="min-w-full text-sm">
          <thead>
            <tr class="text-left ov text-brand-muted dark:text-brand-muted-dark border-b-2 border-brand-strong dark:border-brand-strong-dark">
              <th class="pr-4 pb-2.5 font-medium">Name</th>
              <th class="pr-4 pb-2.5 font-medium">Issued by</th>
              <th class="pr-4 pb-2.5 font-medium whitespace-nowrap">Issued</th>
              <th class="pr-4 pb-2.5 font-medium whitespace-nowrap">Last used</th>
              <th class="pr-4 pb-2.5 font-medium text-right whitespace-nowrap">Races logged</th>
              <th class="pr-0 pb-2.5 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-brand-border dark:divide-brand-border-dark border-b border-brand-border dark:border-brand-border-dark">
            <tr v-for="key in keys" :key="key.id" class="hover:bg-brand-surface dark:hover:bg-brand-surface-dark">
              <td class="pr-4 py-2.5 font-semibold text-brand-text dark:text-brand-text-dark">
                <span class="inline-flex items-center gap-1.5">
                  {{ key.name }}
                  <span v-if="key.revoked_at" class="ov font-medium text-brand-muted dark:text-brand-muted-dark">Revoked</span>
                </span>
              </td>
              <td class="pr-4 py-2.5 text-brand-muted dark:text-brand-muted-dark">{{ key.user_email }}</td>
              <td class="pr-4 py-2.5 tabular text-xs text-brand-muted dark:text-brand-muted-dark whitespace-nowrap">{{ formatDate(key.created_at) }}</td>
              <td class="pr-4 py-2.5 tabular text-xs text-brand-muted dark:text-brand-muted-dark whitespace-nowrap">
                {{ key.last_used_at ? formatDate(key.last_used_at) : 'Never' }}
              </td>
              <td class="pr-4 py-2.5 tabular text-right whitespace-nowrap">
                <router-link
                  :to="{ path: '/races', query: { source: 'api', api_key_id: key.id } }"
                  class="font-semibold text-brand-accent dark:text-brand-accent-dark hover:underline"
                >{{ key.race_count.toLocaleString() }}</router-link>
              </td>
              <td class="pr-0 py-2.5 text-right">
                <template v-if="!key.revoked_at">
                  <button
                    v-if="confirmDeleteId !== key.id"
                    type="button"
                    class="ov min-h-[44px] inline-flex items-center text-brand-muted dark:text-brand-muted-dark hover:text-brand-accent dark:hover:text-brand-accent-dark"
                    @click="confirmDeleteId = key.id"
                  >
                    Revoke
                  </button>
                  <span v-else class="inline-flex items-center gap-2">
                    <span class="ov text-brand-muted dark:text-brand-muted-dark">Sure?</span>
                    <button type="button" class="ov min-h-[44px] inline-flex items-center font-bold text-brand-accent dark:text-brand-accent-dark" @click="onDelete(key.id)">Yes</button>
                    <button type="button" class="ov min-h-[44px] inline-flex items-center text-brand-muted dark:text-brand-muted-dark hover:text-brand-text dark:hover:text-brand-text-dark" @click="confirmDeleteId = null">Cancel</button>
                  </span>
                </template>
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
import { formatDateTime } from '../utils/dateFormat.js'

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
  computed: {
    totalRaceCount() {
      return this.keys.reduce((sum, key) => sum + key.race_count, 0)
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
    formatDate: formatDateTime,
    async onDelete(id) {
      this.confirmDeleteId = null
      try {
        await adminDeleteApiKey(id)
        const key = this.keys.find(k => k.id === id)
        if (key) key.revoked_at = new Date().toISOString()
        pushToast('API key revoked', 'success')
      } catch (err) {
        pushToast(err.message || 'Failed to revoke key', 'error')
      }
    }
  }
}
</script>
