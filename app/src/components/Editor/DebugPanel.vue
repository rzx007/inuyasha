<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useEditorStore } from '@/stores/editor'
import { createHighlighter } from 'shiki'
import { shikiToMonaco } from '@shikijs/monaco'
import { init } from 'modern-monaco'

const editorStore = useEditorStore()
const editorContainer = ref<HTMLDivElement>()
const editorInstance = ref<any>(null)
const isInitialized = ref(false)
const isLoading = ref(false)
const initError = ref<string | null>(null)

const jsonContent = computed(() => {
  return JSON.stringify(editorStore.pageConfig.components, null, 2)
})

let initPromise: Promise<void> | null = null

async function initEditor() {
  if (isInitialized.value || isLoading.value) return
  
  // 如果正在初始化，等待完成
  if (initPromise) {
    await initPromise
    return
  }

  isLoading.value = true
  initError.value = null

  initPromise = (async () => {
    try {
      // 等待 DOM 渲染完成，确保容器存在
      await nextTick()
      
      // 多次尝试等待容器渲染
      let retries = 10
      while (!editorContainer.value && retries > 0) {
        await new Promise(resolve => setTimeout(resolve, 50))
        await nextTick()
        retries--
      }
      
      if (!editorContainer.value) {
        throw new Error('编辑器容器未找到，请重试')
      }
      
      // 使用 requestIdleCallback 或 setTimeout 延迟初始化，避免阻塞 UI
      await new Promise(resolve => {
        if ('requestIdleCallback' in window) {
          requestIdleCallback(resolve, { timeout: 1000 })
        } else {
          setTimeout(resolve, 100)
        }
      })
      
      // 再次检查容器（可能在延迟期间被移除）
      if (!editorContainer.value) {
        throw new Error('编辑器容器未找到')
      }
      
      // 初始化 Monaco Editor
      const monaco = await init({
        theme: 'vitesse-light',
        langs: ['json'],
      })
      
      // 创建 Shiki 高亮器（异步，不阻塞）
      const highlighter = await createHighlighter({
        themes: ['vitesse-light', 'vitesse-light'],
        langs: ['json'],
      })

      // 将 Shiki 高亮器集成到 Monaco
      shikiToMonaco(highlighter, monaco)

      // 创建编辑器实例
      if (editorContainer.value) {
        editorInstance.value = monaco.editor.create(editorContainer.value, {
          value: jsonContent.value,
          language: 'json',
          theme: 'vitesse-light',
          readOnly: true,
          automaticLayout: true,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          wordWrap: 'on',
        })

        isInitialized.value = true
      } else {
        throw new Error('创建编辑器时容器不存在')
      }
    } catch (error) {
      console.error('初始化 Monaco Editor 失败:', error)
      initError.value = error instanceof Error ? error.message : '初始化失败'
    } finally {
      isLoading.value = false
      initPromise = null
    }
  })()

  await initPromise
}

// 监听 JSON 内容变化，更新编辑器
watch(
  jsonContent,
  (newValue) => {
    if (editorInstance.value && isInitialized.value) {
      const currentValue = editorInstance.value.getValue()
      if (currentValue !== newValue) {
        editorInstance.value.setValue(newValue)
      }
    }
  },
  { immediate: false }
)

onMounted(() => {
  // 延迟初始化，避免阻塞首次渲染
  setTimeout(() => {
    initEditor()
  }, 0)
})

onUnmounted(() => {
  if (editorInstance.value) {
    editorInstance.value.dispose()
    editorInstance.value = null
  }
  isInitialized.value = false
})
</script>

<template>
  <div class="debug-panel h-full flex flex-col bg-white overflow-hidden">
    <div class="p-4 border-b border-gray-200 shrink-0">
      <h3 class="text-lg font-semibold text-gray-800">组件配置 JSON</h3>
      <p class="text-sm text-gray-500 mt-1">实时显示 pageConfig.components 的 JSON 数据</p>
    </div>
    <!-- 容器始终存在，使用 v-show 控制显示 -->
    <div ref="editorContainer" class="flex-1 min-h-0 w-full" v-show="!isLoading && !initError"></div>
    <!-- 加载状态覆盖层 -->
    <div v-if="isLoading" class="flex-1 flex items-center justify-center absolute inset-0 bg-white z-10">
      <div class="text-center text-gray-500">
        <div class="mb-2">正在加载编辑器...</div>
      </div>
    </div>
    <!-- 错误状态覆盖层 -->
    <div v-if="initError" class="flex-1 flex items-center justify-center absolute inset-0 bg-white z-10">
      <div class="text-center text-red-500">
        <div class="mb-2">加载失败: {{ initError }}</div>
        <button 
          @click="initEditor" 
          class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          重试
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.debug-panel {
  height: 100%;
  position: relative;
}
</style>
