<script setup lang="ts">
import { ElCollapse, ElCollapseItem } from 'element-plus'

export interface CollapseItem {
  name: string
  title: string
  [key: string]: any
}

export interface Props {
  items?: CollapseItem[]
  modelValue?: string | string[]
}

const props = withDefaults(defineProps<Props>(), {
  items: () => []
})

const emit = defineEmits(['update:modelValue', 'change'])
</script>

<template>
  <el-collapse
    v-bind="$attrs"
    :model-value="modelValue"
    @update:model-value="val => emit('update:modelValue', val)"
    @change="(...args) => emit('change', ...args)"
  >
    <el-collapse-item
      v-for="item in items"
      :key="item.name"
      v-bind="item"
    >
      <slot :name="item.name"></slot>
    </el-collapse-item>
  </el-collapse>
</template>

