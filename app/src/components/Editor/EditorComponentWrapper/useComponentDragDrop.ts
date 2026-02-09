import { ref, type ComputedRef, type Ref } from 'vue'
import { useDrag, useDrop } from 'vue3-dnd'
import { useEditor } from '@inuyasha/vue'
import { DndTypes, type DragItem } from '@inuyasha/core'
import type { ComponentSchema } from '@inuyasha/core'

export function useComponentDragDrop(
  componentRef: Ref<HTMLElement | null>,
  schema: ComponentSchema,
  displayType: ComputedRef<string>,
  index?: number,
  parentId?: string
) {
  const editorStore = useEditor()

  const [handleDragCollected, handleDragSource, handleDragPreview] = useDrag(() => ({
    type: DndTypes.EXISTING_COMPONENT,
    item: () => ({
      type: DndTypes.EXISTING_COMPONENT,
      id: schema.id,
      index,
      parentId,
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
      if (!parentId) {
        return
      }
      const dragId = item.id
      const dragIndex = item.index
      const hoverIndex = index
      if (!dragId || dragIndex === undefined || hoverIndex === undefined) {
        return
      }
      if (item.parentId !== parentId) {
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

      const slotName = schema.props?._slot
      editorStore.moveComponent(dragId, parentId, hoverIndex, slotName)
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

      let targetIndex = index !== undefined ? index : 0
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
            if (schema.props?._slot) {
              newComponent.props = {
                ...newComponent.props,
                _slot: schema.props._slot
              }
            }
            if (parentId) {
              editorStore.addComponent(newComponent, parentId, targetIndex)
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
        if (draggedId === schema.id) {
          return
        }

        const slotName = schema.props?._slot

        if (parentId) {
          editorStore.moveComponent(draggedId, parentId, targetIndex, slotName)
          item.parentId = parentId
          item.index = targetIndex
        }

        return { dropped: true }
      }
    },
    collect: monitor => ({
      isOver: monitor.isOver({ shallow: true })
    })
  })

  return {
    handleDragCollected,
    handleDragSource,
    handleDragPreview,
    dropCollected,
    dropTarget,
    indicatorPosition
  }
}
