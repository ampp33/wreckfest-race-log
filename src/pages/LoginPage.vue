<template>
  <div class="min-h-screen flex items-center justify-center px-6">
    <div class="rule-top w-full max-w-md pt-6">
      <div class="ov text-brand-accent dark:text-brand-accent-dark mb-4">Wreckfest Race Log</div>
      <h1 class="font-display font-black tracking-tightest leading-[0.86] text-display-sm text-brand-text dark:text-brand-text-dark mb-4">
        {{ mode === 'signin' ? 'Sign in' : 'Create an account' }}
      </h1>
      <p class="font-body text-[15px] leading-relaxed text-brand-muted dark:text-brand-muted-dark mb-8">
        {{ mode === 'signin' ? 'Sign in to log your races.' : 'Create an account to start logging races.' }}
      </p>

      <button
        type="button"
        :disabled="submitting"
        class="w-full min-h-[44px] flex items-center justify-center gap-2.5 font-body font-medium border border-brand-border dark:border-brand-border-dark px-6 hover:border-brand-accent dark:hover:border-brand-accent-dark disabled:opacity-60"
        @click="onGoogleSignIn"
      >
        <svg viewBox="0 0 18 18" class="w-4 h-4" aria-hidden="true">
          <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.88 2.7-6.62z"/>
          <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.83.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.96v2.33A9 9 0 0 0 9 18z"/>
          <path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.16.28-1.7V4.97H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.03l2.99-2.33z"/>
          <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.97l2.99 2.33C4.66 5.17 6.65 3.58 9 3.58z"/>
        </svg>
        Continue with Google
      </button>

      <div class="flex items-center gap-3 my-5">
        <div class="flex-1 h-px bg-brand-border dark:bg-brand-border-dark"></div>
        <span class="ov text-brand-muted dark:text-brand-muted-dark">or</span>
        <div class="flex-1 h-px bg-brand-border dark:bg-brand-border-dark"></div>
      </div>

      <form @submit.prevent="onSubmit" class="space-y-4">
        <div>
          <label class="ov block text-brand-muted dark:text-brand-muted-dark mb-2">
            Email
          </label>
          <input
            v-model="email"
            type="email"
            required
            autocomplete="email"
            class="w-full min-h-[44px] border border-brand-border dark:border-brand-border-dark bg-brand-bg dark:bg-brand-surface-dark px-3 focus:outline-none focus:border-brand-accent dark:focus:border-brand-accent-dark"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label class="ov block text-brand-muted dark:text-brand-muted-dark mb-2">
            Password
          </label>
          <input
            v-model="password"
            type="password"
            required
            minlength="6"
            :autocomplete="mode === 'signin' ? 'current-password' : 'new-password'"
            class="w-full min-h-[44px] border border-brand-border dark:border-brand-border-dark bg-brand-bg dark:bg-brand-surface-dark px-3 focus:outline-none focus:border-brand-accent dark:focus:border-brand-accent-dark"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          :disabled="submitting"
          class="ov w-full min-h-[44px] flex items-center justify-center bg-brand-accent dark:bg-brand-accent-dark text-white hover:opacity-85 disabled:opacity-60"
        >
          {{ submitButtonLabel }}
        </button>
      </form>

      <p class="mt-6 font-body text-[15px] text-brand-muted dark:text-brand-muted-dark text-center">
        {{ mode === 'signin' ? "Don't have an account?" : 'Already have an account?' }}
        <button
          type="button"
          class="text-brand-accent hover:underline ml-1"
          @click="toggleMode"
        >
          {{ mode === 'signin' ? 'Create one' : 'Sign in' }}
        </button>
      </p>

      <p v-if="message" class="mt-5 text-sm text-brand-good dark:text-brand-good-dark">{{ message }}</p>
      <p v-if="errorMessage" class="mt-5 text-sm text-brand-accent dark:text-brand-accent-dark">{{ errorMessage }}</p>
    </div>
  </div>
</template>

<script>
import { signInWithPassword, signUpWithPassword, signInWithGoogle } from '../services/authService.js'

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
      return '/tracks'
    }
  },
  methods: {
    toggleMode() {
      this.mode = this.mode === 'signin' ? 'signup' : 'signin'
      this.message = ''
      this.errorMessage = ''
    },
    async onGoogleSignIn() {
      this.message = ''
      this.errorMessage = ''
      this.submitting = true
      try {
        // Current URL (including the ?redirect= route we're already on) is
        // where Google/Supabase should land the browser back after consent.
        await signInWithGoogle(window.location.href)
      } catch (err) {
        this.errorMessage = err.message || 'Google sign-in failed.'
        this.submitting = false
      }
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
