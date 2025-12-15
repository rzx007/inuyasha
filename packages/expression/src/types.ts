import type { ComponentSchema, ComponentId } from '@inuyasha/core'
import type { DataSource, DataSourceId } from '@inuyasha/core'

/**
 * Store interfaces for dependency injection
 */
export interface EditorStore {
  pageConfig: {
    rootComponent: ComponentSchema
  }
}

export interface DataSourceStore {
  dataSources: Record<DataSourceId, DataSource>
}

export interface FormStateStore {
  getComponentState(componentId: ComponentId, key: string): any
}

export interface ExpressionContext {
  editorStore: EditorStore
  dataSourceStore: DataSourceStore
  formStateStore: FormStateStore
}
