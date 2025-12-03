<script setup lang="ts">
import { useEditorStore } from '@/stores/editor'
import { Button } from '@/components/ui/button'
import { useRouter } from 'vue-router'

const editorStore = useEditorStore()
const router = useRouter()

const props = defineProps<{
  isDebugMode?: boolean
}>()

const emit = defineEmits<{
  (e: 'toggleDebug'): void
}>()

// 切换预览模式
function handlePreview() {
  // 1. Generate a unique ID for the current page config if it doesn't have one
  const pageId = editorStore.pageConfig.id || 'current-page'
  editorStore.pageConfig.id = pageId

  // 2. Save the current config to localStorage
  localStorage.setItem(`page-config-${pageId}`, JSON.stringify(editorStore.pageConfig))

  // 3. Open the preview page in a new tab
  router.push(`/preview/${pageId}`)
}

// 保存配置
function handleSave() {
  const config = editorStore.pageConfig
  localStorage.setItem('page-config', JSON.stringify(config))
  // 这里可以添加提示消息
  console.log('配置已保存', config)
}

// 清空画布
function handleClear() {
  if (confirm('确定要清空画布吗？')) {
    editorStore.setPageConfig({
      ...editorStore.pageConfig,
      components: [],
      updatedAt: Date.now(),
    })
  }
}
</script>

<template>
  <div class="toolbar h-14 flex items-center justify-between px-4 bg-white border-b border-gray-200">
    <div class="flex items-center gap-2">
      <h2 class="text-lg font-semibold text-gray-800">低代码编辑器</h2>
    </div>
    
    <div class="flex items-center gap-2">
      <Button 
        @click="emit('toggleDebug')" 
        :variant="props.isDebugMode ? 'default' : 'outline'"
      >
        {{ props.isDebugMode ? '画布' : '调试' }}
      </Button>
      <Button @click="handleSave" variant="outline">保存</Button>
      <Button @click="handleClear" variant="destructive">清空</Button>
      <Button
        variant="default"
        @click="handlePreview"
      >
        预览
      </Button>
    </div>
  </div>
</template>

