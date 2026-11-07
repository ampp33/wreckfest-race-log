<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
    <h1 class="font-heading font-normal tracking-normal leading-none text-display-lg text-brand-text dark:text-brand-text-dark mb-1">
      <em class="signal">Users</em>
    </h1>
    <p class="font-body text-[15px] leading-relaxed text-brand-secondary dark:text-brand-secondary-dark mb-6">Manage registered users' access and standing, ranked by activity.</p>

    <p v-if="loading" class="font-body text-[15px] text-brand-muted dark:text-brand-muted-dark">Loading…</p>

    <p v-else-if="error" class="text-sm text-red-500">{{ error }}</p>

    <div v-else class="space-y-6">
      <div class="flex flex-wrap gap-4">
        <div
          v-for="tile in summaryTiles"
          :key="tile.label"
          class="bg-brand-surface dark:bg-brand-surface-dark rounded border border-brand-border dark:border-brand-border-dark p-4 inline-block"
          :title="tile.title"
        >
          <div class="font-body font-medium uppercase tracking-widest text-[11px] text-brand-muted dark:text-brand-muted-dark">{{ tile.label }}</div>
          <div class="mt-1 font-display font-black tracking-tight text-3xl text-brand-text dark:text-brand-text-dark">{{ tile.value }}</div>
        </div>
      </div>

      <!-- User growth chart -->
      <div class="bg-brand-surface dark:bg-brand-surface-dark rounded border border-brand-border dark:border-brand-border-dark p-4">
        <div class="flex items-center justify-between gap-2 flex-wrap mb-3">
          <h2 class="font-heading font-normal tracking-normal leading-none text-display-sm text-brand-text dark:text-brand-text-dark">
            User <em class="signal">growth</em>
          </h2>
          <ChartRangePicker v-model="usersRange" />
        </div>
        <div class="relative h-56">
          <canvas ref="growthCanvas"></canvas>
        </div>
      </div>

      <!-- Races logged chart -->
      <div class="bg-brand-surface dark:bg-brand-surface-dark rounded border border-brand-border dark:border-brand-border-dark p-4">
        <div class="flex items-center justify-between gap-2 flex-wrap mb-3">
          <h2 class="font-heading font-normal tracking-normal leading-none text-display-sm text-brand-text dark:text-brand-text-dark">
            Races <em class="signal">logged</em>
          </h2>
          <ChartRangePicker v-model="racesRange" />
        </div>
        <div class="relative h-56">
          <canvas ref="racesCanvas"></canvas>
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
                  @click="setBanned(user, false)"
                >
                  <span class="w-4 h-4 inline-block" v-html="checkIcon"></span>
                </button>
                <template v-else-if="confirmBanId === user.id">
                  <span class="text-xs text-brand-muted dark:text-brand-muted-dark">Sure?</span>
                  <button
                    type="button"
                    class="min-h-[44px] min-w-[44px] flex items-center justify-center text-red-500 hover:opacity-75"
                    title="Confirm ban"
                    @click="setBanned(user, true)"
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
                        @click="setBanned(user, false)"
                      >
                        <span class="w-4 h-4 inline-block" v-html="checkIcon"></span>
                      </button>
                      <span v-else-if="confirmBanId === user.id" class="inline-flex items-center gap-1">
                        <span class="text-xs text-brand-muted dark:text-brand-muted-dark mr-1">Sure?</span>
                        <button
                          type="button"
                          class="min-h-[44px] min-w-[44px] flex items-center justify-center text-red-500 hover:opacity-75"
                          title="Confirm ban"
                          @click="setBanned(user, true)"
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

<script>
import { authStore, pushToast } from '../stores.js'
import { getAllUsers, getRaceLogBins, getUserActivityBins, setUserRole, setUserBanned, getTotalRaceCount } from '../api.js'
import { bucketUnit, growthBuckets, countPerBucket, runningTotalPerBucket, activeUsersPerBucket } from '../utils/chartBuckets.js'
import { formatDate, formatDateTime } from '../utils/format.js'
import { chartMixin, getChartTheme } from '../utils/chart.js'
import ChartRangePicker from '../components/ChartRangePicker.vue'
import editIcon from '../assets/icons/edit.svg?raw'
import banIcon from '../assets/icons/ban.svg?raw'
import checkIcon from '../assets/icons/check.svg?raw'
import closeIcon from '../assets/icons/close-filled.svg?raw'

// "Active" means raced in the trailing 60 days.
const ACTIVE_WINDOW_MS = 60 * 24 * 60 * 60 * 1000
// Past a few months of daily points, 3px markers overlap into a solid blob —
// they're dropped for dense ranges (1y/all) and the line carries it.
const DENSE_POINT_COUNT = 60

function bucketLabel(bucket, unit) {
  return unit === 'hour'
    ? bucket.toLocaleTimeString(undefined, { hour: 'numeric' })
    : bucket.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function lineDataset(label, data, color, fillAlpha, dense) {
  return {
    label,
    data,
    borderColor: color,
    backgroundColor: color + fillAlpha,
    borderWidth: 2.5,
    pointRadius: dense ? 0 : 3,
    pointHoverRadius: dense ? 4 : 6,
    pointBackgroundColor: color,
    pointBorderColor: '#fff',
    pointBorderWidth: 2,
    tension: 0.35,
    fill: true
  }
}

function lineChart(rows, range, datasets, legend, tooltipLabel, theme) {
  const unit = bucketUnit(range)
  return {
    type: 'line',
    data: { labels: rows.map(row => bucketLabel(row.bucket, unit)), datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend,
        tooltip: { ...theme.tooltip, callbacks: { label: tooltipLabel } }
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
          ticks: { color: theme.tickColor, font: { size: 11 }, precision: 0 }
        }
      }
    }
  }
}

export default {
  name: 'UsersPage',
  components: { ChartRangePicker },
  mixins: [chartMixin],
  data() {
    return {
      loading: true,
      error: null,
      users: [],
      // Per-user race activity, for the active-users line.
      activityBins: [],
      growthData: [],
      racesData: [],
      totalRaces: 0,
      usersRange: '30d',
      racesRange: '30d',
      saving: false,
      dialog: { open: false, user: null, selectedRole: null },
      confirmBanId: null,
      banningId: null,
      availableRoles: [
        { value: 'user', label: 'User', description: 'Standard access' },
        { value: 'admin', label: 'Admin', description: 'Access to admin pages' }
      ],
      editIcon,
      banIcon,
      checkIcon,
      closeIcon
    }
  },
  computed: {
    currentUserId() {
      return authStore.user?.id ?? null
    },
    activeUserCount() {
      return this.users.filter(u => u.last_race_at && Date.now() - new Date(u.last_race_at).getTime() <= ACTIVE_WINDOW_MS).length
    },
    summaryTiles() {
      return [
        { label: 'Registered users', value: this.users.length },
        { label: 'Active users', value: this.activeUserCount, title: 'Raced in the last 60 days' },
        { label: 'Total races logged', value: this.totalRaces }
      ]
    }
  },
  watch: {
    isDark() { this.$nextTick(this.renderCharts) },
    // The canvases only enter the DOM once loading is done.
    loading(isLoading) {
      if (!isLoading) this.$nextTick(this.renderCharts)
    },
    async usersRange() {
      try {
        this.activityBins = await getUserActivityBins(this.usersRange)
        this.buildUserGrowth()
        this.$nextTick(this.renderGrowthChart)
      } catch (err) {
        pushToast(err.message || 'Failed to load user growth', 'error')
      }
    },
    async racesRange() {
      try {
        this.buildRaceGrowth(await getRaceLogBins(this.racesRange))
        this.$nextTick(this.renderRacesChart)
      } catch (err) {
        pushToast(err.message || 'Failed to load race growth', 'error')
      }
    }
  },
  async mounted() {
    window.addEventListener('keydown', this.onKeydown)
    try {
      const [users, raceLogBins, raceCount, activityBins] = await Promise.all([
        getAllUsers(),
        getRaceLogBins(this.racesRange),
        getTotalRaceCount(),
        getUserActivityBins(this.usersRange)
      ])
      this.users = users
      this.activityBins = activityBins
      this.buildUserGrowth()
      this.buildRaceGrowth(raceLogBins)
      this.totalRaces = raceCount
    } catch (err) {
      this.error = err.message || 'Failed to load users'
    } finally {
      this.loading = false
    }
  },
  beforeUnmount() {
    window.removeEventListener('keydown', this.onKeydown)
  },
  methods: {
    formatDate,
    formatDateTime,
    // Both charts are bucketed by the viewer's local hour (1D) or day — see
    // src/utils/chartBuckets.js. User growth is a running total of signup
    // dates; active users come from the per-user activity bins.
    buildUserGrowth() {
      const signups = this.users.map(u => u.created_at)
      const unit = bucketUnit(this.usersRange)
      const buckets = growthBuckets(this.usersRange, signups)
      const active = activeUsersPerBucket(this.activityBins, buckets, unit, ACTIVE_WINDOW_MS)
      this.growthData = runningTotalPerBucket(signups, buckets, unit)
        .map(({ bucket, count }, i) => ({ bucket, user_count: count, active_count: active[i].count }))
    },
    // Races logged is a per-bucket count, not a running total.
    buildRaceGrowth(bins) {
      const unit = bucketUnit(this.racesRange)
      const buckets = growthBuckets(this.racesRange, bins.map(b => b.at))
      this.racesData = countPerBucket(bins, buckets, unit).map(({ bucket, count }) => ({ bucket, race_count: count }))
    },
    renderCharts() {
      this.renderGrowthChart()
      this.renderRacesChart()
    },
    renderGrowthChart() {
      const rows = this.growthData
      if (!this.$refs.growthCanvas || !rows.length) return
      const theme = getChartTheme(this.isDark)
      const dense = rows.length > DENSE_POINT_COUNT
      this.drawChart('growthCanvas', lineChart(rows, this.usersRange, [
        lineDataset('Total users', rows.map(row => row.user_count), this.isDark ? '#E5332F' : '#C41E1E', '22', dense),
        lineDataset('Active users', rows.map(row => row.active_count), this.isDark ? '#FF6B61' : '#F0443A', '33', dense)
      ],
      { display: true, align: 'end', labels: { color: theme.tickColor, boxHeight: 2, font: { size: 11 } } },
      ctx => `  ${ctx.parsed.y} ${ctx.dataset.label.toLowerCase()}`,
      theme))
    },
    renderRacesChart() {
      const rows = this.racesData
      if (!this.$refs.racesCanvas || !rows.length) return
      const theme = getChartTheme(this.isDark)
      this.drawChart('racesCanvas', lineChart(rows, this.racesRange, [
        lineDataset('Races logged', rows.map(row => row.race_count), this.isDark ? '#E5332F' : '#C41E1E', '22', rows.length > DENSE_POINT_COUNT)
      ],
      { display: false },
      ctx => `  ${ctx.parsed.y} race${ctx.parsed.y !== 1 ? 's' : ''}`,
      theme))
    },
    openDialog(user) {
      this.dialog = { open: true, user, selectedRole: user.role }
    },
    closeDialog() {
      this.dialog = { open: false, user: null, selectedRole: null }
    },
    onKeydown(event) {
      if (event.key === 'Escape') this.closeDialog()
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
    },
    async setBanned(user, banned) {
      if (banned) this.confirmBanId = null
      this.banningId = user.id
      try {
        await setUserBanned(user.id, banned)
        user.banned = banned
        pushToast(`${user.email} has been ${banned ? 'banned' : 'unbanned'}`, 'success')
      } catch (err) {
        pushToast(err.message || `Failed to ${banned ? 'ban' : 'unban'} user`, 'error')
      } finally {
        this.banningId = null
      }
    }
  }
}
</script>
