<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { Globe, Save, Plus, Trash2, Send, ChevronDown, Type, Braces } from 'lucide-vue-next'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import VariablePicker from '../VariablePicker.vue'
import { resolveVariablesInConfig } from '@/utils/expressionEngine'
import type { ApiDataSourceConfig, DataSource } from '@inuyasha/core'
import { useDataSourceStore } from '@/stores/dataSource'

const props = defineProps<{
  open: boolean
  api?: Partial<DataSource>
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'save', data: any): void
}>()

// State
const name = ref('')
const method = ref<'GET' | 'POST' | 'PUT' | 'DELETE'>('GET')
const url = ref('')
const params = ref<{ id: string; key: string; value: string }[]>([])
const headers = ref<{ id: string; key: string; value: string }[]>([])
const body = ref('')
const activeTab = ref('params')

// Store
const dataSourceStore = useDataSourceStore()

// Variable Picker State
const activePicker = ref<{ type: 'url' | 'body' | 'param' | 'header', index?: number, target?: HTMLElement } | null>(null)
const showPicker = ref(false)

// Response State
const loading = ref(false)
const response = ref<any>(null)
const responseTime = ref(0)

// 打开dialog时初始化表单
watch(
  () => props.open,
  isOpen => {
    if (isOpen) {
      const config = props.api?.config as ApiDataSourceConfig | undefined
      name.value = props.api?.name || ''
      method.value = config?.method || 'GET'
      url.value = config?.url || ''

      // Map existing params/headers or initialize empty
      params.value = config?.params
        ? config.params.map(p => ({ ...p, id: Math.random().toString(36).substr(2, 9) }))
        : []

      headers.value = config?.headers
        ? config.headers.map(h => ({ ...h, id: Math.random().toString(36).substr(2, 9) }))
        : []

      body.value = config?.body || ''
      response.value = null
      responseTime.value = 0
    }
  }
)

// Actions
const addParam = () =>
  params.value.push({ id: Math.random().toString(36).substr(2, 9), key: '', value: '' })
const removeParam = (index: number) => params.value.splice(index, 1)

const addHeader = () =>
  headers.value.push({ id: Math.random().toString(36).substr(2, 9), key: '', value: '' })
const removeHeader = (index: number) => headers.value.splice(index, 1)

const handleSave = () => {
  emit('save', {
    name: name.value,
    config: {
      url: url.value,
      method: method.value,
      params: params.value.map(({ key, value }) => ({ key, value })),
      headers: headers.value.map(({ key, value }) => ({ key, value })),
      body: body.value
    }
  })
  emit('update:open', false)
}

const handleSend = async () => {
  if (!url.value) return
  loading.value = true
  response.value = null
  const startTime = Date.now()
  let success = false

  try {
    // 构造临时配置对象进行解析
    const tempConfig: ApiDataSourceConfig = {
      url: url.value,
      method: method.value,
      params: params.value,
      headers: headers.value,
      body: body.value
    }
    
    // 使用工具函数解析变量
    const config = resolveVariablesInConfig(tempConfig)

    let finalUrl = config.url

    // Append params to URL for GET requests or if they exist
    if (config.params && config.params.length > 0) {
      const queryString = config.params
        .filter(p => p.key)
        .map(p => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`)
        .join('&')

      if (queryString) {
        finalUrl += (finalUrl.includes('?') ? '&' : '?') + queryString
      }
    }

    const headersObj: Record<string, string> = {}
    if (config.headers) {
      config.headers.forEach(h => {
        if (h.key) headersObj[h.key] = h.value
      })
    }

    const res = await fetch(finalUrl, {
      method: config.method,
      headers: headersObj,
      body: ['GET', 'HEAD'].includes(config.method) ? undefined : config.body
    })

    const data = await res.json().catch(() => ({ error: 'Could not parse JSON' }))
    success = res.ok
    
    response.value = {
      status: res.status,
      statusText: res.statusText,
      data
    }
  } catch (err: any) {
    response.value = {
      status: 0,
      statusText: 'Network Error',
      data: { error: err.message }
    }
  } finally {
    // 测试成功且是已保存的数据源时，刷新 store 中的数据，方便画布立刻使用
    if (success && props.api?.id) {
      dataSourceStore.fetchDataSource(props.api.id)
    }
    responseTime.value = Date.now() - startTime
    loading.value = false
  }
}

// Variable Picker Logic
const openPicker = (type: 'url' | 'body' | 'param' | 'header', event: MouseEvent, index?: number) => {
  const target = event.currentTarget as HTMLElement
  activePicker.value = { type, index, target }
  showPicker.value = true
}

const handleInsertVariable = (variable: string) => {
  if (!activePicker.value) return

  const { type, index } = activePicker.value
  
  if (type === 'url') {
    url.value += variable
  } else if (type === 'body') {
    body.value += variable
  } else if (type === 'param' && typeof index === 'number') {
    params.value[index].value += variable
  } else if (type === 'header' && typeof index === 'number') {
    headers.value[index].value += variable
  }
  
  showPicker.value = false
  activePicker.value = null
}

const methodColor = computed(() => {
  switch (method.value) {
    case 'GET':
      return 'text-blue-600 bg-blue-50'
    case 'POST':
      return 'text-emerald-600 bg-emerald-50'
    case 'PUT':
      return 'text-amber-600 bg-amber-50'
    case 'DELETE':
      return 'text-red-600 bg-red-50'
    default:
      return 'text-slate-600 bg-slate-50'
  }
})

const responseSize = computed(() => {
  if (!response.value?.data) return 0
  return JSON.stringify(response.value.data).length
})
</script>

<template>
  <Dialog :open="open" @update:open="$emit('update:open', $event)">
    <DialogContent class="w-[70vw]! max-w-[70vw]! h-[90vh] flex flex-col p-0 gap-0 overflow-hidden sm:rounded-xl">
      <!-- Header -->
      <div
        class="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white"
      >
        <div class="flex items-center gap-3">
          <div
            class="w-9 h-9 bg-indigo-50 border border-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 shadow-xs"
          >
            <Globe :size="20" />
          </div>
          <div>
            <DialogTitle class="text-sm font-bold text-slate-900">{{
              api ? '编辑请求' : '新建请求'
            }}</DialogTitle>
            <DialogDescription class="text-[10px] text-slate-500 font-medium mt-0.5"
              >配置 API 端点和参数</DialogDescription
            >
          </div>
        </div>
        <div class="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            @click="$emit('update:open', false)"
            class="text-xs font-semibold text-slate-600"
          >
            取消
          </Button>
          <Button
            size="sm"
            @click="handleSave"
            class="text-xs font-bold bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-100"
          >
            <Save :size="14" class="mr-2" /> 保存请求
          </Button>
        </div>
      </div>

      <!-- Main Content -->
      <div class="flex-1 flex flex-col lg:flex-row overflow-hidden bg-slate-50/30 relative">
        <!-- Left Panel: Config -->
        <div class="flex-1 flex flex-col p-6 overflow-hidden border-r border-slate-200 min-w-[50%]">
          <!-- URL Section -->
          <div class="space-y-5 mb-6 shrink-0">
            <div>
              <label
                class="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1"
                >请求名称</label
              >
              <div class="relative group">
                <Input v-model="name" placeholder="例如：获取用户信息" class="font-semibold " />
                <Type :size="14" class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300" />
              </div>
            </div>

            <div>
              <label
                class="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1"
                >接口地址</label
              >
              <div class="flex gap-2">
                <div
                  class="flex-1 flex h-10 rounded-md border border-slate-200 bg-white overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500"
                >
                  <div class="relative border-r border-slate-100 shrink-0">
                    <select
                      v-model="method"
                      class="h-full pl-3 pr-8 appearance-none outline-none text-xs font-bold bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors"
                      :class="methodColor"
                    >
                      <option value="GET">GET</option>
                      <option value="POST">POST</option>
                      <option value="PUT">PUT</option>
                      <option value="DELETE">DEL</option>
                    </select>
                    <ChevronDown
                      :size="12"
                      class="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400"
                    />
                  </div>
                  <div class="flex-1 flex relative group">
                     <input
                      v-model="url"
                      placeholder="https://api.example.com/v1/resource"
                      class="flex-1 px-3 text-sm font-mono text-slate-700 placeholder:text-slate-300 outline-none w-full bg-transparent"
                    />
                    <button 
                      @click="(e) => openPicker('url', e)"
                      class="text-slate-400 hover:text-indigo-500 p-1.5 mr-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Braces :size="14" />
                    </button>
                    <!-- Variable Picker Positioned Relative to this container if needed, or use global absolute -->
                    <VariablePicker 
                      v-if="showPicker && activePicker?.type === 'url'" 
                      @select="handleInsertVariable" 
                      @close="showPicker = false" 
                    />
                  </div>
                </div>
                <Button
                  @click="handleSend"
                  :disabled="loading"
                  class="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm w-24"
                >
                  <div
                    v-if="loading"
                    class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"
                  ></div>
                  <template v-else> <Send :size="14" class="mr-2" /> 发送 </template>
                </Button>
              </div>
            </div>
          </div>

          <!-- Tabs Section -->
          <div
            class="flex-1 min-h-0 flex flex-col bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
          >
            <Tabs v-model="activeTab" class="flex flex-col h-full">
              <div class="border-b border-slate-100 px-4 pt-3 bg-slate-50/50">
                <TabsList class="bg-transparent p-0 gap-1 h-auto">
                  <TabsTrigger
                    value="params"
                    class="px-4 py-2 text-xs font-bold rounded-t-lg data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-none border-t border-x border-transparent data-[state=active]:border-slate-200 bg-transparent h-auto translate-y-px"
                  >
                    Params
                    <span
                      v-if="params.length"
                      class="ml-2 w-1.5 h-1.5 rounded-full bg-emerald-400"
                    ></span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="headers"
                    class="px-4 py-2 text-xs font-bold rounded-t-lg data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-none border-t border-x border-transparent data-[state=active]:border-slate-200 bg-transparent h-auto translate-y-px"
                  >
                    Headers
                    <span
                      v-if="headers.length"
                      class="ml-2 w-1.5 h-1.5 rounded-full bg-emerald-400"
                    ></span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="body"
                    class="px-4 py-2 text-xs font-bold rounded-t-lg data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-none border-t border-x border-transparent data-[state=active]:border-slate-200 bg-transparent h-auto translate-y-px"
                  >
                    Body
                    <span v-if="body" class="ml-2 w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  </TabsTrigger>
                </TabsList>
              </div>

              <div class="flex-1 overflow-hidden p-0 relative">
                <!-- Params Tab -->
                <TabsContent value="params" class="h-full m-0 p-4 flex flex-col">
                  <div class="flex items-center justify-between mb-3">
                    <span class="text-[11px] font-medium text-slate-500">Query Parameters</span>
                    <span class="text-[10px] bg-slate-100 text-slate-400 px-2 py-0.5 rounded-full">Automated encoding</span>
                  </div>
                  <div class="flex-1 overflow-y-auto border border-slate-200 rounded-lg bg-white relative">
                    <div
                      class="grid grid-cols-[1fr_1fr_40px] border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase py-2.5 px-3 sticky top-0 z-10 backdrop-blur-sm"
                    >
                      <div class="border-r border-slate-200">Key</div>
                      <div class="border-r border-slate-200 pl-3">Value</div>
                      <div></div>
                    </div>
                    <div
                      v-for="(item, index) in params"
                      :key="item.id"
                      class="grid grid-cols-[1fr_1fr_40px] border-b border-slate-50 last:border-0 group hover:bg-slate-50"
                    >
                      <div class="border-r border-slate-100 relative">
                         <input
                          v-model="item.key"
                          placeholder="Key"
                          class="w-full px-3 py-2.5 text-xs bg-transparent outline-none font-mono font-medium text-slate-700 placeholder:text-slate-300"
                        />
                      </div>
                      <div class="border-r border-slate-100 relative flex group/input">
                        <input
                          v-model="item.value"
                          placeholder="Value"
                          class="flex-1 px-3 py-2.5 text-xs bg-transparent outline-none font-mono text-indigo-600 font-medium"
                        />
                        <button 
                          @click="(e) => openPicker('param', e, index)"
                          class="text-slate-400 hover:text-indigo-500 p-1.5 opacity-0 group-hover/input:opacity-100 transition-opacity"
                        >
                          <Braces :size="14" />
                        </button>
                        <VariablePicker 
                          v-if="showPicker && activePicker?.type === 'param' && activePicker.index === index" 
                          @select="handleInsertVariable" 
                          @close="showPicker = false" 
                        />
                      </div>
                      <div class="flex items-center justify-center">
                        <button
                          @click="removeParam(index)"
                          class="flex items-center justify-center text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-colors p-1.5"
                        >
                          <Trash2 :size="14" />
                        </button>
                      </div>
                    </div>
                    <div
                      v-if="params.length === 0"
                      class="p-12 text-center text-slate-400 text-xs italic flex flex-col items-center gap-2"
                    >
                      <Type :size="24" class="opacity-20" />
                      <span>No parameters defined</span>
                    </div>
                  </div>
                  <div class="pt-4">
                     <Button
                      variant="outline"
                      size="sm"
                      @click="addParam"
                      class="w-fit text-xs gap-2 bg-white shadow-sm hover:bg-indigo-50 hover:text-indigo-600 border-slate-200 hover:border-indigo-300 transition-all font-semibold text-slate-600"
                    >
                      <Plus :size="14" /> Add Parameter
                    </Button>
                  </div>
                </TabsContent>

                <!-- Headers Tab -->
                <TabsContent value="headers" class="h-full m-0 p-4 flex flex-col">
                  <div class="flex items-center justify-between mb-3">
                    <span class="text-[11px] font-medium text-slate-500">Request Headers</span>
                  </div>
                  <div class="flex-1 overflow-y-auto border border-slate-200 rounded-lg bg-white relative">
                     <div
                      class="grid grid-cols-[1fr_1fr_40px] border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase py-2.5 px-3 sticky top-0 z-10 backdrop-blur-sm"
                    >
                      <div class="border-r border-slate-200">Key</div>
                      <div class="border-r border-slate-200 pl-3">Value</div>
                      <div></div>
                    </div>
                    <div
                      v-for="(item, index) in headers"
                      :key="item.id"
                      class="grid grid-cols-[1fr_1fr_40px] border-b border-slate-50 last:border-0 group hover:bg-slate-50"
                    >
                      <div class="border-r border-slate-100 relative">
                         <input
                          v-model="item.key"
                          placeholder="Key"
                          class="w-full px-3 py-2.5 text-xs bg-transparent outline-none font-mono font-medium text-slate-700 placeholder:text-slate-300"
                        />
                      </div>
                      <div class="border-r border-slate-100 relative flex group/input">
                        <input
                          v-model="item.value"
                          placeholder="Value"
                          class="flex-1 px-3 py-2.5 text-xs bg-transparent outline-none font-mono text-indigo-600 font-medium"
                        />
                        <button 
                          @click="(e) => openPicker('header', e, index)"
                          class="text-slate-400 hover:text-indigo-500 p-1.5 opacity-0 group-hover/input:opacity-100 transition-opacity"
                        >
                          <Braces :size="14" />
                        </button>
                        <VariablePicker 
                          v-if="showPicker && activePicker?.type === 'header' && activePicker.index === index" 
                          @select="handleInsertVariable" 
                          @close="showPicker = false" 
                        />
                      </div>
                      <div class="flex items-center justify-center">
                        <button
                          @click="removeHeader(index)"
                          class="flex items-center justify-center text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-colors p-1.5"
                        >
                          <Trash2 :size="14" />
                        </button>
                      </div>
                    </div>
                    <div
                      v-if="headers.length === 0"
                      class="p-12 text-center text-slate-400 text-xs italic flex flex-col items-center gap-2"
                    >
                      <Type :size="24" class="opacity-20" />
                      <span>No headers defined</span>
                    </div>
                  </div>
                  <div class="pt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      @click="addHeader"
                      class="w-fit text-xs gap-2 bg-white shadow-sm hover:bg-indigo-50 hover:text-indigo-600 border-slate-200 hover:border-indigo-300 transition-all font-semibold text-slate-600"
                    >
                      <Plus :size="14" /> Add Header
                    </Button>
                  </div>
                </TabsContent>

                <!-- Body Tab -->
                <TabsContent value="body" class="h-full m-0 p-4 flex flex-col">
                  <div class="flex items-center justify-between mb-3">
                    <span class="text-[11px] font-medium text-slate-500">Request Body (JSON)</span>
                    <span class="text-[10px] bg-slate-100 text-slate-400 px-2 py-0.5 rounded-full"
                      >application/json</span
                    >
                  </div>
                  <div
                    class="flex-1 border border-slate-200 rounded-lg overflow-hidden flex flex-col shadow-sm relative group/body"
                  >
                    <div
                      class="flex justify-between items-center bg-slate-50 border-b border-slate-200 px-3 py-2"
                    >
                      <span class="text-[10px] font-bold text-slate-500 uppercase tracking-wide"
                        >Raw JSON Payload</span
                      >
                      <div class="relative">
                        <button 
                          @click="(e) => openPicker('body', e)"
                          class="text-[10px] text-indigo-600 flex items-center gap-1.5 hover:bg-indigo-50 px-2 py-1 rounded transition-colors font-medium border border-transparent hover:border-indigo-100"
                        >
                          <Braces :size="12" /> Insert Variable
                        </button>
                        <VariablePicker 
                          v-if="showPicker && activePicker?.type === 'body'" 
                          @select="handleInsertVariable" 
                          @close="showPicker = false" 
                        />
                      </div>
                    </div>
                    <Textarea
                      v-model="body"
                      placeholder='{ "key": "value" }'
                      class="flex-1 w-full text-xs font-mono p-4 border-0 resize-none focus-visible:ring-0"
                    />
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>

        <!-- Right Panel: Response -->
        <div
          class="flex-1 flex flex-col bg-white border-l border-slate-200 overflow-hidden min-h-[400px] lg:min-h-0"
        >
          <div
            class="px-4 py-3 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center"
          >
            <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">Response</span>
             <div class="flex gap-2">
                 <span class="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Body</span>
            </div>
          </div>

          <div class="flex-1 relative overflow-hidden">
            <div
              v-if="loading"
              class="h-full flex flex-col items-center justify-center text-slate-400 gap-3"
            >
              <div
                class="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"
              ></div>
              <span class="text-xs font-medium">Sending Request...</span>
            </div>

            <div
              v-else-if="!response"
              class="h-full flex flex-col items-center justify-center text-slate-300 gap-2"
            >
              <Send :size="32" class="opacity-20" />
              <span class="text-xs">点击发送按钮查看响应</span>
            </div>

            <div v-else class="flex flex-col h-full overflow-hidden">
              <div
                class="flex items-center justify-between px-4 py-2 bg-slate-50 border-b border-slate-200 shrink-0"
              >
                <div class="flex items-center gap-4">
                  <span
                    class="text-xs font-bold px-2 py-0.5 rounded"
                    :class="
                      response.status >= 400
                        ? 'bg-red-100 text-red-700'
                        : 'bg-emerald-100 text-emerald-700'
                    "
                  >
                    {{ response.status }} {{ response.statusText }}
                  </span>
                  <span class="text-[10px] font-medium text-slate-500">{{ responseTime }} ms</span>
                  <span class="text-[10px] font-medium text-slate-500">{{ responseSize }} B</span>
                </div>
              </div>
              <div class="flex-1 overflow-auto bg-white p-4">
                <pre
                  class="font-mono text-xs text-slate-700 leading-relaxed whitespace-pre-wrap break-all"
                  >{{ JSON.stringify(response.data, null, 2) }}</pre
                >
              </div>
            </div>
          </div>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>
