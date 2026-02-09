import { computed } from 'vue'
import { useEditor, useComponentMeta } from '@inuyasha/vue'
import type { ComponentSchema } from '@inuyasha/core'

export function useComponentSelection(schema: ComponentSchema) {
  const editorStore = useEditor()
  const componentStore = useComponentMeta()

  const displayType = computed(() => {
    const meta = componentStore.getComponentMeta(schema.type)
    return meta?.display || 'block'
  })

  function handleComponentClick(event: MouseEvent) {
    event.stopPropagation()
    editorStore.selectComponent(schema.id)
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
      editorStore.deleteComponent(schema.id)
    }
  }

  function handleDeleteButtonClick() {
    editorStore.deleteComponent(schema.id)
  }

  return {
    displayType,
    handleComponentClick,
    handleDeleteComponent,
    handleDeleteButtonClick
  }
}
