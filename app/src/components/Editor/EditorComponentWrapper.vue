<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useElementBounding, useEventListener } from '@vueuse/core'
import { useEditor, useComponentMeta } from '@inuyasha/vue'
import type { ComponentSchema } from '@inuyasha/core'
import DynamicRenderer from '@/components/Render/DynamicRenderer.vue'
import { useDrag, useDrop } from 'vue3-dnd'
import { DndTypes, type DragItem } from '@inuyasha/core'

interface Props {
  schema: ComponentSchema
  index?: number
  parentId?: string
}
const props = defineProps<Props>()

const editorStore = useEditor()
const componentStore = useComponentMeta()
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
  const target = event.target as HTMLElement
  const isEditableElement =
    target.tagName === 'INPUT' ||
    target.tagName === 'TEXTAREA' ||
    target.isContentEditable ||
    target.closest('input, textarea, [contenteditable="true"]')

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

const [handleDragCollected, handleDragSource, handleDragPreview] = useDrag(() => ({
  type: DndTypes.EXISTING_COMPONENT,
  item: () => ({
    type: DndTypes.EXISTING_COMPONENT,
    id: props.schema.id,
    index: props.index,
    parentId: props.parentId,
    display: displayType.value
  }),
  collect: monitor => ({
    isDragging: monitor.isDragging()
  })
}))

const indicatorPosition = ref<'top' | 'bottom' | 'left' | 'right' | null>(null)

const [dropCollected, dropTarget] = useDrop<DragItem, unknown, { isOver: boolean }>({
  accept: [DndTypes.COMPONENT, DndTypes.EXISTING_COMPONENT],
  hover(item, monitor) {
    if (!componentRef.value) {
      return
    }

    const hoverRect = componentRef.value.getBoundingClientRect()
    const clientOffset = monitor.getClientOffset()
    if (!clientOffset) {
      return
    }

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

    if (item.type !== DndTypes.EXISTING_COMPONENT) {
      return
    }
    if (!props.parentId) {
      return
    }
    const dragId = item.id
    const dragIndex = item.index
    const hoverIndex = props.index
    if (!dragId || dragIndex === undefined || hoverIndex === undefined) {
      return
    }
    if (item.parentId !== props.parentId) {
      return
    }

    const isAfter = isInlineSort
      ? indicatorPosition.value === 'right'
      : indicatorPosition.value === 'bottom'

    if (dragIndex < hoverIndex && !isAfter) {
      return
    }
    if (dragIndex > hoverIndex && isAfter) {
      return
    }

    const slotName = props.schema.props?._slot
    editorStore.moveComponent(dragId, props.parentId, hoverIndex, slotName)
    item.index = hoverIndex
  },
  drop(item, monitor) {
    indicatorPosition.value = null

    if (monitor.didDrop()) {
      return
    }

    if (!componentRef.value) {
      return
    }

    let targetIndex = props.index !== undefined ? props.index : 0
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

    if (item.type === DndTypes.EXISTING_COMPONENT) {
      const draggedId = item.id
      if (!draggedId) {
        return
      }
      if (draggedId === props.schema.id) {
        return
      }

      const slotName = props.schema.props?._slot

      if (props.parentId) {
        editorStore.moveComponent(draggedId, props.parentId, targetIndex, slotName)
        item.parentId = props.parentId
        item.index = targetIndex
      }

      return { dropped: true }
    }
  },
  collect: monitor => ({
    isOver: monitor.isOver({ shallow: true })
  })
})

const componentRef = ref<HTMLElement | null>(null)

const setRef = (el: any) => {
  componentRef.value = el
  dropTarget(el)
  handleDragPreview(el)
}

const handleRef = ref<HTMLElement | null>(null)

const setHandleRef = (el: any) => {
  handleRef.value = el
  handleDragSource(el)
}

const { top, left, width, height, update } = useElementBounding(componentRef)

const overlayRect = computed(() => ({
  top: top.value,
  left: left.value,
  width: width.value,
  height: height.value
}))

const canvasScrollTop = ref(0)
const overlayZIndex = computed(() => (canvasScrollTop.value > 0 ? 29 : 30))

function syncCanvasScrollTop() {
  const el = document.querySelector('.canvas-content')
  canvasScrollTop.value = el ? (el as HTMLElement).scrollTop : 0
}

watch([selectedId, () => props.schema.id], () => {
  if (selectedId.value === props.schema.id || dropCollected.value.isOver) {
    syncCanvasScrollTop()
    update()
  }
})

useEventListener(
  () => document.querySelector('.canvas-content'),
  'scroll',
  () => {
    syncCanvasScrollTop()
    update()
  },
  { passive: true }
)
</script>

<template>
  <div
    :ref="setRef"
    class="component-wrapper relative"
    :class="{
      selected: selectedId === schema.id,
      'inline-block': displayType === 'inline-block',
      'opacity-50': handleDragCollected.isDragging
    }"
    tabindex="0"
    @click="handleComponentClick"
    @keydown="handleDeleteComponent"
  >
    <DynamicRenderer :schema="schema" />
  </div>

  <Teleport v-if="selectedId === schema.id || dropCollected.isOver" to="body">
    <div
      class="component-overlay fixed pointer-events-none"
      :style="{
        top: overlayRect.top + 'px',
        left: overlayRect.left + 'px',
        width: overlayRect.width + 'px',
        height: overlayRect.height + 'px',
        zIndex: overlayZIndex
      }"
    >
      <div
        v-if="dropCollected.isOver && indicatorPosition === 'top'"
        class="absolute top-0 left-0 right-0 h-0.5 bg-blue-500 z-50 pointer-events-none"
      />
      <div
        v-if="dropCollected.isOver && indicatorPosition === 'bottom'"
        class="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 z-50 pointer-events-none"
      />
      <div
        v-if="dropCollected.isOver && indicatorPosition === 'left'"
        class="absolute top-0 bottom-0 left-0 w-0.5 bg-blue-500 z-50 pointer-events-none"
      />
      <div
        v-if="dropCollected.isOver && indicatorPosition === 'right'"
        class="absolute top-0 bottom-0 right-0 w-0.5 bg-blue-500 z-50 pointer-events-none"
      />

      <div
        v-if="selectedId === schema.id"
        class="absolute inset-[-2px] border-2 border-blue-500 rounded"
      />

      <div
        v-if="selectedId === schema.id"
        :ref="setHandleRef"
        class="absolute -top-7 left-[-2px] bg-blue-500 text-white text-xs px-2 py-1 rounded-t flex items-center whitespace-nowrap min-w-fit pointer-events-auto"
      >
        <span class="cursor-move mr-2 whitespace-nowrap">⠿ {{ schema.semanticId }}</span>
        <button
          class="bg-transparent hover:bg-white/20 p-1 rounded shrink-0"
          title="Delete"
          @click.stop="handleDeleteButtonClick"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M7 21q-.825 0-1.412-.587T5 19V6H4V4h5V3h6v1h5v2h-1v13q0 .825-.587 1.413T17 21zM17 6H7v13h10zM9 17h2V8H9zm4 0h2V8h-2zM7 6v13z"
            />
          </svg>
        </button>
      </div>
    </div>
  </Teleport>
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
