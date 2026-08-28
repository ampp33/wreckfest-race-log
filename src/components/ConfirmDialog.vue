<template>
  <div
    v-if="open"
    class="fixed inset-0 z-40 flex items-start sm:items-center justify-center bg-black/70 backdrop-blur-sm p-2 sm:p-4 overflow-hidden"
    @mousedown.self="onCancel"
    @keydown.esc.stop="onCancel"
  >
    <div
      class="bg-brand-bg dark:bg-brand-surface-dark rounded-lg shadow-xl w-full max-w-sm p-4 sm:p-6 border border-brand-border dark:border-brand-border-dark"
      role="alertdialog"
      aria-modal="true"
      :aria-labelledby="titleId"
      :aria-describedby="message ? descId : undefined"
    >
      <h2 :id="titleId" class="font-display font-black tracking-tighter leading-none text-display-sm text-brand-text dark:text-brand-text-dark mb-2">
        {{ title }}
      </h2>
      <p v-if="message" :id="descId" class="font-body text-[15px] leading-relaxed text-brand-secondary dark:text-brand-secondary-dark mb-5">
        {{ message }}
      </p>

      <div class="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-4">
        <button
          ref="cancelBtn"
          type="button"
          class="w-full sm:w-auto px-4 py-2 rounded border border-brand-border dark:border-brand-border-dark text-brand-text dark:text-brand-text-dark hover:bg-brand-surface dark:hover:bg-brand-surface-dark"
          @click="onCancel"
        >
          {{ cancelLabel }}
        </button>
        <button
          type="button"
          class="w-full sm:w-auto px-4 py-2 rounded text-white"
          :class="danger ? 'bg-red-600 hover:bg-red-700' : 'bg-brand-accent hover:opacity-90'"
          @click="onConfirm"
        >
          {{ confirmLabel }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
let idSeq = 0

export default {
  name: 'ConfirmDialog',
  props: {
    open: { type: Boolean, default: false },
    title: { type: String, default: 'Are you sure?' },
    message: { type: String, default: '' },
    confirmLabel: { type: String, default: 'Delete' },
    cancelLabel: { type: String, default: 'Cancel' },
    danger: { type: Boolean, default: true }
  },
  emits: ['confirm', 'cancel'],
  data() {
    idSeq += 1
    return {
      instanceId: idSeq
    }
  },
  computed: {
    titleId() {
      return `confirm-dialog-title-${this.instanceId}`
    },
    descId() {
      return `confirm-dialog-desc-${this.instanceId}`
    }
  },
  watch: {
    open(isOpen) {
      if (isOpen) {
        this.$nextTick(() => this.$refs.cancelBtn && this.$refs.cancelBtn.focus())
      }
    }
  },
  methods: {
    onConfirm() {
      this.$emit('confirm')
    },
    onCancel() {
      this.$emit('cancel')
    }
  }
}
</script>
