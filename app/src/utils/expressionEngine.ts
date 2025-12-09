import { useEditorStore } from '@/stores/editor'
import { useDataSourceStore } from '@/stores/dataSource'
import type { DataBinding, ApiDataSourceConfig } from '@/types/dataSource'
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

// 解析变量路径 (例如 "input1.value" 或 "user.name")
export function resolveVariable(variablePath: string): any {
    const parts = variablePath.split('.')
    const rootName = parts[0]
    const path = parts.slice(1).join('.')
    
    const editorStore = useEditorStore()
    const dataSourceStore = useDataSourceStore()
    
    // 1. 尝试查找组件
    // 遍历组件树找到 semanticId 匹配的组件
    const findComp = (nodes: any[]): any => {
      for (const node of nodes) {
        if (node.semanticId === rootName) return node
        if (node.children) {
          const found = findComp(node.children)
          if (found) return found
        }
      }
      return null
    }
    
    const rootComp = editorStore.pageConfig.rootComponent
    let comp = null
    if (rootComp.semanticId === rootName) {
      comp = rootComp
    } else if (rootComp.children) {
      comp = findComp(rootComp.children)
    }
    
    console.log("🚀 ~ resolveVariable ~ comp:", comp)
    if (comp) {
        // 组件找到了，获取值
        const formStateStore = useFormStateStore()
        
        // 优先级：modelValue → props → style
        
        // 1. modelValue
        const modelValue = formStateStore.getComponentState(comp.id, path)
        if (modelValue !== undefined) return modelValue
        
        // 2. props
        const propValue = get(comp.props, path)
        if (propValue !== undefined) return propValue
        
        // 3. style
        const styleValue = get(comp.style, path)
        if (styleValue !== undefined) return styleValue
        
        // 默认尝试 value
        if (!path) {
            return formStateStore.getComponentState(comp.id, 'value')
        }
        
        return undefined
    }
    
    // 2. 尝试在数据源中寻找
    const ds = Object.values(dataSourceStore.dataSources).find(d => d.name === rootName)
    if (ds && ds.data) {
        return path ? get(ds.data, path) : ds.data
    }
    
    // 3. Try System Variables (mock)
    if (rootName === 'user') {
        if (path === 'name') return 'Guest User'
        if (path === 'email') return 'guest@example.com'
    }
    
    return undefined
}

// 解析字符串中的变量 {{xxx}}
export function resolveStringVariables(str: string): string {
    if (!str) return str
    return str.replace(/\{\{(.+?)\}\}/g, (_, path) => {
      const resolved = resolveVariable(path.trim())
      return resolved !== undefined ? String(resolved) : ''
    })
}

// 解析 API 配置中的所有变量
export function resolveVariablesInConfig(config: ApiDataSourceConfig): ApiDataSourceConfig {
    const resolvedConfig = { ...config }
    
    // URL
    resolvedConfig.url = resolveStringVariables(config.url)
    
    // Body
    if (config.body) {
        resolvedConfig.body = resolveStringVariables(config.body)
    }
    
    // Params
    if (config.params) {
        resolvedConfig.params = config.params.map(p => ({
            ...p,
            key: resolveStringVariables(p.key),
            value: resolveStringVariables(p.value)
        }))
    }
    
    // Headers
    if (config.headers) {
        resolvedConfig.headers = config.headers.map(h => ({
            ...h,
            key: resolveStringVariables(h.key),
            value: resolveStringVariables(h.value)
        }))
    }
    
    return resolvedConfig
}
