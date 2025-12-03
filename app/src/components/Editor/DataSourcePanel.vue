<script setup lang="ts">
import { ref } from 'vue'
import { useDataSourceStore } from '@/stores/dataSource'
import { DataSourceType, type ApiDataSourceConfig, type DataSource } from '@/types/dataSource'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'

const dataSourceStore = useDataSourceStore()
const isDialogVisible = ref(false)
const currentDataSource = ref<Partial<DataSource>>({})

function openAddDialog() {
  currentDataSource.value = {
    name: 'New API',
    type: DataSourceType.API,
    config: {
      url: 'https://api.example.com/data',
      method: 'GET',
      params: {},
      headers: {},
    },
  }
  isDialogVisible.value = true
}

function handleSave() {
  if (currentDataSource.value.id) {
    dataSourceStore.updateDataSource(currentDataSource.value.id, currentDataSource.value)
  } else {
    dataSourceStore.addDataSource(currentDataSource.value as Omit<DataSource, 'id'>)
  }
  isDialogVisible.value = false
}
</script>

<template>
  <div class="data-source-panel h-full flex flex-col">
    <div class="p-2 border-b">
      <Button @click="openAddDialog" class="w-full">
        Add API Source
      </Button>
    </div>
    
    <div class="flex-1 overflow-y-auto p-2">
      <div
        v-for="ds in dataSourceStore.dataSources"
        :key="ds.id"
        class="p-2 border rounded mb-2"
      >
        <div class="font-semibold">{{ ds.name }}</div>
        <div class="text-xs text-gray-500 truncate">{{ (ds.config as ApiDataSourceConfig).url }}</div>
      </div>
    </div>

    <Dialog :open="isDialogVisible" @update:open="(val) => isDialogVisible = val">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>API Data Source</DialogTitle>
        </DialogHeader>
        
        <div class="space-y-4 py-4">
          <div class="space-y-2">
            <label class="text-sm font-medium">Name</label>
            <Input v-model="currentDataSource.name" />
          </div>
          <div class="space-y-2">
            <label class="text-sm font-medium">URL</label>
            <Input v-model="(currentDataSource.config as ApiDataSourceConfig).url" />
          </div>
          <div class="space-y-2">
            <label class="text-sm font-medium">Method</label>
            <Select v-model="(currentDataSource.config as ApiDataSourceConfig).method">
              <SelectTrigger>
                <SelectValue placeholder="Select method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GET">GET</SelectItem>
                <SelectItem value="POST">POST</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" @click="isDialogVisible = false">Cancel</Button>
          <Button @click="handleSave">Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
