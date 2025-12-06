<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useEditorStore } from '@/stores/editor'
import { useComponentStore } from '@/stores/component'

import { allComponents } from '@/config/components'
import { pageRootMeta } from '@/config/components/pageRoot'
import PreviewRenderer from '@/components/Render/PreviewRenderer.vue'
import type { PageConfig } from '@/types/editor'

const route = useRoute()
const editorStore = useEditorStore()
const componentStore = useComponentStore()

const pageConfig = ref<PageConfig | null>(null)

onMounted(() => {

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
