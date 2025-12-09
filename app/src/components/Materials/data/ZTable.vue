<script setup lang="ts">
import { computed, watch, ref } from 'vue'
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

// 示例数据（与 defaultValue 保持一致）
const EXAMPLE_DATA: TableRow[] = [
  { date: '2016-05-03', name: 'Tom', address: 'No. 189, Grove St, Los Angeles' },
  { date: '2016-05-02', name: 'Tom', address: 'No. 189, Grove St, Los Angeles' },
  { date: '2016-05-04', name: 'Tom', address: 'No. 189, Grove St, Los Angeles' },
]

// 示例 columns（与 defaultValue 保持一致）
const EXAMPLE_COLUMNS: TableColumn[] = [
  { prop: 'date', label: 'Date' },
  { prop: 'name', label: 'Name' },
  { prop: 'address', label: 'Address' },
]

// 双向绑定的 columns
const columns = defineModel<TableColumn[]>('columns')

const props = withDefaults(defineProps<{
  data?: TableRow[]
}>(), {
  data: () => [],
})

// 标记是否是用户手动修改的 columns（用于区分自动生成和手动修改）
const isManuallyModified = ref(false)

// 判断数据是否是示例数据
const isExampleData = (data: TableRow[]): boolean => {
  if (!data || data.length !== EXAMPLE_DATA.length) return false
  return JSON.stringify(data) === JSON.stringify(EXAMPLE_DATA)
}

// 获取数据结构的签名（用于比较数据结构是否变化）
const getDataStructure = (data: TableRow[]): string | null => {
  if (!data || data.length === 0) return null
  return Object.keys(data[0]).sort().join(',')
}

// 从 data 的第一行生成列配置
const generateColumnsFromData = (data: TableRow[]): TableColumn[] => {
  if (!data || data.length === 0) return []

  const firstRow = data[0]
  return Object.keys(firstRow).map(key => ({
    prop: key,
    label: key.charAt(0).toUpperCase() + key.slice(1), // 首字母大写
  }))
}

// 使用传入的 columns，或者自动生成的 columns
const computedColumns = computed(() => {
  // 如果有 columns 值，直接使用
  if (columns.value && columns.value.length > 0) {
    return columns.value
  }

  // 如果是示例数据，返回示例 columns
  if (isExampleData(props.data)) {
    return EXAMPLE_COLUMNS
  }

  // 否则自动从 data 生成
  return generateColumnsFromData(props.data)
})

// 监听 columns 的变化，标记是否手动修改
watch(
  () => columns.value,
  (newVal, oldVal) => {
    // 如果 columns 从无到有，或者发生了变化，标记为手动修改
    if (newVal && oldVal && JSON.stringify(newVal) !== JSON.stringify(oldVal)) {
      isManuallyModified.value = true
    }
  }
)

// 监听 data 的变化，智能更新 columns
watch(
  () => ({
    data: props.data,
    structure: getDataStructure(props.data),
    isExample: isExampleData(props.data)
  }),
  (newVal, oldVal) => {
    console.log("🚀 ~ newVal, oldVal:", newVal, oldVal)
    // 如果用户已经手动修改了 columns，不再自动更新
    if (isManuallyModified.value) {
      return
    }

    // 场景 1: 数据变成示例数据，重置为示例 columns
    if (newVal.isExample) {
      columns.value = EXAMPLE_COLUMNS
      isManuallyModified.value = false // 重置手动修改标记
      return
    }

    // 场景 2: 数据结构发生变化（不是示例数据），重新生成 columns
    if (oldVal && newVal.structure !== oldVal.structure && !newVal.isExample) {
      columns.value = generateColumnsFromData(newVal.data)
      console.log("🚀 ~ columns.value:", columns.value)
      isManuallyModified.value = false // 重置手动修改标记
      return
    }

    // 场景 3: 首次加载或数据从空变为有数据
    if (!oldVal && newVal.data && newVal.data.length > 0) {
      if (newVal.isExample) {
        columns.value = EXAMPLE_COLUMNS
      } else {
        columns.value = generateColumnsFromData(newVal.data)
      }
      isManuallyModified.value = false
    }
  },
  {
    immediate: true,
    deep: true
  }
)

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
