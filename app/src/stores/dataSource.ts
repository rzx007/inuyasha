import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { DataSource, DataSourceId } from '@/types/dataSource'
import { nanoid } from 'nanoid'

export const useDataSourceStore = defineStore('dataSource', () => {
  const dataSources = ref<Record<DataSourceId, DataSource>>({})

  function addDataSource(dataSource: Omit<DataSource, 'id'>) {
    const id = nanoid()
    dataSources.value[id] = { ...dataSource, id }
    return id
  }

  function updateDataSource(id: DataSourceId, updates: Partial<DataSource>) {
    if (dataSources.value[id]) {
      Object.assign(dataSources.value[id], updates)
    }
  }

  function removeDataSource(id: DataSourceId) {
    delete dataSources.value[id]
  }

  async function fetchDataSource(id: DataSourceId) {
    const ds = dataSources.value[id]
    if (!ds || ds.type !== 'api') return

    try {
      // Basic fetch implementation.
      // In a real-world scenario, you would use a more robust HTTP client.
      const response = await fetch(ds.config.url, {
        method: ds.config.method,
        headers: ds.config.headers,
        // For GET requests, params should be in the URL.
        // For POST, they should be in the body. This is a simplified example.
      })
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      
      updateDataSource(id, { data, lastFetched: Date.now() })
    } catch (error) {
      console.error(`Failed to fetch data source ${id}:`, error)
      updateDataSource(id, { data: { error: 'Failed to fetch' }, lastFetched: Date.now() })
    }
  }

  return {
    dataSources,
    addDataSource,
    updateDataSource,
    removeDataSource,
    fetchDataSource,
  }
})
