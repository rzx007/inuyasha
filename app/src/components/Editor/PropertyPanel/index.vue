<script setup lang="ts">
import { computed, ref } from 'vue'
import { useEditorStore } from '@/stores/editor'
import { MousePointer2, Copy, Trash2 } from 'lucide-vue-next'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { ComponentType } from '@inuyasha/core'
import PageSettingsPanel from './PageSettingsPanel.vue'
import ComponentPropsPanel from './ComponentPropsPanel.vue'
import ComponentEventsPanel from './ComponentEventsPanel.vue'

const editorStore = useEditorStore()
const activeTab = ref('props')

const selectedComponent = computed(() => editorStore.selectedComponent)

// 判断是否显示页面设置
const showPageSettings = computed(() => {
  return !selectedComponent.value || 
         selectedComponent.value?.schema.type === ComponentType.PageRoot
})

// 复制组件
function handleCopyComponent() {
  // TODO: 实现复制组件功能
  console.log('复制组件')
}

// 删除组件
function handleDeleteComponent() {
  if (!selectedComponent.value) return
  if (selectedComponent.value.schema.type === ComponentType.PageRoot) {
    alert('无法删除页面根元素')
    return
  }
  if (confirm('确定要删除这个组件吗？')) {
    editorStore.deleteComponent(selectedComponent.value.id)
  }
}
</script>

<template>
  <div
    class="property-panel w-full h-full flex flex-col bg-white border-l border-slate-200 shrink-0"
    style="box-shadow: -4px 0 24px rgba(0, 0, 0, 0.02)"
  >
    <!-- 页面设置视图 -->
    <div v-if="showPageSettings" class="flex-1 flex flex-col overflow-hidden">
      <div class="px-4 py-4 border-b border-slate-100 bg-white">
        <h2 class="text-lg font-semibold tracking-wider text-slate-900">
          页面设置
        </h2>
      </div>

      <PageSettingsPanel />
    </div>

    <!-- 未选中组件视图 -->
    <div v-else-if="!selectedComponent" class="flex-1 flex items-center justify-center text-slate-400">
      <div class="text-center">
        <MousePointer2 :size="48" class="mb-4 text-slate-200 mx-auto" />
        <p class="text-sm font-medium">Select a component to edit</p>
      </div>
    </div>

    <!-- 组件属性编辑视图 -->
    <div v-else class="flex-1 flex flex-col overflow-hidden">
      <!-- Header -->
      <div class="px-4 py-4 border-b border-slate-100 bg-white">
        <div class="flex items-center justify-between mb-1">
          <Badge variant="secondary" class="font-semibold bg-slate-100 text-primary border border-slate-200">
            {{ selectedComponent.schema.type.toUpperCase() }}
          </Badge>

          <div class="flex gap-2 text-slate-400">
            <button
              @click="handleCopyComponent"
              class="hover:text-slate-600 transition-colors"
              title="复制组件"
            >
              <Copy :size="14" />
            </button>
            <button
              v-if="selectedComponent.schema.type !== ComponentType.PageRoot"
              @click="handleDeleteComponent"
              class="hover:text-red-500 transition-colors"
              title="删除组件"
            >
              <Trash2 :size="14" />
            </button>
          </div>
        </div>
        <h2 class="text-lg font-semibold tracking-wider text-slate-900 truncate flex items-center gap-2.5">
          {{ selectedComponent.schema.label }}
          <p class="text-xs font-thin font-mono text-slate-400 mt-1">ID: {{ selectedComponent.schema.semanticId }}</p>
        </h2>
      </div>

      <Tabs v-model="activeTab" class="flex-1 flex flex-col overflow-hidden">
        <TabsList class="tabs-list-editor">
          <TabsTrigger value="props" class="tabs-trigger-editor">属性面板</TabsTrigger>
          <TabsTrigger value="events" class="tabs-trigger-editor">事件面板</TabsTrigger>
        </TabsList>
        <TabsContent value="props" class="overflow-hidden bg-white data-[state=inactive]:hidden">
          <ComponentPropsPanel :component-id="selectedComponent.id" />
        </TabsContent>

        <TabsContent value="events" class="overflow-hidden flex-1 flex flex-col data-[state=inactive]:hidden">
          <ComponentEventsPanel :component-id="selectedComponent.id" />
        </TabsContent>
      </Tabs>
    </div>
  </div>
</template>

