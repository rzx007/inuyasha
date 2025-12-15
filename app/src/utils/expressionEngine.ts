import { useEditorStore } from '@/stores/editor'
import { useDataSourceStore } from '@/stores/dataSource'
import type { DataBinding, ApiDataSourceConfig } from '@inuyasha/core'
import { resolveBinding as resolveBindingCore, resolveVariable as resolveVariableCore, resolveStringVariables as resolveStringVariablesCore, resolveVariablesInConfig as resolveVariablesInConfigCore } from '@inuyasha/expression'
import { useFormStateStore } from '@/stores/formState'
import type { ExpressionContext } from '@inuyasha/expression'

/**
 * Resolves the value of a data binding configuration.
 * @param binding - The data binding configuration object.
 * @returns The resolved value, or undefined if not found.
 */
export function resolveBinding(binding: DataBinding): any {
  const editorStore = useEditorStore()
  const dataSourceStore = useDataSourceStore()
  const formStateStore = useFormStateStore()

  // 直接访问响应式属性以建立依赖追踪
  const context: ExpressionContext = {
    editorStore: {
      pageConfig: editorStore.pageConfig
    },
    dataSourceStore: {
      dataSources: dataSourceStore.dataSources
    },
    formStateStore: {
      getComponentState: (componentId: string, key: string) => {
        // 使用 store 的方法，该方法内部会访问响应式 states
        return formStateStore.getComponentState(componentId, key)
      }
    }
  }
  return resolveBindingCore(binding, context)
}

// 解析变量路径 (例如 "input1.value" 或 "user.name")
export function resolveVariable(variablePath: string): any {
    const editorStore = useEditorStore()
    const dataSourceStore = useDataSourceStore()
    const formStateStore = useFormStateStore()

    const context: ExpressionContext = {
      editorStore: {
        pageConfig: editorStore.pageConfig
      },
      dataSourceStore: {
        dataSources: dataSourceStore.dataSources
      },
      formStateStore: {
        getComponentState: (componentId: string, key: string) => {
          return formStateStore.getComponentState(componentId, key)
        }
      }
    }

    return resolveVariableCore(variablePath, context)
}

// 解析字符串中的变量 {{xxx}}
export function resolveStringVariables(str: string): string {
    const editorStore = useEditorStore()
    const dataSourceStore = useDataSourceStore()
    const formStateStore = useFormStateStore()

    const context: ExpressionContext = {
      editorStore: {
        pageConfig: editorStore.pageConfig
      },
      dataSourceStore: {
        dataSources: dataSourceStore.dataSources
      },
      formStateStore: {
        getComponentState: (componentId: string, key: string) => {
          return formStateStore.getComponentState(componentId, key)
        }
      }
    }

    return resolveStringVariablesCore(str, context)
}

// 解析 API 配置中的所有变量
export function resolveVariablesInConfig(config: ApiDataSourceConfig): ApiDataSourceConfig {
    const editorStore = useEditorStore()
    const dataSourceStore = useDataSourceStore()
    const formStateStore = useFormStateStore()

    const context: ExpressionContext = {
      editorStore: {
        pageConfig: editorStore.pageConfig
      },
      dataSourceStore: {
        dataSources: dataSourceStore.dataSources
      },
      formStateStore: {
        getComponentState: (componentId: string, key: string) => {
          return formStateStore.getComponentState(componentId, key)
        }
      }
    }

    return resolveVariablesInConfigCore(config, context)
}
