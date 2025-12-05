<script setup lang="ts">
import { computed } from 'vue'
import { ChevronDown, ChevronRight, Layers as LayersIcon } from 'lucide-vue-next'
import { Badge } from '@/components/ui/badge'
import type { ComponentSchema } from '@/types/component'
import { getIconComponent } from '@/utils/iconMapping'
import { useComponentStore } from '@/stores/component'

export type LayerNode = {
  id: string
  label: string
  schema?: ComponentSchema
  children: LayerNode[]
  isSlot?: boolean
  slotName?: string
}

const props = defineProps<{
  node: LayerNode
  depth?: number
  selectedId?: string | null
  isCollapsed: (id: string) => boolean
  toggleCollapse: (id: string) => void
  onSelect: (node: LayerNode) => void
}>()

defineOptions({ name: 'LayerTreeItem' })

const componentStore = useComponentStore()

const depth = computed(() => props.depth ?? 0)
const hasChildren = computed(() => props.node.children && props.node.children.length > 0)
const collapsed = computed(() => props.isCollapsed(props.node.id))
const isSelected = computed(() => props.node.schema?.id === props.selectedId)
const paddingLeft = computed(() => `${depth.value * 12 + 8}px`)

const iconComp = computed(() => {
  if (!props.node.schema) return null
  const meta = componentStore.getComponentMeta(props.node.schema.type)
  return getIconComponent(meta?.icon)
})

function handleRowClick() {
  if (props.node.isSlot) {
    props.toggleCollapse(props.node.id)
  } else {
    props.onSelect(props.node)
  }
}

function handleToggle(e: Event) {
  e.stopPropagation()
  props.toggleCollapse(props.node.id)
}
</script>

<template>
  <div class="space-y-0.5">
    <div
      class="flex items-center gap-2 px-2 py-1.5 border border-transparent rounded transition-colors cursor-pointer"
      :class="[
        isSelected ? 'bg-primary/10 text-primary-700 border border-primary/30!' : 'hover:bg-slate-50',
        node.isSlot ? 'text-slate-500' : 'text-slate-700'
      ]"
      :style="{ paddingLeft }"
      @click="handleRowClick"
    >
      <button
        v-if="hasChildren"
        class="w-5 h-5 flex items-center justify-center text-slate-400 hover:text-slate-600"
        @click="handleToggle"
      >
        <component :is="collapsed ? ChevronRight : ChevronDown" :size="14" />
      </button>
      <span v-else class="w-5 h-5 inline-flex items-center justify-center text-slate-200">
        <span class="block w-2 h-2 rounded-full bg-slate-200" />
      </span>

      <Badge
        v-if="node.isSlot"
        variant="secondary"
        class="text-[11px] font-medium px-2 py-0.5 bg-slate-100 text-slate-600 border border-slate-200"
      >
        {{ node.slotName || 'Slot' }}
      </Badge>
      <component
        v-else
        :is="iconComp || LayersIcon"
        :size="14"
        class="text-slate-500"
      />

      <span class="text-sm flex-1 truncate" :title="node.label">
        {{ node.label }}
      </span>

      <Badge
        v-if="node.schema"
        variant="outline"
        class="text-[10px] font-thin font-mono uppercase bg-slate-50 text-slate-500 border border-slate-200"
      >
        {{ node.schema?.semanticId }}
      </Badge>
    </div>

    <div v-if="hasChildren && !collapsed" class="space-y-1">
      <LayerTreeItem
        v-for="child in node.children"
        :key="child.id"
        :node="child"
        :depth="depth + 1"
        :selected-id="selectedId"
        :is-collapsed="isCollapsed"
        :toggle-collapse="toggleCollapse"
        :on-select="onSelect"
      />
    </div>
  </div>
</template>

