<script setup lang="ts">
import { computed, ref } from 'vue'
import { Layers as LayersIcon } from 'lucide-vue-next'
import { useEditorStore } from '@/stores/editor'
import { useComponentStore } from '@/stores/component'
import type { ComponentSchema } from '@/types/component'
import LayerTreeItem, { type LayerNode } from './LayerTreeItem.vue'

const editorStore = useEditorStore()
const componentStore = useComponentStore()

const collapsedIds = ref<Set<string>>(new Set())

const selectedId = computed(() => editorStore.selectedComponent?.id ?? null)

function toggleCollapse(id: string) {
  const next = new Set(collapsedIds.value)
  if (next.has(id)) {
    next.delete(id)
  } else {
    next.add(id)
  }
  collapsedIds.value = next
}

function isCollapsed(id: string) {
  return collapsedIds.value.has(id)
}

function getSlotLabel(parent: ComponentSchema | undefined, slot: string) {
  if (!parent) return slot
  const items = (parent.props as any)?.items
  if (Array.isArray(items)) {
    const found = items.find((item: any) => item?.name === slot)
    if (found) {
      return found.label || found.title || found.name || slot
    }
  }
  return slot
}

function getDisplayLabel(schema: ComponentSchema) {
  const meta = componentStore.getComponentMeta(schema.type)
  return schema.label || meta?.name || schema.semanticId || schema.id
}

function buildNodes(components: ComponentSchema[], parent?: ComponentSchema): LayerNode[] {
  const nodes: LayerNode[] = []
  const slotBuckets: Record<string, ComponentSchema[]> = {}
  const normalChildren: ComponentSchema[] = []

  components.forEach(child => {
    const slot = (child.props as any)?._slot
    if (slot) {
      slotBuckets[slot] = slotBuckets[slot] || []
      slotBuckets[slot].push(child)
    } else {
      normalChildren.push(child)
    }
  })

  // 普通子节点
  normalChildren.forEach(child => {
    nodes.push(makeNode(child))
  })

  // 按 slot 分组的子节点
  Object.entries(slotBuckets).forEach(([slot, slotChildren]) => {
    nodes.push({
      id: `${parent?.id || 'root'}-slot-${slot}`,
      isSlot: true,
      slotName: getSlotLabel(parent, slot),
      label: `Slot: ${getSlotLabel(parent, slot)}`,
      children: slotChildren.map(child => makeNode(child)),
    })
  })

  return nodes
}

function makeNode(schema: ComponentSchema): LayerNode {
  return {
    id: schema.id,
    label: getDisplayLabel(schema),
    schema,
    children: buildNodes(schema.children || [], schema),
  }
}

const rootNodes = computed<LayerNode[]>(() => buildNodes(editorStore.pageConfig.components))

function handleSelect(node: LayerNode) {
  if (!node.schema) return
  editorStore.selectComponent(node.schema.id)
}

</script>

<template>
  <div class=" h-full flex flex-col">
    <!-- <div class="p-4 border-b border-slate-100">
      <div class="flex items-center gap-2 text-slate-700">
        <LayersIcon :size="16" />
        <span class="text-sm font-semibold">层级结构</span>
      </div>
    </div> -->

    <div class="flex-1 overflow-y-auto p-2">
      <div
        v-if="rootNodes.length === 0"
        class="flex items-center justify-center h-full text-slate-400 text-sm"
      >
        画布为空，拖拽组件开始构建
      </div>
      <div v-else class="space-y-1">
        <LayerTreeItem
          v-for="node in rootNodes"
          :key="node.id"
          :node="node"
          :depth="0"
          :selected-id="selectedId || undefined"
          :is-collapsed="isCollapsed"
          :toggle-collapse="toggleCollapse"
          :on-select="handleSelect"
        />
      </div>
    </div>
  </div>
</template>


