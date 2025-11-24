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
      if (binding.componentId) {
        // 对于组件绑定，首先从表单状态存储中检查是否有实时值。
        const formValue = formStateStore.getComponentState(binding.componentId)
        
        // 如果 formValue 是 undefined，检查是否是表单组件
        // 如果是表单组件，返回空字符串而不是 fallback 到 schema
        if (formValue === undefined) {
          const componentSchema = findComponentById(binding.componentId, editorStore.pageConfig.components)
          if (componentSchema) {
            // 判断是否是表单组件
            const isFormComponent = [
              'input',
              'select', 
              'datePicker'
            ].includes(componentSchema.type)
            
            // 如果是表单组件，返回空字符串（表示还没有输入）
            if (isFormComponent) {
              return ''
            }
            
            // 对于非表单组件，才 fallback 到 schema
            return binding.path ? get(componentSchema, binding.path) : componentSchema
          }
          return undefined
        }
        
        // 如果有 formValue，正常返回
        return binding.path ? get(formValue, binding.path) : formValue
      }
      return undefined

    case 'static':
      return binding.value
      
    default:
      return undefined
  }
}
