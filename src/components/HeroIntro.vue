<!-- New top section, added above whatever each of the 8 concepts already
     has. Visually matches the real HomePage.vue hero treatment (the
     cropped, solid-accent-colored giant "W" behind the headline, same
     display-xl/tracking-tightest/outline-ink treatment) — just plain
     explanatory copy this time instead of a marketing hook, per the ask:
     one huge-text section that says what this site actually is before any
     concept's own layout takes over. -->
<template>
  <section class="relative overflow-hidden">
    <!-- Hidden below sm: on a narrow phone this headline wraps to 4 lines
         ("Track every" / "race." / "Master the" / "game."), and the
         watermark's mobile size/position was tuned for a shorter 2-line
         headline — at 4 lines it crosses straight through "race." and
         "Master the", hurting legibility. There's no room to shrink it
         further without it disappearing, so it's dropped at that width
         instead of shipping it half-illegible. -->
    <div
      aria-hidden="true"
      class="hidden sm:block absolute z-0 select-none pointer-events-none font-display font-black leading-[0.8]
             text-brand-accent dark:text-brand-accent-dark
             sm:text-[42vw] sm:-right-[6vw] sm:-top-[3vw]"
    >W</div>

    <div class="relative z-10 max-w-7xl mx-auto px-6 sm:px-10 pt-16 pb-8 sm:pt-16 sm:pb-10">
      <h1 class="font-display font-black tracking-tightest leading-[0.9] text-display-xl text-brand-text dark:text-brand-text-dark">
        Track every race.<br><span class="outline-ink">Sharpen your skills.</span>
      </h1>
      <p class="font-body text-[17px] leading-relaxed text-brand-secondary dark:text-brand-secondary-dark max-w-lg mt-8">
        <b>Wreckfest Race Log</b> is exactly what the name says — it's an online race log and tracking tool for Wreckfest. Track every race automatically with the <router-link to="/plugin" class="font-bold hover:underline">Telemetry plugin</router-link>,
        or manually log them yourself here — then use the site to watch your stats improve, take notes
        track by track, and work toward mastering the game.
      </p>
      <p class="font-body text-[17px] leading-relaxed text-brand-secondary dark:text-brand-secondary-dark max-w-lg mt-4">
        <i>I built this tool because I wanted a pretty and simple way to log my races and take notes, and I hope this tool helps you as much as it's helped me.</i> — Ampp33
      </p>
    </div>
  </section>
</template>

<script>
export default {
  name: 'HeroIntro'
}
</script>
