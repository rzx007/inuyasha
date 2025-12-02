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
import { ElTabs, ElTabPane } from 'element-plus'

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
        <ElTabs v-model="activeLeftTab" class="h-full flex flex-col">
          <ElTabPane label="Components" name="components" class="h-full">
            <ComponentPanel />
          </ElTabPane>
          <ElTabPane label="Data Sources" name="data" class="h-full">
            <DataSourcePanel />
          </ElTabPane>
        </ElTabs>
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

<style>
.editor-page .el-tabs__header {
  margin-bottom: 0;
  padding: 0 10px;
}
.editor-page .el-tabs__content {
  flex-grow: 1;
  overflow-y: auto;
}
</style>

