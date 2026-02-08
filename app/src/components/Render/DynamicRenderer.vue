<script setup lang="ts">
import { defineAsyncComponent, computed, onMounted, onUnmounted, ref } from 'vue'
import type { ComponentSchema } from '@inuyasha/core'
import { ComponentType } from '@inuyasha/core'
import { useEditor, useComponentInstance, useSchemaRenderer } from '@inuyasha/vue'

const EditorComponentWrapper = defineAsyncComponent(
  () => import('@/components/Editor/EditorComponentWrapper.vue')
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
const componentRegistry = useComponentInstance()
const componentRef = ref(null)

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
    componentRegistry.register(props.schema.id, componentRef.value)
  }
})

onUnmounted(() => {
  componentRegistry.unregister(props.schema.id)
})

const styleObject = computed(() => resolvedStyle.value)

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
    :style-object="styleObject"
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
      v-if="needsModelValue"
      ref="componentRef"
      v-bind="{ ...resolvedProps, ...modelValueBindings }"
      :style="styleObject"
      v-on="{ ...dynamicEvents, ...modelValueEvents }"
    >
      <template v-for="slot in componentMeta?.slots" :key="slot.name" #[slot.name]>
        <EditorComponentWrapper
          v-for="(child, index) in getSlotChildren(slot.name)"
          :key="child.id"
          :schema="child"
          :index="index"
          :parent-id="schema.id"
        />

        <SlotDropWrapper
          v-if="slot.allowDrag && getSlotChildren(slot.name).length === 0"
          :slot-name="slot.name"
          :parent-id="schema.id"
        />
      </template>
    </component>

    <component
      :is="componentMeta?.componentName"
      v-else
      ref="componentRef"
      v-bind="resolvedProps"
      :style="styleObject"
      v-on="dynamicEvents"
    >
      <template v-for="slot in componentMeta?.slots" :key="slot.name" #[slot.name]>
        <EditorComponentWrapper
          v-for="(child, index) in getSlotChildren(slot.name)"
          :key="child.id"
          :schema="child"
          :index="index"
          :parent-id="schema.id"
        />

        <SlotDropWrapper
          v-if="slot.allowDrag && getSlotChildren(slot.name).length === 0"
          :slot-name="slot.name"
          :parent-id="schema.id"
        />
      </template>

      <template v-for="item in dynamicSlotItems" :key="item.name" #[item.name]>
        <EditorComponentWrapper
          v-for="(child, index) in getSlotChildren(item.name)"
          :key="child.id"
          :schema="child"
          :index="index"
          :parent-id="schema.id"
        />

        <SlotDropWrapper
          v-if="getSlotChildren(item.name).length === 0"
          :slot-name="item.name"
          :parent-id="schema.id"
        />
      </template>

      <template v-if="schema.type === ComponentType.Text">
        {{ resolvedProps.content }}
      </template>
    </component>
  </template>

  <div v-else :style="styleObject" class="p-4 border border-dashed border-red-400 bg-red-50">
    <div class="text-red-500 text-sm">未知组件类型: {{ schema.type }}</div>
  </div>
</template>
