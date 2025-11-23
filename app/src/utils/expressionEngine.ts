import { useEditorStore } from '@/stores/editor'
import { useDataSourceStore } from '@/stores/dataSource'
import type { DataBinding } from '@/types/dataSource'
import { get } from 'lodash-es'
import { findComponentById } from '@/utils/tree'

/**
 * Resolves the value of a data binding configuration.
 * @param binding - The data binding configuration object.
 * @returns The resolved value, or undefined if not found.
 */
export function resolveBinding(binding: DataBinding): any {
  const editorStore = useEditorStore()
  const dataSourceStore = useDataSourceStore()

  if (!binding) {
    return undefined
  }

  switch (binding.type) {
    case 'dataSource':
      if (binding.dataSourceId) {
        const ds = dataSourceStore.dataSources[binding.dataSourceId]
        if (ds && ds.data) {
          return binding.path ? get(ds.data, binding.path) : ds.data
        }
      }
      return undefined

    case 'component':
      if (binding.componentId) {
        const componentSchema = findComponentById(binding.componentId, editorStore.pageConfig.components)
        if (componentSchema) {
          return binding.path ? get(componentSchema, binding.path) : componentSchema
        }
      }
      return undefined

    case 'static':
      return binding.value
      
    default:
      return undefined
  }
}
