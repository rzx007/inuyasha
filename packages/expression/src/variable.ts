import { get } from 'lodash-es'
import type { ExpressionContext } from './types'
// 解析变量路径 (例如 "input1.value" 或 "user.name")
export function resolveVariable(variablePath: string, context: ExpressionContext): any {
    const parts = variablePath.split('.')
    const rootName = parts[0]
    const path = parts.slice(1).join('.')
    
    const { editorStore, dataSourceStore, formStateStore } = context
    
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
    
    if (comp) {
        // 组件找到了，获取值
        
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
export function resolveStringVariables(str: string, context: ExpressionContext): string {
    if (!str) return str
    return str.replace(/\{\{(.+?)\}\}/g, (_, path) => {
      const resolved = resolveVariable(path.trim(), context)
      return resolved !== undefined ? String(resolved) : ''
    })
}

// 解析 API 配置中的所有变量
export function resolveVariablesInConfig(config: any, context: ExpressionContext): any {
    const resolvedConfig = { ...config }
    
    // URL
    resolvedConfig.url = resolveStringVariables(config.url, context)
    
    // Body
    if (config.body) {
        resolvedConfig.body = resolveStringVariables(config.body, context)
    }
    
    // Params
    if (config.params) {
        resolvedConfig.params = config.params.map((p: any) => ({
            ...p,
            key: resolveStringVariables(p.key, context),
            value: resolveStringVariables(p.value, context)
        }))
    }
    
    // Headers
    if (config.headers) {
        resolvedConfig.headers = config.headers.map((h: any) => ({
            ...h,
            key: resolveStringVariables(h.key, context),
            value: resolveStringVariables(h.value, context)
        }))
    }
    
    return resolvedConfig
}
