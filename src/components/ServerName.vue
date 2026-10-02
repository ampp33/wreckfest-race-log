<template>
  <!-- Dark chip so every in-game color (white and black included) stays
       legible in both themes, like it is against Wreckfest's own UI. -->
  <span class="inline-block max-w-full rounded px-2 py-1 bg-neutral-900 text-white text-sm font-bold break-words" :title="plainName">
    <span v-for="(seg, i) in segments" :key="i" :style="seg.color ? { color: seg.color } : null">{{ seg.text }}</span>
  </span>
</template>

<script>
import { parseWreckfestColors, stripWreckfestColors } from '../utils/wreckfestColors.js'

// A server name rendered in its Wreckfest ^N colors.
export default {
  name: 'ServerName',
  props: {
    // Raw server name, with Wreckfest ^N color codes still in it.
    name: { type: String, required: true }
  },
  computed: {
    segments() {
      return parseWreckfestColors(this.name)
    },
    plainName() {
      return stripWreckfestColors(this.name)
    }
  }
}
</script>
