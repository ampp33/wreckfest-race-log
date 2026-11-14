<template>
  <span
    class="w-3 h-3 shrink-0 text-brand-accent dark:text-brand-accent-dark"
    :title="`Online Race: ${plainName}`"
    v-html="globeIcon"
  ></span>
</template>

<script>
import { stripWreckfestColors } from '../utils/wreckfestColors.js'
import globeIcon from '../assets/icons/globe.svg?raw'

// Globe marking a race as run online; hovering shows the server name with
// its Wreckfest color codes stripped.
export default {
  name: 'OnlineRaceIcon',
  props: {
    // Raw server name, with Wreckfest ^N color codes still in it.
    serverName: { type: String, required: true }
  },
  data() {
    return { globeIcon }
  },
  computed: {
    plainName() {
      return stripWreckfestColors(this.serverName)
    }
  }
}
</script>
