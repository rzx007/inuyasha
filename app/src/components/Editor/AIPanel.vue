<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue'
import { Sparkles, Send, Square, Settings2, Trash2, Loader2, Bot, User } from 'lucide-vue-next'
import { Switch } from '@/components/ui/switch'
import { throttle } from 'lodash-es'
import { AIClient } from '@inuyasha/ai-renderer'
import type { AIComponentNode } from '@inuyasha/ai-renderer'
import { useEditor, useComponentMeta } from '@inuyasha/vue'
import { buildAICatalog } from '@/utils/ai/adapter'
import {
  normalizeAIOutput,
  replaceStreamingIds,
  buildMetaMap
} from '@/utils/ai/normalizer'

const editorStore = useEditor()
const componentMetaStore = useComponentMeta()

// 配置
const apiKey = ref(localStorage.getItem('ai-api-key') ?? '')
const baseURL = ref(localStorage.getItem('ai-base-url') ?? 'https://api.deepseek.com')
const model = ref(localStorage.getItem('ai-model') ?? 'deepseek-chat')
const useStreaming = ref(localStorage.getItem('ai-use-streaming') !== 'false') // 默认开启流式
const showSettings = ref(!apiKey.value)

// 聊天状态
const userInput = ref('')
const isGenerating = ref(false)
const streamingText = ref('')
const messages = ref<Array<{ role: 'user' | 'assistant'; content: string; isError?: boolean }>>([])
const messagesContainer = ref<HTMLElement | null>(null)
let abortHandle: { abort: () => void } | null = null

// 自动滚动到底部
function scrollToBottom() {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

watch([messages, streamingText], scrollToBottom, { deep: true })

watch(useStreaming, v => {
  localStorage.setItem('ai-use-streaming', String(v))
})

// 保存配置
function saveSettings() {
  localStorage.setItem('ai-api-key', apiKey.value)
  localStorage.setItem('ai-base-url', baseURL.value)
  localStorage.setItem('ai-model', model.value)
  localStorage.setItem('ai-use-streaming', String(useStreaming.value))
  showSettings.value = false
}

// 清空对话
function clearMessages() {
  messages.value = []
  streamingText.value = ''
}

// AI Client 实例
function getClient(): AIClient {
  return new AIClient({
    apiKey: apiKey.value,
    baseURL: baseURL.value || undefined,
    defaultModel: model.value || undefined
  })
}

// 构建 AI 上下文
function buildContext() {
  const allMetas = componentMetaStore.getAllComponents()
  const catalog = buildAICatalog(allMetas)
  const selection = editorStore.selectedComponent?.schema ?? undefined
  return { catalog, selection }
}

// ---- 流式渲染状态 ----
// 当前流式生成中的占位组件 ID，用于实时替换
let streamingComponentId: string | null = null
// 目标父组件 ID
let streamingParentId: string | null = null

/**
 * 获取组件应该插入的父容器 ID
 */
function getTargetParentId(): string {
  const pageRoot = editorStore.getPageRoot()
  if (
    editorStore.selectedComponent?.schema?.type === 'container' ||
    editorStore.selectedComponent?.schema?.type === 'flex-container' ||
    editorStore.selectedComponent?.schema?.type === 'pageRoot'
  ) {
    return editorStore.selectedComponent.schema.id
  }
  return pageRoot.id
}

/**
 * 将 AI 局部输出实时更新到画布
 * 首次调用时插入占位组件，后续调用替换其内容
 */
function updateCanvasWithPartial(node: AIComponentNode) {
  const allMetas = componentMetaStore.getAllComponents()
  const metaMap = buildMetaMap(allMetas)
  const pageRoot = editorStore.getPageRoot()
  const existingComponents = pageRoot.children ?? []

  // 如果 node 没有 type，说明数据还太少，跳过
  if (!node.type) {
    return
  }

  const schema = normalizeAIOutput(node, metaMap, existingComponents, {
    forStreaming: true
  })

  if (!streamingComponentId) {
    // 首次：插入到画布，记住 ID
    streamingParentId = getTargetParentId()
    streamingComponentId = schema.id
    editorStore.addComponent(schema, streamingParentId)
  } else {
    // 后续：用新的子树替换占位组件的内容
    editorStore.updateComponent(streamingComponentId, {
      props: schema.props,
      style: schema.style,
      children: schema.children
    })
  }
}

/**
 * 节流版本的画布更新，避免过于频繁的重渲染
 */
const throttledUpdateCanvas = throttle((node: AIComponentNode) => {
  updateCanvasWithPartial(node)
}, 300)

/**
 * 非流式模式：将完整 AI 输出一次性注入编辑器
 */
function injectToEditor(node: AIComponentNode) {
  const allMetas = componentMetaStore.getAllComponents()
  const metaMap = buildMetaMap(allMetas)
  const pageRoot = editorStore.getPageRoot()
  const existingComponents = pageRoot.children ?? []

  const schema = normalizeAIOutput(node, metaMap, existingComponents)
  const parentId = getTargetParentId()
  editorStore.addComponent(schema, parentId)
}

/**
 * 将最终完整的 AI 输出注入编辑器（替换占位组件）
 */
function finalizeCanvas(node: AIComponentNode) {
  const allMetas = componentMetaStore.getAllComponents()
  const metaMap = buildMetaMap(allMetas)
  const pageRoot = editorStore.getPageRoot()
  const existingComponents = pageRoot.children ?? []

  const rawSchema = normalizeAIOutput(node, metaMap, existingComponents, {
    forStreaming: true
  })
  const schema = replaceStreamingIds(rawSchema)

  if (streamingComponentId) {
    // 用正式 ID 的完整数据更新占位组件（子节点已替换为 nanoid）
    editorStore.updateComponent(streamingComponentId, {
      props: schema.props,
      style: schema.style,
      children: schema.children
    })
  } else {
    const parentId = getTargetParentId()
    editorStore.addComponent(schema, parentId)
  }

  streamingComponentId = null
  streamingParentId = null
}

// 发送消息
async function handleSend() {
  const prompt = userInput.value.trim()
  if (!prompt || isGenerating.value) {
    return
  }

  if (!apiKey.value) {
    showSettings.value = true
    return
  }

  // 重置流式渲染状态
  streamingComponentId = null
  streamingParentId = null

  messages.value.push({ role: 'user', content: prompt })
  userInput.value = ''
  isGenerating.value = true
  streamingText.value = ''

  const client = getClient()
  const context = buildContext()

  if (useStreaming.value) {
    // 流式模式
    try {
      abortHandle = await client.streamUI(
        prompt,
        context,
        {
          onChunk: partialData => {
            streamingText.value = JSON.stringify(partialData, null, 2)
            throttledUpdateCanvas(partialData as AIComponentNode)
          },
          onComplete: result => {
            throttledUpdateCanvas.cancel()
            finalizeCanvas(result)
            isGenerating.value = false
            streamingText.value = ''
            messages.value.push({
              role: 'assistant',
              content: JSON.stringify(result, null, 2)
            })
          },
          onError: error => {
            throttledUpdateCanvas.cancel()
            isGenerating.value = false
            streamingText.value = ''
            if (streamingComponentId) {
              editorStore.deleteComponent(streamingComponentId)
              streamingComponentId = null
              streamingParentId = null
            }
            messages.value.push({
              role: 'assistant',
              content: error.message,
              isError: true
            })
          }
        },
        { model: model.value }
      )
    } catch (error) {
      isGenerating.value = false
      messages.value.push({
        role: 'assistant',
        content: error instanceof Error ? error.message : String(error),
        isError: true
      })
    }
  } else {
    // 非流式模式：等完整输出后一次性渲染
    let cancelled = false
    abortHandle = {
      abort: () => {
        cancelled = true
      }
    }

    try {
      const result = await client.generateUI(prompt, context, {
        model: model.value
      })
      if (cancelled) {
        return
      }

      injectToEditor(result.root)
      messages.value.push({
        role: 'assistant',
        content: JSON.stringify(result.root, null, 2)
      })
    } catch (error) {
      if (cancelled) {
        return
      }
      messages.value.push({
        role: 'assistant',
        content: error instanceof Error ? error.message : String(error),
        isError: true
      })
    } finally {
      isGenerating.value = false
      abortHandle = null
    }
  }
}

// 停止生成
function handleStop() {
  throttledUpdateCanvas.cancel()
  abortHandle?.abort()
  abortHandle = null
  isGenerating.value = false
  streamingText.value = ''
  // 停止时保留已渲染的部分内容（不删除占位组件）
  streamingComponentId = null
  streamingParentId = null
}

// 快捷键发送
function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSend()
  }
}

const displayMessages = computed(() => {
  const result = [...messages.value]
  if (streamingText.value) {
    result.push({ role: 'assistant', content: streamingText.value })
  }
  return result
})

// 快捷提示
const quickPrompts = ['生成一个登录表单', '创建一个数据仪表盘', '两列布局，左侧导航右侧内容']
function useQuickPrompt(prompt: string) {
  userInput.value = prompt
}
</script>

<template>
  <div class="ai-panel flex flex-col h-full">
    <!-- 标题栏 -->
    <div class="flex items-center justify-between px-4 py-3 border-b border-slate-100">
      <div class="flex items-center gap-2 text-slate-700">
        <div class="p-1 bg-violet-50 rounded-md">
          <Sparkles :size="14" class="text-primary-500" />
        </div>
        <span class="text-sm font-semibold">AI 助手</span>
      </div>
      <div class="flex items-center gap-1">
        <button
          v-if="messages.length > 0"
          class="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          title="清空对话"
          @click="clearMessages"
        >
          <Trash2 :size="13" />
        </button>
        <button
          class="p-1.5 rounded-md transition-colors"
          :class="
            showSettings
              ? 'text-primary-500 bg-primary-50'
              : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
          "
          title="设置"
          @click="showSettings = !showSettings"
        >
          <Settings2 :size="13" />
        </button>
      </div>
    </div>

    <!-- 设置面板 -->
    <Transition name="settings">
      <div v-if="showSettings" class="border-b border-slate-100 bg-slate-50/50">
        <div class="p-4 space-y-3">
          <div>
            <label
              class="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1.5 block"
              >API Key</label
            >
            <input
              v-model="apiKey"
              type="password"
              class="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400 transition-shadow"
              placeholder="sk-..."
            />
          </div>
          <div>
            <label
              class="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1.5 block"
              >Base URL</label
            >
            <input
              v-model="baseURL"
              type="text"
              class="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400 transition-shadow"
              placeholder="https://api.deepseek.com"
            />
          </div>
          <div>
            <label
              class="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1.5 block"
              >模型</label
            >
            <input
              v-model="model"
              type="text"
              class="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400 transition-shadow"
              placeholder="deepseek-chat"
            />
          </div>
          <div class="flex items-center justify-between py-1">
            <label
              class="text-[11px] font-medium text-slate-500 uppercase tracking-wider"
              for="ai-streaming"
              >流式渲染</label
            >
            <Switch
              id="ai-streaming"
              :checked="useStreaming"
              @update:checked="(v: boolean) => (useStreaming = v)"
            />
          </div>
          <p class="text-[10px] text-slate-400 -mt-1">
            开启时实时显示生成过程，关闭时等完整输出后一次性渲染
          </p>
          <button
            class="w-full py-1.5 text-xs font-medium bg-primary-500 text-white rounded-md hover:bg-primary-600 active:bg-primary-700 transition-colors"
            @click="saveSettings"
          >
            保存配置
          </button>
        </div>
      </div>
    </Transition>

    <!-- 消息列表 -->
    <div ref="messagesContainer" class="flex-1 overflow-y-auto">
      <!-- 空状态 -->
      <div
        v-if="displayMessages.length === 0"
        class="flex flex-col items-center justify-center h-full px-4"
      >
        <div class="p-3 bg-violet-50 rounded-xl mb-3">
          <Sparkles :size="20" class="text-primary-400" />
        </div>
        <p class="text-sm font-medium text-slate-600 mb-1">描述你想要的界面</p>
        <p class="text-xs text-slate-400 mb-5">AI 将自动生成组件并添加到画布</p>

        <!-- 快捷提示 -->
        <div class="w-full space-y-1.5">
          <button
            v-for="prompt in quickPrompts"
            :key="prompt"
            class="w-full text-left px-3 py-2 text-xs text-slate-500 bg-slate-50 hover:bg-primary-50 hover:text-primary-600 rounded-lg border border-slate-100 hover:border-primary-200 transition-colors"
            @click="useQuickPrompt(prompt)"
          >
            {{ prompt }}
          </button>
        </div>
      </div>

      <!-- 消息 -->
      <div v-else class="p-3 space-y-3">
        <div
          v-for="(msg, idx) in displayMessages"
          :key="idx"
          class="flex gap-2"
          :class="msg.role === 'user' ? 'flex-row-reverse' : ''"
        >
          <!-- 头像 -->
          <div
            class="shrink-0 w-6 h-6 rounded-md flex items-center justify-center mt-0.5"
            :class="msg.role === 'user' ? 'bg-slate-100' : 'bg-primary-50'"
          >
            <User v-if="msg.role === 'user'" :size="12" class="text-slate-500" />
            <Bot v-else :size="12" class="text-primary-500" />
          </div>

          <!-- 消息内容 -->
          <div
            class="min-w-0 max-w-[85%] rounded-lg px-3 py-2 text-xs leading-relaxed"
            :class="[
              msg.role === 'user'
                ? 'bg-primary-500 text-white'
                : msg.isError
                  ? 'bg-red-50 text-red-600 border border-red-100'
                  : 'bg-slate-50 text-slate-700 border border-slate-100'
            ]"
          >
            <pre
              v-if="msg.role === 'assistant' && !msg.isError"
              class="whitespace-pre-wrap font-mono text-[11px] leading-relaxed overflow-x-auto"
              >{{ msg.content }}</pre
            >
            <span v-else>{{ msg.content }}</span>
          </div>
        </div>

        <!-- 生成中指示器 -->
        <div v-if="isGenerating && !streamingText" class="flex gap-2">
          <div class="shrink-0 w-6 h-6 rounded-md flex items-center justify-center bg-primary-50">
            <Loader2 :size="12" class="text-primary-500 animate-spin" />
          </div>
          <div class="bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">
            <span class="text-xs text-slate-400">正在生成...</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 输入区域 -->
    <div class="p-3 border-t border-slate-100 bg-white">
      <div class="relative">
        <textarea
          v-model="userInput"
          class="w-full px-3 py-2 pr-10 text-xs bg-slate-50 border border-slate-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400 focus:bg-white transition-all placeholder:text-slate-400"
          rows="2"
          placeholder="描述你想要的界面... (Enter 发送，Shift+Enter 换行)"
          :disabled="isGenerating"
          @keydown="handleKeydown"
        />
        <!-- 发送/停止按钮 -->
        <button
          v-if="isGenerating"
          class="absolute right-2 bottom-2 p-1.5 rounded-md bg-red-500 text-white hover:bg-red-600 active:bg-red-700 transition-colors shadow-sm"
          title="停止生成"
          @click="handleStop"
        >
          <Square :size="12" />
        </button>
        <button
          v-else
          class="absolute right-2 bottom-2 p-1.5 rounded-md transition-all shadow-sm"
          :class="
            userInput.trim()
              ? 'bg-primary text-white hover:bg-primary/70 active:bg-primary/80'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          "
          title="发送 (Enter)"
          :disabled="!userInput.trim()"
          @click="handleSend"
        >
          <Send :size="12" />
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.settings-enter-active,
.settings-leave-active {
  transition: all 0.2s ease;
  overflow: hidden;
}
.settings-enter-from,
.settings-leave-to {
  max-height: 0;
  opacity: 0;
}
.settings-enter-to,
.settings-leave-from {
  max-height: 300px;
  opacity: 1;
}
</style>
