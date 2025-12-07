<script setup lang="ts">
import { ElTabs, ElTabPane } from 'element-plus'

export interface TabItem {
  name: string
  title: string
  [key: string]: any
}

export interface Props {
  items?: TabItem[]
  modelValue?: string
}

const props = withDefaults(defineProps<Props>(), {
  items: () => []
})

const emit = defineEmits(['update:modelValue', 'tab-click', 'tab-change', 'edit'])
</script>

<template>
  <el-tabs
    v-bind="$attrs"
    :model-value="modelValue"
    @update:model-value="val => emit('update:modelValue', val)"
    @tab-click="(...args) => emit('tab-click', ...args)"
    @tab-change="(...args) => emit('tab-change', ...args)"
    @edit="(...args) => emit('edit', ...args)"
  >
    <el-tab-pane
      v-for="item in items"
      :key="item.name"
      v-bind="item"
      :label="item.title"
    >
      <slot :name="item.name"></slot>
    </el-tab-pane>
  </el-tabs>
</template>

