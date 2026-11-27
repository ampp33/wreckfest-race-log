<template>
  <div ref="rootEl" class="relative">
    <button
      type="button"
      :class="buttonClass"
      :aria-label="buttonLabel"
      aria-haspopup="true"
      :aria-expanded="open"
      @click="toggleOpen"
    >
      <span class="w-4 h-4 inline-block" v-html="bullhornIcon"></span>
      <span
        v-if="alerts.unreadCount"
        class="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-brand-accent dark:bg-brand-accent-dark text-white text-[10px] font-bold leading-none tabular ring-2 ring-brand-bg dark:ring-brand-bg-dark"
        aria-hidden="true"
      >{{ badgeText }}</span>
    </button>

    <div
      v-if="open"
      class="absolute right-0 top-full mt-2 z-50 w-[min(22.5rem,calc(100vw-3rem))] bg-brand-bg dark:bg-brand-bg-dark border border-brand-border dark:border-brand-border-dark border-t-2 border-t-brand-strong dark:border-t-brand-strong-dark shadow-[0_18px_40px_rgba(10,10,10,0.18)] text-brand-text dark:text-brand-text-dark"
      role="dialog"
      aria-label="Unread alerts"
    >
      <div class="flex items-center justify-between px-[18px] py-4">
        <span class="ov text-brand-muted dark:text-brand-muted-dark">Alerts</span>
        <button
          v-if="alerts.unreadCount"
          type="button"
          class="ov text-brand-accent dark:text-brand-accent-dark hover:text-brand-text dark:hover:text-brand-text-dark"
          @click="onMarkAllRead"
        >Mark {{ alerts.unreadCount }} read</button>
      </div>

      <p
        v-if="!preview.length"
        class="px-[18px] pb-6 pt-2 font-body text-[14px] text-brand-muted dark:text-brand-muted-dark text-center"
      >
        You're all caught up.
      </p>

      <!-- The rail: one line down the left, a filled red dot per unread alert. -->
      <ol v-else class="relative px-[18px] pb-2">
        <span class="absolute left-6 top-1.5 bottom-6 w-px bg-brand-border dark:bg-brand-border-dark" aria-hidden="true"></span>
        <li v-for="alert in preview" :key="alert.id" class="relative">
          <router-link
            :to="{ name: 'alerts', query: { highlight: alert.id } }"
            class="group block pl-[26px] pb-[18px]"
          >
            <span
              class="absolute left-[1px] top-[3px] w-[11px] h-[11px] rounded-full bg-brand-accent dark:bg-brand-accent-dark ring-[3px] ring-brand-bg dark:ring-brand-bg-dark"
              aria-hidden="true"
            ></span>
            <span class="ov tabular block mb-1.5 text-brand-accent dark:text-brand-accent-dark">{{ formatRelativeDate(alert.created_at) }}</span>
            <span class="block font-body font-bold text-[14px] leading-snug line-clamp-1 group-hover:text-brand-accent dark:group-hover:text-brand-accent-dark">{{ alert.title }}</span>
            <span class="block mt-0.5 font-body text-[13px] leading-snug text-brand-secondary dark:text-brand-secondary-dark line-clamp-2">
              {{ truncate(alert.body, PREVIEW_CHARS) }}
            </span>
          </router-link>
        </li>
      </ol>

      <router-link
        :to="{ name: 'alerts' }"
        class="flex min-h-[44px] items-center justify-between px-[18px] border-t border-brand-border dark:border-brand-border-dark font-body font-medium text-[13px] text-brand-accent dark:text-brand-accent-dark hover:text-brand-text dark:hover:text-brand-text-dark"
      >
        View all alerts <span aria-hidden="true">→</span>
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useEventListener } from '../composables/useEventListener.js'
import { alertStore, markRead, markAllRead, refreshAlerts } from '../stores/alertStore.js'
import { formatRelativeDate } from '../utils/dateFormat.js'
import { truncate } from '../utils/textFormat.js'
import bullhornIcon from '../assets/icons/bullhorn.svg?raw'

const PREVIEW_COUNT = 3
const PREVIEW_CHARS = 120

const props = defineProps({
  // The mobile drawer's bell sits on the nav bar next to the hamburger, which
  // has a solid border and full-color icon rather than the desktop
  // cluster's muted one.
  variant: { type: String, default: 'desktop' }
})
const emit = defineEmits(['open'])

const alerts = alertStore
const route = useRoute()
const open = ref(false)
const rootEl = ref(null)
// Snapshot of what the popover showed, so exactly those get marked read on
// close — not whatever has since shifted into the top three.
const shownIds = ref([])

const preview = computed(() => alerts.unread.slice(0, PREVIEW_COUNT))
const badgeText = computed(() => (alerts.unreadCount > 9 ? '9+' : String(alerts.unreadCount)))
const buttonLabel = computed(() =>
  alerts.unreadCount ? `Alerts (${alerts.unreadCount} unread)` : 'Alerts'
)
const buttonClass = computed(() => [
  'relative min-h-[44px] min-w-[44px] flex items-center justify-center border',
  props.variant === 'mobile'
    ? 'border-brand-border dark:border-brand-border-dark text-brand-text dark:text-brand-text-dark'
    : 'border-brand-border dark:border-brand-border-dark text-brand-muted dark:text-brand-muted-dark hover:text-brand-accent dark:hover:text-brand-accent-dark',
  open.value && 'text-brand-accent dark:text-brand-accent-dark border-brand-accent dark:border-brand-accent-dark'
])

function toggleOpen() {
  if (open.value) {
    close()
    return
  }
  open.value = true
  shownIds.value = preview.value.map(a => a.id)
  emit('open')
  refreshAlerts()
}

// Marking read on close rather than open keeps the previewed alerts
// displayed (and the badge unchanged) while the user is actually reading
// them; anything past the top three stays unread.
function close() {
  if (!open.value) return
  open.value = false
  markRead(shownIds.value)
  shownIds.value = []
}

function onMarkAllRead() {
  markAllRead()
  close()
}

// Alerts that arrive via the open-time refresh are shown too, so they
// count as seen along with the initial snapshot.
watch(preview, list => {
  if (!open.value) return
  for (const a of list) {
    if (!shownIds.value.includes(a.id)) shownIds.value.push(a.id)
  }
})

watch(() => route.fullPath, () => {
  close()
  refreshAlerts()
})

useEventListener(document, 'mousedown', e => {
  if (open.value && rootEl.value && !rootEl.value.contains(e.target)) close()
})

useEventListener(document, 'keydown', e => {
  if (e.key === 'Escape') close()
})
</script>
