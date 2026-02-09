<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    direction?: 'row' | 'column' | 'row-reverse' | 'column-reverse'
    justifyContent?:
      | 'flex-start'
      | 'flex-end'
      | 'center'
      | 'space-between'
      | 'space-around'
      | 'space-evenly'
    alignItems?: 'flex-start' | 'flex-end' | 'center' | 'baseline' | 'stretch'
    gap?: number
    flexWrap?: 'nowrap' | 'wrap' | 'wrap-reverse'
  }>(),
  {
    direction: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'nowrap'
  }
)

const containerStyle = computed(() => ({
  display: 'flex',
  flexDirection: props.direction,
  justifyContent: props.justifyContent,
  alignItems: props.alignItems,
  gap: `${props.gap}px`,
  flexWrap: props.flexWrap
}))
</script>

<template>
  <div :style="containerStyle">
    <slot />
  </div>
</template>
