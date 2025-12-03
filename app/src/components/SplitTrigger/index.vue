<script setup lang="ts">
defineOptions({ name: 'SplitTrigger' })

const props = defineProps<{
  direction?: 'horizontal' | 'vertical'
}>()
</script>

<template>
  <div
    :class="[
      'bg-transparent hover:bg-primary ',
      props.direction === 'horizontal' ? 'h-1 cursor-row-resize' : 'w-1 cursor-col-resize',
    ]"
    :bind="$attrs"
  />
</template>

<style lang="scss" scoped></style>
