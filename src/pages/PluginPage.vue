<template>
  <PublicHeader />
  <div class="max-w-7xl mx-auto px-6 py-10">
    <h1 class="font-heading font-normal tracking-normal leading-none text-display-lg text-brand-text dark:text-brand-text-dark">
      Wreckfest <em class="signal ml-2">Telemetry</em> Plugin
    </h1>
    <p class="font-body text-[15px] leading-relaxed text-brand-secondary dark:text-brand-secondary-dark mt-3.5 mb-2 max-w-xl">
      An auto-loading ASI plugin that reads your Wreckfest race results live, straight out of the
      game's own memory, and logs each completed race to this site automatically.
    </p>
    <div class="ov text-brand-muted dark:text-brand-muted-dark mb-6">Works on Windows and Linux (Steam + Proton)</div>

    <!-- Setup -->
    <section class="rule-top pt-5">
      <h2 class="font-heading font-normal tracking-normal leading-none text-display-sm text-brand-text dark:text-brand-text-dark mb-5">
        Installation <em class="signal">instructions</em>
      </h2>
      <ol class="font-body text-[15px] leading-relaxed text-brand-text dark:text-brand-text-dark space-y-4 list-decimal list-inside">
        <li>
          Download the latest release zip from the
          <a href="https://github.com/ampp33/wreckfest-telemetry-asi/releases" target="_blank" rel="noopener noreferrer" class="text-brand-accent hover:underline">Releases</a>
          page.
        </li>
        <li>
          Extract it into your Wreckfest install root directory (next to
          <code class="font-mono text-[13px] font-medium text-brand-text dark:text-brand-text-dark">Wreckfest_x64.exe</code>), so
          <code class="font-mono text-[13px] font-medium text-brand-text dark:text-brand-text-dark">version.dll</code> and
          <code class="font-mono text-[13px] font-medium text-brand-text dark:text-brand-text-dark">scripts/</code> land there.
        </li>
        <li>
          Generate an <router-link to="/settings/api-keys" class="text-brand-accent hover:underline">API Key</router-link>,
          then open <code class="font-mono text-[13px] font-medium text-brand-text dark:text-brand-text-dark">scripts/api-key.txt</code>
          and replace the placeholder text with it (one line, nothing else).
        </li>
        <li>
          <strong class="text-brand-text dark:text-brand-text-dark">Steam + Linux (Proton) only:</strong>
          add
          <code class="font-mono text-[13px] font-medium text-brand-text dark:text-brand-text-dark">WINEDLLOVERRIDES="version=n,b" %command%</code>
          to Wreckfest's launch options in Steam, so Wine loads the real proxy DLL instead of its
          own built-in stub. Not needed on native Windows.
        </li>
        <li>
          Complete a race in Wreckfest — the entry should appear at the top of the table on the
          <router-link to="/races" class="text-brand-accent hover:underline">races</router-link> page.
        </li>
      </ol>
    </section>
    <a
      href="https://github.com/ampp33/wreckfest-telemetry-asi"
      target="_blank"
      rel="noopener noreferrer"
      class="ov min-h-[44px] mt-4 px-6 inline-flex items-center bg-brand-accent dark:bg-brand-accent-dark text-white hover:opacity-85 mb-12"
    >
      View Code on GitHub
    </a>
  </div>
</template>

<script>
import PublicHeader from '../components/PublicHeader.vue'

export default {
  name: 'TelemetryPage',
  components: { PublicHeader }
}
</script>
