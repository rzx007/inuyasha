<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, shallowRef } from 'vue'
import { createDeepSeek } from '@ai-sdk/deepseek'
import {
  Agent,
  defaultStreamFn,
  type AgentMessage,
  type AgentTool,
  type AgentEvent
} from '@inuyasha/agent-core'
import { z } from 'zod'
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton
} from '@/components/ai-elements/conversation'
import {
  Message,
  MessageContent,
  MessageResponse,
  MessageAvatar
} from '@/components/ai-elements/message'
import {
  PromptInput,
  PromptInputBody,
  PromptInputTextarea,
  PromptInputSubmit,
  PromptInputFooter
} from '@/components/ai-elements/prompt-input'
import { Tool, ToolHeader, ToolContent, ToolInput, ToolOutput } from '@/components/ai-elements/tool'
import { Button } from '@/components/ui/button'
import { Square, Settings2 } from 'lucide-vue-next'

// 配置
const apiKey = ref(localStorage.getItem('ai-api-key') ?? '')
const baseURL = ref(localStorage.getItem('ai-base-url') ?? 'https://api.deepseek.com')
const modelName = ref(localStorage.getItem('ai-model') ?? 'deepseek-chat')
const showSettings = ref(!apiKey.value)

// 消息与状态
const messages = ref<AgentMessage[]>([])
const toolCalls = ref<Array<{ toolName: string; input?: unknown; result?: unknown; isError?: boolean }>>([])
const isRunning = ref(false)
const agentRef = shallowRef<Agent | null>(null)

// 示例工具
const demoTools: Record<string, AgentTool> = {
  getWeather: {
    description: '获取指定城市的天气信息',
    parameters: z.object({ city: z.string().describe('城市名称') }),
    execute: async ({ city }) => {
      await new Promise(r => setTimeout(r, 100))
      return `${city} 天气：晴，25°C`
    }
  },
  delay: {
    description: '模拟耗时操作，用于测试 Steering',
    parameters: z.object({ ms: z.number().describe('延迟毫秒数') }),
    execute: async ({ ms }) => {
      await new Promise(r => setTimeout(r, ms))
      return `延迟 ${ms}ms 完成`
    }
  }
}

// 创建 Agent
function createAgent() {
  const model = createDeepSeek({
    apiKey: apiKey.value,
    baseURL: baseURL.value || undefined
  })(modelName.value)
  return new Agent({
    streamFn: defaultStreamFn,
    model,
    tools: demoTools,
    systemPrompt: '你是一个有帮助的助手。可以使用 getWeather 查询天气，使用 delay 模拟耗时操作。',
    maxSteps: 10
  })
}

// 订阅 Agent 事件
function subscribeAgent(agent: Agent) {
  return agent.subscribe((e: AgentEvent) => {
    if (e.type === 'message') {
      messages.value = agent.getMessages()
    } else if (e.type === 'tool-call') {
      toolCalls.value = [...toolCalls.value, { toolName: e.payload.toolName, input: e.payload.input ?? e.payload.args }]
    } else if (e.type === 'tool-result') {
      const last = toolCalls.value[toolCalls.value.length - 1]
      if (last) {
        last.result = e.payload.result
        last.isError = e.payload.isError
      }
    } else if (e.type === 'finish') {
      isRunning.value = false
      toolCalls.value = []
    } else if (e.type === 'error') {
      isRunning.value = false
      toolCalls.value = []
    }
  })
}

// 发送消息
function handleSubmit(payload: { text: string }) {
  const text = payload.text?.trim()
  if (!text) return
  if (!apiKey.value) {
    showSettings.value = true
    return
  }
  if (!agentRef.value) {
    const agent = createAgent()
    agentRef.value = agent
    onUnmounted(subscribeAgent(agent))
  }
  isRunning.value = true
  agentRef.value!.send(text)
}

// 停止
function handleStop() {
  agentRef.value?.abort()
}

// 清空
function clearMessages() {
  messages.value = []
  toolCalls.value = []
  agentRef.value = null
}

// 保存配置
function saveSettings() {
  localStorage.setItem('ai-api-key', apiKey.value)
  localStorage.setItem('ai-base-url', baseURL.value)
  localStorage.setItem('ai-model', modelName.value)
  showSettings.value = false
}

// 提取消息文本
function getMessageText(msg: AgentMessage): string {
  if (typeof msg.content === 'string') return msg.content
  if (Array.isArray(msg.content)) {
    const textPart = msg.content.find((p: any) => p.type === 'text')
    return textPart?.text ?? ''
  }
  return ''
}

// 过滤显示消息（排除 system）
const displayMessages = computed(() =>
  messages.value.filter(m => m.role !== 'system')
)
</script>

<template>
  <div class="agent-page flex flex-col h-screen bg-background">
    <!-- 头部 -->
    <header class="flex items-center justify-between px-4 py-2 border-b shrink-0">
      <h1 class="font-semibold text-lg">Agent 对话</h1>
      <div class="flex items-center gap-2">
        <Button variant="ghost" size="icon" @click="showSettings = true">
          <Settings2 class="size-4" />
        </Button>
        <Button variant="ghost" size="sm" @click="clearMessages">
          清空
        </Button>
      </div>
    </header>

    <!-- 对话区域 -->
    <Conversation class="flex-1 min-h-0">
      <ConversationContent v-if="displayMessages.length > 0">
        <template v-for="(msg, i) in displayMessages" :key="i">
          <Message v-if="msg.role === 'user'" :from="'user'">
            <MessageContent>
              <MessageResponse :content="getMessageText(msg)" />
            </MessageContent>
          </Message>
          <Message v-else-if="msg.role === 'assistant'" :from="'assistant'">
            <MessageAvatar src="/avatar.png" name="AI" />
            <MessageContent>
              <MessageResponse :content="getMessageText(msg)" />
              <!-- 工具调用展示 -->
              <template v-if="toolCalls.length > 0 && i === displayMessages.length - 1">
                <Tool v-for="(tc, j) in toolCalls" :key="j" class="mt-2">
                  <ToolHeader
                    :type="'dynamic-tool'"
                    :state="tc.result !== undefined ? (tc.isError ? 'output-error' : 'output-available') : 'input-available'"
                    :tool-name="tc.toolName"
                  />
                  <ToolContent>
                    <ToolInput v-if="tc.input" :input="tc.input" />
                    <ToolOutput
                      v-if="tc.result !== undefined"
                      :output="tc.isError ? undefined : tc.result"
                      :error-text="tc.isError ? String(tc.result) : undefined"
                    />
                  </ToolContent>
                </Tool>
              </template>
            </MessageContent>
          </Message>
        </template>
      </ConversationContent>
      <ConversationEmptyState
        v-else
        title="开始对话"
        description="输入消息与 Agent 对话，支持工具调用、Steering 和 Follow-up"
      />
      <ConversationScrollButton />
    </Conversation>

    <!-- 输入区域 -->
    <div class="p-4 border-t shrink-0">
      <PromptInput @submit="handleSubmit">
        <PromptInputBody>
          <PromptInputTextarea placeholder="输入消息..." />
          <PromptInputFooter class="flex justify-end gap-2">
            <Button
              v-if="isRunning"
              variant="outline"
              size="icon"
              type="button"
              @click="handleStop"
            >
              <Square class="size-4" />
            </Button>
            <PromptInputSubmit
              :status="isRunning ? 'submitted' : 'ready'"
              :disabled="!apiKey"
            />
          </PromptInputFooter>
        </PromptInputBody>
      </PromptInput>
    </div>

    <!-- 配置弹窗 -->
    <div
      v-if="showSettings"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      @click.self="showSettings = false"
    >
      <div class="bg-background rounded-lg p-6 w-96 shadow-xl">
        <h3 class="font-semibold mb-4">API 配置</h3>
        <div class="space-y-4">
          <div>
            <label class="text-sm text-muted-foreground">API Key</label>
            <input
              v-model="apiKey"
              type="password"
              class="w-full mt-1 px-3 py-2 border rounded-md"
              placeholder="sk-..."
            />
          </div>
          <div>
            <label class="text-sm text-muted-foreground">Base URL</label>
            <input
              v-model="baseURL"
              type="text"
              class="w-full mt-1 px-3 py-2 border rounded-md"
              placeholder="https://api.deepseek.com"
            />
          </div>
          <div>
            <label class="text-sm text-muted-foreground">Model</label>
            <input
              v-model="modelName"
              type="text"
              class="w-full mt-1 px-3 py-2 border rounded-md"
              placeholder="deepseek-chat"
            />
          </div>
        </div>
        <div class="flex justify-end gap-2 mt-6">
          <Button variant="outline" @click="showSettings = false">取消</Button>
          <Button @click="saveSettings">保存</Button>
        </div>
      </div>
    </div>
  </div>
</template>
