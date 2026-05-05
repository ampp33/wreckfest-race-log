<template>
  <div class="max-w-4xl mx-auto px-4 py-6">
    <h1 class="text-2xl font-bold mb-1">Diagnostics</h1>
    <p class="text-sm text-slate-500 mb-6">Site-wide activity overview.</p>

    <p v-if="loading" class="text-sm text-slate-500">Loading…</p>

    <p v-else-if="error" class="text-sm text-red-500">{{ error }}</p>

    <div v-else class="space-y-6">
      <div class="bg-white dark:bg-gray-800 rounded border border-slate-200 dark:border-slate-700 p-4 inline-block">
        <div class="text-xs uppercase text-slate-500">Registered users</div>
        <div class="mt-1 text-3xl font-bold">{{ data.total_users }}</div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded border border-slate-200 dark:border-slate-700 p-4">
        <h2 class="text-sm font-semibold uppercase tracking-wider text-slate-800 dark:text-slate-200 mb-3">
          Top 5 users by activity
        </h2>
        <p v-if="!data.top_users || !data.top_users.length" class="text-sm text-slate-500">
          No activity yet.
        </p>
        <table v-else class="w-full text-sm">
          <thead>
            <tr class="text-left text-xs uppercase text-slate-500 border-b border-slate-200 dark:border-slate-700">
              <th class="pb-2 font-medium">User</th>
              <th class="pb-2 font-medium text-right">Races</th>
              <th class="pb-2 font-medium text-right">Goals</th>
              <th class="pb-2 font-medium text-right">Annotations</th>
              <th class="pb-2 font-medium text-right">Total</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-slate-700">
            <tr v-for="(user, i) in data.top_users" :key="user.email" class="hover:bg-slate-50 dark:hover:bg-slate-700/40">
              <td class="py-2 pr-4">
                <span class="text-slate-400 mr-2">{{ i + 1 }}.</span>
                {{ user.email }}
              </td>
              <td class="py-2 text-right tabular-nums">{{ user.race_count }}</td>
              <td class="py-2 text-right tabular-nums">{{ user.goal_count }}</td>
              <td class="py-2 text-right tabular-nums">{{ user.annotation_count }}</td>
              <td class="py-2 text-right tabular-nums font-semibold">{{ user.total_activity }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
import { getDiagnostics } from '../services/adminService.js'

export default {
  name: 'DiagnosticsPage',
  data() {
    return {
      loading: true,
      error: null,
      data: { total_users: 0, top_users: [] }
    }
  },
  async created() {
    try {
      this.data = await getDiagnostics()
    } catch (err) {
      this.error = err.message || 'Failed to load diagnostics'
    } finally {
      this.loading = false
    }
  }
}
</script>
