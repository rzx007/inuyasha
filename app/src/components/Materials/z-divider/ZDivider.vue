<script setup lang="ts">
defineOptions({
  name: 'ZDivider',
})
defineProps<{
  direction?: 'horizontal' | 'vertical'
  label?: string
  contentPosition?: 'left' | 'center' | 'right'
  borderStyle?: 'dashed' | 'dotted' | 'solid'
}>()
</script>

<template>
  <ElDivider
    v-bind="$attrs"
    :direction="direction"
    :content-position="contentPosition"
    :border-style="borderStyle"
  >
    <template #default>
      <span v-if="label">{{ label }}</span>
    </template>
  </ElDivider>
</template>