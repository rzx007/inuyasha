<script setup lang="ts">
import { useEditorStore } from '@/stores/editor'
import { Button } from '@/components/ui/button'
import { useRouter } from 'vue-router'
import { Trash2, Play, Save, Bug } from 'lucide-vue-next'

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
  <div
    class="toolbar h-14 flex items-center justify-between px-4 bg-background border-b sticky top-0 z-30"
  >
    <!-- 左侧：标题 -->
    <div class="flex items-center gap-2">
      <div class="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center text-sm font-semibold shadow-sm">
        LC
      </div>
      <div class="flex flex-col leading-tight">
        <span class="font-bold text-lg tracking-tight text-slate-900">Inuyasha</span>
      </div>
    </div>

    <!-- 右侧：操作按钮 -->
    <div class="flex items-center gap-2">
      <Button
        @click="emit('toggleDebug')"
        :variant="props.isDebugMode ? 'default' : 'outline'"
        size="sm"
        class="px-3 "
      >
        <Bug class="w-4 h-4" />
        {{ props.isDebugMode ? '画布' : '调试' }}
      </Button>
      <Button @click="handleSave" variant="outline" size="sm" class="px-3 text-slate-600 shadow-none">
        <Save class="w-4 h-4" />
        保存
      </Button>
      <Button @click="handleClear" variant="outline" size="sm" class="px-3 text-slate-600 shadow-none">
        <Trash2 class="w-4 h-4" />
        清空
      </Button>
      <Button
        variant="default"
        size="sm"
        class="px-5!"
        @click="handlePreview"
      >
      <Play class="w-4 h-4"/>
      预览
      </Button>
    </div>
  </div>
</template>

