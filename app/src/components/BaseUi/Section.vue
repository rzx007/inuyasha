<script setup lang="ts">
import { Plus, Palette } from 'lucide-vue-next';

defineProps<{
  title: string;
}>();
</script>

<template>
  <div class="flex flex-col gap-2 group">
    <div class="flex items-center justify-between text-xs font-semibold text-foreground cursor-pointer hover:text-foreground/80">
      <span>{{ title }}</span>
      <div class="flex gap-2">
        <Palette :size="14" class="text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        <Plus :size="14" class="text-muted-foreground hover:text-foreground" />
      </div>
    </div>
  </div>
</template>
