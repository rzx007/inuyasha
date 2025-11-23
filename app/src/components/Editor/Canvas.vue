<script setup lang="ts">
import { computed } from 'vue'
import { VueDraggable } from 'vue-draggable-plus'
import { useEditorStore } from '@/stores/editor'
import EditorComponentWrapper from '@/components/Editor/EditorComponentWrapper.vue'

const editorStore = useEditorStore()

const components = computed({
  get: () => editorStore.pageConfig.components,
  set: (value) => {
    editorStore.setPageConfig({
      ...editorStore.pageConfig,
      components: value,
      updatedAt: Date.now(),
    })
  },
})

// 点击空白区域取消选中
function handleCanvasClick() {
  editorStore.selectComponent(null)
}
</script>

<template>
  <div
    class="canvas-container h-full overflow-auto bg-gray-100"
    @click="handleCanvasClick"
  >
    <div class="canvas-content min-h-full p-4">
      <VueDraggable
        v-model="components"
        group="components"
        :animation="200"
        handle=".drag-handle"
        item-key="id"
        class="min-h-full"
        :class="{ 'is-empty': components.length === 0 }"
      >
        <EditorComponentWrapper
          v-for="component in components"
          :key="component.id"
          :schema="component"
        />
      </VueDraggable>
      
      <!-- 空状态提示 -->
      <div
        v-if="components.length === 0"
        class="empty-canvas absolute inset-0 flex items-center justify-center text-gray-400 pointer-events-none"
      >
        <div class="text-center">
          <div class="text-4xl mb-2">📋</div>
          <div>从左侧组件库拖拽添加组件</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.canvas-content {
  position: relative;
}

/* 当画布为空时，给拖拽区域一个最小高度和视觉提示 */
.is-empty {
  min-height: 400px;
  border: 2px dashed #d1d5db;
  border-radius: 4px;
  background-color: #f9fafb;
}
</style>
