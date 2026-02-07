<script setup lang="ts">
defineProps<{
  active?: boolean;
}>()

const emit = defineEmits(['click'])
</script>

<template>
  <button 
    :class="[
      'flex items-center justify-center p-1.5 rounded-sm transition-colors',
      active ? 'bg-secondary text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
    ]"
    @click="emit('click')"
  >
    <slot />
  </button>
</template>
