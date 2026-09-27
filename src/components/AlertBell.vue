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
      class="absolute right-0 top-full mt-2 z-50 w-[min(20rem,calc(100vw-3rem))] bg-brand-bg dark:bg-brand-bg-dark border border-brand-border dark:border-brand-border-dark shadow-lg text-brand-text dark:text-brand-text-dark"
      role="dialog"
      aria-label="Unread alerts"
    >
      <div class="flex items-baseline justify-between px-4 pt-4 pb-3 border-b border-brand-border dark:border-brand-border-dark">
        <span class="ov text-brand-muted dark:text-brand-muted-dark">Alerts</span>
        <span v-if="alerts.unreadCount" class="flex items-baseline gap-3">
          <span class="ov text-brand-accent dark:text-brand-accent-dark">{{ alerts.unreadCount }} unread</span>
          <!-- Only needed when some unread alerts aren't in the preview —
               the previewed ones get marked read on close anyway. -->
          <button
            v-if="alerts.unreadCount > PREVIEW_COUNT"
            type="button"
            class="ov text-brand-muted dark:text-brand-muted-dark hover:text-brand-accent dark:hover:text-brand-accent-dark"
            @click="onMarkAllRead"
          >Mark all read</button>
        </span>
      </div>

      <p
        v-if="!preview.length"
        class="px-4 py-6 font-body text-[14px] text-brand-muted dark:text-brand-muted-dark text-center"
      >
        You're all caught up.
      </p>

      <ul v-else class="divide-y divide-brand-border dark:divide-brand-border-dark">
        <li v-for="alert in preview" :key="alert.id">
          <router-link
            :to="{ name: 'alerts', query: { highlight: alert.id } }"
            class="block px-4 py-3 hover:bg-brand-surface dark:hover:bg-brand-surface-dark"
          >
            <div class="flex items-baseline justify-between gap-3 mb-1">
              <span class="font-body font-bold text-[14px] leading-snug line-clamp-1">{{ alert.title }}</span>
              <span class="ov tabular text-brand-muted dark:text-brand-muted-dark whitespace-nowrap">{{ formatRelativeDate(alert.created_at) }}</span>
            </div>
            <p class="font-body text-[13px] leading-snug text-brand-secondary dark:text-brand-secondary-dark line-clamp-2">
              {{ truncate(alert.body, PREVIEW_CHARS) }}
            </p>
          </router-link>
        </li>
      </ul>

      <router-link
        :to="{ name: 'alerts' }"
        class="flex min-h-[44px] items-center justify-center border-t border-brand-border dark:border-brand-border-dark font-body text-[13px] text-brand-accent dark:text-brand-accent-dark hover:underline"
      >
        View all alerts →
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
