<template>
  <!-- One-time introduction to the scope nav, shown the first time a signed-in
       user lands on a page with the NavBar. Everything is washed in the accent
       colour except the nav's scope controls (`data-nav-intro` in NavBar.vue —
       the scope icon and its views from 1200px, the scope icon and menu button
       below that), which a white arrow points at. Dismissing it is remembered
       per user, in this browser. -->
  <div
    v-if="open && spot"
    class="fixed inset-0 z-[60] text-white"
    role="dialog"
    aria-modal="true"
    aria-labelledby="nav-intro-title"
  >
    <!-- The cut-out: a transparent box over the nav controls whose enormous
         box-shadow is the wash over everything else. It doesn't take clicks,
         so the layer under it blocks the page (nav included) until dismissed. -->
    <div class="absolute inset-0"></div>
    <div
      class="absolute pointer-events-none border-2 border-white"
      :style="{
        left: spot.left + 'px',
        top: spot.top + 'px',
        width: spot.width + 'px',
        height: spot.height + 'px',
        boxShadow: `0 0 0 200vmax ${washColor}`
      }"
    ></div>

    <!-- Starts below the cut-out so scrolling (short screens) never covers it. -->
    <div class="absolute inset-x-0 bottom-0 overflow-y-auto overscroll-contain" :style="{ top: spot.top + spot.height + 'px' }">
      <!-- Tip at the top right, tail at the bottom left, so it reaches up to
           the scope icon from the text below it in both layouts. -->
      <svg
        aria-hidden="true"
        class="absolute"
        :style="{ left: arrowTipX - 112 + 'px', top: '6px' }"
        width="120"
        height="104"
        viewBox="0 0 120 104"
        fill="none"
        stroke="currentColor"
        stroke-width="3"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M14 100 C 24 52, 58 26, 110 6" />
        <path d="M86 6 L 110 6 L 98 27" />
      </svg>

      <div class="max-w-7xl mx-auto px-6 pt-[100px] pb-10">
        <div class="grid gap-x-12 gap-y-8 min-[1200px]:grid-cols-[minmax(0,1fr)_440px]">
          <div class="max-w-xl">
            <h2 id="nav-intro-title" class="font-heading font-normal leading-none text-[clamp(44px,7vw,64px)]">{{ isNewAccount ? 'Welcome!' : 'Welcome back!' }}</h2>
            <p class="font-display font-black tracking-tightest leading-tight text-[21px] sm:text-[24px] mt-2">
              The site has a new trick: all races are now public, and you have different views to see the races you care about.
            </p>
            <p class="font-body text-[15px] sm:text-[16px] leading-relaxed text-white/90 mt-4">
              You can look at anyone's log, not just yours.
              <b class="text-white">{{ isDesktop ? 'The icon' : 'Tap the icon' }}</b> up there picks <b class="text-white">whose races</b> you're looking at:
            </p>
            <ul class="mt-3 space-y-1.5 font-body text-[15px]">
              <li v-for="item in legend" :key="item.kind" class="flex items-center gap-3">
                <span class="w-7 h-7 shrink-0 flex items-center justify-center border border-white/70">
                  <ScopeIcon :kind="item.kind" name="D" icon-class="w-3.5 h-3.5" />
                </span>
                <span><b>{{ item.label }}</b> — {{ item.detail }}</span>
              </li>
            </ul>
            <p class="font-body text-[15px] sm:text-[16px] leading-relaxed text-white/90 mt-4">
              <template v-if="isDesktop">
                <b class="text-white">The links beside it are the views</b> for that scope — Leaderboard, Tracks, Races, Stats.
              </template>
              <template v-else>
                <b class="text-white">The menu button lists the views</b> of those races — Leaderboard, Tracks, Races, Stats.
              </template>
              Switch the scope and you stay on the same view, but the data will change.
            </p>
            <p class="font-body text-[14px] leading-relaxed text-white/80 mt-4">
              Rather keep your races to yourself?
              <router-link to="/settings/profile" class="underline font-semibold text-white hover:opacity-80" @click="dismiss">Make them private in Profile settings</router-link>.
            </p>
            <button v-if="isDesktop" ref="gotIt" type="button" :class="buttonClass" @click="dismiss">Got it</button>
          </div>

          <div class="grid gap-5" :class="isDesktop ? '' : 'grid-cols-2 items-start'">
            <AppShot
              v-for="shot in shots"
              :key="shot.name"
              :name="shot.name"
              :alt="shot.alt"
              :caption="shot.caption"
              img-class="border-4 border-white shadow-[0_12px_32px_rgba(0,0,0,0.25)]"
              caption-class="font-body text-[13px] leading-snug text-white/85 mt-2"
            />
          </div>

          <!-- On phones the shots come after the text, so the button follows
               them rather than inviting a dismissal before they're seen. -->
          <div v-if="!isDesktop">
            <button ref="gotIt" type="button" :class="buttonClass" @click="dismiss">Got it</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { authStore } from '../stores/authStore.js'
import { prefsStore } from '../stores/prefsStore.js'
import ScopeIcon from './ScopeIcon.vue'
import AppShot from './AppShot.vue'

const STORAGE_PREFIX = 'wreckfest:navIntroSeen:'
// Where NavBar switches between its desktop row and the phone layout.
const DESKTOP_MIN_WIDTH = 1200
// Breathing room between the nav controls and the cut-out's white edge.
const SPOT_PADDING = 6

function hasSeen(userId) {
  try {
    return localStorage.getItem(STORAGE_PREFIX + userId) === '1'
  } catch {
    return false
  }
}

function markSeen(userId) {
  try {
    localStorage.setItem(STORAGE_PREFIX + userId, '1')
  } catch {
    // Storage unavailable: it'll just show again next visit.
  }
}

export default {
  name: 'NavIntroOverlay',
  components: { ScopeIcon, AppShot },
  data() {
    return {
      auth: authStore,
      prefs: prefsStore,
      open: false,
      spot: null,
      arrowTipX: 0,
      isDesktop: true
    }
  },
  computed: {
    buttonClass() {
      return 'mt-5 min-h-[48px] px-8 bg-white text-brand-accent dark:text-brand-accent-dark font-bold text-[14px] hover:opacity-90 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white'
    },
    userId() {
      return this.auth.user?.id ?? null
    },
    // A brand-new account has no "back" to welcome.
    isNewAccount() {
      const created = Date.parse(this.auth.user?.created_at ?? '')
      return Number.isFinite(created) && Date.now() - created < 24 * 60 * 60 * 1000
    },
    // Semi-transparent, so the page still shows through underneath.
    washColor() {
      return this.prefs.darkMode ? 'rgba(229, 51, 47, 0.95)' : 'rgba(196, 30, 30, 0.95)'
    },
    legend() {
      return [
        { kind: 'everyone', label: 'Everyone', detail: "every driver's races together" },
        { kind: 'you', label: 'You', detail: 'just your own log' },
        { kind: 'driver', label: 'Another driver', detail: 'their initial, once you open their log' }
      ]
    },
    shots() {
      return this.isDesktop
        ? [
            { name: 'nav-scope-menu', alt: "The nav's scope menu open: Everyone, You, recently viewed drivers and Find a driver", caption: "Click the icon to choose: everyone, you, a driver you've looked at lately, or find one by name." },
            { name: 'nav-viewing-driver', alt: "The nav while viewing another driver's tracks", caption: "Viewing someone else: their initial takes the icon's place, and the line above the title says whose log it is." }
          ]
        : [
            { name: 'nav-scope-menu-mobile', alt: 'The scope menu open on a phone', caption: 'Tap the icon to choose whose races.' },
            { name: 'nav-views-menu-mobile', alt: "The menu open on a phone, listing Everyone's views", caption: 'Tap the menu for their views.' }
          ]
    }
  },
  watch: {
    // Signing in, or the first page that has the nav.
    userId() {
      this.maybeOpen()
    },
    '$route.fullPath'() {
      if (this.open) this.$nextTick(this.measure)
      else this.maybeOpen()
    }
  },
  mounted() {
    window.addEventListener('resize', this.measure)
    document.addEventListener('keydown', this.onKeydown, true)
    this.maybeOpen()
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.measure)
    document.removeEventListener('keydown', this.onKeydown, true)
    this.unlockScroll()
  },
  methods: {
    async maybeOpen() {
      if (this.open || !this.userId || hasSeen(this.userId)) return
      // Let the NavBar render, and its fonts settle, before measuring it.
      await this.$nextTick()
      await document.fonts?.ready
      if (!this.userId || hasSeen(this.userId)) return
      window.scrollTo(0, 0)
      this.measure()
      if (!this.spot) return
      this.open = true
      document.documentElement.style.overflow = 'hidden'
      await this.$nextTick()
      this.$refs.gotIt?.focus({ preventScroll: true })
    },
    // Whichever of the two marked groups is showing at this width.
    measure() {
      const target = [...document.querySelectorAll('[data-nav-intro]')].find(el => el.getClientRects().length > 0)
      if (!target) {
        this.spot = null
        return
      }
      const r = target.getBoundingClientRect()
      this.spot = {
        left: r.left - SPOT_PADDING,
        top: r.top - SPOT_PADDING,
        width: r.width + SPOT_PADDING * 2,
        height: r.height + SPOT_PADDING * 2
      }
      // Point at the scope icon itself, the thing to click.
      const icon = target.querySelector('button')?.getBoundingClientRect() ?? r
      this.arrowTipX = icon.left + icon.width / 2
      this.isDesktop = window.innerWidth >= DESKTOP_MIN_WIDTH
    },
    dismiss() {
      if (this.userId) markSeen(this.userId)
      this.open = false
      this.unlockScroll()
    },
    unlockScroll() {
      document.documentElement.style.overflow = ''
    },
    // Capture phase, so App's Q/T shortcuts don't open dialogs underneath.
    onKeydown(event) {
      if (!this.open) return
      if (event.key === 'Escape') {
        event.preventDefault()
        this.dismiss()
      }
      event.stopPropagation()
    }
  }
}
</script>
