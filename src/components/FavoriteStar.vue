<template>
  <button
    type="button"
    class="flex items-center justify-center"
    :class="[compact ? 'w-5 h-8' : 'min-h-[44px] min-w-[44px]', active
      ? 'text-brand-accent dark:text-brand-accent-dark'
      : 'text-brand-muted dark:text-brand-muted-dark hover:text-brand-accent dark:hover:text-brand-accent-dark']"
    :title="active ? 'Remove from favorites' : 'Add to favorites'"
    :aria-label="active ? 'Remove from favorites' : 'Add to favorites'"
    :aria-pressed="active"
    @click.stop="toggleFavorite(raceId)"
  >
    <span class="w-4 h-4 inline-block" v-html="active ? starFillIcon : starIcon"></span>
  </button>
</template>

<script>
import { isFavorite, toggleFavorite } from '../stores/favoritesStore.js'
import starIcon from '../assets/icons/star.svg?raw'
import starFillIcon from '../assets/icons/star-fill.svg?raw'

// A race's favorite toggle, for whoever's signed in — callers only render it
// then, since there's nobody to save a favorite for otherwise.
export default {
  name: 'FavoriteStar',
  props: {
    raceId: { type: String, required: true },
    // Just the icon's width, for the tables' leading star column — the
    // row's height comes from the action buttons anyway.
    compact: { type: Boolean, default: false }
  },
  data() {
    return { starIcon, starFillIcon }
  },
  computed: {
    active() {
      return isFavorite(this.raceId)
    }
  },
  methods: { toggleFavorite }
}
</script>
