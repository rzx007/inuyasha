<script setup lang="ts">
import { computed, onMounted } from 'vue'
import type { ComponentSchema } from '@/types/component'
import { ComponentType } from '@/types/component'
import { useComponentStore } from '@/stores/component'
import {
  ElButton,
  ElCard,
  ElImage,
  ElDivider,
  ElStatistic,
  ElTable,
  ElTableColumn,
  ElFormItem,
  ElInput,
  ElSelect,
  ElOption,
  ElDatePicker,
  ElRow,
  ElCol,
  ElCollapse,
  ElCollapseItem,
  ElTabs,
  ElTabPane,
} from 'element-plus'
import ChartRenderer from './widgets/ChartRenderer.vue'
import { resolveBinding } from '@/utils/expressionEngine'
import { executeEvent } from '@/utils/eventEngine'
import { useFormStateStore } from '@/stores/formState'

interface Props {
  schema: ComponentSchema
}
const props = defineProps<Props>()
const componentStore = useComponentStore()
const formStateStore = useFormStateStore()

// 在组件挂载时初始化 defaultModelValue
onMounted(() => {
  const componentMeta = componentStore.getComponentMeta(props.schema.type)
  if (componentMeta?.defaultModelValue) {
    // 为每个 defaultModelValue 中的 key 初始化值（如果还没有值的话）
    Object.entries(componentMeta.defaultModelValue).forEach(([key, defaultValue]) => {
      const existingValue = formStateStore.getComponentState(props.schema.id, key)
      if (existingValue === undefined) {
        formStateStore.setComponentState(props.schema.id, key, defaultValue)
      }
    })
  }
})

const resolvedProps = computed(() => {
  const newProps = { ...props.schema.props }
  for (const key in newProps) {
    const bindingKey = `${key}_binding`
    if (newProps[bindingKey]) {
      const resolvedValue = resolveBinding(newProps[bindingKey])
      if (resolvedValue !== undefined) {
        newProps[key] = resolvedValue
      }
    }
  }
  return newProps
})

// Create a computed version of the style that resolves any style bindings
const resolvedStyle = computed(() => {
  const newStyle = { ...props.schema.style }
  const propsObj = props.schema.props

  // 查找 style.xxx_binding 格式的绑定
  for (const key in propsObj) {
    if (key.startsWith('style.') && key.endsWith('_binding')) {
      // 提取样式属性名，例如 'style.width_binding' -> 'width'
      const styleKey = key.substring(6, key.length - 8)
      const binding = propsObj[key]
      const resolvedValue = resolveBinding(binding)
      if (resolvedValue !== undefined) {
        newStyle[styleKey] = resolvedValue
      }
    }
  }
  return newStyle
})

// 表单组件的双向绑定值（默认使用 'value' 作为 key）
const formValue = computed({
  get: () => formStateStore.getComponentState(props.schema.id, 'value'),
  set: (value) => {
    formStateStore.setComponentState(props.schema.id, 'value', value)
  },
})

function handleButtonClick() {
  const events = props.schema.events || []
  const onClickEvent = events.find(e => e.trigger === 'onClick')
  if (onClickEvent) {
    executeEvent(onClickEvent)
  }
}

const styleObject = computed(() => resolvedStyle.value)

// 辅助函数：获取指定插槽的子组件
function getSlotChildren(slotName: string) {
  return props.schema.children?.filter(child => child.props?._slot === slotName) || []
}
</script>

<template>
  <!-- 容器组件 -->
  <div v-if="schema.type === ComponentType.Container" :style="styleObject">
    <PreviewRenderer
      v-for="child in schema.children"
      :key="child.id"
      :schema="child"
    />
  </div>

  <!-- 卡片组件 -->
  <ElCard
    v-else-if="schema.type === ComponentType.Card"
    :shadow="resolvedProps.shadow || 'always'"
    :style="styleObject"
  >
    <template #header>
      <span>{{ resolvedProps.title || '卡片标题' }}</span>
    </template>
    <PreviewRenderer
      v-for="child in schema.children"
      :key="child.id"
      :schema="child"
    />
  </ElCard>

  <!-- 栅格行 -->
  <ElRow
    v-else-if="schema.type === ComponentType.Row"
    :gutter="resolvedProps.gutter || 0"
    :style="styleObject"
  >
    <PreviewRenderer
      v-for="child in schema.children"
      :key="child.id"
      :schema="child"
    />
  </ElRow>

  <!-- 栅格列 -->
  <ElCol
    v-else-if="schema.type === ComponentType.Col"
    :span="resolvedProps.span || 12"
    :style="styleObject"
  >
    <PreviewRenderer
      v-for="child in schema.children"
      :key="child.id"
      :schema="child"
    />
  </ElCol>

  <!-- 折叠面板 -->
  <ElCollapse
    v-else-if="schema.type === ComponentType.Collapse"
    :style="styleObject"
  >
    <ElCollapseItem
      v-for="item in resolvedProps.items || []"
      :key="item.name"
      :title="item.title"
      :name="item.name"
    >
      <PreviewRenderer
        v-for="child in getSlotChildren(item.name)"
        :key="child.id"
        :schema="child"
      />
      <template #footer>
        <div v-if="getSlotChildren(item.name).length === 0" class="empty-placeholder text-center text-gray-400 text-sm py-2">
          将组件拖到此处
        </div>
      </template>
    </ElCollapseItem>
  </ElCollapse>

    <!-- 标签页 -->
    <ElTabs
    v-else-if="schema.type === ComponentType.Tabs"
    :model-value="resolvedProps.activeName"
    :type="resolvedProps.type || 'line'"
    :tab-position="resolvedProps.tabPosition || 'top'"
    :closable="resolvedProps.closable || false"
    :addable="resolvedProps.addable || false"
    :editable="resolvedProps.editable || false"
    :style="styleObject"
  >
    <ElTabPane
      v-for="item in resolvedProps.items || []"
      :key="item.name"
      :label="item.title"
      :name="item.name"
    >
      <div class="min-h-[50px] p-1">
        <PreviewRenderer
          v-for="child in getSlotChildren(item.name)"
          :key="child.id"
          :schema="child"
        />
        <div v-if="getSlotChildren(item.name).length === 0" class="empty-placeholder text-center text-gray-400 text-sm py-2">
          暂无内容
        </div>
      </div>
    </ElTabPane>
  </ElTabs>


  <!-- 文本组件 -->
  <div v-else-if="schema.type === ComponentType.Text" :style="styleObject">
    {{ resolvedProps.content || '文本内容' }}
  </div>

  <!-- 按钮组件 -->
  <el-button
    v-else-if="schema.type === ComponentType.Button"
    :type="resolvedProps.type || 'primary'"
    :style="styleObject"
    @click="handleButtonClick"
  >
    {{ resolvedProps.text || '按钮' }}
  </el-button>

  <!-- 图片组件 -->
  <ElImage
    v-else-if="schema.type === ComponentType.Image"
    :src="resolvedProps.src"
    :alt="resolvedProps.alt || '图片'"
    :style="styleObject"
    fit="contain"
  />

  <!-- 分割线组件 -->
  <ElDivider
    v-else-if="schema.type === ComponentType.Divider"
    :direction="schema.props.direction || 'horizontal'"
    :style="styleObject"
  />

  <!-- 统计数值组件 -->
  <ElStatistic
    v-else-if="schema.type === ComponentType.Statistic"
    :title="resolvedProps.title || 'Title'"
    :value="resolvedProps.value || 0"
    :style="styleObject"
  />

  <!-- 列表组件 -->
  <ElCard
    v-else-if="schema.type === ComponentType.List"
    :style="styleObject"
    class="component-list"
  >
    <template #header>
      <span>{{ resolvedProps.header }}</span>
    </template>
    <div
      v-for="(item, index) in resolvedProps.items"
      :key="index"
      class="list-item py-2 px-4"
      :class="{ 'border-b': index < resolvedProps.items.length - 1 }"
    >
      <div class="font-semibold">{{ item.title }}</div>
      <div class="text-sm text-gray-500">{{ item.description }}</div>
    </div>
    <template v-if="resolvedProps.footer" #footer>
      <span>{{ resolvedProps.footer }}</span>
    </template>
  </ElCard>

  <!-- 表格组件 -->
  <ElTable
    v-else-if="schema.type === ComponentType.Table"
    :data="resolvedProps.data || []"
    :style="styleObject"
    border
    stripe
  >
    <ElTableColumn
      v-for="col in resolvedProps.columns"
      :key="col.prop"
      :prop="col.prop"
      :label="col.label"
    />
  </ElTable>

  <!-- 图表组件 -->
  <ChartRenderer
    v-else-if="schema.type === ComponentType.Chart"
    :option="resolvedProps.option || {}"
    :style="styleObject"
  />

  <!-- 表单项容器 -->
  <ElFormItem
    v-else-if="[ComponentType.Input, ComponentType.Select, ComponentType.DatePicker].includes(schema.type)"
    :label="resolvedProps.label"
    :style="styleObject"
  >
    <!-- 输入框 -->
    <ElInput
      v-if="schema.type === ComponentType.Input"
      v-model="formValue"
      :placeholder="resolvedProps.placeholder"
    />
    <!-- 选择器 -->
    <ElSelect
      v-else-if="schema.type === ComponentType.Select"
      v-model="formValue"
      placeholder="Select"
    >
      <ElOption
        v-for="item in resolvedProps.options"
        :key="item.value"
        :label="item.label"
        :value="item.value"
      />
    </ElSelect>
    <!-- 日期选择器 -->
    <ElDatePicker
      v-else-if="schema.type === ComponentType.DatePicker"
      v-model="formValue"
      type="date"
      placeholder="Pick a day"
    />
  </ElFormItem>

  <!-- 未知组件 -->
  <div
    v-else
    :style="styleObject"
    class="p-4 border border-dashed border-red-400 bg-red-50"
  >
    <div class="text-red-500 text-sm">未知组件类型: {{ schema.type }}</div>
  </div>
</template>
