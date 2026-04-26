<template>
  <tr class="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-gray-900">
    <td colspan="9" class="py-3">
      <RaceForm
        :vehicles="vehicles"
        :defaults="defaults"
        :saving="saving"
        :autofocus="true"
        @submit="onSubmit"
        @cancel="$emit('cancel')"
      />
    </td>
  </tr>
</template>

<script>
import RaceForm from './RaceForm.vue'

export default {
  name: 'InlineAddRaceRow',
  components: { RaceForm },
  props: {
    vehicles: { type: Array, required: true },
    defaults: { type: Object, default: () => ({}) },
    saving: { type: Boolean, default: false }
  },
  emits: ['submit', 'cancel'],
  methods: {
    onSubmit(payload) {
      this.$emit('submit', payload)
    }
  }
}
</script>
