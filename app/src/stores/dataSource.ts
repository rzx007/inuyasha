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

    const config = ds.config as import('@/types/dataSource').ApiDataSourceConfig

    try {
      // Basic fetch implementation.
      // Convert array headers to object
      const headersObject = config.headers.reduce((acc: Record<string, string>, curr) => {
        if (curr.key) acc[curr.key] = curr.value
        return acc
      }, {} as Record<string, string>)

      let url = config.url
      if (config.params && config.params.length > 0) {
        const queryString = config.params
          .filter(p => p.key)
          .map(p => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`)
          .join('&')
        if (queryString) {
          url += (url.includes('?') ? '&' : '?') + queryString
        }
      }

      const response = await fetch(url, {
        method: config.method,
        headers: headersObject,
        body: ['GET', 'HEAD'].includes(config.method) ? undefined : config.body,
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
