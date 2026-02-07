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
        // 如果数据源 ID 存在，则查找数据源
        const ds = dataSourceStore.dataSources[binding.dataSourceId]
        if (ds && ds.data) {
          // 如果数据源存在，则返回数据源数据和路径
          return binding.path ? get(ds.data, binding.path) : ds.data
        } else {
          // 如果数据源不存在，则返回 undefined
          return undefined
        }
      }
      return undefined

    case 'component':
      if (binding.componentId && binding.path) {
        // 在 rootComponent 树中查找组件
        const rootComponent = editorStore.pageConfig.rootComponent
        let componentSchema = null
        if (rootComponent.id === binding.componentId) {
          // 如果组件 ID 与根组件 ID 相同，则返回根组件 schema
          componentSchema = rootComponent
        } else if (rootComponent.children) {
          // 如果组件 ID 不在根组件中，则查找子组件
          componentSchema = findComponentById(binding.componentId, rootComponent.children)
        }
        
        // 如果找不到组件，则返回 undefined
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
