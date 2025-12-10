<script setup lang="ts">
import { ref, computed } from 'vue'
import { onMounted } from 'vue'
import { DndProvider } from 'vue3-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { Layers, Database } from 'lucide-vue-next'
import { useComponentStore } from '@/stores/component'
import { useEditorStore } from '@/stores/editor'
import { pageRootMeta } from '@/config/components/pageRoot'

import { allComponents } from '@/config/components'
import ComponentPanel from '@/components/Editor/ComponentPanel.vue'
import DataSourcePanel from '@/components/Editor/DataSourcePanel/index.vue'
import DebugPanel from '@/components/Editor/DebugPanel.vue'
import Canvas from '@/components/Editor/Canvas.vue'
import PropertyPanel from '@/components/Editor/PropertyPanel/index.vue'
import Toolbar from '@/components/Editor/Toolbar.vue'
import LayersPanel from '@/components/Editor/LayersPanel.vue'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

const componentStore = useComponentStore()
const editorStore = useEditorStore()

const activeLeftTab = ref('components')
const showDebugPanel = ref(false)

const currentView = computed(() => (showDebugPanel.value ? DebugPanel : Canvas))

onMounted(() => {
  // 注册所有组件（包括 PageRoot）
  componentStore.registerComponents(allComponents)
  componentStore.registerComponent(pageRootMeta)

  // 尝试从本地存储加载配置
  const savedConfig = localStorage.getItem('page-config')
  if (savedConfig) {
    try {
      const config = JSON.parse(savedConfig)
      editorStore.setPageConfig(config)
    } catch (e) {
      console.error('加载配置失败', e)
    }
  }
  // 注意：不需要手动创建 PageRoot，因为 editorStore 初始化时已经创建了
})
</script>

<template>
  <DndProvider :backend="HTML5Backend">
    <div class="editor-page h-screen flex flex-col bg-gray-50">
      <!-- 工具栏 -->
      <Toolbar :is-debug-mode="showDebugPanel" @toggle-debug="showDebugPanel = !showDebugPanel" />

      <!-- 编辑器主体 -->
      <div class="flex-1 flex overflow-hidden">
        <!-- 左侧面板 -->
        <div class="w-72 shrink-0 bg-white border-r border-gray-200">
          <Tabs v-model="activeLeftTab" class="h-full flex flex-col">
            <TabsList class="tabs-list-editor">
              <TabsTrigger value="components" class="tabs-trigger-editor" title="组件库">
                <Layers :size="16" />
                <!-- <span>组件库</span> -->
              </TabsTrigger>
              <TabsTrigger value="data" class="tabs-trigger-editor" title="资源库">
                <Database :size="16" />
                <!-- <span>资源库</span> -->
              </TabsTrigger>
              <TabsTrigger value="layers" class="tabs-trigger-editor" title="层级树">
                <Layers :size="16" />
                <!-- <span>层级</span> -->
              </TabsTrigger>
            </TabsList>
            <TabsContent value="layers" class="h-full overflow-y-auto">
              <LayersPanel />
            </TabsContent>
            <TabsContent value="components" class="h-full overflow-y-auto">
              <ComponentPanel />
            </TabsContent>
            <TabsContent value="data" class="h-full overflow-y-auto">
              <DataSourcePanel />
            </TabsContent>
          </Tabs>
        </div>

        <!-- 画布区域 / Debug 面板 -->
        <div class="flex-1 overflow-hidden">
          <keep-alive>
            <component :is="currentView" />
          </keep-alive>
        </div>

        <!-- 属性面板 -->
        <div class="w-80 shrink-0">
          <PropertyPanel />
        </div>
      </div>
    </div>
  </DndProvider>
</template>
