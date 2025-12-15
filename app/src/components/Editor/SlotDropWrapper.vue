<script setup lang="ts">
import { useDrop, type DropTargetMonitor } from 'vue3-dnd'
import { DndTypes, type DragItem } from '@inuyasha/core'
import { useEditorStore } from '@/stores/editor'

interface Props {
  slotName?: string
  parentId: string
}
const props = defineProps<Props>()

const editorStore = useEditorStore()

// 拖拽处理函数：处理新组件添加到空插槽
function handleDrop(item: DragItem, monitor: DropTargetMonitor) {
  // 防止嵌套组件重复处理
  if (monitor.didDrop()) {
    return
  }

  // 1. 处理新组件 (COMPONENT)
  if (item.type === DndTypes.COMPONENT) {
    const { meta, cloneFn } = item
    if (meta && cloneFn) {
      const newComponent = cloneFn(meta)
      if (newComponent) {
        // 如果指定了 slot，设置 _slot 属性
        if (props.slotName) {
          newComponent.props = {
            ...newComponent.props,
            _slot: props.slotName
          }
        }
        
        // 使用 store 的 addComponent 方法，默认添加到末尾
        editorStore.addComponent(newComponent, props.parentId)
      }
    }
    return { dropped: true }
  }

  // 2. 处理已存在组件移动到空插槽 (EXISTING_COMPONENT)
  if (item.type === DndTypes.EXISTING_COMPONENT) {
    const draggedId = item.id
    if (!draggedId) return
    
    // 移动到容器末尾
    editorStore.moveComponent(draggedId, props.parentId, undefined, props.slotName)
    
    return { dropped: true }
  }
}

const [collected, drop] = useDrop(() => ({
  accept: [DndTypes.COMPONENT, DndTypes.EXISTING_COMPONENT],
  drop: handleDrop,
  collect: (monitor) => ({
    isOver: monitor.isOver({ shallow: true }),
    canDrop: monitor.canDrop(),
  }),
}))
</script>

<template>
  <div
    :ref="drop"
    class="empty-slot-placeholder min-h-[50px] w-full p-1 border border-dashed border-gray-300 bg-gray-50/50 rounded"
    :class="{ 'ring-2 ring-primary ring-inset bg-primary/5': collected.isOver && collected.canDrop }"
  >
    <div class="text-center text-gray-400 text-sm py-2">
      拖拽组件至此
    </div>
  </div>
</template>

