<template>
  <div>
    <label class="block text-xs uppercase tracking-wide text-slate-500 mb-1">
      Track / variation
    </label>
    <input
      ref="searchInput"
      v-model="query"
      type="text"
      class="w-full rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-gray-700 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
      placeholder="Type to search tracks..."
      autocomplete="off"
      @keydown.down.prevent="moveSelection(1)"
      @keydown.up.prevent="moveSelection(-1)"
      @keydown.enter.prevent="confirmSelection"
    />

    <ul
      ref="listEl"
      v-if="filtered.length"
      class="mt-2 max-h-56 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded divide-y divide-slate-100 dark:divide-slate-700"
    >
      <li
        v-for="(item, idx) in filtered"
        :key="item.variation.id"
        class="px-3 py-2 cursor-pointer text-sm flex items-center gap-3"
        :class="idx === highlightedIndex
          ? 'bg-brand text-white'
          : 'hover:bg-slate-100 dark:hover:bg-slate-700'"
        @mousedown.prevent="selectItem(item)"
      >
        <img
          :src="variationImageUrl(item.track.slug, item.variation.slug)"
          :alt="item.variation.name"
          class="w-12 h-9 object-contain bg-black rounded shrink-0"
          loading="lazy"
        />
        <div class="flex-1 min-w-0 flex justify-between items-center gap-2">
          <span class="truncate">{{ item.track.name }}</span>
          <span class="text-xs opacity-75 shrink-0">{{ item.variation.name }}</span>
        </div>
      </li>
    </ul>

    <p v-else-if="query" class="mt-2 text-xs text-slate-500">
      No matches.
    </p>
  </div>
</template>

<script>
import { variationImageUrl } from '../utils/imageUrl.js'

export default {
  name: 'TrackVariationPicker',
  props: {
    tracks: { type: Array, required: true },
    autofocus: { type: Boolean, default: true }
  },
  emits: ['select'],
  data() {
    return {
      query: '',
      highlightedIndex: 0
    }
  },
  computed: {
    flattened() {
      const out = []
      for (const track of this.tracks) {
        for (const variation of track.track_variations || []) {
          out.push({ track, variation })
        }
      }
      return out
    },
    filtered() {
      const q = this.query.trim().toLowerCase()
      if (!q) return this.flattened.slice(0, 8)
      return this.flattened
        .filter(item => {
          const label = `${item.track.name} ${item.variation.name}`.toLowerCase()
          return label.includes(q)
        })
        .slice(0, 12)
    }
  },
  watch: {
    filtered() {
      this.highlightedIndex = 0
    }
  },
  mounted() {
    if (this.autofocus) this.focus()
  },
  methods: {
    variationImageUrl,
    focus() {
      this.$nextTick(() => this.$refs.searchInput && this.$refs.searchInput.focus())
    },
    moveSelection(delta) {
      if (!this.filtered.length) return
      const next = this.highlightedIndex + delta
      const max = this.filtered.length - 1
      if (next < 0) this.highlightedIndex = max
      else if (next > max) this.highlightedIndex = 0
      else this.highlightedIndex = next
      this.$nextTick(() => {
        const list = this.$refs.listEl
        if (!list) return
        const item = list.children[this.highlightedIndex]
        if (item) item.scrollIntoView({ block: 'nearest' })
      })
    },
    confirmSelection() {
      const item = this.filtered[this.highlightedIndex]
      if (item) this.selectItem(item)
    },
    selectItem(item) {
      this.$emit('select', item)
    }
  }
}
</script>
