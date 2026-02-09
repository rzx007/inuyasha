<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useEditor } from '@inuyasha/vue'
import type { ComponentSchema } from '@inuyasha/core'
import DynamicRenderer from '@/components/Render/DynamicRenderer.vue'
import { useComponentDragDrop } from './useComponentDragDrop'
import { useComponentOverlay } from './useComponentOverlay'
import { useComponentSelection } from './useComponentSelection'
import ComponentOverlay from './ComponentOverlay.vue'

interface Props {
  schema: ComponentSchema
  index?: number
  parentId?: string
}

const props = defineProps<Props>()

const editorStore = useEditor()
const selectedId = computed(() => editorStore.selectedComponent?.id)

const componentRef = ref<HTMLElement | null>(null)
const handleRef = ref<HTMLElement | null>(null)

const { displayType, handleComponentClick, handleDeleteComponent, handleDeleteButtonClick } =
  useComponentSelection(props.schema)

const {
  handleDragCollected,
  handleDragSource,
  handleDragPreview,
  dropCollected,
  dropTarget,
  indicatorPosition
} = useComponentDragDrop(componentRef, props.schema, displayType, props.index, props.parentId)

const { overlayRect, overlayZIndex, shouldShowOverlay, update } = useComponentOverlay(
  componentRef,
  computed(() => selectedId.value === props.schema.id),
  dropCollected
)

const setRef = (el: any) => {
  componentRef.value = el
  dropTarget(el)
  handleDragPreview(el)
}

const setHandleRef = (el: any) => {
  handleRef.value = el
  handleDragSource(el)
}

watch([selectedId, () => props.schema.id], () => {
  if (selectedId.value === props.schema.id || dropCollected.value.isOver) {
    update()
  }
})
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

  <Teleport
    v-if="shouldShowOverlay"
    to="body"
  >
    <ComponentOverlay
      :overlay-rect="overlayRect"
      :z-index="overlayZIndex"
      :indicator-position="indicatorPosition"
      :is-drop-over="dropCollected.isOver"
      :is-selected="selectedId === schema.id"
      :handle-delete-button-click="handleDeleteButtonClick"
      :handle-drag-source="setHandleRef"
      :schema="schema"
    />
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
