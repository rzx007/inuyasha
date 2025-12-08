<script setup lang="ts">
import { ElSelect, ElOption } from 'element-plus'

type OptionItem = {
  label: string
  value: string | number
  disabled?: boolean
}

const props = defineProps<{
  options: OptionItem[]
  label: string
}>()
</script>

<template>
  <div class="flex items-center gap-2">
    <span class="text-sm text-gray-500  whitespace-nowrap">{{ label }}</span>
    <ElSelect v-bind="$attrs" class="w-full">
      <ElOption
        v-for="opt in options"
        :key="opt.value"
        :label="opt.label"
        :value="opt.value"
        :disabled="opt.disabled"
      />
    </ElSelect>
  </div>
</template>
