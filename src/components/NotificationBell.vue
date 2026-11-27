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
        v-if="notifications.unreadCount"
        class="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-brand-accent dark:bg-brand-accent-dark text-white text-[10px] font-bold leading-none tabular ring-2 ring-brand-bg dark:ring-brand-bg-dark"
        aria-hidden="true"
      >{{ badgeText }}</span>
    </button>

    <!-- Desktop: a dropdown under the bell. Mobile: teleported into NavBar's
         drawer slot so it opens full width under the bar and slides like
         the other mobile drawers. -->
    <Teleport defer to="#notification-drawer-slot" :disabled="!isMobile">
    <Transition v-bind="isMobile ? drawerTransition : {}">
    <div
      v-if="open"
      ref="panelEl"
      :class="panelClass"
      role="dialog"
      aria-label="Unread notifications"
    >
    <div :class="isMobile && 'overflow-hidden'">
    <div :class="isMobile && 'max-w-7xl mx-auto'">
      <div class="flex items-center justify-between px-[18px] py-4">
        <span class="ov" :class="tone.muted">Notifications</span>
        <button
          v-if="notifications.unreadCount"
          type="button"
          class="ov"
          :class="tone.action"
          @click="onMarkAllRead"
        >Mark {{ notifications.unreadCount }} read</button>
      </div>

      <p
        v-if="!preview.length"
        class="px-[18px] pb-6 pt-2 font-body text-[14px] text-center"
        :class="tone.muted"
      >
        You're all caught up.
      </p>

      <!-- The rail: one line down the left, a filled red dot per unread notification. -->
      <ol v-else class="relative px-[18px] pb-2">
        <span class="absolute left-6 top-1.5 bottom-6 w-px" :class="tone.rail" aria-hidden="true"></span>
        <li v-for="notification in preview" :key="notification.id" class="relative">
          <router-link
            :to="{ name: 'notifications', query: { highlight: notification.id } }"
            class="group block pl-[26px] pb-[18px]"
          >
            <span
              class="absolute left-[1px] top-[3px] w-[11px] h-[11px] rounded-full ring-[3px]"
              :class="tone.dot"
              aria-hidden="true"
            ></span>
            <span class="ov tabular block mb-1.5" :class="tone.date">{{ formatRelativeDate(notification.created_at) }}</span>
            <span class="block font-body font-bold text-[14px] leading-snug line-clamp-1" :class="tone.title">{{ notification.title }}</span>
            <span class="block mt-0.5 font-body text-[13px] leading-snug line-clamp-2" :class="tone.body">
              {{ truncate(notification.body, PREVIEW_CHARS) }}
            </span>
          </router-link>
        </li>
      </ol>

      <router-link
        :to="{ name: 'notifications' }"
        class="flex min-h-[44px] items-center justify-between px-[18px] border-t font-body font-medium text-[13px]"
        :class="[tone.divider, tone.action]"
      >
        View all notifications <span aria-hidden="true">→</span>
      </router-link>
    </div>
    </div>
    </div>
    </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useEventListener } from '../composables/useEventListener.js'
import { notificationStore, markRead, markAllRead, refreshNotifications } from '../stores/notificationStore.js'
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

const notifications = notificationStore
const route = useRoute()
const open = ref(false)
const rootEl = ref(null)
const panelEl = ref(null)

const isMobile = computed(() => props.variant === 'mobile')
// Same grid-rows slide as NavBar's other mobile drawers.
const drawerTransition = {
  enterActiveClass: 'transition-[grid-template-rows] duration-300 ease-out',
  enterFromClass: 'grid-rows-[0fr]',
  enterToClass: 'grid-rows-[1fr]',
  leaveActiveClass: 'transition-[grid-template-rows] duration-200 ease-in',
  leaveFromClass: 'grid-rows-[1fr]',
  leaveToClass: 'grid-rows-[0fr]'
}
// Mobile is a red slab like NavBar's menu drawer, so every colour flips to
// white-on-red there; desktop stays ink-on-page with red accents.
const panelClass = computed(() =>
  isMobile.value
    ? 'grid bg-brand-accent dark:bg-brand-accent-dark text-white'
    : 'absolute right-0 top-full mt-2 z-50 w-[min(22.5rem,calc(100vw-3rem))] bg-brand-bg dark:bg-brand-bg-dark text-brand-text dark:text-brand-text-dark border border-brand-border dark:border-brand-border-dark border-t-2 border-t-brand-strong dark:border-t-brand-strong-dark shadow-[0_18px_40px_rgba(10,10,10,0.18)]'
)
const tone = computed(() =>
  isMobile.value
    ? {
        muted: 'text-white/85',
        action: 'text-white hover:text-white/80',
        rail: 'bg-white/40',
        dot: 'bg-white ring-brand-accent dark:ring-brand-accent-dark',
        date: 'text-white/85',
        title: 'group-hover:underline',
        body: 'text-white/90',
        divider: 'border-white/30'
      }
    : {
        muted: 'text-brand-muted dark:text-brand-muted-dark',
        action: 'text-brand-accent dark:text-brand-accent-dark hover:text-brand-text dark:hover:text-brand-text-dark',
        rail: 'bg-brand-border dark:bg-brand-border-dark',
        dot: 'bg-brand-accent dark:bg-brand-accent-dark ring-brand-bg dark:ring-brand-bg-dark',
        date: 'text-brand-accent dark:text-brand-accent-dark',
        title: 'group-hover:text-brand-accent dark:group-hover:text-brand-accent-dark',
        body: 'text-brand-secondary dark:text-brand-secondary-dark',
        divider: 'border-brand-border dark:border-brand-border-dark'
      }
)
// Snapshot of what the popover showed, so exactly those get marked read on
// close — not whatever has since shifted into the top three.
const shownIds = ref([])

const preview = computed(() => notifications.unread.slice(0, PREVIEW_COUNT))
const badgeText = computed(() => (notifications.unreadCount > 9 ? '9+' : String(notifications.unreadCount)))
const buttonLabel = computed(() =>
  notifications.unreadCount ? `Notifications (${notifications.unreadCount} unread)` : 'Notifications'
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
  refreshNotifications()
}

// Marking read on close rather than open keeps the previewed notifications
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

// Notifications that arrive via the open-time refresh are shown too, so they
// count as seen along with the initial snapshot.
watch(preview, list => {
  if (!open.value) return
  for (const a of list) {
    if (!shownIds.value.includes(a.id)) shownIds.value.push(a.id)
  }
})

watch(() => route.fullPath, () => {
  close()
  refreshNotifications()
})

useEventListener(document, 'mousedown', e => {
  // The mobile drawer is teleported out of rootEl, so check it separately.
  const inside = rootEl.value?.contains(e.target) || panelEl.value?.contains(e.target)
  if (open.value && !inside) close()
})

useEventListener(document, 'keydown', e => {
  if (e.key === 'Escape') close()
})
</script>
