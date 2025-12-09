<script setup lang="ts">
import { defineAsyncComponent, computed, onMounted } from 'vue'
import { VueDraggable } from 'vue-draggable-plus'
import { useEditorStore } from '@/stores/editor'
import { useComponentStore } from '@/stores/component'
import type { ComponentSchema } from '@/types/component'
import { ComponentType } from '@/types/component'
import { ElCard, ElStatistic,  ElOption } from 'element-plus'
import ChartRenderer from './widgets/ChartRenderer.vue'
import { resolveBinding } from '@/utils/expressionEngine'
import { executeEvent } from '@/utils/eventEngine'
import { useFormStateStore } from '@/stores/formState'

// 循环引用问题：DynamicRenderer 引用 EditorComponentWrapper，反之亦然
// 使用 defineAsyncComponent 解决
const EditorComponentWrapper = defineAsyncComponent(
  () => import('@/components/Editor/EditorComponentWrapper.vue')
)

interface Props {
  schema: ComponentSchema
}
const props = defineProps<Props>()

const editorStore = useEditorStore()
const componentStore = useComponentStore()
const formStateStore = useFormStateStore()

// 在组件挂载时初始化 vModel 属性
onMounted(() => {
  const componentMeta = componentStore.getComponentMeta(props.schema.type)
  if (componentMeta?.propsSchema) {
    // 为每个 vModel: true 的属性初始化值（如果还没有值的话）
    componentMeta.propsSchema
      .filter(schema => schema.vModel)
      .forEach(schema => {
        const existingValue = formStateStore.getComponentState(props.schema.id, schema.key)
        if (existingValue === undefined && schema.defaultValue !== undefined) {
          formStateStore.setComponentState(props.schema.id, schema.key, schema.defaultValue)
        }
      })
  }
})

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

// 通用事件处理函数
function handleEvent(trigger: string) {
  const events = props.schema.events || []
  const matchedEvent = events.find(e => e.trigger === trigger)
  if (matchedEvent) {
    executeEvent(matchedEvent)
  }
}

// 动态计算所有双向绑定值
const modelValueBindings = computed(() => {
  const bindings: Record<string, any> = {}
  if (componentMeta.value?.propsSchema) {
    componentMeta.value.propsSchema
      .filter(schema => schema.vModel)
      .forEach(schema => {
        bindings[schema.key] = formStateStore.getComponentState(props.schema.id, schema.key)
      })
  }
  return bindings
})

// 动态计算所有双向绑定事件
const modelValueEvents = computed(() => {
  const events: Record<string, (value: any) => void> = {}
  if (componentMeta.value?.propsSchema) {
    componentMeta.value.propsSchema
      .filter(schema => schema.vModel)
      .forEach(schema => {
        console.log("🚀 ~ `update:${schema.key}`:", `update:${schema.key}`)
        events[`update:${schema.key}`] = (value: any) => {

          formStateStore.setComponentState(props.schema.id, schema.key, value)
          handleEvent('onValueChange')
        }
      })
  }
  return events
})

// 获取指定插槽的子组件
function getSlotChildren(slotName: string) {
  return props.schema.children?.filter(child => child.props?._slot === slotName) || []
}

// 更新指定插槽的子组件
function updateSlotChildren(slotName: string, newChildren: ComponentSchema[]) {
  // 1. 保留不属于当前 slot 的组件
  const otherChildren =
    props.schema.children?.filter(child => child.props?._slot !== slotName) || []

  // 2. 标记新组件
  const updatedNewChildren = newChildren.map(child => {
    // 如果已经是当前 slot，直接返回
    if (child.props?._slot === slotName) return child
    // 否则（新拖入的，或从其他 slot 移过来的），更新 _slot
    return {
      ...child,
      props: {
        ...child.props,
        _slot: slotName
      }
    }
  })

  // 3. 更新组件
  editorStore.updateComponent(props.schema.id, {
    children: [...otherChildren, ...updatedNewChildren]
  })
}

const styleObject = computed(() => resolvedStyle.value)

// 获取组件元数据
const componentMeta = computed(() => componentStore.getComponentMeta(props.schema.type))

// 动态事件绑定
const dynamicEvents = computed(() => {
  const events: Record<string, Function> = {}
  if (componentMeta.value?.triggers) {
    componentMeta.value.triggers.forEach(trigger => {
      if (trigger.event) {
        events[trigger.event] = () => handleEvent(trigger.value)
      }
    })
  }
  return events
})

// 是否使用 componentName 渲染
const canUseDynamicRender = computed(() => !!componentMeta.value?.componentName)

// 是否需要双向绑定（根据 propsSchema 中是否存在 vModel 属性判断）
const needsModelValue = computed(() => componentMeta.value?.propsSchema?.some(schema => schema.vModel) || false)

// 拖拽列表的计算属性
const children = computed({
  get: () => props.schema.children || [],
  set: newChildren => {
    editorStore.updateComponent(props.schema.id, { children: newChildren })
  }
})

// 计算动态插槽项
const dynamicSlotItems = computed(() => {
  if (componentMeta.value?.useDynamicSlots && Array.isArray(resolvedProps.value.items)) {
    return resolvedProps.value.items
  }
  return []
})
</script>

<template>
  <!-- PageRoot 组件 (特殊处理，始终作为顶级容器) -->
  <VueDraggable
    v-if="schema.type === ComponentType.PageRoot"
    v-model="children"
    group="components"
    :animation="200"
    handle=".drag-handle"
    item-key="id"
    :style="styleObject"
    class="page-root min-h-full"
  >
    <EditorComponentWrapper v-for="child in children" :key="child.id" :schema="child" />
    <template #footer>
      <div
        v-if="children.length === 0"
        class="empty-placeholder text-center text-gray-400 text-sm py-4"
      >
        将组件拖到此处
      </div>
    </template>
  </VueDraggable>

  <!-- 动态渲染部分 -->
  <template v-else-if="canUseDynamicRender">
    <!-- 需要双向绑定的组件（表单组件） -->
    <component
      v-if="needsModelValue"
      :is="componentMeta?.componentName"
      v-bind="{ ...resolvedProps, ...modelValueBindings }"
      :style="styleObject"
      v-on="{ ...dynamicEvents, ...modelValueEvents }"
    >
      <!-- 动态插槽渲染 (Static definition from meta.slots) -->
      <template v-for="slot in componentMeta?.slots" :key="slot.name" #[slot.name]>
        <!-- 如果允许拖拽，渲染 VueDraggable -->
        <VueDraggable
          v-if="slot.allowDrag"
          :model-value="getSlotChildren(slot.name)"
          @update:model-value="updateSlotChildren(slot.name, $event)"
          group="components"
          :animation="200"
          handle=".drag-handle"
          item-key="id"
          class="min-h-[50px] p-1 border border-dashed border-gray-300 bg-gray-50/50"
          :class="{ 'flex flex-wrap': schema.type === ComponentType.Row }"
        >
          <EditorComponentWrapper
            v-for="child in getSlotChildren(slot.name)"
            :key="child.id"
            :schema="child"
          />
          <template #footer>
            <div
              v-if="getSlotChildren(slot.name).length === 0"
              class="empty-placeholder text-center text-gray-400 text-sm py-2"
            >
              拖拽组件至此
            </div>
          </template>
        </VueDraggable>

        <!-- 不允许拖拽 -->
        <div v-else>
          <EditorComponentWrapper
            v-for="child in getSlotChildren(slot.name)"
            :key="child.id"
            :schema="child"
          />
        </div>
      </template>

      <!-- 下拉框选项特殊处理 (如果组件是 ElSelect) -->
      <template v-if="schema.type === ComponentType.Select">
        <ElOption
          v-for="item in resolvedProps.options"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </template>
    </component>

    <!-- 不需要双向绑定的组件 -->
    <component
      v-else
      :is="componentMeta?.componentName"
      v-bind="resolvedProps"
      :style="styleObject"
      v-on="dynamicEvents"
    >
      <!-- 动态插槽渲染 (Static definition from meta.slots) -->
      <template v-for="slot in componentMeta?.slots" :key="slot.name" #[slot.name]>
        <!-- ... (existing logic for static slots) ... -->
        <!-- 如果允许拖拽，渲染 VueDraggable -->
        <VueDraggable
          v-if="slot.allowDrag"
          :model-value="getSlotChildren(slot.name)"
          @update:model-value="updateSlotChildren(slot.name, $event)"
          group="components"
          :animation="200"
          handle=".drag-handle"
          item-key="id"
          class="min-h-[50px] p-1 border border-dashed border-gray-300 bg-gray-50/50"
          :class="{ 'flex flex-wrap': schema.type === ComponentType.Row }"
        >
          <EditorComponentWrapper
            v-for="child in getSlotChildren(slot.name)"
            :key="child.id"
            :schema="child"
          />
          <template #footer>
            <div
              v-if="getSlotChildren(slot.name).length === 0"
              class="empty-placeholder text-center text-gray-400 text-sm py-2"
            >
              拖拽组件至此
            </div>
          </template>
        </VueDraggable>

        <!-- 不允许拖拽 -->
        <div v-else>
          <EditorComponentWrapper
            v-for="child in getSlotChildren(slot.name)"
            :key="child.id"
            :schema="child"
          />
        </div>
      </template>

      <!-- 动态插槽渲染 (Dynamic generation from props.items) -->
      <template v-for="item in dynamicSlotItems" :key="item.name" #[item.name]>
        <!-- 动态插槽默认允许拖拽 (通常是内容区域) -->
        <VueDraggable
          :model-value="getSlotChildren(item.name)"
          @update:model-value="updateSlotChildren(item.name, $event)"
          group="components"
          :animation="200"
          handle=".drag-handle"
          item-key="id"
          class="min-h-[50px] p-1 border border-dashed border-gray-300 bg-gray-50/50"
        >
          <EditorComponentWrapper
            v-for="child in getSlotChildren(item.name)"
            :key="child.id"
            :schema="child"
          />
          <template #footer>
            <div
              v-if="getSlotChildren(item.name).length === 0"
              class="empty-placeholder text-center text-gray-400 text-sm py-2"
            >
              拖拽组件至此
            </div>
          </template>
        </VueDraggable>
      </template>

      <!-- 文本内容特殊处理 -->
      <template v-if="schema.type === ComponentType.Text">
        {{ resolvedProps.content }}
      </template>
    </component>
  </template>

  <!-- 回退到手动渲染 (用于未配置 componentName 的组件或复杂组件) -->
  <template v-else>
    <!-- 统计数值组件 -->
    <ElStatistic
      v-if="schema.type === ComponentType.Statistic"
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


    <!-- 图表组件 -->
    <ChartRenderer
      v-else-if="schema.type === ComponentType.Chart"
      :option="resolvedProps.option || {}"
      :style="styleObject"
    />

    <!-- 未知组件 -->
    <div v-else :style="styleObject" class="p-4 border border-dashed border-red-400 bg-red-50">
      <div class="text-red-500 text-sm">未知组件类型: {{ schema.type }}</div>
    </div>
  </template>
</template>
