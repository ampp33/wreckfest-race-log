<template>
  <div class="min-h-screen flex items-center justify-center px-4">
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6 sm:p-8 w-full max-w-md border border-slate-200 dark:border-slate-700">
      <h1 class="text-2xl font-bold text-brand mb-1">🏁 Wreckfest Race Log</h1>
      <p class="text-sm text-slate-500 mb-6">
        {{ mode === 'signin' ? 'Sign in to log your races.' : 'Create an account to start logging races.' }}
      </p>

      <form @submit.prevent="onSubmit" class="space-y-3">
        <div>
          <label class="block text-xs uppercase tracking-wide text-slate-500 mb-1">
            Email
          </label>
          <input
            v-model="email"
            type="email"
            required
            autocomplete="email"
            class="w-full rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-gray-700 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label class="block text-xs uppercase tracking-wide text-slate-500 mb-1">
            Password
          </label>
          <input
            v-model="password"
            type="password"
            required
            minlength="6"
            :autocomplete="mode === 'signin' ? 'current-password' : 'new-password'"
            class="w-full rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-gray-700 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          :disabled="submitting"
          class="w-full px-4 py-2 bg-brand hover:bg-brand-dark text-white rounded font-semibold disabled:opacity-60"
        >
          {{ submitButtonLabel }}
        </button>
      </form>

      <p class="mt-4 text-sm text-slate-500 text-center">
        {{ mode === 'signin' ? "Don't have an account?" : 'Already have an account?' }}
        <button
          type="button"
          class="text-brand hover:underline ml-1"
          @click="toggleMode"
        >
          {{ mode === 'signin' ? 'Create one' : 'Sign in' }}
        </button>
      </p>

      <p v-if="message" class="mt-4 text-sm text-green-600">{{ message }}</p>
      <p v-if="errorMessage" class="mt-4 text-sm text-red-600">{{ errorMessage }}</p>
    </div>
  </div>
</template>

<script>
import { signInWithPassword, signUpWithPassword } from '../services/authService.js'

export default {
  name: 'LoginPage',
  data() {
    return {
      mode: 'signin',
      email: '',
      password: '',
      submitting: false,
      message: '',
      errorMessage: ''
    }
  },
  computed: {
    submitButtonLabel() {
      if (this.submitting) return this.mode === 'signin' ? 'Signing in...' : 'Creating account...'
      return this.mode === 'signin' ? 'Sign in' : 'Create account'
    },
    redirectPath() {
      const target = this.$route.query.redirect
      if (typeof target === 'string' && target.startsWith('/') && !target.startsWith('//')) {
        return target
      }
      return '/'
    }
  },
  methods: {
    toggleMode() {
      this.mode = this.mode === 'signin' ? 'signup' : 'signin'
      this.message = ''
      this.errorMessage = ''
    },
    async onSubmit() {
      this.message = ''
      this.errorMessage = ''
      this.submitting = true
      try {
        if (this.mode === 'signin') {
          await signInWithPassword(this.email.trim(), this.password)
          this.$router.replace(this.redirectPath)
        } else {
          const { session } = await signUpWithPassword(this.email.trim(), this.password)
          if (session) {
            this.$router.replace(this.redirectPath)
          } else {
            // Project has "Confirm email" enabled — the user has to click the
            // verification link before we can sign them in.
            this.message = 'Account created. Check your inbox to confirm your email, then sign in.'
            this.mode = 'signin'
          }
        }
      } catch (err) {
        this.errorMessage = err.message || 'Authentication failed.'
      } finally {
        this.submitting = false
      }
    }
  }
}
</script>
