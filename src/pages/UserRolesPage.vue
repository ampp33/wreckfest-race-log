<template>
  <div class="max-w-4xl mx-auto px-4 py-6">
    <h1 class="text-2xl font-bold mb-1">User Roles</h1>
    <p class="text-sm text-slate-500 mb-6">Manage admin access for registered users.</p>

    <p v-if="loading" class="text-sm text-slate-500">Loading…</p>

    <p v-else-if="error" class="text-sm text-red-500">{{ error }}</p>

    <div v-else class="bg-white dark:bg-gray-800 rounded border border-slate-200 dark:border-slate-700 p-4">
      <p v-if="!users.length" class="text-sm text-slate-500">No users found.</p>
      <table v-else class="w-full text-sm">
        <thead>
          <tr class="text-left text-xs uppercase text-slate-500 border-b border-slate-200 dark:border-slate-700">
            <th class="pb-2 font-medium">Email</th>
            <th class="pb-2 font-medium">Joined</th>
            <th class="pb-2 font-medium">Role</th>
            <th class="pb-2 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 dark:divide-slate-700">
          <tr
            v-for="user in users"
            :key="user.id"
            class="hover:bg-slate-50 dark:hover:bg-slate-700/40"
          >
            <td class="py-2 pr-4">
              {{ user.email }}
              <span v-if="user.id === currentUserId" class="ml-1 text-xs text-slate-400">(you)</span>
            </td>
            <td class="py-2 pr-4 text-slate-500 whitespace-nowrap">
              {{ formatDate(user.created_at) }}
            </td>
            <td class="py-2 pr-4">
              <span
                class="px-2 py-0.5 rounded text-xs font-medium"
                :class="user.role === 'admin'
                  ? 'bg-brand/10 text-brand'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'"
              >
                {{ user.role }}
              </span>
            </td>
            <td class="py-2 text-right">
              <button
                v-if="user.id !== currentUserId"
                type="button"
                class="text-xs text-brand hover:underline"
                @click="openDialog(user)"
              >
                Change role
              </button>
              <span v-else class="text-xs text-slate-400">—</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Role picker dialog -->
    <teleport to="body">
      <div
        v-if="dialog.open"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
        @click.self="closeDialog"
      >
        <div class="bg-white dark:bg-gray-800 rounded border border-slate-200 dark:border-slate-700 shadow-xl w-72 p-5">
          <h2 class="font-semibold mb-1">Change role</h2>
          <p class="text-xs text-slate-500 mb-4 break-all">{{ dialog.user?.email }}</p>

          <div class="space-y-2 mb-5">
            <label
              v-for="role in availableRoles"
              :key="role.value"
              class="flex items-start gap-3 cursor-pointer"
            >
              <input
                type="radio"
                :value="role.value"
                v-model="dialog.selectedRole"
                class="mt-0.5 accent-brand"
              />
              <span>
                <span class="block text-sm font-medium">{{ role.label }}</span>
                <span class="block text-xs text-slate-500">{{ role.description }}</span>
              </span>
            </label>
          </div>

          <div class="flex justify-end gap-2">
            <button
              type="button"
              class="px-3 py-1.5 text-sm rounded border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700"
              @click="closeDialog"
            >
              Cancel
            </button>
            <button
              type="button"
              class="px-3 py-1.5 text-sm rounded bg-brand text-white hover:opacity-90 disabled:opacity-50"
              :disabled="saving || dialog.selectedRole === dialog.user?.role"
              @click="confirmChange"
            >
              {{ saving ? 'Saving…' : 'OK' }}
            </button>
          </div>
        </div>
      </div>
    </teleport>
  </div>
</template>

<script>
import { authStore } from '../stores/authStore.js'
import { getAllUsers, setUserRole } from '../services/adminService.js'
import { pushToast } from '../stores/toastStore.js'

export default {
  name: 'UserRolesPage',
  data() {
    return {
      loading: true,
      error: null,
      users: [],
      saving: false,
      dialog: {
        open: false,
        user: null,
        selectedRole: null
      },
      availableRoles: [
        { value: 'user',  label: 'User',  description: 'Standard access' },
        { value: 'admin', label: 'Admin', description: 'Access to admin pages' }
      ]
    }
  },
  computed: {
    currentUserId() {
      return authStore.user?.id ?? null
    }
  },
  mounted() {
    this._onKeydown = e => { if (e.key === 'Escape') this.closeDialog() }
    window.addEventListener('keydown', this._onKeydown)
  },
  beforeUnmount() {
    window.removeEventListener('keydown', this._onKeydown)
  },
  async created() {
    try {
      this.users = await getAllUsers()
    } catch (err) {
      this.error = err.message || 'Failed to load users'
    } finally {
      this.loading = false
    }
  },
  methods: {
    formatDate(iso) {
      return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
    },
    openDialog(user) {
      this.dialog = { open: true, user, selectedRole: user.role }
    },
    closeDialog() {
      this.dialog = { open: false, user: null, selectedRole: null }
    },
    async confirmChange() {
      const { user, selectedRole } = this.dialog
      this.saving = true
      try {
        await setUserRole(user.id, selectedRole)
        user.role = selectedRole
        pushToast(`${user.email} is now ${selectedRole}`, 'success')
        this.closeDialog()
      } catch (err) {
        pushToast(err.message || 'Failed to update role', 'error')
      } finally {
        this.saving = false
      }
    }
  }
}
</script>
