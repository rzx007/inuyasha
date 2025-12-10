<script setup lang="ts">
import { ElRow, ElCol } from 'element-plus'

export interface ColItem {
  span: number
  offset?: number
  push?: number
  pull?: number
  xs?: number | object
  sm?: number | object
  md?: number | object
  lg?: number | object
  xl?: number | object
  [key: string]: any
}

export interface Props {
  items?: ColItem[]
  gutter?: number
  justify?: 'start' | 'end' | 'center' | 'space-around' | 'space-between' | 'space-evenly'
  align?: 'top' | 'middle' | 'bottom'
}

defineOptions({
  name: 'ZRow'
})

const props = withDefaults(defineProps<Props>(), {
  items: () => [],
  gutter: 0,
  justify: 'start'
})
</script>

<template>
  <el-row v-bind="$attrs" :gutter="gutter" :justify="justify" :align="align">
    <el-col v-for="(col, index) in items" :key="index" v-bind="col">
      <slot :name="col.name">
        <div class="w-full bg-slate-200 h-80"></div>
      </slot>
    </el-col>
  </el-row>
</template>
