<script setup lang="ts">
import { computed, ref } from 'vue'
import { useEditorStore } from '@/stores/editor'
import { useComponentStore } from '@/stores/component'
import type { ComponentSchema } from '@/types/component'
import DynamicRenderer from '@/components/Render/DynamicRenderer.vue'
import { useDrag, useDrop } from 'vue3-dnd'
import { DndTypes, type DragItem } from '@/types/dnd'

interface Props {
  schema: ComponentSchema
  index?: number // 添加 index 属性，用于排序
  parentId?: string // 父容器 ID
}
const props = defineProps<Props>()

const editorStore = useEditorStore()
const componentStore = useComponentStore()
const selectedId = computed(() => editorStore.selectedComponent?.id)

const displayType = computed(() => {
  const meta = componentStore.getComponentMeta(props.schema.type)
  return meta?.display || 'block'
})

function handleComponentClick(event: MouseEvent) {
  event.stopPropagation()
  editorStore.selectComponent(props.schema.id)
}

function handleDeleteComponent(event: KeyboardEvent) {
  // 检查事件目标是否是可编辑元素
  const target = event.target as HTMLElement
  const isEditableElement = 
    target.tagName === 'INPUT' ||
    target.tagName === 'TEXTAREA' ||
    target.isContentEditable ||
    target.closest('input, textarea, [contenteditable="true"]')
  
  // 如果是在可编辑元素中，不执行删除操作
  if (isEditableElement) {
    return
  }
  
  if (event.key === 'Delete' || event.key === 'Backspace') {
    event.preventDefault()
    event.stopPropagation()
    editorStore.deleteComponent(props.schema.id)
  }
}

function handleDeleteButtonClick() {
  editorStore.deleteComponent(props.schema.id)
}

// DnD - 拖拽源 (Source)
// 组件 wrapper 本身也是一个可拖拽项，用于拖动排序
const [dragCollected, dragSource, dragPreview] = useDrag({
  type: DndTypes.EXISTING_COMPONENT,
  item: () => ({
    type: DndTypes.EXISTING_COMPONENT,
    id: props.schema.id,
    index: props.index,
    parentId: props.parentId,
    display: displayType.value // 传递组件显示类型
  }),
  collect: (monitor) => ({
    isDragging: monitor.isDragging(),
  }),
})

// 指示器位置状态
const indicatorPosition = ref<'top' | 'bottom' | 'left' | 'right' | null>(null)

// DnD - 放置目标 (Target) - 用于排序占位
// 当另一个组件拖拽到当前组件上时，触发重排
// useDrop 泛型参数：<DragItem, unknown, { isOver: boolean }>
// 第一个参数是 item 类型，第二个是 drop result 类型，第三个是 collected props 类型
const [dropCollected, dropTarget] = useDrop<DragItem, unknown, { isOver: boolean }>({
  accept: [DndTypes.COMPONENT, DndTypes.EXISTING_COMPONENT],
  // 同父容器内即时排序，避免必须松手才调整
  hover(item, monitor) {
    if (!componentRef.value) return
    
    // 计算悬停位置并设置指示器
    const hoverRect = componentRef.value.getBoundingClientRect()
    const clientOffset = monitor.getClientOffset()
    if (!clientOffset) return

    // 如果是 inline-block 组件之间的排序，使用左右指示器
    const isInlineSort = item.display === 'inline-block' && displayType.value === 'inline-block'
    
    if (isInlineSort) {
      const hoverMiddleX = (hoverRect.right - hoverRect.left) / 2
      const hoverClientX = clientOffset.x - hoverRect.left
      if (hoverClientX < hoverMiddleX) {
        indicatorPosition.value = 'left'
      } else {
        indicatorPosition.value = 'right'
      }
    } else {
      const hoverMiddleY = (hoverRect.bottom - hoverRect.top) / 2
      const hoverClientY = clientOffset.y - hoverRect.top
      if (hoverClientY < hoverMiddleY) {
        indicatorPosition.value = 'top'
      } else {
        indicatorPosition.value = 'bottom'
      }
    }

    // 以下逻辑仅针对同父容器内的即时排序
    if (item.type !== DndTypes.EXISTING_COMPONENT) return
    if (!props.parentId) return
    const dragId = item.id
    const dragIndex = item.index
    const hoverIndex = props.index
    if (!dragId || dragIndex === undefined || hoverIndex === undefined) return
    if (item.parentId !== props.parentId) return

    // 对于即时排序，只有当指示器位置表明确实跨越了中点时才触发移动
    // 注意：这里的移动是真正的 DOM 移动，会立即反映在界面上
    // 所以 indicatorPosition 其实是“预判”位置，如果真的移动了，item.index 会变
    
    // 暂时保留原有的逻辑，仅在真正 drop 时才跨容器移动，同容器内 hover 保持现状
    // 但为了更好的视觉效果，我们可以依赖 indicatorPosition 来做判断
    
    // TODO: 如果要完全依赖 indicator 排序，这里需要调整
    // 目前 hover 逻辑主要用于排序，drop 逻辑用于最终确认
    
    // 简化：仅当确实跨越中点时才执行移动
    const isAfter = isInlineSort 
      ? indicatorPosition.value === 'right' 
      : indicatorPosition.value === 'bottom'
      
    if (dragIndex < hoverIndex && !isAfter) return
    if (dragIndex > hoverIndex && isAfter) return

    const slotName = props.schema.props?._slot
    editorStore.moveComponent(dragId, props.parentId, hoverIndex, slotName)
    item.index = hoverIndex
  },
  drop(item, monitor) {
    indicatorPosition.value = null // 重置指示器
    
    if (monitor.didDrop()) {
      return
    }

    // drop 时的逻辑主要用于处理跨容器拖拽和新组件添加
    // 同容器内的排序已经在 hover 中处理了（虽然这里会再次计算 targetIndex，但如果是同容器且 hover 已更新，影响不大）
    
    if (!componentRef.value) {
      return
    }
    
    // 重新计算一次 targetIndex，确保准确
    let targetIndex = props.index !== undefined ? props.index : 0
    // 根据 indicatorPosition 决定是否 +1
    // 如果 hover 没有触发（例如快速拖动），需要重新计算 indicatorPosition 类似的逻辑
    const hoverRect = componentRef.value.getBoundingClientRect()
    const clientOffset = monitor.getClientOffset()
    
    let isAfter = false
    if (clientOffset) {
      const isInlineSort = item.display === 'inline-block' && displayType.value === 'inline-block'
      if (isInlineSort) {
        const hoverMiddleX = (hoverRect.right - hoverRect.left) / 2
        const hoverClientX = clientOffset.x - hoverRect.left
        isAfter = hoverClientX > hoverMiddleX
      } else {
        const hoverMiddleY = (hoverRect.bottom - hoverRect.top) / 2
        const hoverClientY = clientOffset.y - hoverRect.top
        isAfter = hoverClientY > hoverMiddleY
      }
    }
    
    if (isAfter) {
      targetIndex += 1
    }

    // 1. 处理新组件 (COMPONENT)
    if (item.type === DndTypes.COMPONENT) {
      const { meta, cloneFn } = item
      if (meta && cloneFn) {
        const newComponent = cloneFn(meta)
        if (newComponent) {
          if (props.schema.props?._slot) {
             newComponent.props = {
               ...newComponent.props,
               _slot: props.schema.props._slot
             }
          }
          if (props.parentId) {
             editorStore.addComponent(newComponent, props.parentId, targetIndex)
          }
        }
      }
      return { dropped: true }
    }

    // 2. 处理已存在组件排序/移动 (EXISTING_COMPONENT)
    if (item.type === DndTypes.EXISTING_COMPONENT) {
      const draggedId = item.id
      if (!draggedId) return
      if (draggedId === props.schema.id) return

      const slotName = props.schema.props?._slot

      // 跨容器或最终落点插入
      if (props.parentId) {
        editorStore.moveComponent(draggedId, props.parentId, targetIndex, slotName)
        item.parentId = props.parentId
        item.index = targetIndex
      }
      
      return { dropped: true }
    }
  },
  collect: (monitor) => ({
    isOver: monitor.isOver({ shallow: true }),
  })
})

const componentRef = ref<HTMLElement | null>(null)

// 绑定 ref
const setRef = (el: any) => {
  componentRef.value = el
  dragSource(el)
  dropTarget(el)
  dragPreview(el) // 使用 dragPreview
}
</script>

<template>
  <div
    :ref="setRef"
    class="component-wrapper relative"
    :class="{
      'selected': selectedId === schema.id,
      'inline-block': displayType === 'inline-block',
      'opacity-50': dragCollected.isDragging,
      // 移除原有的 ring class，改为使用 indicator
    }"
    tabindex="0"
    @click="handleComponentClick"
    @keydown="handleDeleteComponent"
  >
    <!-- 拖拽位置指示器 -->
    <div v-if="dropCollected.isOver && indicatorPosition === 'top'" class="absolute top-0 left-0 right-0 h-0.5 bg-blue-500 z-50 pointer-events-none"></div>
    <div v-if="dropCollected.isOver && indicatorPosition === 'bottom'" class="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 z-50 pointer-events-none"></div>
    <div v-if="dropCollected.isOver && indicatorPosition === 'left'" class="absolute top-0 bottom-0 left-0 w-0.5 bg-blue-500 z-50 pointer-events-none"></div>
    <div v-if="dropCollected.isOver && indicatorPosition === 'right'" class="absolute top-0 bottom-0 right-0 w-0.5 bg-blue-500 z-50 pointer-events-none"></div>

    <!-- 选中高亮边框 -->
    <div
      v-if="selectedId === schema.id"
      class="absolute inset-[-2px] border-2 border-blue-500 pointer-events-none z-10 rounded"
    />

    <!-- 拖拽手柄和操作栏 -->
    <div
      v-if="selectedId === schema.id"
      class="absolute -top-7 left-[-2px] bg-blue-500 text-white text-xs px-2 py-1 rounded-t z-10 flex items-center whitespace-nowrap min-w-fit"
    >
      <!-- 使用 dragSource 直接绑定到 handle -->
      <!-- 注意：如果要限制只能通过 handle 拖拽，应该把 dragSource 绑定在这里，而不是外层 div -->
      <!-- 但是为了排序体验，通常整个卡片可拖拽，或者外层 div 作为 target，handle 作为 source -->
      <!-- 这里我们暂时保持外层作为 source/target，handle 只是视觉上的 -->
      <span class="cursor-move drag-handle mr-2 whitespace-nowrap">⠿ {{ schema.semanticId }}</span>
      <button
        class="delete-btn bg-transparent hover:bg-white/20 p-1 rounded shrink-0"
        title="Delete"
        @click.stop="handleDeleteButtonClick"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24"><path fill="currentColor" d="M7 21q-.825 0-1.412-.587T5 19V6H4V4h5V3h6v1h5v2h-1v13q0 .825-.587 1.413T17 21zM17 6H7v13h10zM9 17h2V8H9zm4 0h2V8h-2zM7 6v13z"/></svg>
      </button>
    </div>

    <!-- 渲染组件 -->
    <DynamicRenderer :schema="schema" />
  </div>
</template>

<style scoped>
.component-wrapper {
  outline: none;
  transition: all 0.2s ease;
}
.component-wrapper:hover {
  box-shadow: 0 0 0 1px var(--el-color-primary-light-3);
}
.component-wrapper.selected {
  outline: none;
}
</style>
