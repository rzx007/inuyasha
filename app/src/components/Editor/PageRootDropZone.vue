<script setup lang="ts">
import { useDrop } from 'vue3-dnd'
import { DndTypes, type DragItem } from '@/types/dnd'
import { useEditorStore } from '@/stores/editor'

interface Props {
  parentId: string
  styleObject?: Record<string, any>
}
const props = defineProps<Props>()
const editorStore = useEditorStore()

// 背景层拖拽逻辑 - 添加到末尾
const [collected, drop] = useDrop(() => ({
  accept: [DndTypes.COMPONENT, DndTypes.EXISTING_COMPONENT],
  drop: (item: DragItem, monitor) => {
    // 如果子组件已处理，不重复处理
    if (monitor.didDrop()) {
      return
    }
    
    // 添加到末尾
    if (item.type === DndTypes.COMPONENT) {
      const { meta, cloneFn } = item
      if (meta && cloneFn) {
        const newComponent = cloneFn(meta)
        if (newComponent) {
          editorStore.addComponent(newComponent, props.parentId)
        }
      }
    } else if (item.type === DndTypes.EXISTING_COMPONENT) {
      const draggedId = item.id
      if (draggedId) {
        editorStore.moveComponent(draggedId, props.parentId)
      }
    }
    
    return { dropped: true }
  },
  collect: (monitor) => ({
    isOver: monitor.isOver({ shallow: true }),
    canDrop: monitor.canDrop(),
  }),
}))
</script>

<template>
  <div class="page-root-drop-zone relative min-h-full border border-dashed" :style="styleObject">
    <!-- 背景拖拽层（绝对定位，全覆盖） -->
    <div
      :ref="drop"
      class="absolute inset-0 pointer-events-auto"
      :class="{ 'bg-primary/5 ring-2 ring-primary ring-inset': collected.isOver && collected.canDrop }"
    />
    
    <!-- 子组件层（相对定位，z-index 更高） -->
    <div class="relative z-10 pointer-events-auto">
      <slot />
    </div>
  </div>
</template>

