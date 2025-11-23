<script setup lang="ts">
import { ref } from 'vue'
import { useDataSourceStore } from '@/stores/dataSource'
import { DataSourceType, type ApiDataSourceConfig, type DataSource } from '@/types/dataSource'
import { ElButton, ElDialog, ElForm, ElFormItem, ElInput, ElSelect, ElOption } from 'element-plus'

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
      <ElButton @click="openAddDialog" type="primary" class="w-full">
        Add API Source
      </ElButton>
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

    <ElDialog v-model="isDialogVisible" title="API Data Source">
      <ElForm :model="currentDataSource" label-position="top">
        <ElFormItem label="Name">
          <ElInput v-model="currentDataSource.name" />
        </ElFormItem>
        <ElFormItem label="URL">
          <ElInput v-model="(currentDataSource.config as ApiDataSourceConfig).url" />
        </ElFormItem>
        <ElFormItem label="Method">
          <ElSelect v-model="(currentDataSource.config as ApiDataSourceConfig).method">
            <ElOption label="GET" value="GET" />
            <ElOption label="POST" value="POST" />
          </ElSelect>
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="isDialogVisible = false">Cancel</ElButton>
        <ElButton type="primary" @click="handleSave">Save</ElButton>
      </template>
    </ElDialog>
  </div>
</template>
