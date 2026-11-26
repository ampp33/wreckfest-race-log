<template>
  <!-- Low-contrast hazard stripes so the text stays readable on top of them. -->
  <div
    class="w-full text-white"
    style="background: repeating-linear-gradient(-45deg, #DC2626 0 14px, #CB2020 14px 28px)"
  >
    <div class="max-w-7xl mx-auto px-4 sm:px-6 py-2 text-sm flex items-center gap-3">
      <svg class="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M9 2v5M15 2v5M7 7h10v4a5 5 0 0 1-10 0z" />
        <path d="M12 16v3a3 3 0 0 0 3 3h1" />
        <path d="M3 3l18 18" />
      </svg>
      <span>
        No races logged yet. Set up the Telemetry plugin to log your races automatically:&nbsp;
        <router-link to="/plugin" class="underline font-semibold hover:opacity-75">install the plugin</router-link>
      </span>
    </div>
  </div>
</template>

