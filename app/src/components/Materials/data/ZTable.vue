<script setup lang="ts">
import { computed } from 'vue'
import { ElTable, ElTableColumn } from 'element-plus'

export interface TableColumn {
  prop: string
  label: string
  width?: string | number
  minWidth?: string | number
  fixed?: boolean | 'left' | 'right'
  sortable?: boolean | 'custom'
  resizable?: boolean
  showOverflowTooltip?: boolean
  align?: 'left' | 'center' | 'right'
  headerAlign?: 'left' | 'center' | 'right'
  className?: string
  labelClassName?: string
  [key: string]: any
}

export interface TableRow {
  [key: string]: any
}

export interface Props {
  columns?: TableColumn[]
  data?: TableRow[]
}

const props = withDefaults(defineProps<Props>(), {
  data: () => [],
  columns: () => [],
})
// 自动从 data 解析列配置
const computedColumns = computed(() => {
  // 如果已经定义了 columns，直接使用
  // if (props.columns && props.columns.length > 0) {
  //   return props.columns
  // }
  
  // 否则从 data 的第一项自动解析
  if (props.data && props.data.length > 0) {
    const firstRow = props.data[0]
    return Object.keys(firstRow).map(key => ({
      prop: key,
      label: key.charAt(0).toUpperCase() + key.slice(1), // 首字母大写
    }))
  }
  
  return  props.columns || []
})

</script>

<template>
  <el-table
    v-bind="$attrs"
    :data="data"
  >
    <el-table-column
      v-for="column in computedColumns"
      :key="column.prop"
      v-bind="column"
    />
  </el-table>
</template>
