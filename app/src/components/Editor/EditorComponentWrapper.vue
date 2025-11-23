<script setup lang="ts">
import { computed } from 'vue'
import { useEditorStore } from '@/stores/editor'
import { useComponentStore } from '@/stores/component'
import type { ComponentSchema } from '@/types/component'
import DynamicRenderer from '@/components/Render/DynamicRenderer.vue'

interface Props {
  schema: ComponentSchema
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
  if (event.key === 'Delete' || event.key === 'Backspace') {
    event.preventDefault()
    editorStore.deleteComponent(props.schema.id)
  }
}

function handleDeleteButtonClick() {
  editorStore.deleteComponent(props.schema.id)
}
</script>

<template>
  <div
    class="component-wrapper relative"
    :class="{
      'selected': selectedId === schema.id,
      'mb-2': !schema.style.margin,
      'inline-block align-top mr-2': displayType === 'inline-block'
    }"
    tabindex="0"
    @click="handleComponentClick"
    @keydown="handleDeleteComponent"
  >
    <!-- 选中高亮边框 -->
    <div
      v-if="selectedId === schema.id"
      class="absolute inset-[-2px] border-2 border-blue-500 pointer-events-none z-10 rounded"
    />

    <!-- 拖拽手柄和操作栏 -->
    <div
      v-if="selectedId === schema.id"
      class="absolute -top-6 left-[-2px] bg-blue-500 text-white text-xs px-2 py-1 rounded-t z-20 flex items-center"
    >
      <span class="cursor-move drag-handle mr-2">⠿ {{ schema.label }}</span>
      <button
        class="delete-btn bg-transparent hover:bg-white/20 p-1 rounded"
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
