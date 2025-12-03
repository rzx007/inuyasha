<template>
  <!-- 参照postman/apipost -->
  <div class="flex-1 flex flex-col bg-background border-t-2 border-border/60">
    <div v-if="response" class="flex-1 flex flex-col">
      <!-- 响应状态 -->
      <div class="px-4 py-3 border-b border-border/60 bg-muted/30">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <component :is="getStatusIcon(response?.status || 404)" class="w-4 h-4" />
            <span :class="['text-sm font-semibold font-mono', getStatusColor(response?.status || 404)]">
              {{ response?.status || 404 }} {{ response?.statusText }}
            </span>
          </div>
          <div class="flex items-center gap-4 text-xs text-muted-foreground">
            <div class="flex items-center gap-1.5 px-2 py-1 bg-muted/40 rounded">
              <Clock class="w-3 h-3" />
              <span class="font-mono">{{ response?.time }}ms</span>
            </div>
            <div class="px-2 py-1 bg-muted/40 rounded font-mono">{{ response?.size }} 字节</div>
            <div class="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                class="w-7 h-7 p-0 hover:bg-muted/60 transition-colors"
                @click="copyResponseToClipboard"
              >
                <Copy class="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                class="w-7 h-7 p-0 hover:bg-muted/60 transition-colors"
                @click="downloadResponseBody"
              >
                <Download class="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <!-- 响应Tab -->
      <Tabs v-model="activeTab" class="flex-1 flex flex-col">
        <div class="border-b border-border/60 bg-muted/20">
          <div class="flex px-1">
            <button
              v-for="tab in responseTabs"
              :key="tab.value"
              :class="[
                'px-4 py-2.5 text-xs font-medium border-b-2 transition-all duration-200',
                activeTab === tab.value
                  ? 'border-primary text-primary bg-background shadow-sm'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40',
              ]"
              @click="activeTab = tab.value"
            >
              {{ tab.label }}
            </button>
          </div>
        </div>

        <!-- 响应体 -->
        <TabsContent value="body" class="flex-1">
          <ScrollArea class="h-full">
            <div class="border border-border/60 rounded-md overflow-hidden shadow-sm">
              <!-- <pre class="text-xs font-mono bg-muted/20 p-4 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                {{ JSON.stringify(JSON.parse(response?.body), null, 2) }}
              </pre> -->
              <CodeMirror
                class="h-[400px]"
                :model-value="JSON.stringify(JSON.parse(response?.body), null, 2)"
                language="json"
                :dark="false"
                basic
                placeholder="{}"
              />
            </div>
          </ScrollArea>
        </TabsContent>

        <!-- 响应头 -->
        <TabsContent value="headers" class="flex-1">
          <ScrollArea class="h-full">
            <div class="space-y-2">
              <div
                v-for="[key, value] in Object.entries(response?.headers)"
                :key="key"
                class="flex text-xs font-mono p-2 bg-muted/20 rounded border border-border/40"
              >
                <div class="font-semibold w-48 text-muted-foreground shrink-0">{{ key }}:</div>
                <div class="flex-1 text-foreground break-all">{{ value }}</div>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>

        <!-- Cookie -->
        <TabsContent value="cookies" class="flex-1">
          <div
            class="flex items-center justify-center h-32 text-xs text-muted-foreground bg-muted/10 rounded-md border border-dashed border-border/60"
          >
            未收到Cookie
          </div>
        </TabsContent>
      </Tabs>
    </div>
    <div v-else class="flex-1 flex items-center justify-center text-muted-foreground">
      <div class="text-center">
        <!-- 请求中的加载动画 -->
        <div v-if="isLoading" class="flex items-center justify-center mb-4">
          <div class="flex space-x-1">
            <div class="w-2 h-2 bg-primary rounded-full loading-dot" style="animation-delay: 0ms"></div>
            <div class="w-2 h-2 bg-primary rounded-full loading-dot" style="animation-delay: 150ms"></div>
            <div class="w-2 h-2 bg-primary rounded-full loading-dot" style="animation-delay: 300ms"></div>
          </div>
        </div>
        <!-- 默认状态 -->
        <Play v-else class="w-12 h-12 mx-auto mb-4 opacity-20" />
        <p class="text-sm font-medium">{{ isLoading ? '正在发送请求...' : '发送请求以查看响应' }}</p>
        <p class="text-xs text-muted-foreground/70 mt-1">{{ isLoading ? '请稍候' : '在上方输入URL并点击发送' }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent } from '@/components/ui/tabs'
import CodeMirror from '@/components/CodeMirror/index.vue'
import { CheckCircle, XCircle, AlertCircle, Clock, Copy, Download, Play } from 'lucide-vue-next'
import type { ApiResponse } from './types'
import Toast from '@/components/toast'

interface Props {
  response: ApiResponse | null
  isLoading?: boolean
}

const props = defineProps<Props>()

const activeTab = ref('body')
const responseTabs = [
  { value: 'body', label: '响应体' },
  { value: 'headers', label: '响应头' },
  { value: 'cookies', label: 'Cookie' },
]

// 复制响应到剪贴板
const copyResponseToClipboard = () => {
  if (!props.response?.body) return

  try {
    const formattedJson = JSON.stringify(JSON.parse(props.response.body), null, 2)
    navigator.clipboard.writeText(formattedJson)
    Toast({
      value: '已复制到剪贴板',
      duration: 2000,
      background: '#f0f9ff',
      color: '#0369a1',
    })
  } catch (error) {
    // 如果不是有效的JSON，直接复制原始内容
    navigator.clipboard.writeText(props.response.body)
    Toast({
      value: '已复制到剪贴板',
      duration: 2000,
      background: '#f0f9ff',
      color: '#0369a1',
    })
  }
}

// 下载响应体
const downloadResponseBody = () => {
  if (!props.response?.body) return

  try {
    // 尝试解析JSON以便格式化
    const formattedJson = JSON.stringify(JSON.parse(props.response.body), null, 2)
    const blob = new Blob([formattedJson], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url

    // 生成文件名：api-response-时间戳.json
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    link.download = `api-response-${timestamp}.json`

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    Toast({
      value: '响应体已下载',
      duration: 2000,
      background: '#f0f9ff',
      color: '#0369a1',
    })
  } catch (error) {
    // 如果不是有效的JSON，作为文本下载
    const blob = new Blob([props.response.body], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url

    // 生成文件名：api-response-时间戳.txt
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    link.download = `api-response-${timestamp}.txt`

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    Toast({
      value: '响应体已下载',
      duration: 2000,
      background: '#f0f9ff',
      color: '#0369a1',
    })
  }
}

const getStatusColor = (status: number) => {
  if (status >= 200 && status < 300) return 'text-green-500'
  if (status >= 300 && status < 400) return 'text-yellow-500'
  if (status >= 400 && status < 500) return 'text-orange-500'
  return 'text-red-500'
}

const getStatusIcon = (status: number) => {
  if (status >= 200 && status < 300) return CheckCircle
  if (status >= 300 && status < 400) return AlertCircle
  return XCircle
}
</script>

<style scoped>
.loading-dot {
  animation: loading-pulse 1.4s ease-in-out infinite both;
}

@keyframes loading-pulse {
  0%,
  80%,
  100% {
    transform: scale(0.8);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
