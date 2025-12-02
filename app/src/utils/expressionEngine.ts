import { useEditorStore } from '@/stores/editor'
import { useDataSourceStore } from '@/stores/dataSource'
import type { DataBinding } from '@/types/dataSource'
import { get } from 'lodash-es'
import { findComponentById } from '@/utils/tree'
import { useFormStateStore } from '@/stores/formState'

/**
 * Resolves the value of a data binding configuration.
 * @param binding - The data binding configuration object.
 * @returns The resolved value, or undefined if not found.
 */
export function resolveBinding(binding: DataBinding): any {
  const editorStore = useEditorStore()
  const dataSourceStore = useDataSourceStore()
  const formStateStore = useFormStateStore()

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
      if (binding.componentId && binding.path) {
        const componentSchema = findComponentById(binding.componentId, editorStore.pageConfig.components)
        if (!componentSchema) {
          return undefined
        }

        // 解析路径格式：modelValue.xxx, props.xxx, style.xxx
        const pathParts = binding.path.split('.')
        const category = pathParts[0] // 'modelValue', 'props', 'style'
        const key = pathParts.slice(1).join('.') // 剩余路径

        switch (category) {
          case 'modelValue':
            // 从 formStateStore 读取双向绑定值
            if (key) {
              const value = formStateStore.getComponentState(binding.componentId, key)
              // 如果值为 undefined，返回默认的空值（避免显示 undefined）
              return value !== undefined ? value : ''
            }
            return undefined

          case 'props':
            // 从组件 schema 的 props 读取
            return key ? get(componentSchema.props, key) : componentSchema.props

          case 'style':
            // 从组件 schema 的 style 读取
            return key ? get(componentSchema.style, key) : componentSchema.style

          default:
            // 兼容旧的路径格式（没有前缀的直接路径）
            return get(componentSchema, binding.path)
        }
      }
      return undefined

    case 'static':
      return binding.value
      
    default:
      return undefined
  }
}
