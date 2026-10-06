import { createRouter, createWebHashHistory } from 'vue-router'
import { authStore, initAuthStore, clearAuthSession } from '../stores/authStore.js'
import { signOut } from '../services/authService.js'
import { pushToast } from '../stores/toastStore.js'

import HomePage from '../pages/HomePage.vue'
import PluginPage from '../pages/PluginPage.vue'
import TrackListPage from '../pages/TrackListPage.vue'
import TrackDetailPage from '../pages/TrackDetailPage.vue'
import StatsPage from '../pages/StatsPage.vue'
import LoginPage from '../pages/LoginPage.vue'
import UsersPage from '../pages/Users.vue'
import RacesPage from '../pages/RacesPage.vue'
import ApiKeysPage from '../pages/ApiKeysPage.vue'
import ProfileSettingsPage from '../pages/ProfileSettingsPage.vue'
import AdminApiKeysPage from '../pages/AdminApiKeysPage.vue'
import AdminFeedbackPage from '../pages/AdminFeedbackPage.vue'
import GettingStartedPage from '../pages/GettingStartedPage.vue'
import NewsPage from '../pages/NewsPage.vue'
import LeaderboardPage from '../pages/LeaderboardPage.vue'
import CommunityStatsPage from '../pages/CommunityStatsPage.vue'

// A driver's pages live under their user id: /<userId>/races, etc. The
// param only matches a UUID, so it can never shadow a top-level route like
// /login or /news.
const DRIVER = '/:userId([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})'

// Where a signed-in user lands: after sign-in, from "/", and off pages they
// aren't allowed on.
export function signedInHomeRoute() {
  return { name: 'community-leaderboard' }
}

// Pre-namespace URLs (/races, /track/a/b, ...) from bookmarks and old links:
// the same page under the signed-in user's own prefix. The auth session is
// resolved before the router is installed (see main.js), so authStore is
// already settled here. Signed out there's no "own" page, so the community
// version of the same page instead.
function toOwnPage(to) {
  if (authStore.isAuthenticated) {
    return { path: `/${authStore.user.id}${to.path}`, query: to.query, hash: to.hash }
  }
  return { path: `/community${to.path}`, hash: to.hash }
}

const routes = [
  { path: '/', name: 'home', component: HomePage, meta: { public: true } },
  { path: '/login', name: 'login', component: LoginPage, meta: { public: true } },
  { path: '/plugin', name: 'telemetry', component: PluginPage, meta: { public: true } },
  { path: '/getting-started', name: 'getting-started', component: GettingStartedPage },
  { path: '/news', name: 'news', component: NewsPage },

  // Community: every public driver's races. Same components as a driver's
  // pages, switched into community mode by meta.scope.
  { path: '/community/leaderboard', name: 'community-leaderboard', component: LeaderboardPage, meta: { public: true, scope: 'community' } },
  { path: '/community/stats', name: 'community-stats', component: CommunityStatsPage, meta: { public: true, scope: 'community' } },
  { path: '/community/tracks', name: 'community-tracks', component: TrackListPage, meta: { public: true, scope: 'community' } },
  { path: '/community/track/:trackSlug/:variationSlug', name: 'community-track-detail', component: TrackDetailPage, meta: { public: true, scope: 'community' } },
  { path: '/community/races', name: 'community-races', component: RacesPage, meta: { public: true, scope: 'community' } },

  // Public: anyone can view a driver's pages. The pages themselves only
  // show editing, notes, goals and annotations when the driver is you.
  { path: `${DRIVER}/tracks`, name: 'driver-tracks', component: TrackListPage, meta: { public: true } },
  { path: `${DRIVER}/track/:trackSlug/:variationSlug`, name: 'driver-track-detail', component: TrackDetailPage, meta: { public: true } },
  { path: `${DRIVER}/races`, name: 'driver-races', component: RacesPage, meta: { public: true } },
  { path: `${DRIVER}/stats`, name: 'driver-stats', component: StatsPage, meta: { public: true } },
  { path: '/tracks', redirect: toOwnPage },
  { path: '/track/:trackSlug/:variationSlug', redirect: toOwnPage },
  { path: '/races', redirect: toOwnPage },
  { path: '/stats', redirect: toOwnPage },

  { path: '/settings/api-keys', name: 'api-keys', component: ApiKeysPage },
  { path: '/settings/profile', name: 'profile', component: ProfileSettingsPage },
  { path: '/admin/users', name: 'admin-users', component: UsersPage, meta: { requiresAdmin: true } },
  { path: '/admin/api-keys', name: 'admin-api-keys', component: AdminApiKeysPage, meta: { requiresAdmin: true } },
  { path: '/admin/feedback', name: 'admin-feedback', component: AdminFeedbackPage, meta: { requiresAdmin: true } },

  { path: '/:pathMatch(.*)*', redirect: '/' }
]

// Hash history avoids needing a 404 fallback on GitHub Pages.
export const router = createRouter({
  history: createWebHashHistory(),
  routes
})

router.beforeEach(async to => {
  await initAuthStore()

  // A suspended account is treated as signed out from here on — the real
  // enforcement is at the RLS/RPC level (see supabase/schema.sql), this
  // just gets them out of the authenticated UI on their next navigation.
  if (authStore.isBanned) {
    clearAuthSession()
    signOut().catch(() => {})
    pushToast('Your account has been suspended.', 'error')
  }

  if (to.meta.public) {
    // Signed-in visitors don't need the marketing page — send them
    // straight into the app instead of showing it every time they hit "/".
    if (to.name === 'home' && authStore.isAuthenticated) {
      return signedInHomeRoute()
    }
    // OAuth sign-in (Google/Discord) does a full-page redirect away and
    // back, so there's no in-page JS left to route away afterward like the
    // password form does — the browser lands back on /login already
    // authenticated and the guard has to send it onward itself.
    if (to.name === 'login' && authStore.isAuthenticated) {
      const target = to.query.redirect
      if (typeof target === 'string' && target.startsWith('/') && !target.startsWith('//')) {
        return target
      }
      return signedInHomeRoute()
    }
    return true
  }
  if (!authStore.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (to.meta.requiresAdmin && !authStore.isAdmin) {
    return signedInHomeRoute()
  }
  return true
})
