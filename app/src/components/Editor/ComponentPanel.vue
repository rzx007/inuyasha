<script setup lang="ts">
import { computed, ref } from 'vue'
import { Search } from 'lucide-vue-next'
import { Input } from '@/components/ui/input'
import { VueDraggable } from 'vue-draggable-plus'
import { useComponentStore } from '@/stores/component'
import { useEditorStore } from '@/stores/editor'
import { createComponent } from '@/utils/componentRegistry'
import type { ComponentMeta } from '@/types/component'
import { getIconComponent } from '@/utils/iconMapping'

const componentStore = useComponentStore()
const editorStore = useEditorStore()

// 搜索关键词
const searchKeyword = ref('')

// 过滤组件函数
function filterComponents(components: ComponentMeta[], keyword: string): ComponentMeta[] {
  if (!keyword.trim()) {
    return components
  }
  const lowerKeyword = keyword.toLowerCase().trim()
  return components.filter(meta => 
    meta.name.toLowerCase().includes(lowerKeyword) ||
    meta.type.toLowerCase().includes(lowerKeyword)
  )
}

// 按分类获取组件（带搜索过滤）
const baseComponents = computed({
  get: () => filterComponents(componentStore.getComponentsByCategory('base'), searchKeyword.value),
  set: () => {} 
})
const layoutComponents = computed({
  get: () => filterComponents(componentStore.getComponentsByCategory('layout'), searchKeyword.value),
  set: () => {}
})
const dataComponents = computed({
  get: () => filterComponents(componentStore.getComponentsByCategory('data'), searchKeyword.value),
  set: () => {}
})
const formComponents = computed({
  get: () => filterComponents(componentStore.getComponentsByCategory('form'), searchKeyword.value),
  set: () => {}
})

// 判断是否有搜索结果
const hasSearchResults = computed(() => 
  baseComponents.value.length > 0 ||
  layoutComponents.value.length > 0 ||
  dataComponents.value.length > 0 ||
  formComponents.value.length > 0
)

//克隆组件时，我们只传递组件类型。 画布接收到这个对象，并用它来创建真正的组件实例。
function cloneComponent(meta: ComponentMeta) {
  // 获取现有组件列表，用于生成语义化标识
  const existingComponents = editorStore.pageConfig.components
  return createComponent(meta.type, undefined, existingComponents)
}
</script>

<template>
  <div class="component-panel h-full flex flex-col border-gray-200">
    <div class="p-4 border-b border-slate-100">
      <div class="relative">
        <Search class="absolute left-3 top-2.5 text-slate-400" :size="16" />
        <Input
          v-model="searchKeyword"
          type="text"
          placeholder="搜索组件..."
          class="pl-9 pr-3 py-2 text-sm bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-primary transition-all"
        />
      </div>
    </div>

    <div class="flex-1 overflow-y-auto p-4">
      <!-- 无搜索结果提示 -->
      <div v-if="searchKeyword.trim() && !hasSearchResults" class="flex flex-col items-center justify-center py-12 text-slate-400">
        <Search class="mb-3 opacity-50" :size="32" />
        <p class="text-sm">未找到匹配的组件</p>
      </div>

      <!-- 基础组件 -->
      <div v-if="baseComponents.length > 0" class="mb-6">
        <h4 class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-1">
          基础组件
        </h4>
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
            class="component-item flex flex-col items-center justify-center p-3 bg-white border border-slate-200 rounded-lg hover:border-primary/70 hover:shadow-md cursor-grab active:cursor-grabbing transition-all group"
          >
            <div
              class="p-2 bg-slate-50 text-slate-600 rounded-md group-hover:bg-primary/10 group-hover:text-primary transition-colors mb-2"
            >
              <component :is="getIconComponent(meta.icon)" :size="16" />
            </div>
            <div class="text-xs font-medium text-slate-600 group-hover:text-slate-900 text-center">
              {{ meta.name }}
            </div>
          </div>
        </VueDraggable>
      </div>

      <!-- 布局组件 -->
      <div v-if="layoutComponents.length > 0" class="mb-6">
        <h4 class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-1">
          布局组件
        </h4>
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
            class="component-item flex flex-col items-center justify-center p-3 bg-white border border-slate-200 rounded-lg hover:border-primary/70 hover:shadow-md cursor-grab active:cursor-grabbing transition-all group"
          >
            <div
              class="p-2 bg-slate-50 text-slate-600 rounded-md group-hover:bg-primary/10 group-hover:text-primary transition-colors mb-2"
            >
              <component :is="getIconComponent(meta.icon)" :size="16" />
            </div>
            <div class="text-xs font-medium text-slate-600 group-hover:text-slate-900 text-center">
              {{ meta.name }}
            </div>
          </div>
        </VueDraggable>
      </div>

      <!-- 数据展示组件 -->
      <div v-if="dataComponents.length > 0" class="mb-6">
        <h4 class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-1">
          数据展示
        </h4>
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
            class="component-item flex flex-col items-center justify-center p-3 bg-white border border-slate-200 rounded-lg hover:border-primary/70 hover:shadow-md cursor-grab active:cursor-grabbing transition-all group"
          >
            <div
              class="p-2 bg-slate-50 text-slate-600 rounded-md group-hover:bg-primary/10 group-hover:text-primary transition-colors mb-2"
            >
              <component :is="getIconComponent(meta.icon)" :size="16" />
            </div>
            <div class="text-xs font-medium text-slate-600 group-hover:text-slate-900 text-center">
              {{ meta.name }}
            </div>
          </div>
        </VueDraggable>
      </div>

      <!-- 表单组件 -->
      <div v-if="formComponents.length > 0" class="mb-6">
        <h4 class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-1">
          表单组件
        </h4>
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
            class="component-item flex flex-col items-center justify-center p-3 bg-white border border-slate-200 rounded-lg hover:border-primary/70 hover:shadow-md cursor-grab active:cursor-grabbing transition-all group"
          >
            <div
              class="p-2 bg-slate-50 text-slate-600 rounded-md group-hover:bg-primary/10 group-hover:text-primary transition-colors mb-2"
            >
              <component :is="getIconComponent(meta.icon)" :size="16" />
            </div>
            <div class="text-xs font-medium text-slate-600 group-hover:text-slate-900 text-center">
              {{ meta.name }}
            </div>
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
