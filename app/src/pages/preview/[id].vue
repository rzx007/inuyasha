<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useEditorStore } from '@/stores/editor'
import { useComponentStore } from '@/stores/component'

import { allComponents } from '@/config/components'
import { pageRootMeta } from '@/config/components/pageRoot'
import PreviewRenderer from '@/components/Render/PreviewRenderer.vue'
import type { PageConfig } from '@/types/editor'

import { useDataSourceStore } from '@/stores/dataSource'

const route = useRoute()
const editorStore = useEditorStore()
const componentStore = useComponentStore()
const dataSourceStore = useDataSourceStore()

const pageConfig = ref<PageConfig | null>(null)

onMounted(async () => { // Make it async

  // Register all components, so the renderer knows about them
  componentStore.registerComponents(allComponents)
  componentStore.registerComponent(pageRootMeta)

  // @ts-ignore - route.params type issue
  const pageId = String(route.params.id || '')
  if (pageId) {
    const savedConfig = localStorage.getItem(`page-config-${pageId}`)
    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig)
        pageConfig.value = config
        // Also set it in the store so data sources and event engine can access it
        editorStore.setPageConfig(config)
        
        // 恢复数据源 (如果需要)
        // 注意：目前 dataSourceStore 没有与 pageConfig 一起持久化，
        // 假设在真实应用中，dataSources 应该从服务端加载或存储在 pageConfig 中。
        // 这里我们假设 dataSources 已经在内存中 (因为是预览模式，通常在同一会话中)
        // 但如果是在新标签页打开预览，dataSources 将丢失。
        // 为了演示，我们需要将 dataSources 也保存到 localStorage。
        
        // 尝试从 localStorage 恢复 dataSources
        const savedDataSources = localStorage.getItem(`data-sources-${pageId}`)
        if (savedDataSources) {
          try {
             const sources = JSON.parse(savedDataSources)
             // 批量添加到 store
             Object.values(sources).forEach((ds: any) => {
               if (ds.id) {
                 dataSourceStore.updateDataSource(ds.id, ds)
               } else {
                 dataSourceStore.addDataSource(ds)
               }
             })
          } catch(e) { console.error('Failed to load data sources', e) }
        }

        // 自动触发 AutoFetch 的 API
        Object.values(dataSourceStore.dataSources).forEach(ds => {
          if (ds.type === 'api' && (ds.config as any).autoFetch) {
            dataSourceStore.fetchDataSource(ds.id)
          }
        })
        
      } catch (e) {
        console.error('Failed to load page config for preview:', e)
      }
    }
  }
})
</script>

<template>
  <div v-if="pageConfig" class="preview-page">
    <PreviewRenderer :schema="pageConfig.rootComponent" />
  </div>
  <div v-else class="flex items-center justify-center h-screen text-gray-500">
    Loading preview or page configuration not found...
  </div>
</template>
