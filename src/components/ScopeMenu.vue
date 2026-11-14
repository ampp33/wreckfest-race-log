<template>
  <!-- "Whose races?" — the scope picker's list: everyone, you, the drivers
       you looked at lately, and a search for anyone else. The same list
       renders as the red mobile drop-down and the dark desktop dropdown. -->
  <div :class="variant === 'red' ? 'text-white' : 'text-brand-text-dark'">
    <div class="ov pt-3 pb-2" :class="mutedClass">Whose races</div>
    <button
      v-for="row in mainRows"
      :key="row.key"
      type="button"
      class="w-full min-h-[48px] flex items-center gap-3 text-left text-[15px]"
      :class="[rowClass, isCurrent(row.scope) ? 'font-bold' : 'font-medium']"
      @click="$emit('pick', row.scope)"
    >
      <span class="w-8 h-8 shrink-0 flex items-center justify-center" :class="badgeClass(row.scope)">
        <ScopeIcon :kind="row.scope.kind" :name="row.name" icon-class="w-4 h-4" />
      </span>
      <span class="flex-1 min-w-0 truncate">{{ row.label }}</span>
      <span class="w-4 text-center font-black" :class="checkClass">{{ isCurrent(row.scope) ? '✓' : '' }}</span>
    </button>

    <template v-if="recentRows.length">
      <div class="ov pt-4 pb-2" :class="mutedClass">Recently viewed</div>
      <button
        v-for="row in recentRows"
        :key="row.key"
        type="button"
        class="w-full min-h-[48px] flex items-center gap-3 text-left text-[15px]"
        :class="[rowClass, isCurrent(row.scope) ? 'font-bold' : 'font-medium']"
        @click="$emit('pick', row.scope)"
      >
        <span class="w-8 h-8 shrink-0 flex items-center justify-center text-[14px]" :class="badgeClass(row.scope)">
          <ScopeIcon kind="driver" :name="row.name" />
        </span>
        <span class="flex-1 min-w-0 truncate">{{ row.label }}</span>
        <span class="w-4 text-center font-black" :class="checkClass">{{ isCurrent(row.scope) ? '✓' : '' }}</span>
      </button>
    </template>

    <label class="mt-3 flex items-center gap-2.5 min-h-[44px] px-3" :class="inputWrapClass">
      <span class="w-4 h-4 inline-block shrink-0 opacity-80" v-html="searchIcon"></span>
      <input
        v-model="query"
        type="search"
        placeholder="Find a driver"
        aria-label="Find a driver"
        class="flex-1 min-w-0 h-10 bg-transparent border-0 text-[15px] focus:outline-none"
        :class="variant === 'red' ? 'placeholder:text-white/70' : 'placeholder:text-brand-muted-dark'"
      />
    </label>
    <div v-if="query.trim().length >= 2" class="pt-1">
      <p v-if="searching && !results.length" class="py-3 text-[13px]" :class="mutedClass">Searching…</p>
      <p v-else-if="!results.length" class="py-3 text-[13px]" :class="mutedClass">No public drivers match “{{ query.trim() }}”.</p>
      <button
        v-for="row in resultRows"
        :key="row.key"
        type="button"
        class="w-full min-h-[48px] flex items-center gap-3 text-left text-[15px] font-medium"
        :class="rowClass"
        @click="$emit('pick', row.scope)"
      >
        <span class="w-8 h-8 shrink-0 flex items-center justify-center text-[14px]" :class="badgeClass(row.scope)">
          <ScopeIcon :kind="row.scope.kind" :name="row.name" icon-class="w-4 h-4" />
        </span>
        <span class="flex-1 min-w-0 truncate">{{ row.label }}</span>
      </button>
    </div>
  </div>
</template>

<script>
import ScopeIcon from './ScopeIcon.vue'
import { searchProfiles } from '../services/profileService.js'
import { sameScope } from '../utils/scope.js'
import { debounce } from '../utils/debounce.js'
import searchIcon from '../assets/icons/search.svg?raw'

export default {
  name: 'ScopeMenu',
  components: { ScopeIcon },
  props: {
    // 'red' (the mobile drop-down slab) or 'dark' (the desktop dropdown).
    variant: { type: String, default: 'red' },
    // The scope being shown now, to tick.
    current: { type: Object, default: null },
    myId: { type: String, default: null },
    // Your display name; null when signed out, which hides the "You" row.
    myName: { type: String, default: null },
    // [{ id, name }] from recentDriversStore.
    recent: { type: Array, default: () => [] }
  },
  emits: ['pick'],
  data() {
    return {
      searchIcon,
      query: '',
      results: [],
      searching: false
    }
  },
  computed: {
    mainRows() {
      const rows = [{ key: 'everyone', label: 'Everyone', scope: { kind: 'everyone' } }]
      if (this.myName) rows.push({ key: 'you', label: `You · ${this.myName}`, scope: { kind: 'you' } })
      return rows
    },
    recentRows() {
      return this.recent
        .filter(d => d.id !== this.myId)
        .map(d => ({ key: d.id, label: d.name, name: d.name, scope: { kind: 'driver', userId: d.id } }))
    },
    resultRows() {
      return this.results.map(p => {
        const isMe = p.user_id === this.myId
        return {
          key: p.user_id,
          label: isMe ? `You · ${p.display_name}` : p.display_name,
          name: p.display_name,
          scope: isMe ? { kind: 'you' } : { kind: 'driver', userId: p.user_id }
        }
      })
    },
    mutedClass() {
      return this.variant === 'red' ? 'text-white/70' : 'text-brand-muted-dark'
    },
    rowClass() {
      return this.variant === 'red'
        ? 'border-b border-white/20'
        : 'px-2 -mx-2 hover:bg-brand-border-dark'
    },
    checkClass() {
      return this.variant === 'red' ? 'text-white' : 'text-brand-accent-dark'
    },
    inputWrapClass() {
      return this.variant === 'red' ? 'bg-white/15 text-white' : 'bg-brand-border-dark text-brand-text-dark'
    }
  },
  watch: {
    query(value) {
      if (value.trim().length < 2) {
        this.results = []
        return
      }
      this.searching = true
      this.runSearch(value)
    }
  },
  created() {
    this.runSearch = debounce(async query => {
      try {
        const results = await searchProfiles(query)
        // Ignore an answer for a query that has since been retyped.
        if (query === this.query) this.results = results
      } catch {
        if (query === this.query) this.results = []
      } finally {
        if (query === this.query) this.searching = false
      }
    }, 250)
  },
  methods: {
    isCurrent(scope) {
      return sameScope(scope, this.current)
    },
    badgeClass(scope) {
      if (this.variant === 'red') {
        return scope.kind === 'driver' ? 'bg-white text-brand-accent' : 'bg-white/15'
      }
      if (scope.kind === 'everyone') return 'bg-brand-accent dark:bg-brand-accent-dark text-white'
      if (scope.kind === 'you') return 'bg-brand-text-dark text-brand-text'
      return 'border border-brand-muted text-brand-text-dark'
    }
  }
}
</script>
