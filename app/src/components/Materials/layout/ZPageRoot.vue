<template>
  <div  class="page-root min-h-full border border-dashed">
    <slot></slot>
  </div>
</template>
<script setup lang="ts">
defineOptions({
  name: 'ZPageRoot'
})
</script>