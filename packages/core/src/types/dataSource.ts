/**
 * Data Source Type Definitions
 */

export type DataSourceId = string

export enum DataSourceType {
  API = 'api',
  STATIC = 'static',
}

export interface DataSource {
  id: DataSourceId
  name: string
  type: DataSourceType
  config: ApiDataSourceConfig | StaticDataSourceConfig
  data?: any // Holds the fetched data
  lastFetched?: number
}

export interface ApiDataSourceConfig {
  url: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  params: { key: string; value: string }[]
  headers: { key: string; value: string }[]
  body?: string
  autoFetch?: boolean
}

export interface StaticDataSourceConfig {
  data: any
}

export interface DataBinding {
  type: 'dataSource' | 'component' | 'static'
  dataSourceId?: string
  componentId?: string
  path?: string
  value?: any
}

export interface CallDataSourceActionConfig {
  dataSourceId: string
}
