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
        // setPageConfig will also sync dataSources into the dataSourceStore (with default {} for compatibility)
        editorStore.setPageConfig(config)

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
