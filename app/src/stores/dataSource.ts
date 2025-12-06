import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { DataSource, DataSourceId, ApiDataSourceConfig } from '@/types/dataSource'
import { nanoid } from 'nanoid'
import { useEditorStore } from '@/stores/editor'
import { useFormStateStore } from '@/stores/formState'
import { get } from 'lodash-es'

export const useDataSourceStore = defineStore('dataSource', () => {
  const dataSources = ref<Record<DataSourceId, DataSource>>({})

  function addDataSource(dataSource: Omit<DataSource, 'id'>) {
    const id = nanoid()
    dataSources.value[id] = { ...dataSource, id }
    return id
  }

  function updateDataSource(id: DataSourceId, updates: Partial<DataSource>) {
    if (dataSources.value[id]) {
      Object.assign(dataSources.value[id], updates)
    }
  }

  function removeDataSource(id: DataSourceId) {
    delete dataSources.value[id]
  }

  // 解析字符串中的变量 {{xxx}}
  function resolveStringVariables(str: string): string {
    if (!str) return str
    return str.replace(/\{\{(.+?)\}\}/g, (_, path) => {
      const resolved = resolveVariable(path.trim())
      return resolved !== undefined ? String(resolved) : ''
    })
  }
  
  // 辅助函数：解析变量名
  function resolveVariable(variablePath: string): any {
    const parts = variablePath.split('.')
    const rootName = parts[0]
    const path = parts.slice(1).join('.')
    
    const editorStore = useEditorStore()
    
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
        const formStateStore = useFormStateStore()
        
        if (path) {
            // 如果 path 是 value，取 modelValue.value (通用约定)
            // 或者直接从 formStateStore 取 path
            const val = formStateStore.getComponentState(comp.id, path)
            if (val !== undefined) return val
             
            // 尝试 props
             if (path.startsWith('props.')) {
                 const propKey = path.replace('props.', '')
                 return comp.props[propKey]
             }
        } else {
            // 没有 path，默认取 value
             const val = formStateStore.getComponentState(comp.id, 'value')
             return val
        }
    }
    
    // 2. 尝试在数据中寻找
    const ds = Object.values(dataSources.value).find(d => d.name === rootName)
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

  function resolveVariablesInConfig(config: ApiDataSourceConfig): ApiDataSourceConfig {
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

  async function fetchDataSource(id: DataSourceId) {
    const ds = dataSources.value[id]
    if (!ds || ds.type !== 'api') return

    const originalConfig = ds.config as ApiDataSourceConfig
    // 解析变量
    const config = resolveVariablesInConfig(originalConfig)

    try {
      // Basic fetch implementation.
      // Convert array headers to object
      const headersObject = config.headers.reduce((acc: Record<string, string>, curr) => {
        if (curr.key) acc[curr.key] = curr.value
        return acc
      }, {} as Record<string, string>)

      let url = config.url
      if (config.params && config.params.length > 0) {
        const queryString = config.params
          .filter(p => p.key)
          .map(p => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`)
          .join('&')
        if (queryString) {
          url += (url.includes('?') ? '&' : '?') + queryString
        }
      }

      const response = await fetch(url, {
        method: config.method,
        headers: headersObject,
        body: ['GET', 'HEAD'].includes(config.method) ? undefined : config.body,
      })
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      
      updateDataSource(id, { data, lastFetched: Date.now() })
    } catch (error) {
      console.error(`Failed to fetch data source ${id}:`, error)
      updateDataSource(id, { data: { error: 'Failed to fetch' }, lastFetched: Date.now() })
    }
  }

  return {
    dataSources,
    addDataSource,
    updateDataSource,
    removeDataSource,
    fetchDataSource,
  }
})
