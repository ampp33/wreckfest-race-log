<template>
  <div class="max-w-7xl mx-auto px-6 py-10">
    <h1 class="font-heading font-normal tracking-normal leading-none text-display-lg text-brand-text dark:text-brand-text-dark mb-1">
      <em class="signal">Users</em>
    </h1>
    <p class="font-body text-[15px] leading-relaxed text-brand-secondary dark:text-brand-secondary-dark mb-6">Manage registered users' access and standing, ranked by activity.</p>

    <p v-if="loading" class="font-body text-[15px] text-brand-muted dark:text-brand-muted-dark">Loading…</p>

    <p v-else-if="error" class="text-sm text-red-500">{{ error }}</p>

    <div v-else class="space-y-6">
      <div class="bg-brand-surface dark:bg-brand-surface-dark rounded border border-brand-border dark:border-brand-border-dark p-4 inline-block">
        <div class="font-body font-medium uppercase tracking-widest text-[11px] text-brand-muted dark:text-brand-muted-dark">Registered users</div>
        <div class="mt-1 font-display font-black tracking-tight text-3xl text-brand-text dark:text-brand-text-dark">{{ users.length }}</div>
      </div>

      <!-- User growth chart -->
      <div class="bg-brand-surface dark:bg-brand-surface-dark rounded border border-brand-border dark:border-brand-border-dark p-4">
        <h2 class="font-heading font-normal tracking-normal leading-none text-display-sm text-brand-text dark:text-brand-text-dark mb-3">
          User <em class="signal">growth</em> - last 30 days
        </h2>
        <div class="relative h-56">
          <canvas ref="growthCanvas"></canvas>
        </div>
      </div>

      <!-- Users table -->
      <div class="bg-brand-surface dark:bg-brand-surface-dark rounded border border-brand-border dark:border-brand-border-dark">
        <p v-if="!users.length" class="p-4 font-body text-[15px] text-brand-muted dark:text-brand-muted-dark">No users found.</p>

        <template v-else>
          <!-- Card layout (mobile) -->
          <div class="sm:hidden divide-y divide-brand-border dark:divide-brand-border-dark">
            <div
              v-for="user in users"
              :key="user.id"
              class="p-3"
              :class="{ 'opacity-60': user.banned }"
            >
              <div class="flex items-start justify-between gap-2">
                <div class="min-w-0">
                  <div class="truncate">
                    {{ user.email }}
                    <span v-if="user.id === currentUserId" class="ml-1 text-xs text-brand-muted dark:text-brand-muted-dark">(you)</span>
                  </div>
                  <div class="text-xs text-brand-muted dark:text-brand-muted-dark mt-0.5">Joined {{ formatDate(user.created_at) }}</div>
                  <div class="text-xs text-brand-muted dark:text-brand-muted-dark mt-0.5">Last race {{ formatDateTime(user.last_race_at) }}</div>
                </div>
                <div class="flex flex-col items-end gap-1 shrink-0">
                  <span
                    class="px-2 py-0.5 rounded text-xs font-medium"
                    :class="user.role === 'admin'
                      ? 'bg-brand-accent/10 text-brand-accent'
                      : 'bg-brand-bg dark:bg-brand-bg-dark text-brand-secondary dark:text-brand-secondary-dark'"
                  >
                    {{ user.role }}
                  </span>
                  <span v-if="user.banned" class="px-2 py-0.5 rounded text-xs font-medium bg-red-500/10 text-red-500">
                    Banned
                  </span>
                </div>
              </div>
              <div class="flex items-center justify-between mt-2">
                <div class="flex gap-4 text-xs text-brand-secondary dark:text-brand-secondary-dark">
                  <span>{{ user.race_count }} races</span>
                  <span>{{ user.goal_count }} goals</span>
                  <span>{{ user.annotation_count }} annotations</span>
                </div>
                <div class="text-right shrink-0">
                  <div class="font-semibold tabular-nums text-sm">{{ user.total_activity }}</div>
                  <div class="text-[10px] uppercase tracking-widest text-brand-muted dark:text-brand-muted-dark">Total</div>
                </div>
              </div>
              <div v-if="user.id !== currentUserId" class="mt-1 flex items-center gap-1">
                <button
                  type="button"
                  class="min-h-[44px] min-w-[44px] flex items-center justify-center text-brand-muted dark:text-brand-muted-dark hover:text-brand-accent dark:hover:text-brand-accent-dark"
                  title="Change role"
                  @click="openDialog(user)"
                >
                  <span class="w-4 h-4 inline-block" v-html="editIcon"></span>
                </button>

                <button
                  v-if="user.banned"
                  type="button"
                  class="min-h-[44px] min-w-[44px] flex items-center justify-center text-brand-muted dark:text-brand-muted-dark hover:text-brand-accent dark:hover:text-brand-accent-dark disabled:opacity-50"
                  title="Unban user"
                  :disabled="banningId === user.id"
                  @click="unban(user)"
                >
                  <span class="w-4 h-4 inline-block" v-html="checkIcon"></span>
                </button>
                <template v-else-if="confirmBanId === user.id">
                  <span class="text-xs text-brand-muted dark:text-brand-muted-dark">Sure?</span>
                  <button
                    type="button"
                    class="min-h-[44px] min-w-[44px] flex items-center justify-center text-red-500 hover:opacity-75"
                    title="Confirm ban"
                    @click="confirmBan(user)"
                  >
                    <span class="w-4 h-4 inline-block" v-html="checkIcon"></span>
                  </button>
                  <button
                    type="button"
                    class="min-h-[44px] min-w-[44px] flex items-center justify-center text-brand-muted dark:text-brand-muted-dark hover:text-brand-text dark:hover:text-brand-text-dark"
                    title="Cancel"
                    @click="confirmBanId = null"
                  >
                    <span class="w-4 h-4 inline-block" v-html="closeIcon"></span>
                  </button>
                </template>
                <button
                  v-else
                  type="button"
                  class="min-h-[44px] min-w-[44px] flex items-center justify-center text-brand-muted dark:text-brand-muted-dark hover:text-red-500"
                  title="Ban user"
                  @click="confirmBanId = user.id"
                >
                  <span class="w-4 h-4 inline-block" v-html="banIcon"></span>
                </button>
              </div>
            </div>
          </div>

          <!-- Table layout (desktop) -->
          <div class="hidden sm:block overflow-x-auto">
            <table class="min-w-full text-sm">
              <thead>
                <tr class="text-left font-body font-medium uppercase tracking-widest text-[11px] text-brand-muted dark:text-brand-muted-dark border-b border-brand-border dark:border-brand-border-dark">
                  <th class="px-4 py-2 font-medium">Email</th>
                  <th class="px-4 py-2 font-medium">Joined</th>
                  <th class="px-4 py-2 font-medium">Last race</th>
                  <th class="px-4 py-2 font-medium">Role</th>
                  <th class="px-4 py-2 font-medium text-right">Races</th>
                  <th class="px-4 py-2 font-medium text-right">Goals</th>
                  <th class="px-4 py-2 font-medium text-right">Annotations</th>
                  <th class="px-4 py-2 font-medium text-right">Total</th>
                  <th class="px-4 py-2 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-brand-border dark:divide-brand-border-dark">
                <tr
                  v-for="user in users"
                  :key="user.id"
                  class="hover:bg-brand-bg dark:hover:bg-brand-bg-dark/30"
                  :class="{ 'opacity-60': user.banned }"
                >
                  <td class="px-4 py-2">
                    {{ user.email }}
                    <span v-if="user.id === currentUserId" class="ml-1 text-xs text-brand-muted dark:text-brand-muted-dark">(you)</span>
                  </td>
                  <td class="px-4 py-2 text-brand-muted dark:text-brand-muted-dark whitespace-nowrap">
                    {{ formatDate(user.created_at) }}
                  </td>
                  <td class="px-4 py-2 text-brand-muted dark:text-brand-muted-dark whitespace-nowrap">
                    {{ formatDateTime(user.last_race_at) }}
                  </td>
                  <td class="px-4 py-2">
                    <span
                      class="px-2 py-0.5 rounded text-xs font-medium"
                      :class="user.role === 'admin'
                        ? 'bg-brand-accent/10 text-brand-accent'
                        : 'bg-brand-bg dark:bg-brand-bg-dark text-brand-secondary dark:text-brand-secondary-dark'"
                    >
                      {{ user.role }}
                    </span>
                    <span v-if="user.banned" class="ml-1 px-2 py-0.5 rounded text-xs font-medium bg-red-500/10 text-red-500">
                      Banned
                    </span>
                  </td>
                  <td class="px-4 py-2 text-right tabular-nums">{{ user.race_count }}</td>
                  <td class="px-4 py-2 text-right tabular-nums">{{ user.goal_count }}</td>
                  <td class="px-4 py-2 text-right tabular-nums">{{ user.annotation_count }}</td>
                  <td class="px-4 py-2 text-right tabular-nums font-semibold">{{ user.total_activity }}</td>
                  <td class="px-4 py-2 text-right">
                    <span v-if="user.id === currentUserId" class="text-xs text-brand-muted dark:text-brand-muted-dark">—</span>
                    <span v-else class="inline-flex items-center justify-end gap-1">
                      <button
                        type="button"
                        class="min-h-[44px] min-w-[44px] flex items-center justify-center text-brand-muted dark:text-brand-muted-dark hover:text-brand-accent dark:hover:text-brand-accent-dark"
                        title="Change role"
                        @click="openDialog(user)"
                      >
                        <span class="w-4 h-4 inline-block" v-html="editIcon"></span>
                      </button>

                      <button
                        v-if="user.banned"
                        type="button"
                        class="min-h-[44px] min-w-[44px] flex items-center justify-center text-brand-muted dark:text-brand-muted-dark hover:text-brand-accent dark:hover:text-brand-accent-dark disabled:opacity-50"
                        title="Unban user"
                        :disabled="banningId === user.id"
                        @click="unban(user)"
                      >
                        <span class="w-4 h-4 inline-block" v-html="checkIcon"></span>
                      </button>
                      <span v-else-if="confirmBanId === user.id" class="inline-flex items-center gap-1">
                        <span class="text-xs text-brand-muted dark:text-brand-muted-dark mr-1">Sure?</span>
                        <button
                          type="button"
                          class="min-h-[44px] min-w-[44px] flex items-center justify-center text-red-500 hover:opacity-75"
                          title="Confirm ban"
                          @click="confirmBan(user)"
                        >
                          <span class="w-4 h-4 inline-block" v-html="checkIcon"></span>
                        </button>
                        <button
                          type="button"
                          class="min-h-[44px] min-w-[44px] flex items-center justify-center text-brand-muted dark:text-brand-muted-dark hover:text-brand-text dark:hover:text-brand-text-dark"
                          title="Cancel"
                          @click="confirmBanId = null"
                        >
                          <span class="w-4 h-4 inline-block" v-html="closeIcon"></span>
                        </button>
                      </span>
                      <button
                        v-else
                        type="button"
                        class="min-h-[44px] min-w-[44px] flex items-center justify-center text-brand-muted dark:text-brand-muted-dark hover:text-red-500"
                        title="Ban user"
                        @click="confirmBanId = user.id"
                      >
                        <span class="w-4 h-4 inline-block" v-html="banIcon"></span>
                      </button>
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>
      </div>
    </div>

    <!-- Role picker dialog -->
    <teleport to="body">
      <div
        v-if="dialog.open"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
        @click.self="closeDialog"
      >
        <div class="bg-brand-surface dark:bg-brand-surface-dark rounded border border-brand-border dark:border-brand-border-dark shadow-xl w-72 p-5">
          <h2 class="font-display font-black tracking-tighter leading-none text-display-sm text-brand-text dark:text-brand-text-dark mb-1">
            Change <em class="signal">role</em>
          </h2>
          <p class="font-body text-[15px] text-brand-muted dark:text-brand-muted-dark mb-4 break-all">{{ dialog.user?.email }}</p>

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
                class="mt-0.5 accent-brand-accent"
              />
              <span>
                <span class="block text-sm font-medium text-brand-text dark:text-brand-text-dark">{{ role.label }}</span>
                <span class="block font-body text-[15px] text-brand-muted dark:text-brand-muted-dark">{{ role.description }}</span>
              </span>
            </label>
          </div>

          <div class="flex justify-end gap-2">
            <button
              type="button"
              class="px-3 py-1.5 text-sm rounded border border-brand-border dark:border-brand-border-dark hover:bg-brand-bg dark:hover:bg-brand-bg-dark"
              @click="closeDialog"
            >
              Cancel
            </button>
            <button
              type="button"
              class="font-display font-black uppercase tracking-widest bg-brand-accent text-white px-4 py-1.5 rounded-none hover:opacity-85 active:opacity-70 transition-opacity disabled:opacity-50 text-sm"
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

<script setup>
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Filler
} from 'chart.js'
import { authStore } from '../stores/authStore.js'
import { prefsStore } from '../stores/prefsStore.js'
import { getAllUsers, getUserGrowth, setUserRole, setUserBanned } from '../services/adminService.js'
import { pushToast } from '../stores/toastStore.js'
import { formatDate, formatDateTime } from '../utils/dateFormat.js'
import { useChart } from '../composables/useChart.js'
import { getChartTheme } from '../utils/chartTheme.js'
import { useEventListener } from '../composables/useEventListener.js'
import editIcon from '../assets/icons/edit.svg?raw'
import banIcon from '../assets/icons/ban.svg?raw'
import checkIcon from '../assets/icons/check.svg?raw'
import closeIcon from '../assets/icons/close-filled.svg?raw'

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Filler)

const loading = ref(true)
const error = ref(null)
const users = ref([])
const growthData = ref([])
const saving = ref(false)
const dialog = ref({ open: false, user: null, selectedRole: null })
const confirmBanId = ref(null)
const banningId = ref(null)
const availableRoles = [
  { value: 'user', label: 'User', description: 'Standard access' },
  { value: 'admin', label: 'Admin', description: 'Access to admin pages' }
]

const growthCanvas = ref(null)
const { render } = useChart(growthCanvas)

const isDark = computed(() => prefsStore.darkMode)
const currentUserId = computed(() => authStore.user?.id ?? null)

function renderChart() {
  if (!growthCanvas.value || !growthData.value.length) return

  const dark = isDark.value
  const theme = getChartTheme(dark)
  const color = dark ? '#E5332F' : '#C41E1E'

  const labels = growthData.value.map(row =>
    new Date(row.day).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  )
  const counts = growthData.value.map(row => Number(row.user_count))

  render({
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Total users',
        data: counts,
        borderColor: color,
        backgroundColor: color + '22',
        borderWidth: 2.5,
        pointRadius: 3,
        pointHoverRadius: 6,
        pointBackgroundColor: color,
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        tension: 0.35,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          ...theme.tooltip,
          callbacks: {
            label: ctx => `  ${ctx.parsed.y} users`
          }
        }
      },
      scales: {
        x: {
          grid: { color: theme.gridColor },
          border: { display: false },
          ticks: { color: theme.tickColor, font: { size: 11 }, maxRotation: 45, maxTicksLimit: 10 }
        },
        y: {
          grid: { color: theme.gridColor },
          border: { display: false },
          beginAtZero: true,
          ticks: {
            color: theme.tickColor,
            font: { size: 11 },
            precision: 0
          }
        }
      }
    }
  })
}

watch(isDark, () => nextTick(renderChart))
// The chart's canvas only enters the DOM once `loading` flips false (see the
// template's v-else), so the first render is triggered from here rather than
// onMounted, which would run before that.
watch(loading, (isLoading) => {
  if (!isLoading) nextTick(renderChart)
})

function openDialog(user) {
  dialog.value = { open: true, user, selectedRole: user.role }
}
function closeDialog() {
  dialog.value = { open: false, user: null, selectedRole: null }
}
async function confirmChange() {
  const { user, selectedRole } = dialog.value
  saving.value = true
  try {
    await setUserRole(user.id, selectedRole)
    user.role = selectedRole
    pushToast(`${user.email} is now ${selectedRole}`, 'success')
    closeDialog()
  } catch (err) {
    pushToast(err.message || 'Failed to update role', 'error')
  } finally {
    saving.value = false
  }
}

async function confirmBan(user) {
  confirmBanId.value = null
  banningId.value = user.id
  try {
    await setUserBanned(user.id, true)
    user.banned = true
    pushToast(`${user.email} has been banned`, 'success')
  } catch (err) {
    pushToast(err.message || 'Failed to ban user', 'error')
  } finally {
    banningId.value = null
  }
}
async function unban(user) {
  banningId.value = user.id
  try {
    await setUserBanned(user.id, false)
    user.banned = false
    pushToast(`${user.email} has been unbanned`, 'success')
  } catch (err) {
    pushToast(err.message || 'Failed to unban user', 'error')
  } finally {
    banningId.value = null
  }
}

useEventListener(window, 'keydown', e => { if (e.key === 'Escape') closeDialog() })

onMounted(async () => {
  try {
    const [allUsers, growth] = await Promise.all([getAllUsers(), getUserGrowth()])
    users.value = allUsers
    growthData.value = growth
  } catch (err) {
    error.value = err.message || 'Failed to load users'
  } finally {
    loading.value = false
  }
})
</script>
