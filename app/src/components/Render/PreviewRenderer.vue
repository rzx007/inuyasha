<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import type { ComponentSchema } from '@inuyasha/core'
import { ComponentType } from '@inuyasha/core'
import { useSchemaRenderer } from '@inuyasha/vue'
import { useComponentInstance } from '@inuyasha/vue'

interface Props {
  schema: ComponentSchema
}
const props = defineProps<Props>()

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
</script>

<template>
  <component
    :is="componentMeta?.componentName || 'div'"
    v-if="schema.type === ComponentType.PageRoot"
    :style="styleObject"
    class="page-root min-h-full"
  >
    <PreviewRenderer v-for="child in schema.children" :key="child.id" :schema="child" />
  </component>

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
        <PreviewRenderer
          v-for="child in getSlotChildren(slot.name)"
          :key="child.id"
          :schema="child"
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
        <PreviewRenderer
          v-for="child in getSlotChildren(slot.name)"
          :key="child.id"
          :schema="child"
        />
      </template>

      <template v-for="item in dynamicSlotItems" :key="item.name" #[item.name]>
        <PreviewRenderer
          v-for="child in getSlotChildren(item.name)"
          :key="child.id"
          :schema="child"
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
