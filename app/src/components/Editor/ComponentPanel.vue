<script setup lang="ts">
import { computed } from 'vue'
import { VueDraggable } from 'vue-draggable-plus'
import { useComponentStore } from '@/stores/component'
import { createComponent } from '@/utils/componentRegistry'
import type { ComponentMeta } from '@/types/component'

const componentStore = useComponentStore()

// 按分类获取组件
const baseComponents = computed(() =>
  componentStore.getComponentsByCategory('base')
)
const layoutComponents = computed(() =>
  componentStore.getComponentsByCategory('layout')
)

const dataComponents = computed(() =>
  componentStore.getComponentsByCategory('data')
)

const formComponents = computed(() =>
  componentStore.getComponentsByCategory('form')
)

// 克隆组件时，我们只传递组件类型。
// 画布的 @add 事件会接收到这个对象，并用它来创建真正的组件实例。
function cloneComponent(meta: ComponentMeta) {
  return createComponent(meta.type)
}
</script>

<template>
  <div class="component-panel h-full flex flex-col bg-gray-50 border-r border-gray-200">
    <div class="p-4 border-b border-gray-200">
      <h3 class="text-lg font-semibold text-gray-800">组件库</h3>
    </div>
    
    <div class="flex-1 overflow-y-auto p-4">
      <!-- 基础组件 -->
      <div class="mb-6">
        <h4 class="text-sm font-medium text-gray-600 mb-3">基础组件</h4>
        <VueDraggable
          v-model="baseComponents"
          :sort="false"
          :group="{ name: 'components', pull: 'clone', put: false }"
          :clone="cloneComponent"
          item-key="type"
          class="grid grid-cols-2 gap-2"
        >
          <div
            v-for="meta in baseComponents"
            :key="meta.type"
            class="component-item p-3 bg-white rounded border border-gray-200 cursor-move hover:border-blue-500 hover:shadow-sm transition-all"
          >
            <div class="text-2xl mb-1">{{ meta.icon }}</div>
            <div class="text-xs text-gray-600">{{ meta.name }}</div>
          </div>
        </VueDraggable>
      </div>
      
      <!-- 布局组件 -->
      <div class="mb-6">
        <h4 class="text-sm font-medium text-gray-600 mb-3">布局组件</h4>
        <VueDraggable
          v-model="layoutComponents"
          :sort="false"
          :group="{ name: 'components', pull: 'clone', put: false }"
          :clone="cloneComponent"
          item-key="type"
          class="grid grid-cols-2 gap-2"
        >
          <div
            v-for="meta in layoutComponents"
            :key="meta.type"
            class="component-item p-3 bg-white rounded border border-gray-200 cursor-move hover:border-blue-500 hover:shadow-sm transition-all"
          >
            <div class="text-2xl mb-1">{{ meta.icon }}</div>
            <div class="text-xs text-gray-600">{{ meta.name }}</div>
          </div>
        </VueDraggable>
      </div>

      <!-- 数据展示组件 -->
      <div class="mb-6">
        <h4 class="text-sm font-medium text-gray-600 mb-3">数据展示</h4>
        <VueDraggable
          v-model="dataComponents"
          :sort="false"
          :group="{ name: 'components', pull: 'clone', put: false }"
          :clone="cloneComponent"
          item-key="type"
          class="grid grid-cols-2 gap-2"
        >
          <div
            v-for="meta in dataComponents"
            :key="meta.type"
            class="component-item p-3 bg-white rounded border border-gray-200 cursor-move hover:border-blue-500 hover:shadow-sm transition-all"
          >
            <div class="text-2xl mb-1">{{ meta.icon }}</div>
            <div class="text-xs text-gray-600">{{ meta.name }}</div>
          </div>
        </VueDraggable>
      </div>

      <!-- 表单组件 -->
      <div class="mb-6">
        <h4 class="text-sm font-medium text-gray-600 mb-3">表单组件</h4>
        <VueDraggable
          v-model="formComponents"
          :sort="false"
          :group="{ name: 'components', pull: 'clone', put: false }"
          :clone="cloneComponent"
          item-key="type"
          class="grid grid-cols-2 gap-2"
        >
          <div
            v-for="meta in formComponents"
            :key="meta.type"
            class="component-item p-3 bg-white rounded border border-gray-200 cursor-move hover:border-blue-500 hover:shadow-sm transition-all"
          >
            <div class="text-2xl mb-1">{{ meta.icon }}</div>
            <div class="text-xs text-gray-600">{{ meta.name }}</div>
          </div>
        </VueDraggable>
      </div>
    </div>
  </div>
</template>

<style scoped>
.component-item {
  user-select: none;
}
</style>

