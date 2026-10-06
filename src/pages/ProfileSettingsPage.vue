<template>
  <div class="max-w-7xl mx-auto px-6 py-10">
    <h1 class="font-heading font-normal tracking-normal leading-none text-display-lg text-brand-text dark:text-brand-text-dark mb-1">
      Your <em class="signal">Profile</em>
    </h1>
    <p class="font-body text-[15px] leading-relaxed text-brand-secondary dark:text-brand-secondary-dark mb-8 max-w-2xl">
      How you show up to other racers on the community leaderboards, track pages and race lists.
    </p>

    <p v-if="!auth.profile" class="font-body text-[15px] text-brand-muted dark:text-brand-muted-dark">
      Couldn't load your profile. Try refreshing the page.
    </p>

    <div v-else class="space-y-10 max-w-2xl">
      <!-- Display name -->
      <section class="rule-top pt-4">
        <h2 class="font-heading font-normal tracking-normal leading-none text-display-sm text-brand-text dark:text-brand-text-dark mb-3">
          Display <em class="signal">name</em>
        </h2>

        <p
          v-if="isAutoAssignedName"
          class="font-body text-[14px] text-brand-accent dark:text-brand-accent-dark mb-3"
        >
          You're showing up as <b>{{ auth.profile.display_name }}</b>. Pick a name other racers will recognize.
        </p>

        <form class="flex items-end gap-3" @submit.prevent="onSaveName">
          <div class="flex-1">
            <label
              for="display-name"
              class="block font-body font-medium uppercase tracking-widest text-[11px] text-brand-muted dark:text-brand-muted-dark mb-1"
            >Name</label>
            <input
              id="display-name"
              v-model="nameInput"
              type="text"
              minlength="3"
              maxlength="24"
              required
              autocomplete="nickname"
              class="w-full min-h-[44px] font-body text-[15px] bg-brand-bg dark:bg-brand-bg-dark border border-brand-border dark:border-brand-border-dark rounded px-3 py-2 text-brand-text dark:text-brand-text-dark focus:outline-none focus:border-brand-accent"
            />
          </div>
          <button
            type="submit"
            :disabled="savingName || !nameChanged"
            class="shrink-0 min-h-[44px] px-4 font-body font-semibold text-sm bg-brand-accent text-white rounded hover:opacity-90 disabled:opacity-50"
          >
            {{ savingName ? 'Saving…' : 'Save' }}
          </button>
        </form>
        <p class="text-xs text-brand-muted dark:text-brand-muted-dark mt-2">
          3–24 characters. Names are unique, ignoring capitalization.
        </p>
      </section>

      <!-- Visibility -->
      <section class="rule-top pt-4">
        <h2 class="font-heading font-normal tracking-normal leading-none text-display-sm text-brand-text dark:text-brand-text-dark mb-3">
          Who can see your <em class="signal">races</em>
        </h2>

        <div class="flex mb-4" role="group" aria-label="Race visibility">
          <button
            v-for="option in visibilityOptions"
            :key="option.label"
            type="button"
            class="min-h-[44px] px-5 border text-sm font-semibold -ml-px first:ml-0 disabled:opacity-50"
            :aria-pressed="auth.profile.is_public === option.value"
            :disabled="savingVisibility"
            :class="auth.profile.is_public === option.value
              ? 'bg-brand-strong dark:bg-brand-strong-dark border-brand-strong dark:border-brand-strong-dark text-brand-bg dark:text-brand-bg-dark'
              : 'border-brand-border dark:border-brand-border-dark text-brand-muted dark:text-brand-muted-dark hover:border-brand-accent'"
            @click="onSetVisibility(option.value)"
          >{{ option.label }}</button>
        </div>

        <p class="font-body text-[15px] leading-relaxed text-brand-secondary dark:text-brand-secondary-dark mb-4">
          <template v-if="auth.profile.is_public">
            Anyone, signed in or not, can see your races and your display name.
          </template>
          <template v-else>
            Only you can see your races. You won't appear on leaderboards, community race lists or track pages,
            and your driver page shows nothing to anyone else. Your own pages work exactly the same.
          </template>
        </p>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <div class="ov text-brand-muted dark:text-brand-muted-dark mb-2">Public when visible</div>
            <ul class="font-body text-[14px] leading-relaxed text-brand-secondary dark:text-brand-secondary-dark space-y-1 list-disc pl-5">
              <li>Your display name</li>
              <li>Each race's date, track, vehicle, tuning and assists</li>
              <li>PI, vehicle weight and finishing place</li>
              <li>Lap time, total time and lap splits</li>
              <li>The results roster and server name</li>
            </ul>
          </div>
          <div>
            <div class="ov text-brand-muted dark:text-brand-muted-dark mb-2">Always private</div>
            <ul class="font-body text-[14px] leading-relaxed text-brand-secondary dark:text-brand-secondary-dark space-y-1 list-disc pl-5">
              <li>Race notes</li>
              <li>Track notes and goal lap times</li>
              <li>Track map annotations</li>
              <li>Your API keys, and which key logged a race</li>
              <li>Your email address</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script>
import { authStore, setAuthProfile } from '../stores/authStore.js'
import { updateMyProfile } from '../services/profileService.js'
import { pushToast } from '../stores/toastStore.js'

export default {
  name: 'ProfileSettingsPage',
  data() {
    return {
      auth: authStore,
      nameInput: authStore.profile?.display_name ?? '',
      savingName: false,
      savingVisibility: false,
      visibilityOptions: [
        { label: 'Public', value: true },
        { label: 'Private', value: false }
      ]
    }
  },
  computed: {
    // Matches the 'Driver-<hex>' names wf1.default_display_name() hands out
    // at signup, so a user who hasn't picked a name yet gets nudged to.
    isAutoAssignedName() {
      return /^Driver-[0-9a-f]+$/.test(this.auth.profile?.display_name ?? '')
    },
    nameChanged() {
      return this.nameInput.trim() !== (this.auth.profile?.display_name ?? '')
    }
  },
  methods: {
    async onSaveName() {
      if (!this.nameChanged) return
      this.savingName = true
      try {
        const profile = await updateMyProfile(authStore.user.id, { displayName: this.nameInput })
        setAuthProfile(profile)
        this.nameInput = profile.display_name
        pushToast('Display name saved', 'success', 2000)
      } catch (err) {
        pushToast(err.message, 'error')
      } finally {
        this.savingName = false
      }
    },
    async onSetVisibility(isPublic) {
      if (this.auth.profile.is_public === isPublic) return
      this.savingVisibility = true
      try {
        const profile = await updateMyProfile(authStore.user.id, { isPublic })
        setAuthProfile(profile)
        pushToast(isPublic ? 'Your races are now public' : 'Your races are now private', 'success', 2000)
      } catch (err) {
        pushToast(err.message, 'error')
      } finally {
        this.savingVisibility = false
      }
    }
  }
}
</script>
