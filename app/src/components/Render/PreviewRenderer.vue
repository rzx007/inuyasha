<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import type { ComponentSchema } from '@/types/component'
import { ComponentType } from '@/types/component'
import { useComponentStore } from '@/stores/component'
import { useEditorStore } from '@/stores/editor'
import { ElCard, ElStatistic, ElOption } from 'element-plus'
import ChartRenderer from './widgets/ChartRenderer.vue'
import { resolveBinding } from '@/utils/expressionEngine'
import { executeEvent } from '@/utils/eventEngine'
import { useFormStateStore } from '@/stores/formState'
import { useComponentRegistry } from '@/stores/componentRegistry'

interface Props {
  schema: ComponentSchema
}
const props = defineProps<Props>()
const componentStore = useComponentStore()
const editorStore = useEditorStore()
const formStateStore = useFormStateStore()
const componentRegistry = useComponentRegistry()

// 组件实例引用
const componentRef = ref(null)

// 在组件挂载时初始化 vModel 属性，并注册组件实例
onMounted(() => {
  const componentMeta = componentStore.getComponentMeta(props.schema.type)
  if (componentMeta?.propsSchema) {
    // 为每个 vModel: true 且 storeInProps: false 的属性初始化值（如果还没有值的话）
    componentMeta.propsSchema
      .filter(schema => schema.vModel && !schema.storeInProps)
      .forEach(schema => {
        const existingValue = formStateStore.getComponentState(props.schema.id, schema.key)
        const propsValue = (props.schema.props as any)?.[schema.key]
        if (existingValue === undefined) {
          if (propsValue !== undefined) {
            formStateStore.setComponentState(props.schema.id, schema.key, propsValue)
          } else if (schema.defaultValue !== undefined) {
            formStateStore.setComponentState(props.schema.id, schema.key, schema.defaultValue)
          }
        }
      })
  }

  // 注册组件实例
  if (componentRef.value) {
    componentRegistry.register(props.schema.id, componentRef.value)
  }
})

onUnmounted(() => {
  componentRegistry.unregister(props.schema.id)
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

// 通用事件处理函数
function handleEvent(trigger: string) {
  const events = props.schema.events || []
  const matchedEvent = events.find(e => e.trigger === trigger)
  if (matchedEvent) {
    executeEvent(matchedEvent)
  }
}

const styleObject = computed(() => resolvedStyle.value)

// 辅助函数：获取指定插槽的子组件
function getSlotChildren(slotName: string) {
  return props.schema.children?.filter(child => child.props?._slot === slotName) || []
}

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

// 动态计算所有双向绑定值
const modelValueBindings = computed(() => {
  const bindings: Record<string, any> = {}
  if (componentMeta.value?.propsSchema) {
    componentMeta.value.propsSchema
      .filter(schema => schema.vModel)
      .forEach(schema => {
        if (schema.storeInProps) {
          // 从 resolvedProps 读取（已经处理了数据绑定）
          bindings[schema.key] = resolvedProps.value[schema.key]
        } else {
          // 从 formStateStore 读取
          bindings[schema.key] = formStateStore.getComponentState(props.schema.id, schema.key)
        }
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
        events[`update:${schema.key}`] = (value: any) => {
          if (schema.storeInProps) {
            // 更新 ComponentSchema.props
            editorStore.updateComponent(props.schema.id, {
              props: { ...props.schema.props, [schema.key]: value }
            })
          } else {
            // 更新 formStateStore
            formStateStore.setComponentState(props.schema.id, schema.key, value)
          }
          handleEvent('onValueChange')
        }
      })
  }
  return events
})

// 是否使用 componentName 渲染
const canUseDynamicRender = computed(() => !!componentMeta.value?.componentName)

// 是否需要双向绑定（根据 propsSchema 中是否存在 vModel 属性判断）
const needsModelValue = computed(() => componentMeta.value?.propsSchema?.some(schema => schema.vModel) || false)

// 计算动态插槽项
const dynamicSlotItems = computed(() => {
  if (componentMeta.value?.useDynamicSlots && Array.isArray(resolvedProps.value.items)) {
    return resolvedProps.value.items
  }
  return []
})
</script>

<template>
  <!-- 动态渲染部分 -->
  <template v-if="canUseDynamicRender">
    <!-- 需要双向绑定的组件（表单组件） -->
    <component
      v-if="needsModelValue"
      ref="componentRef"
      :is="componentMeta?.componentName"
      v-bind="{ ...resolvedProps, ...modelValueBindings }"
      :style="styleObject"
      v-on="{ ...dynamicEvents, ...modelValueEvents }"
    >
      <!-- 动态插槽渲染 -->
      <template v-for="slot in componentMeta?.slots" :key="slot.name" #[slot.name]>
        <PreviewRenderer
          v-for="child in getSlotChildren(slot.name)"
          :key="child.id"
          :schema="child"
        />
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
      ref="componentRef"
      :is="componentMeta?.componentName"
      v-bind="resolvedProps"
      :style="styleObject"
      v-on="dynamicEvents"
    >
      <!-- 动态插槽渲染 (Static definition) -->
      <template v-for="slot in componentMeta?.slots" :key="slot.name" #[slot.name]>
        <PreviewRenderer
          v-for="child in getSlotChildren(slot.name)"
          :key="child.id"
          :schema="child"
        />
      </template>

      <!-- 动态插槽渲染 (Dynamic generation from props.items) -->
      <template v-for="item in dynamicSlotItems" :key="item.name" #[item.name]>
        <PreviewRenderer
          v-for="child in getSlotChildren(item.name)"
          :key="child.id"
          :schema="child"
        />
      </template>

      <!-- 文本内容特殊处理 -->
      <template v-if="schema.type === ComponentType.Text">
        {{ resolvedProps.content }}
      </template>
    </component>
  </template>

  <!-- 回退到手动渲染 (用于未配置 componentName 的组件或复杂组件) -->
  <template v-else>
    <!-- PageRoot 组件 -->
    <div
      v-if="schema.type === ComponentType.PageRoot"
      :style="styleObject"
      class="page-root min-h-full"
    >
      <PreviewRenderer v-for="child in schema.children" :key="child.id" :schema="child" />
    </div>

    <!-- 统计数值组件 -->
    <ElStatistic
      v-else-if="schema.type === ComponentType.Statistic"
      ref="componentRef"
      :title="resolvedProps.title || 'Title'"
      :value="resolvedProps.value || 0"
      :style="styleObject"
    />

    <!-- 列表组件 -->
    <ElCard
      v-else-if="schema.type === ComponentType.List"
      ref="componentRef"
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
      ref="componentRef"
      :option="resolvedProps.option || {}"
      :style="styleObject"
    />

    <!-- 未知组件 -->
    <div v-else :style="styleObject" class="p-4 border border-dashed border-red-400 bg-red-50">
      <div class="text-red-500 text-sm">未知组件类型: {{ schema.type }}</div>
    </div>
  </template>
</template>
