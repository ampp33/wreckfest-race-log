<template>
  <!-- -mb-12/pb-12: run the red through the footer's mt-12 gap -->
  <div class="bg-brand-accent dark:bg-brand-accent-dark text-white min-h-[calc(100vh-64px)] -mb-12 pb-12">
    <div class="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
      <div class="ov text-white/70 mb-4">Telemetry plugin · Windows &amp; Linux</div>
      <h1 class="font-heading font-normal tracking-normal leading-none text-display-xl">Installation Instructions</h1>
      <p class="font-body text-[17px] leading-relaxed text-white/85 mt-5 max-w-xl">
        Four steps, about two minutes. Once it's installed, every race you finish shows up here automatically.
      </p>

      <ol class="mt-12 border-t-2 border-white">
        <li class="grid grid-cols-[64px_1fr] sm:grid-cols-[140px_1fr_auto] gap-x-6 gap-y-4 items-center py-8 border-b border-white/30">
          <span class="font-heading text-display-lg leading-none text-white/40 row-span-2 sm:row-span-1">01</span>
          <div>
            <h2 class="font-body font-bold text-[22px]">Download the plugin</h2>
          </div>
          <button class="ov min-h-[52px] px-7 bg-white text-brand-accent dark:text-brand-accent-dark hover:bg-white/90 justify-self-start" :disabled="pluginState === 'busy'" @click="getPlugin">
            {{ pluginState === 'done' ? `✓ Got ${pluginVersion || 'it'} — Click to Download Again` : pluginState === 'busy' ? 'Finding latest…' : 'Download plugin' }}
          </button>
        </li>

        <li class="grid grid-cols-[64px_1fr] sm:grid-cols-[140px_1fr] gap-x-6 py-8 border-b border-white/30">
          <span class="font-heading text-display-lg leading-none text-white/40">02</span>
          <div>
            <h2 class="font-body font-bold text-[22px]">Unzip it into your Wreckfest install folder</h2>
            <p class="font-body text-white/80 text-[15px] mt-1 max-w-xl">
              In Steam: right-click <b>Wreckfest</b> → <b>Manage</b> → <b>Browse local files</b>.
              Extract everything there, next to <code class="font-mono text-[13px] text-white bg-black/25 px-1.5 py-0.5">Wreckfest_x64.exe</code>.
            </p>
          </div>
        </li>

        <li class="grid grid-cols-[64px_1fr] sm:grid-cols-[140px_1fr_auto] gap-x-6 gap-y-4 items-center py-8 border-b border-white/30">
          <span class="font-heading text-display-lg leading-none text-white/40 row-span-2 sm:row-span-1">03</span>
          <div>
            <h2 class="font-body font-bold text-[22px]">Get your key</h2>
            <p class="font-body text-white/80 text-[15px] mt-1 max-w-xl">
              Download your API key (it ties logged races to your account), then drop it in your Wreckfest install's <code class="font-mono text-[13px] text-white bg-black/25 px-1.5 py-0.5">scripts</code> folder, replacing the placeholder file.
            </p>
          </div>
          <router-link v-if="!signedIn" :to="loginRoute" class="ov min-h-[52px] px-7 inline-flex items-center border-2 border-white hover:bg-white/10 justify-self-start">Sign in first</router-link>
          <button v-else class="ov min-h-[52px] px-7 bg-white text-brand-accent dark:text-brand-accent-dark hover:bg-white/90 justify-self-start" :disabled="keyState === 'busy'" @click="getKey">
            {{ keyState === 'done' ? '✓ Saved api-key.txt' : keyState === 'busy' ? 'Creating…' : 'Download my key' }}
          </button>
        </li>

        <li class="grid grid-cols-[64px_1fr] sm:grid-cols-[140px_1fr] gap-x-6 py-8 border-b border-white/30">
          <span class="font-heading text-display-lg leading-none text-white/40">04</span>
          <div>
            <h2 class="font-body font-bold text-[22px]">Go race</h2>
            <p class="font-body text-white/80 text-[15px] mt-1 max-w-xl">
              Finish a race and make sure it lands at the top of <router-link to="/races" class="underline">your races</router-link>.
            </p>
            <details class="mt-4 font-body text-[14px] text-white/85">
              <summary class="cursor-pointer ov text-white">Playing on Linux / Steam Deck?</summary>
              <p class="mt-3">Add this to Wreckfest's Steam launch options first:</p>
              <button class="mt-2 font-mono text-[13px] bg-black/25 hover:bg-black/35 px-3 py-2 text-left" @click="copyLaunch">
                {{ launchOptions }} <span class="ov ml-2 text-white/70">{{ launchCopied ? 'copied' : 'copy' }}</span>
              </button>
            </details>
          </div>
        </li>
      </ol>
      <a href="https://github.com/ampp33/wreckfest-telemetry-asi" target="_blank" rel="noopener noreferrer" class="ov inline-block mt-8 text-white/70 hover:text-white">Source on GitHub ↗</a>
    </div>
  </div>
</template>

<script>
import { authStore } from '../stores/authStore.js'
import { pushToast } from '../stores/toastStore.js'
import { downloadLatestPlugin, downloadNewApiKey } from '../services/pluginService.js'

export default {
  name: 'TelemetryPage',
  data() {
    return {
      launchOptions: 'WINEDLLOVERRIDES="version=n,b" %command%',
      pluginState: 'idle', // idle | busy | done
      pluginVersion: null,
      keyState: 'idle',
      launchCopied: false
    }
  },
  computed: {
    signedIn() { return authStore.isAuthenticated },
    loginRoute() { return { name: 'login', query: { redirect: this.$route.fullPath } } }
  },
  methods: {
    async getPlugin() {
      this.pluginState = 'busy'
      this.pluginVersion = await downloadLatestPlugin()
      this.pluginState = 'done'
    },
    async getKey() {
      this.keyState = 'busy'
      try {
        await downloadNewApiKey()
        this.keyState = 'done'
      } catch (err) {
        this.keyState = 'idle'
        pushToast(err.message || 'Could not create a key', 'error')
      }
    },
    async copyLaunch() {
      await navigator.clipboard.writeText(this.launchOptions)
      this.launchCopied = true
      setTimeout(() => { this.launchCopied = false }, 1500)
    }
  }
}
</script>
