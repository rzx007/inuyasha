<script setup lang="ts">
import { ref } from 'vue'
import { Plus, Play, CheckCircle, AlertCircle, Save, X, Database } from 'lucide-vue-next'
import { useDataSourceStore } from '@/stores/dataSource'
import { DataSourceType, type ApiDataSourceConfig, type DataSource } from '@/types/dataSource'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const dataSourceStore = useDataSourceStore()
const isAddingSource = ref(false)
const newSourceName = ref('')
const newSourceUrl = ref('https://jsonplaceholder.typicode.com/users')
const testResult = ref<any | null>(null)
const testStatus = ref<'idle' | 'loading' | 'success' | 'error'>('idle')

async function handleTestApi() {
  if (!newSourceUrl.value) return
  testStatus.value = 'loading'
  testResult.value = null
  try {
    const response = await fetch(newSourceUrl.value)
    const data = await response.json()
    testResult.value = data
    testStatus.value = 'success'
  } catch (error) {
    testResult.value = { error: 'Failed to fetch' }
    testStatus.value = 'error'
  }
}

function handleSaveSource() {
  if (!newSourceName.value || !newSourceUrl.value) return
  const newSource: Omit<DataSource, 'id'> = {
    name: newSourceName.value,
    type: DataSourceType.API,
    config: {
      url: newSourceUrl.value,
      method: 'GET',
      params: {},
      headers: {},
    },
    data: testResult.value,
  }
  dataSourceStore.addDataSource(newSource)
  // Reset Form
  isAddingSource.value = false
  newSourceName.value = ''
  newSourceUrl.value = 'https://jsonplaceholder.typicode.com/users'
  testResult.value = null
  testStatus.value = 'idle'
}

async function handleRunSource(source: DataSource) {
  if (source.type === DataSourceType.API) {
    await dataSourceStore.fetchDataSource(source.id)
  }
}
</script>

<template>
  <div class="data-source-panel h-full flex flex-col bg-slate-50">
    <!-- Add New Source Button -->
    <div v-if="!isAddingSource" class="p-4 border-b border-slate-200 bg-white">
      <Button
        @click="isAddingSource = true"
        class="w-full flex items-center justify-center space-x-2 bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20"
        variant="ghost"
      >
        <Plus :size="16" />
        <span>Add Data Source</span>
      </Button>
    </div>

    <!-- Add Source Form -->
    <div
      v-if="isAddingSource"
      class="p-4 bg-white border-b border-slate-200 shadow-sm animate-in slide-in-from-top-2 duration-200"
    >
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-sm font-semibold text-slate-800">New API Source</h3>
        <button
          @click="isAddingSource = false"
          class="text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X :size="16" />
        </button>
      </div>

      <div class="space-y-3">
        <div>
          <label class="block text-xs font-medium text-slate-600 mb-1">Name</label>
          <Input
            v-model="newSourceName"
            type="text"
            placeholder="e.g. Users API"
            class="w-full px-2 py-1.5 text-sm"
          />
        </div>
        <div>
          <label class="block text-xs font-medium text-slate-600 mb-1">Endpoint URL</label>
          <div class="flex space-x-1">
            <select
              class="text-xs border border-slate-300 rounded bg-slate-50 px-1 focus:outline-none focus:border-primary"
            >
              <option>GET</option>
            </select>
            <Input
              v-model="newSourceUrl"
              type="text"
              placeholder="https://api..."
              class="flex-1 px-2 py-1.5 text-sm"
            />
          </div>
        </div>

        <!-- Test Actions -->
        <div class="flex items-center space-x-2 pt-2">
          <Button
            @click="handleTestApi"
            :disabled="testStatus === 'loading'"
            class="flex-1 flex items-center justify-center space-x-1 py-1.5 bg-slate-800 text-white hover:bg-slate-900 text-xs font-medium disabled:opacity-50"
          >
            <span v-if="testStatus === 'loading'" class="animate-spin">...</span>
            <Play v-else :size="12" />
            <span>Test Request</span>
          </Button>
          <Button
            @click="handleSaveSource"
            :disabled="!testResult || !newSourceName"
            class="flex-1 flex items-center justify-center space-x-1 py-1.5 bg-primary text-white hover:bg-primary/90 text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save :size="12" />
            <span>Save Source</span>
          </Button>
        </div>

        <!-- Test Result -->
        <div v-if="testResult" class="mt-3">
          <div class="flex items-center space-x-1 mb-1">
            <CheckCircle
              v-if="testStatus === 'success'"
              :size="12"
              class="text-green-500"
            />
            <AlertCircle
              v-else
              :size="12"
              class="text-red-500"
            />
            <span class="text-xs font-medium text-slate-600">Response Preview</span>
          </div>
          <div class="bg-slate-900 rounded p-2 overflow-hidden">
            <pre class="text-[10px] text-green-400 font-mono overflow-auto max-h-32">{{
              JSON.stringify(testResult, null, 2)
            }}</pre>
          </div>
        </div>
      </div>
    </div>

    <!-- Source List -->
    <div class="flex-1 overflow-y-auto p-4 space-y-3">
      <div
        v-if="Object.keys(dataSourceStore.dataSources).length === 0 && !isAddingSource"
        class="text-center py-8 text-slate-400"
      >
        <Database :size="32" class="mx-auto mb-2 opacity-50" />
        <p class="text-sm">No data sources yet.</p>
      </div>

      <div
        v-for="ds in Object.values(dataSourceStore.dataSources)"
        :key="ds.id"
        class="bg-white border border-slate-200 rounded-lg p-3 hover:shadow-sm transition-shadow"
      >
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center space-x-2">
            <div class="w-2 h-2 rounded-full bg-green-500"></div>
            <span class="font-medium text-sm text-slate-800">{{ ds.name }}</span>
          </div>
          <span
            class="text-[10px] font-mono bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded"
          >
            {{ (ds.config as ApiDataSourceConfig).method }}
          </span>
        </div>
        <div
          class="text-xs text-slate-500 truncate mb-2 font-mono"
          :title="(ds.config as ApiDataSourceConfig).url"
        >
          {{ (ds.config as ApiDataSourceConfig).url }}
        </div>
        <div class="flex justify-end">
          <Button
            @click="handleRunSource(ds)"
            variant="ghost"
            class="text-xs text-primary hover:underline flex items-center space-x-1 h-auto p-0"
          >
            <Play :size="10" />
            <span>Run</span>
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>
