// Clips a scrolling container just past a target row's real rendered bottom
// edge — measured from the DOM, not a guessed pixel height, so it holds
// whatever the fonts or an expanded row do to the layout.
//
// A component using it implements fadeElements() → [container, target]
// (target null skips measuring), and may set a `fadeBuffer` option: extra
// room past the target, as a fraction of its height, so the fade resolves
// before the hard clip edge.
export const measuredFade = {
  data() {
    return { fadeHeight: null, gradientHeight: null }
  },
  mounted() {
    this.measureFade()
    window.addEventListener('resize', this.measureFade)
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.measureFade)
  },
  methods: {
    measureFade() {
      const [container, target] = this.fadeElements()
      if (!container || !target) return
      const containerTop = container.getBoundingClientRect().top
      const rect = target.getBoundingClientRect()
      const buffer = Math.round(rect.height * (this.$options.fadeBuffer || 0))
      this.fadeHeight = Math.ceil(rect.bottom - containerTop + buffer)
      this.gradientHeight = Math.ceil(rect.height + buffer)
    }
  }
}
