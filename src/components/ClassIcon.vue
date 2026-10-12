<template>
  <!-- Which car class the nav is filtered to: the class letter, or for every
       class a 2×2 of the four class colours. Sized and coloured by the parent. -->
  <svg
    v-if="!cls"
    class="inline-block"
    :class="iconClass"
    viewBox="0 0 16 16"
    aria-hidden="true"
  >
    <rect v-for="(tile, i) in tiles" :key="tile.letter" :x="(i % 2) * 9" :y="Math.floor(i / 2) * 9" width="7" height="7" :fill="tile.color" />
  </svg>
  <span v-else class="font-display font-black leading-none">{{ cls }}</span>
</template>

<script>
import { CLASS_LETTERS, classLetterColor } from '../utils/piInfo.js'

export default {
  name: 'ClassIcon',
  props: {
    // 'A'..'D', or null for every class.
    cls: { type: String, default: null },
    iconClass: { type: String, default: 'w-4 h-4' }
  },
  computed: {
    // Read left to right, top to bottom, slowest first, like the menu.
    tiles() {
      return CLASS_LETTERS.map(letter => ({ letter, color: classLetterColor(letter) }))
    }
  }
}
</script>
