<script setup lang="ts">
import { ref, computed } from 'vue'
import { onMounted } from 'vue'
import { useComponentStore } from '@/stores/component'
import { useEditorStore } from '@/stores/editor'

import { allComponents } from '@/config/components'
import ComponentPanel from '@/components/Editor/ComponentPanel.vue'
import DataSourcePanel from '@/components/Editor/DataSourcePanel.vue'
import DebugPanel from '@/components/Editor/DebugPanel.vue'
import Canvas from '@/components/Editor/Canvas.vue'
import PropertyPanel from '@/components/Editor/PropertyPanel.vue'
import Toolbar from '@/components/Editor/Toolbar.vue'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

const componentStore = useComponentStore()
const editorStore = useEditorStore()

const activeLeftTab = ref('components')
const showDebugPanel = ref(false)

const currentView = computed(() => showDebugPanel.value ? DebugPanel : Canvas)

onMounted(() => {
  componentStore.registerComponents(allComponents)
  
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
})
</script>

<template>
  <div class="editor-page h-screen flex flex-col bg-gray-50">
    <!-- 工具栏 -->
    <Toolbar 
      :is-debug-mode="showDebugPanel" 
      @toggle-debug="showDebugPanel = !showDebugPanel" 
    />
    
    <!-- 编辑器主体 -->
    <div class="flex-1 flex overflow-hidden">
      <!-- 左侧面板 -->
      <div class="w-72 shrink-0 bg-white border-r border-gray-200">
        <Tabs v-model="activeLeftTab" class="h-full flex flex-col">
          <TabsList class="w-full justify-start rounded-none border-b">
            <TabsTrigger value="components">Components</TabsTrigger>
            <TabsTrigger value="data">Data Sources</TabsTrigger>
          </TabsList>
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
</template>


