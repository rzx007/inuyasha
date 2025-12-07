<template>
  <ElButton  v-bind="$attrs">
    {{ text }}
  </ElButton>
</template>

<script setup lang="ts">
  defineOptions({
    name: 'ZButton',
  })
  const props = defineProps<{
    text: string
  }>()

</script>
