import { get } from 'lodash-es'
import type { DataBinding } from '@inuyasha/core'
import type { ExpressionContext } from './types'
import { findComponentById } from '@inuyasha/component'

/**
 * Resolves the value of a data binding configuration.
 * @param binding - The data binding configuration object.
 * @param context - The expression context containing stores.
 * @returns The resolved value, or undefined if not found.
 */
export function resolveBinding(binding: DataBinding, context: ExpressionContext): any {
  const { editorStore, dataSourceStore, formStateStore } = context

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
        // 在 rootComponent 树中查找组件
        const rootComponent = editorStore.pageConfig.rootComponent
        let componentSchema = null
        if (rootComponent.id === binding.componentId) {
          componentSchema = rootComponent
        } else if (rootComponent.children) {
          componentSchema = findComponentById(binding.componentId, rootComponent.children)
        }
        
        if (!componentSchema) {
          return undefined
        }

        // 优先级：modelValue → props → style
        
        // 1. 先从 formStateStore 查找（modelValue）
        const modelValue = formStateStore.getComponentState(binding.componentId, binding.path)
        if (modelValue !== undefined) {
          return modelValue
        }
        
        // 2. 再从 props 查找
        const propValue = get(componentSchema.props, binding.path)
        if (propValue !== undefined) {
          return propValue
        }
        
        // 3. 最后从 style 查找
        const styleValue = get(componentSchema.style, binding.path)
        if (styleValue !== undefined) {
          return styleValue
        }
        
        // 都找不到返回空字符串
        return ''
      }
      return undefined

    case 'static':
      return binding.value
      
    default:
      return undefined
  }
}
