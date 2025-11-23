<script setup lang="ts">
import { defineAsyncComponent, computed } from 'vue'
import { VueDraggable } from 'vue-draggable-plus'
import { useEditorStore } from '@/stores/editor'
import type { ComponentSchema } from '@/types/component'
import { ComponentType } from '@/types/component'
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
} from 'element-plus'
import ChartRenderer from './widgets/ChartRenderer.vue'
import { resolveBinding } from '@/utils/expressionEngine'
import { executeEvent } from '@/utils/eventEngine'

// 循环引用问题：DynamicRenderer 引用 EditorComponentWrapper，反之亦然
// 使用 defineAsyncComponent 解决
const EditorComponentWrapper = defineAsyncComponent(() => import('@/components/Editor/EditorComponentWrapper.vue'))


interface Props {
  schema: ComponentSchema
}
const props = defineProps<Props>()

const editorStore = useEditorStore()

// Create a computed version of the props that resolves any bindings
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

const children = computed({
  get: () => props.schema.children || [],
  set: (newChildren) => {
    editorStore.updateComponent(props.schema.id, { children: newChildren })
  },
})

function handleButtonClick() {
  const events = props.schema.events || []
  const onClickEvent = events.find(e => e.trigger === 'onClick')
  if (onClickEvent) {
    executeEvent(onClickEvent)
  }
}

const styleObject = computed(() => {
  return props.schema.style || {}
})
</script>

<template>
  <!-- 容器组件 -->
  <div v-if="schema.type === ComponentType.Container" :style="styleObject">
    <VueDraggable
      v-model="children"
      group="components"
      :animation="200"
      handle=".drag-handle"
      item-key="id"
      class="min-h-[100px] p-1 border border-dashed border-gray-400"
    >
      <EditorComponentWrapper
        v-for="child in children"
        :key="child.id"
        :schema="child"
      />
      <template #footer>
        <div v-if="children.length === 0" class="empty-placeholder text-center text-gray-400 text-sm py-4">
          将组件拖到此处
        </div>
      </template>
    </VueDraggable>
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
    <VueDraggable
      v-model="children"
      group="components"
      :animation="200"
      handle=".drag-handle"
      item-key="id"
      class="min-h-[50px]"
    >
      <EditorComponentWrapper
        v-for="child in children"
        :key="child.id"
        :schema="child"
      />
      <template #footer>
        <div v-if="children.length === 0" class="empty-placeholder text-center text-gray-400 text-sm py-2">
          将组件拖到此处
        </div>
      </template>
    </VueDraggable>
  </ElCard>

  <!-- 栅格行 -->
  <ElRow
    v-else-if="schema.type === ComponentType.Row"
    :gutter="resolvedProps.gutter || 0"
    :style="styleObject"
  >
    <VueDraggable
      v-model="children"
      group="components"
      :animation="200"
      handle=".drag-handle"
      item-key="id"
      class="flex min-h-[50px] w-full"
    >
      <EditorComponentWrapper
        v-for="child in children"
        :key="child.id"
        :schema="child"
      />
    </VueDraggable>
  </ElRow>

  <!-- 栅格列 -->
  <ElCol
    v-else-if="schema.type === ComponentType.Col"
    :span="resolvedProps.span || 12"
    :style="styleObject"
  >
    <VueDraggable
      v-model="children"
      group="components"
      :animation="200"
      handle=".drag-handle"
      item-key="id"
      class="min-h-[50px] p-1 border border-dashed border-gray-400"
    >
      <EditorComponentWrapper
        v-for="child in children"
        :key="child.id"
        :schema="child"
      />
      <template #footer>
        <div v-if="children.length === 0" class="empty-placeholder text-center text-gray-400 text-sm py-2">
          将组件拖到此处
        </div>
      </template>
    </VueDraggable>
  </ElCol>

  <!-- 折叠面板 -->
  <ElCollapse
    v-else-if="schema.type === ComponentType.Collapse"
    :style="styleObject"
  >
    <ElCollapseItem :title="resolvedProps.title || 'Collapse Title'" name="1">
      <VueDraggable
        v-model="children"
        group="components"
        :animation="200"
        handle=".drag-handle"
        item-key="id"
        class="min-h-[50px] p-1"
      >
        <EditorComponentWrapper
          v-for="child in children"
          :key="child.id"
          :schema="child"
        />
        <template #footer>
          <div v-if="children.length === 0" class="empty-placeholder text-center text-gray-400 text-sm py-2">
            将组件拖到此处
          </div>
        </template>
      </VueDraggable>
    </ElCollapseItem>
  </ElCollapse>

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
    class="component-list"
    :style="styleObject"
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
      :placeholder="resolvedProps.placeholder"
    />
    <!-- 选择器 -->
    <ElSelect
      v-else-if="schema.type === ComponentType.Select"
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
