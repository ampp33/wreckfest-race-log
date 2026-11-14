<template>
  <!-- Whose races, at a glance: a globe for everyone, a person for you,
       another driver's first letter. Sized and coloured by the parent. -->
  <span v-if="kind === 'everyone'" class="inline-block" :class="iconClass" v-html="globeIcon"></span>
  <span v-else-if="kind === 'you'" class="inline-block" :class="iconClass" v-html="personIcon"></span>
  <span v-else class="font-black leading-none">{{ initial }}</span>
</template>

<script>
import globeIcon from '../assets/icons/globe.svg?raw'
import personIcon from '../assets/icons/person.svg?raw'

export default {
  name: 'ScopeIcon',
  props: {
    // 'everyone' | 'you' | 'driver'
    kind: { type: String, required: true },
    // The driver's display name, for their initial.
    name: { type: String, default: '' },
    iconClass: { type: String, default: 'w-5 h-5' }
  },
  data() {
    return { globeIcon, personIcon }
  },
  computed: {
    initial() {
      return (this.name || '?').trim().charAt(0).toUpperCase() || '?'
    }
  }
}
</script>
