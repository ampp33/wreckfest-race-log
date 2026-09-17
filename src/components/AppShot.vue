<!-- A screenshot of the real app, in the reader's own theme.

     Each shot was captured twice (see public/images/getting-started/) —
     once on the light ground, once on the dark one — because a light-mode
     screenshot dropped onto the dark page reads as a hole punched through
     it, and vice versa. Both <img>s are in the markup and CSS picks one, so
     toggling the theme swaps the shot with no JS and no reflow.

     Both are `loading="lazy"`: the hidden one still counts as a layout-
     invisible image, so the browser skips fetching it until it's near the
     viewport, and the wrong-theme copy is never decoded at all.

     `force` opts out of that pairing for the one case it gets wrong: a
     section that is a fixed black (or red) slab in BOTH themes, where the
     page's own theme no longer predicts what the screenshot is sitting on.
     There, pass force="dark" and the dark capture is used regardless. -->
<template>
  <figure class="m-0">
    <template v-if="force">
      <img
        :src="src(force)"
        :alt="alt"
        :class="['block w-full h-auto', imgClass]"
        loading="lazy"
        decoding="async"
      />
    </template>
    <template v-else>
      <img
        :src="src('light')"
        :alt="alt"
        :class="['block w-full h-auto dark:hidden', imgClass]"
        loading="lazy"
        decoding="async"
      />
      <img
        :src="src('dark')"
        :alt="alt"
        :class="['hidden w-full h-auto dark:block', imgClass]"
        loading="lazy"
        decoding="async"
      />
    </template>
    <figcaption v-if="caption" :class="captionClass">
      <slot name="caption">{{ caption }}</slot>
    </figcaption>
  </figure>
</template>

<script>
import { resolveImageUrl } from '../utils/imageUrl.js'

export default {
  name: 'AppShot',
  props: {
    // File stem under public/images/getting-started, e.g. "track-map-edit".
    name: { type: String, required: true },
    alt: { type: String, required: true },
    caption: { type: String, default: '' },
    // '' (default) follows the page theme; 'light'/'dark' pins one capture,
    // for sections whose ground doesn't change with the theme.
    force: { type: String, default: '' },
    // Per-shot framing (border, shadow, rounding, cropping) — the component
    // itself stays unopinionated about how a shot is framed.
    imgClass: { type: String, default: 'border border-brand-border dark:border-brand-border-dark' },
    captionClass: { type: String, default: 'ov text-brand-muted dark:text-brand-muted-dark mt-2' }
  },
  methods: {
    src(theme) {
      return resolveImageUrl(`images/getting-started/${this.name}.${theme}.webp`)
    }
  }
}
</script>
