<script setup lang="ts">
import { ElTabs, ElTabPane } from 'element-plus'

export interface TabItem {
  name: string
  title: string
  [key: string]: any
}

export interface Props {
  items?: TabItem[]
}

const props = withDefaults(defineProps<Props>(), {
  items: () => []
})
</script>

<template>
  <el-tabs v-bind="$attrs">
    <el-tab-pane v-for="item in items" :key="item.name" v-bind="item" :label="item.title">
      <slot :name="item.name"></slot>
    </el-tab-pane>
  </el-tabs>
</template>
