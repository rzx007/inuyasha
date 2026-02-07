<script setup lang="ts">
import { computed } from 'vue'
import { useEditorStore } from '@/stores/editor'
import DynamicRenderer from '@/components/Render/DynamicRenderer.vue'

const editorStore = useEditorStore()

const rootComponent = computed(() => {
  return editorStore.pageConfig.rootComponent
})

const hasChildren = computed(() => {
  return rootComponent.value.children && rootComponent.value.children.length > 0
})

// 点击空白区域取消选中
function handleCanvasClick() {
  editorStore.selectComponent(null)
}
</script>

<template>
  <div
    class="canvas-container relative h-full bg-gray-100"
    @click="handleCanvasClick"
  >
    <div class="canvas-content overflow-auto h-full p-4">
      <!-- {{ rootComponent }} -->
      <DynamicRenderer :schema="rootComponent" />

      <!-- 空状态提示 -->
      <div
        v-if="!hasChildren"
        class="empty-canvas absolute inset-0 flex items-center justify-center text-gray-400 pointer-events-none"
      >
        <div class="text-center">
          <div class="text-4xl mb-2">
            📋
          </div>
          <div>从左侧组件库拖拽添加组件</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 当画布为空时，给拖拽区域一个最小高度和视觉提示 */
.is-empty {
  min-height: 400px;
  border: 2px dashed #d1d5db;
  border-radius: 4px;
  background-color: #f9fafb;
}
</style>
