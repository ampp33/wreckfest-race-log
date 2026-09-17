import { createRouter, createWebHashHistory } from 'vue-router'
import { authStore, initAuthStore } from '../stores/authStore.js'

import HomePage from '../pages/HomePage.vue'
import PluginPage from '../pages/PluginPage.vue'
import TrackListPage from '../pages/TrackListPage.vue'
import TrackDetailPage from '../pages/TrackDetailPage.vue'
import StatsPage from '../pages/StatsPage.vue'
import LoginPage from '../pages/LoginPage.vue'
import DiagnosticsPage from '../pages/DiagnosticsPage.vue'
import UserRolesPage from '../pages/UserRolesPage.vue'
import RacesPage from '../pages/RacesPage.vue'
import ApiKeysPage from '../pages/ApiKeysPage.vue'
import AdminApiKeysPage from '../pages/AdminApiKeysPage.vue'
import AdminFeedbackPage from '../pages/AdminFeedbackPage.vue'
import GettingStartedPage from '../pages/GettingStartedPage.vue'

const routes = [
  { path: '/', name: 'home', component: HomePage, meta: { public: true } },
  { path: '/login', name: 'login', component: LoginPage, meta: { public: true } },
  { path: '/plugin', name: 'telemetry', component: PluginPage, meta: { public: true } },
  { path: '/getting-started', name: 'getting-started', component: GettingStartedPage },
  { path: '/tracks', name: 'tracks', component: TrackListPage },
  {
    path: '/track/:trackSlug/:variationSlug',
    name: 'track-detail',
    component: TrackDetailPage
  },
  { path: '/races', name: 'races', component: RacesPage },
  { path: '/stats', name: 'stats', component: StatsPage },
  { path: '/settings/api-keys', name: 'api-keys', component: ApiKeysPage },
  { path: '/admin/diagnostics', name: 'admin-diagnostics', component: DiagnosticsPage, meta: { requiresAdmin: true } },
  { path: '/admin/users', name: 'admin-users', component: UserRolesPage, meta: { requiresAdmin: true } },
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
  if (to.meta.public) {
    // Signed-in visitors don't need the marketing page — send them
    // straight into the app instead of showing it every time they hit "/".
    if (to.name === 'home' && authStore.isAuthenticated) {
      return { name: 'races' }
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
      return { name: 'races' }
    }
    return true
  }
  if (!authStore.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (to.meta.requiresAdmin && !authStore.isAdmin) {
    return { name: 'races' }
  }
  return true
})
