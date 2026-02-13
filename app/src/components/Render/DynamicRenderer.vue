<script setup lang="ts">
import { defineAsyncComponent, computed, onMounted, onUnmounted, ref } from 'vue'
import type { ComponentSchema } from '@inuyasha/core'
import { ComponentType } from '@inuyasha/core'
import { useEditor, useComponentInstance, useSchemaRenderer } from '@inuyasha/vue'

const EditorComponentWrapper = defineAsyncComponent(
  () => import('@/components/Editor/EditorComponentWrapper/index.vue')
)

const SlotDropWrapper = defineAsyncComponent(
  () => import('@/components/Editor/SlotDropWrapper.vue')
)

const PageRootDropZone = defineAsyncComponent(
  () => import('@/components/Editor/PageRootDropZone.vue')
)

interface Props {
  schema: ComponentSchema
}
const props = defineProps<Props>()

const editor = useEditor()
const componentInstance = useComponentInstance()
const componentRef = ref(null)

const forwardRef = ref(null)
defineExpose({
  getRef: () => forwardRef.value
})

const {
  resolvedProps,
  resolvedStyle,
  modelValueBindings,
  modelValueEvents,
  dynamicEvents,
  getSlotChildren,
  canUseDynamicRender,
  needsModelValue,
  dynamicSlotItems,
  componentMeta,
  initVModel
} = useSchemaRenderer(() => props.schema)

onMounted(() => {
  initVModel()
  if (componentRef.value) {
    componentInstance.register(props.schema.id, componentRef.value)
  }
  forwardRef.value = componentRef.value
})

onUnmounted(() => {
  componentInstance.unregister(props.schema.id)
  forwardRef.value = null
})

const mergedProps = computed(() =>
  needsModelValue.value
    ? { ...resolvedProps.value, ...modelValueBindings.value }
    : resolvedProps.value
)
const mergedEvents = computed(() =>
  needsModelValue.value
    ? { ...dynamicEvents.value, ...modelValueEvents.value }
    : dynamicEvents.value
)

const slotChildrenMap = computed(() => {
  const map: Record<string, ComponentSchema[]> = {}
  const slots = componentMeta.value?.slots ?? []
  for (const slot of slots) {
    map[slot.name] = getSlotChildren(slot.name)
  }
  for (const item of dynamicSlotItems.value) {
    map[item.name] = getSlotChildren(item.name)
  }
  return map
})

const allSlotItems = computed(() => {
  const metaSlots = (componentMeta.value?.slots ?? []).map(s => ({
    name: s.name,
    allowDrag: s.allowDrag ?? false
  }))
  const dynamicSlots = dynamicSlotItems.value.map(item => ({
    name: item.name,
    allowDrag: true
  }))
  return [...metaSlots, ...dynamicSlots]
})

const children = computed({
  get: () => props.schema.children || [],
  set: newChildren => {
    editor.updateComponent(props.schema.id, { children: newChildren })
  }
})
</script>

<template>
  <PageRootDropZone
    v-if="schema.type === ComponentType.PageRoot"
    :parent-id="schema.id"
    :style-object="resolvedStyle"
  >
    <EditorComponentWrapper
      v-for="(child, index) in children"
      :key="child.id"
      :schema="child"
      :index="index"
      :parent-id="schema.id"
    />

    <div
      v-if="children.length === 0"
      class="empty-placeholder text-center text-gray-400 text-sm py-4"
    >
      将组件拖到此处
    </div>
  </PageRootDropZone>

  <template v-else-if="canUseDynamicRender">
    <component
      :is="componentMeta?.componentName"
      ref="componentRef"
      v-bind="mergedProps"
      :style="resolvedStyle"
      v-on="mergedEvents"
    >
      <template v-for="slot in allSlotItems" :key="slot.name" #[slot.name]>
        <SlotDropWrapper
          v-if="slot.allowDrag"
          :slot-name="slot.name"
          :parent-id="schema.id"
          :has-children="(slotChildrenMap[slot.name] ?? []).length > 0"
        >
          <EditorComponentWrapper
            v-for="(child, index) in slotChildrenMap[slot.name] ?? []"
            :key="child.id"
            :schema="child"
            :index="index"
            :parent-id="schema.id"
          />
        </SlotDropWrapper>
        <template v-else>
          <EditorComponentWrapper
            v-for="(child, index) in slotChildrenMap[slot.name] ?? []"
            :key="child.id"
            :schema="child"
            :index="index"
            :parent-id="schema.id"
          />
        </template>
      </template>

      <template v-if="schema.type === ComponentType.Text">
        {{ resolvedProps.content }}
      </template>
    </component>
  </template>

  <div v-else :style="resolvedStyle" class="p-4 border border-dashed border-red-400 bg-red-50">
    <div class="text-red-500 text-sm">未知组件类型: {{ schema.type }}</div>
  </div>
</template>
