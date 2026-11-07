<template>
  <div>
    <div class="ov text-brand-accent dark:text-brand-accent-dark">{{ label }}</div>
    <div :class="valueClass"><slot /></div>
  </div>
</template>

<script>
// One labelled value in a mobile race card's grid.
export default {
  name: 'CardField',
  props: {
    label: { type: String, required: true },
    valueClass: { type: [String, Array, Object], default: null }
  }
}
</script>
