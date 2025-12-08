<script setup lang="ts">
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { 
  Plus, Play, Database, 
  Settings, Trash2, Globe, Link as LinkIcon, TextCursor, Server, Braces
} from 'lucide-vue-next'
import { useDataSourceStore } from '@/stores/dataSource'
import { useEditorStore } from '@/stores/editor'
import { DataSourceType, type ApiDataSourceConfig, type DataSource } from '@/types/dataSource'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import ApiForm from './ApiForm.vue'
import type { ComponentSchema } from '@/types/component'

const dataSourceStore = useDataSourceStore()
const editorStore = useEditorStore()
const { pageConfig } = storeToRefs(editorStore)
const { dataSources } = storeToRefs(dataSourceStore)

// State
const editingApiId = ref<string | null>(null) // null, 'new', or ID
const showApiForm = ref(false)
const testResult = ref<any>(null)
const showTestResult = ref(false)

// Computed: Variables
const variables = computed(() => {
  const vars: { id: string; name: string; type: string; componentName: string }[] = []
  
  const traverse = (node: ComponentSchema) => {
    if (['Input', 'Checkbox', 'Select', 'Switch'].includes(node.type)) {
      // Try to find a name property or use label
      const nameProp = node.props?.name
      const labelProp = node.props?.label
      const name = nameProp || labelProp || node.type
      vars.push({
        id: node.id,
        name,
        type: node.type,
        componentName: node.label || node.type
      })
    }
    if (node.children) {
      node.children.forEach(traverse)
    }
  }

  if (pageConfig.value.rootComponent) {
    traverse(pageConfig.value.rootComponent)
  }
  
  return vars
})

const apiList = computed(() => {
  return Object.values(dataSources.value).filter(ds => ds.type === DataSourceType.API)
})

const systemVars = ['user.name', 'user.email', 'system.date', 'system.language']

// Actions
const handleAddApi = () => {
  editingApiId.value = 'new'
  showApiForm.value = true
}

const handleEditApi = (id: string) => {
  editingApiId.value = id
  showApiForm.value = true
}

const handleDeleteApi = (id: string) => {
  if (confirm('确定要删除这个数据源吗？')) {
    dataSourceStore.removeDataSource(id)
  }
}

const handleSaveApi = (data: { name: string; config: ApiDataSourceConfig }) => {
  if (editingApiId.value === 'new') {
    dataSourceStore.addDataSource({
      name: data.name,
      type: DataSourceType.API,
      config: data.config
    })
  } else if (editingApiId.value) {
    dataSourceStore.updateDataSource(editingApiId.value, {
      name: data.name,
      config: data.config
    })
  }
  showApiForm.value = false
  editingApiId.value = null
}

const handleRunTest = async (api: DataSource) => {
  const config = api.config as ApiDataSourceConfig
  try {
    let success = false
    // Construct headers object
    const headers: Record<string, string> = {}
    if (Array.isArray(config.headers)) {
        config.headers.forEach((h: any) => {
            if (h.key) headers[h.key] = h.value
        })
    } else {
        // Fallback for old format if any
        Object.assign(headers, config.headers || {})
    }

    let url = config.url
    // Construct query params (simple append)
    if (Array.isArray(config.params) && config.params.length > 0) {
       const qs = config.params
        .filter((p: any) => p.key)
        .map((p: any) => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`)
        .join('&')
       if (qs) url += (url.includes('?') ? '&' : '?') + qs
    }

    const res = await fetch(url, {
      method: config.method,
      headers,
      body: ['GET', 'HEAD'].includes(config.method) ? undefined : config.body
    })
    const data = await res.json().catch(() => ({ error: 'Parse Error' }))
    success = res.ok
    
    testResult.value = {
      status: res.status,
      statusText: res.statusText,
      data
    }
    // 测试成功后同步到 store，方便画布立即使用数据
    if (success) {
      await dataSourceStore.fetchDataSource(api.id)
    }
    showTestResult.value = true
  } catch (e: any) {
    testResult.value = {
      status: 0,
      statusText: 'Error',
      data: { message: e.message }
    }
    showTestResult.value = true
  }
}

const getMethodClass = (method: string) => {
  switch (method) {
    case 'GET': return 'bg-blue-50 text-blue-600'
    case 'POST': return 'bg-purple-50 text-purple-600'
    case 'PUT': return 'bg-orange-50 text-orange-600'
    case 'DELETE': return 'bg-red-50 text-red-600'
    default: return 'bg-slate-50 text-slate-600'
  }
}

const currentEditingApi = computed(() => {
  if (!editingApiId.value || editingApiId.value === 'new') return undefined
  return dataSources.value[editingApiId.value]
})

const handleVariableClick = (id: string) => {
  editorStore.selectComponent(id)
}

const formatVariableName = (name: string) => {
  return `{{${name}}}`
}
</script>

<template>
  <div class="h-full flex flex-col">
    <!-- Main Content -->
    <div class="flex-1 overflow-y-auto p-4 space-y-6">
      
      <!-- Variables Section -->
      <div>
        <h3 class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Braces :size="12" /> 页面变量
        </h3>
        <div class="space-y-2">
          <div v-if="variables.length === 0" class="text-xs text-slate-400 italic px-2">
            暂无输入组件变量
          </div>
          <div 
            v-for="v in variables" 
            :key="v.id"
            @click="handleVariableClick(v.id)"
            class="flex items-center justify-between p-2 bg-slate-50 border border-slate-100 rounded-md hover:border-indigo-300 hover:bg-white hover:shadow-sm cursor-pointer transition-all group"
          >
            <div class="flex items-center gap-2 overflow-hidden">
              <TextCursor :size="14" class="text-slate-400 group-hover:text-indigo-500" />
              <div class="flex flex-col min-w-0">
                <span class="text-xs font-mono font-medium text-slate-700 truncate">{{ formatVariableName(v.name) }}</span>
                <span class="text-[10px] text-slate-400 truncate">来源: {{ v.componentName }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- API Section -->
      <div>
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Globe :size="12" /> API 集成
          </h3>
          <button @click="handleAddApi" class="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-indigo-600 transition-colors">
            <Plus :size="14" />
          </button>
        </div>

        <div class="space-y-2">
          <div v-if="apiList.length === 0" class="text-xs text-slate-400 italic px-2">
            暂无 API 配置
          </div>
          
          <div 
            v-for="api in apiList" 
            :key="api.id"
            class="p-3 bg-white border border-slate-200 rounded-lg shadow-xs hover:shadow-md hover:border-indigo-300 transition-all group relative"
          >
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center gap-2">
                <span class="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide" :class="getMethodClass((api.config as ApiDataSourceConfig).method)">
                  {{ (api.config as ApiDataSourceConfig).method }}
                </span>
                <span class="text-sm font-medium text-slate-800">{{ api.name }}</span>
              </div>
              <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button @click="handleRunTest(api)" class="p-1.5 text-emerald-500 hover:bg-emerald-50 rounded transition-colors" title="测试请求">
                  <Play :size="14" fill="currentColor" />
                </button>
                <button @click="handleEditApi(api.id)" class="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors" title="编辑">
                  <Settings :size="14" />
                </button>
                <button @click="handleDeleteApi(api.id)" class="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="删除">
                  <Trash2 :size="14" />
                </button>
              </div>
            </div>
            <div class="flex items-center gap-2 pl-1 mb-1">
              <LinkIcon :size="12" class="text-slate-300 shrink-0" />
              <span class="text-xs font-mono text-slate-500 truncate w-full leading-none" :title="(api.config as ApiDataSourceConfig).url">
                {{ (api.config as ApiDataSourceConfig).url }}
              </span>
            </div>
            <!-- Status Preview -->
            <div v-if="api.lastFetched" class="flex items-center gap-2 pl-1 mt-2 pt-2 border-t border-slate-50">
               <span class="w-1.5 h-1.5 rounded-full" :class="api.data?.error ? 'bg-red-400' : 'bg-emerald-400'"></span>
               <span class="text-[10px] text-slate-400">
                 上次更新: {{ new Date(api.lastFetched).toLocaleTimeString() }}
               </span>
               <span v-if="api.data?.error" class="text-[10px] text-red-400 ml-auto">Request Failed</span>
               <span v-else class="text-[10px] text-slate-400 ml-auto">Success</span>
            </div>
          </div>
        </div>
      </div>

      <!-- System Globals -->
      <div>
        <h3 class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Server :size="12" /> 系统全局变量
        </h3>
        <div class="space-y-1">
          <div v-for="v in systemVars" :key="v" class="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-slate-100 transition-colors cursor-help group">
            <Database :size="12" class="text-slate-300 group-hover:text-slate-500" />
            <span class="text-xs font-mono text-slate-500 group-hover:text-slate-700">{{ formatVariableName(v) }}</span>
          </div>
        </div>
      </div>

    </div>

    <!-- API Form Dialog -->
    <ApiForm 
      v-model:open="showApiForm" 
      :api="currentEditingApi" 
      @save="handleSaveApi" 
    />

    <!-- Test Result Dialog -->
    <Dialog v-model:open="showTestResult">
      <DialogContent class="max-w-2xl max-h-[80vh] flex flex-col">
        <div class="flex items-center justify-between border-b border-slate-100 pb-2">
           <DialogTitle class="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <div class="w-2 h-2 rounded-full" :class="testResult?.status >= 400 ? 'bg-red-500' : 'bg-emerald-500'"></div>
              API 响应结果
           </DialogTitle>
        </div>
        <div class="flex-1 overflow-auto bg-slate-900 rounded-md p-4 mt-2">
          <pre class="font-mono text-xs text-emerald-400 leading-relaxed whitespace-pre-wrap">{{ JSON.stringify(testResult, null, 2) }}</pre>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>
