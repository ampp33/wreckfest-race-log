<template>
  <div class="max-w-3xl mx-auto px-6 py-10">
    <h1 class="font-display font-black tracking-tightest leading-none text-display-lg text-brand-text dark:text-brand-text-dark">
      Wreckfest <em class="signal">Telemetry</em>
    </h1>
    <p class="font-body text-[15px] leading-relaxed text-brand-secondary dark:text-brand-secondary-dark mt-3.5 mb-6 max-w-xl">
      A companion tool that reads Wreckfest's game memory directly while it runs under
      Steam Play (Proton) on Linux, automatically detecting completed races and posting
      them to your Race Log account — no mods or plugins required.
    </p>

    <a
      href="https://github.com/ampp33/wreckfest-telemetry"
      target="_blank"
      rel="noopener noreferrer"
      class="ov min-h-[44px] px-6 inline-flex items-center bg-brand-accent dark:bg-brand-accent-dark text-white hover:opacity-85 mb-12"
    >
      View on GitHub
    </a>

    <div class="space-y-14">
      <!-- Requirements -->
      <section class="rule-top pt-5">
        <h2 class="font-display font-black tracking-tightest leading-none text-display-sm text-brand-text dark:text-brand-text-dark mb-5">
          System <em class="signal">requirements</em>
        </h2>
        <ul class="font-body text-[15px] leading-relaxed text-brand-text dark:text-brand-text-dark list-disc list-inside space-y-1">
          <li>Linux, with Wreckfest running via Steam Play (Proton)</li>
          <li>Python 3.8+ (standard library only — no extra packages to install)</li>
          <li>Read access to <code class="font-mono text-[13px] font-medium text-brand-text dark:text-brand-text-dark">/proc/&lt;pid&gt;/mem</code> for the game process</li>
        </ul>
      </section>

      <!-- Setup -->
      <section class="rule-top pt-5">
        <h2 class="font-display font-black tracking-tightest leading-none text-display-sm text-brand-text dark:text-brand-text-dark mb-5">
          Setting it <em class="signal">up</em>
        </h2>
        <ol class="font-body text-[15px] leading-relaxed text-brand-text dark:text-brand-text-dark space-y-4 list-decimal list-inside">
          <li>
            Sign in and generate an API key at
            <router-link to="/settings/api-keys" class="text-brand-accent hover:underline">Settings → API Keys</router-link>.
            You'll paste this into the tool's config in a moment.
          </li>
          <li>
            Download or clone the tool from
            <a href="https://github.com/ampp33/wreckfest-telemetry" target="_blank" rel="noopener noreferrer" class="text-brand-accent hover:underline">its GitHub repo</a>.
          </li>
          <li>
            Copy <code class="font-mono text-[13px] font-medium text-brand-text dark:text-brand-text-dark">config.json.example</code>
            to <code class="font-mono text-[13px] font-medium text-brand-text dark:text-brand-text-dark">config.json</code>
            and fill in three fields:
            <div class="mt-3 bg-brand-surface dark:bg-brand-surface-dark border-l-2 border-brand-accent dark:border-brand-accent-dark p-4 font-mono text-xs overflow-x-auto">
<pre>{
  "api_key": "&lt;the key you generated in step 1&gt;",
  "supabase_url": "{{ supabaseUrl }}",
  "supabase_anon_key": "{{ supabaseAnonKey }}"
}</pre>
            </div>
            <p class="font-body text-[13px] text-brand-muted dark:text-brand-muted-dark mt-1">
              The <code class="font-mono">supabase_url</code>/<code class="font-mono">supabase_anon_key</code> values
              above are this site's actual values — safe to copy as-is. Only the API key is
              specific to your account and secret.
            </p>
          </li>
          <li>
            Find the running Wreckfest process ID and start the tool:
            <div class="mt-3 bg-brand-surface dark:bg-brand-surface-dark border-l-2 border-brand-accent dark:border-brand-accent-dark p-4 font-mono text-xs overflow-x-auto">
              python3 wreckfest_telemetry.py --pid 12345
            </div>
            It attaches to the process, waits for each race to finish, then displays the
            results and appends them to <code class="font-mono text-[13px] font-medium text-brand-text dark:text-brand-text-dark">race_log.jsonl</code>
            — and, with a valid <code class="font-mono">config.json</code>, posts them straight to your account.
          </li>
        </ol>
      </section>

      <!-- Flags -->
      <section class="rule-top pt-5">
        <h2 class="font-display font-black tracking-tightest leading-none text-display-sm text-brand-text dark:text-brand-text-dark mb-5">
          Configuration <em class="signal">flags</em>
        </h2>
        <div class="overflow-x-auto">
          <table class="min-w-full text-sm">
            <thead>
              <tr class="text-left ov text-brand-muted dark:text-brand-muted-dark border-b-2 border-brand-strong dark:border-brand-strong-dark">
                <th class="pr-4 pb-2.5 font-medium">Flag</th>
                <th class="pr-4 pb-2.5 font-medium">Purpose</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-brand-border dark:divide-brand-border-dark border-b border-brand-border dark:border-brand-border-dark font-body">
              <tr v-for="flag in flags" :key="flag.name">
                <td class="pr-4 py-2.5 font-mono text-xs whitespace-nowrap text-brand-text dark:text-brand-text-dark">{{ flag.name }}</td>
                <td class="pr-4 py-2.5 text-brand-muted dark:text-brand-muted-dark">{{ flag.purpose }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- Note -->
      <section class="border-l-2 border-brand-accent dark:border-brand-accent-dark pl-5 py-1">
        <p class="font-body text-[15px] leading-relaxed text-brand-secondary dark:text-brand-secondary-dark">
          <strong class="text-brand-text dark:text-brand-text-dark">Heads up:</strong>
          if <code class="font-mono text-sm">config.json</code> is missing or incomplete, the tool
          doesn't error out — it just silently skips posting to your account while local
          <code class="font-mono text-sm">race_log.jsonl</code> logging keeps working. If races
          aren't showing up here, double-check your config first.
        </p>
      </section>
    </div>
  </div>
</template>

<script>
import { supabaseUrl, supabaseAnonKey } from '../services/supabase.js'

export default {
  name: 'TelemetryPage',
  data() {
    return {
      supabaseUrl,
      supabaseAnonKey,
      flags: [
        { name: '--pid PID', purpose: 'Required process identifier.' },
        { name: '--interval SECONDS', purpose: 'Polling frequency (default 0.5).' },
        { name: '--json', purpose: 'Output each race as JSON to stdout.' },
        { name: '--log-file PATH', purpose: 'Specify the JSON-lines output file.' },
        { name: '--watch-tuning', purpose: 'Monitor pre-race tuning screen values.' },
        { name: '--debug', purpose: 'Display raw memory addresses.' },
        { name: '--no-api', purpose: 'Disable API posting.' }
      ]
    }
  }
}
</script>
