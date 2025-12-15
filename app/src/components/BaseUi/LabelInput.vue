<script setup lang="ts">
import { ChevronDown } from 'lucide-vue-next';

defineProps<{
  label?: string;
  value?: string;
  suffix?: string;
  dropdown?: boolean;
  labelClass?: string;
}>();
</script>

<template>
  <div class="relative group flex items-center bg-secondary/50 rounded-sm hover:ring-1 hover:ring-border transition-all">
    <span :class="['absolute left-2 text-muted-foreground pointer-events-none text-[10px] flex items-center justify-center w-4', labelClass]">
      <slot name="label">{{ label }}</slot>
    </span>
    <input 
      type="text" 
      :value="value"
      class="w-full bg-transparent border-none outline-none py-1.5 pl-7 pr-6 text-right text-foreground placeholder-muted-foreground font-mono text-xs focus:bg-background focus:ring-1 focus:ring-blue-500 rounded-sm"
    />
    <span v-if="dropdown" class="absolute right-1 text-muted-foreground pointer-events-none">
      <ChevronDown :size="10" />
    </span>
    <span v-else-if="suffix" class="absolute right-2 text-muted-foreground pointer-events-none text-[10px]">{{ suffix }}</span>
  </div>
</template>
