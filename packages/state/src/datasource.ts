import { nanoid } from 'nanoid'
import type { DataSource, DataSourceId, ApiDataSourceConfig } from '@inuyasha/core'
import type { ExpressionContext } from '@inuyasha/expression'
import { fetchDataSource as fetchDataSourceApi } from './api'

/**
 * Data source store logic
 */
export class DataSourceStore {
  dataSources: Record<DataSourceId, DataSource> = {}

  addDataSource(dataSource: Omit<DataSource, 'id'>): DataSourceId {
    const id = nanoid()
    this.dataSources[id] = { ...dataSource, id }
    return id
  }

  updateDataSource(id: DataSourceId, updates: Partial<DataSource>) {
    if (this.dataSources[id]) {
      Object.assign(this.dataSources[id], updates)
    }
  }

  removeDataSource(id: DataSourceId) {
    delete this.dataSources[id]
  }

  clearDataSources() {
    this.dataSources = {}
  }

  exportDataSources(): Record<DataSourceId, DataSource> {
    return { ...this.dataSources }
  }

  importDataSources(sources: Record<DataSourceId, DataSource> = {}) {
    this.clearDataSources()
    this.dataSources = { ...sources }
  }

  async fetchDataSource(id: DataSourceId, context: ExpressionContext) {
    await fetchDataSourceApi(id, this.dataSources, context)
    // Update is handled in fetchDataSourceApi
  }
}
