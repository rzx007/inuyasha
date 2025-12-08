<script setup lang="ts">
import { ElSelect, ElOption } from 'element-plus'

type OptionItem = {
  label: string
  value: string | number
  disabled?: boolean
}

const props = defineProps<{
  options: OptionItem[]
}>()
</script>

<template>
  <ElSelect v-bind="$attrs" class="w-full">
    <ElOption
      v-for="opt in options"
      :key="opt.value"
      :label="opt.label"
      :value="opt.value"
      :disabled="opt.disabled"
    />
  </ElSelect>
</template>
