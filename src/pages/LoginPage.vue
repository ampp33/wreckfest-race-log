<template>
  <div class="min-h-screen flex items-center justify-center px-6">
    <div class="rule-top w-full max-w-md pt-6">
      <div class="ov text-brand-accent dark:text-brand-accent-dark mb-4">Wreckfest Race Log</div>
      <h1 class="font-heading font-normal tracking-normal leading-[0.86] text-display-sm text-brand-text dark:text-brand-text-dark mb-4">
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
        <span class="w-4 h-4 inline-block" v-html="googleIcon"></span>
        Continue with Google
      </button>

      <button
        type="button"
        :disabled="submitting"
        class="w-full min-h-[44px] flex items-center justify-center gap-2.5 font-body font-medium border border-brand-border dark:border-brand-border-dark px-6 mt-3 hover:border-brand-accent dark:hover:border-brand-accent-dark disabled:opacity-60"
        @click="onDiscordSignIn"
      >
        <span class="w-4 h-4 inline-block" v-html="discordIcon"></span>
        Continue with Discord
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
import { signInWithPassword, signUpWithPassword, signInWithGoogle, signInWithDiscord } from '../services/authService.js'
import googleIcon from '../assets/icons/google.svg?raw'
import discordIcon from '../assets/icons/discord.svg?raw'

export default {
  name: 'LoginPage',
  data() {
    return {
      mode: 'signin',
      email: '',
      password: '',
      submitting: false,
      message: '',
      errorMessage: '',
      googleIcon,
      discordIcon
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
    async onDiscordSignIn() {
      this.message = ''
      this.errorMessage = ''
      this.submitting = true
      try {
        await signInWithDiscord(window.location.href)
      } catch (err) {
        this.errorMessage = err.message || 'Discord sign-in failed.'
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
