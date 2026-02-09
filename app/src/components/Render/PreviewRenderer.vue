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

const componentInstance = useComponentInstance()
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
    componentInstance.register(props.schema.id, componentRef.value)
  }
})

onUnmounted(() => {
  componentInstance.unregister(props.schema.id)
})

const mergedProps = computed(() =>
  needsModelValue.value ? { ...resolvedProps.value, ...modelValueBindings.value } : resolvedProps.value
)
const mergedEvents = computed(() =>
  needsModelValue.value ? { ...dynamicEvents.value, ...modelValueEvents.value } : dynamicEvents.value
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
  const metaSlots = (componentMeta.value?.slots ?? []).map(s => ({ name: s.name }))
  const dynamicSlots = dynamicSlotItems.value.map(item => ({ name: item.name }))
  return [...metaSlots, ...dynamicSlots]
})
</script>

<template>
  <component
    :is="componentMeta?.componentName || 'div'"
    v-if="schema.type === ComponentType.PageRoot"
    :style="resolvedStyle"
    class="page-root min-h-full"
  >
    <PreviewRenderer
      v-for="child in schema.children"
      :key="child.id"
      :schema="child"
    />
  </component>

  <template v-else-if="canUseDynamicRender">
    <component
      :is="componentMeta?.componentName"
      ref="componentRef"
      v-bind="mergedProps"
      :style="resolvedStyle"
      v-on="mergedEvents"
    >
      <template
        v-for="slot in allSlotItems"
        :key="slot.name"
        #[slot.name]
      >
        <PreviewRenderer
          v-for="child in (slotChildrenMap[slot.name] ?? [])"
          :key="child.id"
          :schema="child"
        />
      </template>

      <template v-if="schema.type === ComponentType.Text">
        {{ resolvedProps.content }}
      </template>
    </component>
  </template>

  <div
    v-else
    :style="resolvedStyle"
    class="p-4 border border-dashed border-red-400 bg-red-50"
  >
    <div class="text-red-500 text-sm">
      未知组件类型: {{ schema.type }}
    </div>
  </div>
</template>
