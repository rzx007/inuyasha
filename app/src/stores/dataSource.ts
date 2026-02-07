import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { DataSource, DataSourceId } from '@inuyasha/core'
import { DataSourceStore } from '@inuyasha/state'
import type { ExpressionContext } from '@inuyasha/expression'
import { useEditorStore } from './editor'
import { useFormStateStore } from './formState'

const dataSourceStore = new DataSourceStore()

export const useDataSourceStore = defineStore('dataSource', () => {
  const dataSources = ref(dataSourceStore.dataSources)

  function addDataSource(dataSource: Omit<DataSource, 'id'>) {
    const id = dataSourceStore.addDataSource(dataSource)
    dataSources.value = { ...dataSourceStore.dataSources }
    return id
  }

  function updateDataSource(id: DataSourceId, updates: Partial<DataSource>) {
    dataSourceStore.updateDataSource(id, updates)
    dataSources.value = { ...dataSourceStore.dataSources }
  }

  function removeDataSource(id: DataSourceId) {
    dataSourceStore.removeDataSource(id)
    dataSources.value = { ...dataSourceStore.dataSources }
  }

  function clearDataSources() {
    dataSourceStore.clearDataSources()
    dataSources.value = { ...dataSourceStore.dataSources }
  }

  function exportDataSources(): Record<DataSourceId, DataSource> {
    return dataSourceStore.exportDataSources()
  }

  function importDataSources(sources: Record<DataSourceId, DataSource> = {}) {
    dataSourceStore.importDataSources(sources)
    dataSources.value = { ...dataSourceStore.dataSources }
  }

  async function fetchDataSource(id: DataSourceId) {
    const editorStore = useEditorStore()
    const formStateStore = useFormStateStore()
    
    const context: ExpressionContext = {
      editorStore: {
        pageConfig: editorStore.pageConfig
      },
      dataSourceStore: {
        // 使用响应式的 dataSources.value 以建立依赖追踪
        dataSources: dataSources.value
      },
      formStateStore: {
        getComponentState: (componentId: string, key: string) => {
          // 使用 store 的方法，该方法内部会访问响应式 states
          return formStateStore.getComponentState(componentId, key)
        }
      }
    }
    
    await dataSourceStore.fetchDataSource(id, context)
    dataSources.value = { ...dataSourceStore.dataSources }
  }

  return {
    dataSources,
    addDataSource,
    updateDataSource,
    removeDataSource,
    clearDataSources,
    exportDataSources,
    importDataSources,
    fetchDataSource,
  }
})
