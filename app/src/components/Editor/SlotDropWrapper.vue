<script setup lang="ts">
import { useDrop, type DropTargetMonitor } from 'vue3-dnd'
import { DndTypes, type DragItem } from '@inuyasha/core'
import { useEditor } from '@inuyasha/vue'

interface Props {
  slotName?: string
  parentId: string
  hasChildren?: boolean
}
const props = withDefaults(defineProps<Props>(), {
  hasChildren: false
})

const editorStore = useEditor()

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
    if (!draggedId) {
      return
    }

    // 移动到容器末尾
    editorStore.moveComponent(draggedId, props.parentId, undefined, props.slotName)

    return { dropped: true }
  }
}

const [collected, drop] = useDrop(() => ({
  accept: [DndTypes.COMPONENT, DndTypes.EXISTING_COMPONENT],
  drop: handleDrop,
  collect: monitor => ({
    isOver: monitor.isOver({ shallow: true }),
    canDrop: monitor.canDrop()
  })
}))
</script>

<template>
  <div :ref="drop" class="slot-drop-wrapper relative w-full h-full min-h-[50px]">
    <!-- 放置层（绝对定位，全覆盖） -->
    <div
      class="absolute inset-0 z-0 transition-all duration-200 rounded"
      :class="[
        hasChildren ? 'opacity-0' : 'border border-dashed border-gray-300 bg-gray-50/50',
        {
          'ring-2 ring-primary ring-inset bg-primary/5 !opacity-100':
            collected.isOver && collected.canDrop
        }
      ]"
    >
      <div
        v-if="!hasChildren"
        class="absolute inset-0 flex items-center justify-center text-gray-400 text-sm pointer-events-none"
      >
        拖拽组件至此
      </div>
    </div>

    <!-- 内容层（相对定位，z-index 更高） -->
    <div class="relative z-10 pointer-events-none h-full">
      <!-- 恢复子元素的指针事件 -->
      <div class="pointer-events-auto h-full">
        <slot />
      </div>
    </div>
  </div>
</template>
